import logging
from datetime import datetime, timezone
from typing import Dict, Any, Tuple
from backend.app.models import db, Student, RegisteredDevice, SecurityLog, AccessDecision
from backend.app.sdn_adapter import sdn_adapter

logger = logging.getLogger('access_control')

def evaluate_student_access(student_id: str, observed_mac: str, client_ip: str = "10.0.0.101") -> Tuple[bool, Dict[str, Any]]:
    """
    Core NETSTAT Access Control Engine.
    Enforces the One-Device-Per-Student policy on the SDN network.

    Returns:
        (is_allowed: bool, response_payload: dict)
    """
    student = db.session.get(Student, student_id)
    if not student:
        return False, {
            'decision': 'DROP',
            'reason': f"Student ID '{student_id}' not found in university directory.",
            'event_type': 'INVALID_IDENTITY'
        }

    norm_observed_mac = RegisteredDevice.normalize_mac(observed_mac)
    if not norm_observed_mac:
        return False, {
            'decision': 'DROP',
            'reason': "Invalid or missing MAC address observed from network adapter.",
            'event_type': 'MALFORMED_MAC'
        }

    now = datetime.now(timezone.utc)
    active_device = student.active_device

    # -------------------------------------------------------------
    # CASE 1: FIRST CONNECTION (No active device registered)
    # -------------------------------------------------------------
    if active_device is None:
        # Check if another student is already registered with this exact MAC
        existing_other_device = RegisteredDevice.query.filter(
            RegisteredDevice.mac_address == norm_observed_mac,
            RegisteredDevice.status.in_(['ALLOWED', 'BLOCKED']),
            RegisteredDevice.student_id != student_id
        ).first()

        if existing_other_device:
            # Duplicate MAC / Spoofing alert!
            reason = (
                f"MAC Conflict / Spoofing Alert: Device {norm_observed_mac} is already registered "
                f"to student {existing_other_device.student_id} ({existing_other_device.student.name}). "
                f"Student {student.name} ({student_id}) attempted to claim this device."
            )
            log = SecurityLog(
                student_id=student_id,
                observed_mac=norm_observed_mac,
                registered_mac=existing_other_device.mac_address,
                event_type='MAC_CONFLICT_DETECTED',
                decision='DROP',
                reason=reason,
                severity='CRITICAL',
                timestamp=now
            )
            decision_rec = AccessDecision(
                student_id=student_id,
                observed_mac=norm_observed_mac,
                ip_address=client_ip,
                decision='DROP',
                reason=reason,
                timestamp=now
            )
            db.session.add_all([log, decision_rec])
            db.session.commit()

            # Install OpenFlow DROP rule
            sdn_adapter.push_drop_flow(norm_observed_mac, "MAC Conflict detected")

            return False, {
                'decision': 'DROP',
                'status': 'MAC_CONFLICT',
                'reason': reason,
                'observed_mac': norm_observed_mac,
                'registered_mac': existing_other_device.mac_address,
                'severity': 'CRITICAL'
            }

        # Auto-register this first device
        new_device = RegisteredDevice(
            student_id=student_id,
            mac_address=norm_observed_mac,
            ip_address=client_ip,
            status='ALLOWED',
            device_name=f"{student.name}'s Primary Device",
            registered_at=now,
            last_connected_at=now
        )
        db.session.add(new_device)

        reason = (
            f"First connection from student {student.name} ({student_id}). "
            f"Device {norm_observed_mac} automatically registered and bound to student identity."
        )
        log = SecurityLog(
            student_id=student_id,
            observed_mac=norm_observed_mac,
            registered_mac=norm_observed_mac,
            event_type='DEVICE_AUTO_REGISTERED',
            decision='ALLOW',
            reason=reason,
            severity='LOW',
            timestamp=now
        )
        decision_rec = AccessDecision(
            student_id=student_id,
            observed_mac=norm_observed_mac,
            ip_address=client_ip,
            decision='ALLOW',
            reason=reason,
            timestamp=now
        )
        db.session.add_all([log, decision_rec])
        db.session.commit()

        # Install OpenFlow ALLOW flow rule on SDN Switch
        sdn_adapter.push_allow_flow(norm_observed_mac, client_ip)

        return True, {
            'decision': 'ALLOW',
            'status': 'FIRST_DEVICE_REGISTERED',
            'message': 'Welcome to Hostel Wi-Fi! Your device has been successfully registered.',
            'device': new_device.to_dict(mask_mac=False),
            'student': student.to_dict(include_device=True)
        }

    # -------------------------------------------------------------
    # CASE 2: SAME DEVICE (Observed MAC matches registered MAC)
    # -------------------------------------------------------------
    if active_device.mac_address == norm_observed_mac:
        # Check if admin previously blocked this device
        if active_device.status == 'BLOCKED':
            reason = f"Access denied: Device {norm_observed_mac} has been administratively BLOCKED by network admin."
            log = SecurityLog(
                student_id=student_id,
                observed_mac=norm_observed_mac,
                registered_mac=active_device.mac_address,
                event_type='BLOCKED_DEVICE_CONNECTION_ATTEMPT',
                decision='DROP',
                reason=reason,
                severity='HIGH',
                timestamp=now
            )
            decision_rec = AccessDecision(
                student_id=student_id,
                observed_mac=norm_observed_mac,
                ip_address=client_ip,
                decision='DROP',
                reason=reason,
                timestamp=now
            )
            db.session.add_all([log, decision_rec])
            db.session.commit()

            sdn_adapter.push_drop_flow(norm_observed_mac, "Device administratively blocked")

            return False, {
                'decision': 'DROP',
                'status': 'DEVICE_BLOCKED',
                'reason': reason,
                'device': active_device.to_dict(mask_mac=False)
            }

        # Update last connection time and IP
        active_device.last_connected_at = now
        active_device.ip_address = client_ip

        reason = f"Verified registered device for {student.name} ({student_id}). Network access granted."
        decision_rec = AccessDecision(
            student_id=student_id,
            observed_mac=norm_observed_mac,
            ip_address=client_ip,
            decision='ALLOW',
            reason=reason,
            timestamp=now
        )
        db.session.add(decision_rec)
        db.session.commit()

        # Refresh / ensure flow rule on switch
        sdn_adapter.push_allow_flow(norm_observed_mac, client_ip)

        return True, {
            'decision': 'ALLOW',
            'status': 'VERIFIED_DEVICE',
            'message': 'Device verified. Network access granted.',
            'device': active_device.to_dict(mask_mac=False),
            'student': student.to_dict(include_device=True)
        }

    # -------------------------------------------------------------
    # CASE 3: DIFFERENT DEVICE (One-Device-Per-Student Policy Violation)
    # -------------------------------------------------------------
    reason = (
        f"One-Device Policy Violation: Student {student.name} ({student_id}) already has a "
        f"registered trusted device [{active_device.mac_address}], but attempted login "
        f"from unauthorized device [{norm_observed_mac}]."
    )

    log = SecurityLog(
        student_id=student_id,
        observed_mac=norm_observed_mac,
        registered_mac=active_device.mac_address,
        event_type='UNAUTHORIZED_DEVICE_ATTEMPT',
        decision='DROP',
        reason=reason,
        severity='HIGH',
        timestamp=now
    )
    decision_rec = AccessDecision(
        student_id=student_id,
        observed_mac=norm_observed_mac,
        ip_address=client_ip,
        decision='DROP',
        reason=reason,
        timestamp=now
    )
    db.session.add_all([log, decision_rec])
    db.session.commit()

    # Install OpenFlow DROP rule on SDN Switch (Priority 200)
    sdn_adapter.push_drop_flow(norm_observed_mac, "One-device policy mismatch")

    return False, {
        'decision': 'DROP',
        'status': 'UNAUTHORIZED_DEVICE_MISMATCH',
        'reason': reason,
        'observed_mac': norm_observed_mac,
        'registered_mac': active_device.mac_address,
        'severity': 'HIGH',
        'student': student.to_dict(include_device=True)
    }

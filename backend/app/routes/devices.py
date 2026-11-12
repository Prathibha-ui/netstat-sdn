from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from backend.app.models import db, RegisteredDevice, Student, SecurityLog
from backend.app.sdn_adapter import sdn_adapter
from backend.app.utils import admin_required

devices_bp = Blueprint('devices', __name__, url_prefix='/api/devices')

@devices_bp.route('', methods=['GET'])
@admin_required
def list_devices():
    status_filter = request.args.get('status')
    query = RegisteredDevice.query.order_by(RegisteredDevice.last_connected_at.desc())

    if status_filter:
        query = query.filter_by(status=status_filter.upper())

    devices = query.all()
    return jsonify([d.to_dict(mask_mac=False) for d in devices]), 200


@devices_bp.route('/register', methods=['POST'])
@admin_required
def register_device():
    data = request.get_json() or {}
    student_id = data.get('student_id', '').strip()
    mac = data.get('mac_address', '').strip()
    device_name = data.get('device_name', 'Student Device')
    ip = data.get('ip_address', '10.0.0.101')

    if not student_id or not mac:
        return jsonify({'error': 'Student ID and MAC address are required'}), 400

    student = db.session.get(Student, student_id)
    if not student:
        return jsonify({'error': f"Student '{student_id}' does not exist"}), 404

    norm_mac = RegisteredDevice.normalize_mac(mac)

    # Check if student already has an active device
    if student.active_device:
        return jsonify({
            'error': f"Student {student_id} already has a registered device ({student.active_device.mac_address}). Reset it before registering a new one."
        }), 400

    # Check if MAC is already registered to someone else
    existing = RegisteredDevice.query.filter(
        RegisteredDevice.mac_address == norm_mac,
        RegisteredDevice.status.in_(['ALLOWED', 'BLOCKED'])
    ).first()
    if existing:
        return jsonify({'error': f"MAC address {norm_mac} is already registered to student {existing.student_id}"}), 400

    now = datetime.now(timezone.utc)
    new_device = RegisteredDevice(
        student_id=student_id,
        mac_address=norm_mac,
        ip_address=ip,
        device_name=device_name,
        status='ALLOWED',
        registered_at=now,
        last_connected_at=now
    )
    db.session.add(new_device)

    log = SecurityLog(
        student_id=student_id,
        observed_mac=norm_mac,
        registered_mac=norm_mac,
        event_type='ADMIN_MANUAL_REGISTRATION',
        decision='ALLOW',
        reason=f"Administrator manually registered device {norm_mac} for student {student.name}",
        severity='LOW',
        timestamp=now
    )
    db.session.add(log)
    db.session.commit()

    sdn_adapter.push_allow_flow(norm_mac, ip)

    return jsonify({
        'success': True,
        'message': f"Device {norm_mac} registered for {student.name}",
        'device': new_device.to_dict(mask_mac=False)
    }), 201


@devices_bp.route('/<int:device_id>/block', methods=['POST'])
@admin_required
def block_device(device_id):
    device = db.session.get(RegisteredDevice, device_id)
    if not device:
        return jsonify({'error': 'Device not found'}), 404

    device.status = 'BLOCKED'
    now = datetime.now(timezone.utc)

    log = SecurityLog(
        student_id=device.student_id,
        observed_mac=device.mac_address,
        registered_mac=device.mac_address,
        event_type='ADMIN_DEVICE_BLOCKED',
        decision='BLOCK',
        reason=f"Device {device.mac_address} administratively blocked by network admin",
        severity='HIGH',
        timestamp=now
    )
    db.session.add(log)
    db.session.commit()

    # Install OpenFlow DROP rule
    sdn_adapter.push_drop_flow(device.mac_address, "Administratively blocked")

    return jsonify({
        'success': True,
        'message': f"Device {device.mac_address} blocked successfully",
        'device': device.to_dict(mask_mac=False)
    }), 200


@devices_bp.route('/<int:device_id>/unblock', methods=['POST'])
@admin_required
def unblock_device(device_id):
    device = db.session.get(RegisteredDevice, device_id)
    if not device:
        return jsonify({'error': 'Device not found'}), 404

    device.status = 'ALLOWED'
    now = datetime.now(timezone.utc)

    log = SecurityLog(
        student_id=device.student_id,
        observed_mac=device.mac_address,
        registered_mac=device.mac_address,
        event_type='ADMIN_DEVICE_UNBLOCKED',
        decision='ALLOW',
        reason=f"Device {device.mac_address} unblocked by network admin",
        severity='LOW',
        timestamp=now
    )
    db.session.add(log)
    db.session.commit()

    # Reinstall OpenFlow ALLOW rule
    sdn_adapter.push_allow_flow(device.mac_address, device.ip_address)

    return jsonify({
        'success': True,
        'message': f"Device {device.mac_address} unblocked successfully",
        'device': device.to_dict(mask_mac=False)
    }), 200


@devices_bp.route('/<int:device_id>/reset', methods=['POST'])
@admin_required
def reset_device(device_id):
    """
    Device Replacement / Reset:
    Revokes the current device registration for the student.
    The next valid login from the student's new device will auto-register it!
    """
    device = db.session.get(RegisteredDevice, device_id)
    if not device:
        return jsonify({'error': 'Device not found'}), 404

    mac = device.mac_address
    student_id = device.student_id
    student_name = device.student.name if device.student else "Student"

    # Remove flow rule
    sdn_adapter.remove_flow_for_mac(mac)

    now = datetime.now(timezone.utc)
    log = SecurityLog(
        student_id=student_id,
        observed_mac=mac,
        registered_mac=mac,
        event_type='DEVICE_REGISTRATION_RESET',
        decision='REVOKE',
        reason=f"Device registration {mac} revoked/reset by admin. Student {student_name} ({student_id}) may now register a replacement device.",
        severity='MEDIUM',
        timestamp=now
    )
    db.session.add(log)

    # Delete or mark revoked
    db.session.delete(device)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f"Device registration for student {student_id} reset. New device will be bound on next login."
    }), 200

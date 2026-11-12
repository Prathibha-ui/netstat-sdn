import time
from flask import Blueprint, request, jsonify
from backend.app.models import db, Admin, Student, RegisteredDevice
from backend.app.access_control import evaluate_student_access
from backend.app.sdn_adapter import sdn_adapter
from backend.app.utils import generate_token, get_current_user

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/student/login', methods=['POST'])
def student_login():
    data = request.get_json() or {}
    student_id = data.get('student_id', '').strip()
    password = data.get('password', '').strip()

    if not student_id or not password:
        return jsonify({'error': 'Student ID and password are required'}), 400

    student = db.session.get(Student, student_id)
    if not student or not student.check_password(password):
        return jsonify({
            'error': 'Invalid Student ID or password',
            'decision': 'DROP',
            'reason': 'Authentication credential failure'
        }), 401

    # Retrieve observed MAC from network simulation adapter
    observed_mac = request.headers.get('X-Observed-MAC') or data.get('observed_mac')
    if not observed_mac:
        # If student has a registered device, use that, otherwise default test device
        active = student.active_device
        observed_mac = active.mac_address if active else 'AA:BB:CC:11:22:33'

    client_ip = request.headers.get('X-Forwarded-For') or request.remote_addr or '10.0.0.101'
    if ',' in client_ip:
        client_ip = client_ip.split(',')[0].strip()

    # Core Access Control Policy Evaluation
    is_allowed, result = evaluate_student_access(student_id, observed_mac, client_ip)

    if not is_allowed:
        return jsonify({
            'success': False,
            'decision': result.get('decision', 'DROP'),
            'status': result.get('status'),
            'reason': result.get('reason'),
            'observed_mac': result.get('observed_mac'),
            'registered_mac': result.get('registered_mac'),
            'severity': result.get('severity', 'HIGH'),
            'student': student.to_dict(include_device=True)
        }), 403

    # Generate session token
    token = generate_token({
        'role': 'student',
        'student_id': student.student_id,
        'name': student.name
    })

    return jsonify({
        'success': True,
        'decision': 'ALLOW',
        'token': token,
        'status': result.get('status'),
        'message': result.get('message', 'Login successful'),
        'student': result.get('student', student.to_dict(include_device=True)),
        'device': result.get('device')
    }), 200


@auth_bp.route('/student/register', methods=['POST'])
def student_self_register():
    data = request.get_json() or {}
    student_id = data.get('student_id', '').strip()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    department = data.get('department', 'Computer Science & Engineering').strip()
    year = data.get('year', '3rd Year (B.Tech)').strip()
    hostel_room = data.get('hostel_room', 'Hostel 4, Room 204').strip()
    password = data.get('password', '').strip()

    if not student_id or not name or not password:
        return jsonify({'error': 'Student ID, Name, and Password are required'}), 400

    student = db.session.get(Student, student_id)
    if not student:
        if not email:
            email = f"{student_id.lower()}@university.edu"
        if Student.query.filter_by(email=email).first():
            email = f"{student_id.lower()}_{int(time.time())}@university.edu"

        student = Student(
            student_id=student_id,
            name=name,
            email=email,
            department=department,
            year=year,
            hostel_room=hostel_room
        )
        student.set_password(password)
        db.session.add(student)
        db.session.commit()
    else:
        # Update password if existing
        student.set_password(password)
        db.session.commit()

    observed_mac = request.headers.get('X-Observed-MAC') or data.get('observed_mac') or 'AA:BB:CC:11:22:33'
    norm_mac = RegisteredDevice.normalize_mac(observed_mac)

    # Release any existing demo device holding this MAC so the new student can bind it seamlessly
    existing_other = RegisteredDevice.query.filter(
        RegisteredDevice.mac_address == norm_mac,
        RegisteredDevice.student_id != student_id
    ).all()
    for dev in existing_other:
        sdn_adapter.remove_flow_for_mac(dev.mac_address)
        db.session.delete(dev)
    db.session.commit()

    # Automatically register this device for the student
    client_ip = request.headers.get('X-Forwarded-For') or request.remote_addr or '10.0.0.101'
    is_allowed, result = evaluate_student_access(student_id, norm_mac, client_ip)

    token = generate_token({
        'role': 'student',
        'student_id': student.student_id,
        'name': student.name
    })

    return jsonify({
        'success': True,
        'decision': 'ALLOW',
        'token': token,
        'status': 'FIRST_DEVICE_REGISTERED',
        'message': f"Student account created for {name} ({student_id}) and device {norm_mac} registered!",
        'student': student.to_dict(include_device=True),
        'device': student.active_device.to_dict(mask_mac=False) if student.active_device else None
    }), 201


@auth_bp.route('/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    admin = Admin.query.filter_by(username=username).first()
    if not admin or not admin.check_password(password):
        return jsonify({'error': 'Invalid administrator credentials'}), 401

    token = generate_token({
        'role': 'admin',
        'admin_id': admin.admin_id,
        'username': admin.username
    })

    return jsonify({
        'success': True,
        'token': token,
        'admin': admin.to_dict()
    }), 200


@auth_bp.route('/logout', methods=['POST'])
def logout():
    return jsonify({'success': True, 'message': 'Logged out successfully'}), 200


@auth_bp.route('/me', methods=['GET'])
def get_current_user_profile():
    payload = get_current_user()
    if not payload:
        return jsonify({'authenticated': False}), 401

    if payload.get('role') == 'student':
        student = db.session.get(Student, payload.get('student_id'))
        if not student:
            return jsonify({'authenticated': False}), 401
        return jsonify({
            'authenticated': True,
            'role': 'student',
            'user': student.to_dict(include_device=True)
        })
    elif payload.get('role') in ['admin', 'network_admin']:
        admin = db.session.get(Admin, payload.get('admin_id'))
        if not admin:
            return jsonify({'authenticated': False}), 401
        return jsonify({
            'authenticated': True,
            'role': 'admin',
            'user': admin.to_dict()
        })

    return jsonify({'authenticated': False}), 401

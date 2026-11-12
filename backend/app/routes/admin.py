from flask import Blueprint, request, jsonify
from backend.app.models import db, Student, RegisteredDevice, SecurityLog, AccessDecision, NetworkFlowRule
from backend.app.sdn_adapter import sdn_adapter
from backend.app.utils import admin_required

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/students', methods=['GET'])
@admin_required
def list_students():
    students = Student.query.order_by(Student.student_id.asc()).all()
    return jsonify([s.to_dict(include_device=True) for s in students]), 200


@admin_bp.route('/students', methods=['POST'])
@admin_required
def create_student():
    data = request.get_json() or {}
    student_id = data.get('student_id', '').strip()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    department = data.get('department', '').strip()
    year = data.get('year', '1st Year').strip()
    hostel_room = data.get('hostel_room', '').strip()
    password = data.get('password', 'Student@123').strip()

    if not student_id or not name or not email:
        return jsonify({'error': 'Student ID, Name and Email are required'}), 400

    if db.session.get(Student, student_id):
        return jsonify({'error': f"Student ID '{student_id}' already exists"}), 400

    if Student.query.filter_by(email=email).first():
        return jsonify({'error': f"Email '{email}' is already in use"}), 400

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

    return jsonify({
        'success': True,
        'message': f"Student {name} created successfully",
        'student': student.to_dict(include_device=False)
    }), 201


@admin_bp.route('/students/<string:student_id>', methods=['PUT'])
@admin_required
def update_student(student_id):
    student = db.session.get(Student, student_id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404

    data = request.get_json() or {}
    if 'name' in data:
        student.name = data['name'].strip()
    if 'email' in data:
        student.email = data['email'].strip()
    if 'department' in data:
        student.department = data['department'].strip()
    if 'year' in data:
        student.year = data['year'].strip()
    if 'hostel_room' in data:
        student.hostel_room = data['hostel_room'].strip()
    if 'password' in data and data['password']:
        student.set_password(data['password'].strip())

    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Student updated successfully',
        'student': student.to_dict(include_device=True)
    }), 200


@admin_bp.route('/students/<string:student_id>', methods=['DELETE'])
@admin_required
def delete_student(student_id):
    student = db.session.get(Student, student_id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404

    # Remove flows for devices
    for d in student.devices:
        sdn_adapter.remove_flow_for_mac(d.mac_address)

    db.session.delete(student)
    db.session.commit()

    return jsonify({'success': True, 'message': f"Student {student_id} deleted"}), 200


@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    total_students = Student.query.count()
    registered_devices = RegisteredDevice.query.count()
    connected_devices = RegisteredDevice.query.filter_by(status='ALLOWED').count()
    blocked_devices = RegisteredDevice.query.filter_by(status='BLOCKED').count()

    unauthorized_attempts = SecurityLog.query.filter_by(event_type='UNAUTHORIZED_DEVICE_ATTEMPT').count()
    total_security_alerts = SecurityLog.query.filter(SecurityLog.severity.in_(['HIGH', 'CRITICAL'])).count()

    connection_info = sdn_adapter.check_ryu_connection()

    # Recent traffic simulated datapoints
    traffic_history = [
        {'time': '10:00', 'inbound': 45, 'outbound': 32, 'blocked': 2},
        {'time': '11:00', 'inbound': 78, 'outbound': 64, 'blocked': 5},
        {'time': '12:00', 'inbound': 120, 'outbound': 95, 'blocked': 8},
        {'time': '13:00', 'inbound': 90, 'outbound': 80, 'blocked': 3},
        {'time': '14:00', 'inbound': 140, 'outbound': 110, 'blocked': 12},
        {'time': '15:00', 'inbound': 185, 'outbound': 160, 'blocked': 15},
        {'time': '16:00', 'inbound': 210, 'outbound': 190, 'blocked': 18},
    ]

    return jsonify({
        'kpi': {
            'total_students': total_students,
            'registered_devices': registered_devices,
            'connected_devices': connected_devices,
            'blocked_devices': blocked_devices,
            'unauthorized_attempts': unauthorized_attempts,
            'security_alerts': total_security_alerts
        },
        'sdn_status': connection_info,
        'traffic_history': traffic_history
    }), 200

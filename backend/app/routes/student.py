from flask import Blueprint, jsonify, g
from backend.app.models import Student, RegisteredDevice, SecurityLog, AccessDecision
from backend.app.utils import student_required

student_bp = Blueprint('student', __name__, url_prefix='/api/student')

@student_bp.route('/profile', methods=['GET'])
@student_required
def get_profile():
    student_id = g.current_user.get('student_id')
    student = db.session.get(Student, student_id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404

    profile = student.to_dict(include_device=False)
    active_device = student.active_device
    if active_device:
        profile['device'] = active_device.to_dict(mask_mac=True)
    else:
        profile['device'] = None

    return jsonify(profile), 200


@student_bp.route('/device', methods=['GET'])
@student_required
def get_device():
    student_id = g.current_user.get('student_id')
    student = db.session.get(Student, student_id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404

    active_device = student.active_device
    if not active_device:
        return jsonify({
            'registered': False,
            'message': 'No device currently registered. Next login from a trusted network device will automatically register it.'
        }), 200

    return jsonify({
        'registered': True,
        'device': active_device.to_dict(mask_mac=True),
        'policy': {
            'rule': 'One-Device-Per-Student',
            'explanation': 'Hostel Wi-Fi permits exactly one active device per student to prevent unauthorized network sharing and bandwidth abuse.',
            'replacement_policy': 'Contact the hostel network administrator or submit a replacement request to change your registered device.'
        }
    }), 200


@student_bp.route('/activity', methods=['GET'])
@student_required
def get_activity():
    student_id = g.current_user.get('student_id')
    decisions = AccessDecision.query.filter_by(student_id=student_id).order_by(AccessDecision.timestamp.desc()).limit(15).all()
    logs = SecurityLog.query.filter_by(student_id=student_id).order_by(SecurityLog.timestamp.desc()).limit(15).all()

    return jsonify({
        'access_decisions': [d.to_dict() for d in decisions],
        'security_logs': [l.to_dict() for l in logs]
    }), 200

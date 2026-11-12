from flask import Blueprint, jsonify
from backend.app.models import db, Student, RegisteredDevice, SecurityLog, AccessDecision, NetworkFlowRule
from backend.app.sdn_adapter import sdn_adapter
from backend.app.seed_data import seed_database

demo_bp = Blueprint('demo', __name__, url_prefix='/api/demo')

@demo_bp.route('/reset', methods=['POST'])
def reset_demo_state():
    """
    Resets the database back to initial demo condition:
    Student 23CS001 has NO registered device initially,
    ready for fresh demonstration of:
      TEST 1: First login from Device 1 (AA:BB:CC:11:22:33) -> Auto-register & ALLOW
      TEST 2: Second login from Device 1 -> ALLOW
      TEST 3: Third login from Device 2 (DD:EE:FF:44:55:66) -> DROP & Security Alert
      TEST 4: Admin dashboard reflection
    """
    try:
        # Clear device registrations for test student 23CS001
        devs = RegisteredDevice.query.filter_by(student_id='23CS001').all()
        for d in devs:
            sdn_adapter.remove_flow_for_mac(d.mac_address)
            db.session.delete(d)

        # Remove DROP rules for demo unauthorized mac
        sdn_adapter.remove_flow_for_mac('DD:EE:FF:44:55:66')
        sdn_adapter.remove_flow_for_mac('AA:BB:CC:11:22:33')

        db.session.commit()

        # Re-ensure default flows
        sdn_adapter.init_default_flows()

        return jsonify({
            'success': True,
            'message': 'Demo state successfully reset! Student 23CS001 is ready for Test 1.'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

import sys
import os
import unittest
import json

# Add project root to path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.app import create_app
from backend.app.models import db, Student, RegisteredDevice, SecurityLog, AccessDecision, NetworkFlowRule
from backend.app.sdn_adapter import sdn_adapter

class TestNetstatAccessControl(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

        # Reset student 23CS001 device state for clean testing
        student = db.session.get(Student, '23CS001')
        if student:
            for dev in student.devices:
                sdn_adapter.remove_flow_for_mac(dev.mac_address)
                db.session.delete(dev)
            db.session.commit()

        # Clean demo MAC rules
        sdn_adapter.remove_flow_for_mac('AA:BB:CC:11:22:33')
        sdn_adapter.remove_flow_for_mac('DD:EE:FF:44:55:66')
        sdn_adapter.remove_flow_for_mac('11:22:33:44:55:66')

    def tearDown(self):
        self.ctx.pop()

    def test_01_invalid_credentials(self):
        """Verify invalid student password is rejected."""
        res = self.client.post('/api/auth/student/login', json={
            'student_id': '23CS001',
            'password': 'WrongPassword999',
            'observed_mac': 'AA:BB:CC:11:22:33'
        })
        self.assertEqual(res.status_code, 401)
        data = res.get_json()
        self.assertEqual(data.get('decision'), 'DROP')

    def test_02_scenario_1_first_device_registration(self):
        """TEST 1: Student first connection -> Auto-register device -> ALLOW."""
        res = self.client.post('/api/auth/student/login', json={
            'student_id': '23CS001',
            'password': 'Student@123',
            'observed_mac': 'AA:BB:CC:11:22:33'
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get('decision'), 'ALLOW')
        self.assertEqual(data.get('status'), 'FIRST_DEVICE_REGISTERED')

        # Verify device saved in database
        student = db.session.get(Student, '23CS001')
        self.assertIsNotNone(student.active_device)
        self.assertEqual(student.active_device.mac_address, 'AA:BB:CC:11:22:33')
        self.assertEqual(student.active_device.status, 'ALLOWED')

        # Verify OpenFlow rule was installed
        flow = NetworkFlowRule.query.filter(NetworkFlowRule.match_criteria.like('%AA:BB:CC:11:22:33%')).first()
        self.assertIsNotNone(flow)
        self.assertEqual(flow.priority, 100)
        self.assertEqual(flow.rule_type, 'ALLOW_REGISTERED')

    def test_03_scenario_2_same_device_allow(self):
        """TEST 2: Login from the same registered MAC -> ALLOW."""
        # First register
        self.client.post('/api/auth/student/login', json={
            'student_id': '23CS001',
            'password': 'Student@123',
            'observed_mac': 'AA:BB:CC:11:22:33'
        })

        # Second login from same MAC
        res2 = self.client.post('/api/auth/student/login', json={
            'student_id': '23CS001',
            'password': 'Student@123',
            'observed_mac': 'AA:BB:CC:11:22:33'
        })
        self.assertEqual(res2.status_code, 200)
        data2 = res2.get_json()
        self.assertEqual(data2.get('decision'), 'ALLOW')
        self.assertEqual(data2.get('status'), 'VERIFIED_DEVICE')

    def test_04_scenario_3_different_device_drop_and_alert(self):
        """TEST 3: Login from a different MAC (DD:EE:FF:44:55:66) -> DROP + High Severity Security Alert."""
        # Register initial device
        self.client.post('/api/auth/student/login', json={
            'student_id': '23CS001',
            'password': 'Student@123',
            'observed_mac': 'AA:BB:CC:11:22:33'
        })

        # Attempt login from 2nd unauthorized device
        res = self.client.post('/api/auth/student/login', json={
            'student_id': '23CS001',
            'password': 'Student@123',
            'observed_mac': 'DD:EE:FF:44:55:66'
        })
        self.assertEqual(res.status_code, 403)
        data = res.get_json()
        self.assertEqual(data.get('decision'), 'DROP')
        self.assertEqual(data.get('status'), 'UNAUTHORIZED_DEVICE_MISMATCH')
        self.assertEqual(data.get('observed_mac'), 'DD:EE:FF:44:55:66')
        self.assertEqual(data.get('registered_mac'), 'AA:BB:CC:11:22:33')

        # Verify Security Alert in database
        alert = SecurityLog.query.filter_by(
            student_id='23CS001',
            observed_mac='DD:EE:FF:44:55:66',
            event_type='UNAUTHORIZED_DEVICE_ATTEMPT'
        ).first()
        self.assertIsNotNone(alert)
        self.assertEqual(alert.severity, 'HIGH')
        self.assertEqual(alert.decision, 'DROP')

        # Verify OpenFlow DROP rule (priority 200) on switch
        drop_rule = NetworkFlowRule.query.filter(NetworkFlowRule.match_criteria.like('%DD:EE:FF:44:55:66%')).first()
        self.assertIsNotNone(drop_rule)
        self.assertEqual(drop_rule.priority, 200)
        self.assertEqual(drop_rule.rule_type, 'DROP_UNAUTHORIZED')

    def test_05_device_reset_and_replacement(self):
        """Test admin device reset -> student can register a replacement device."""
        # 1. Register device 1
        self.client.post('/api/auth/student/login', json={
            'student_id': '23CS001',
            'password': 'Student@123',
            'observed_mac': 'AA:BB:CC:11:22:33'
        })
        student = db.session.get(Student, '23CS001')
        dev_id = student.active_device.device_id

        # 2. Admin logs in
        admin_res = self.client.post('/api/auth/admin/login', json={
            'username': 'admin',
            'password': 'Admin@123'
        })
        admin_token = admin_res.get_json()['token']

        # 3. Admin resets the device
        reset_res = self.client.post(
            f'/api/devices/{dev_id}/reset',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        self.assertEqual(reset_res.status_code, 200)

        # 4. Student connects with replacement device (11:22:33:44:55:66)
        res_new = self.client.post('/api/auth/student/login', json={
            'student_id': '23CS001',
            'password': 'Student@123',
            'observed_mac': '11:22:33:44:55:66'
        })
        self.assertEqual(res_new.status_code, 200)
        self.assertEqual(res_new.get_json().get('status'), 'FIRST_DEVICE_REGISTERED')

        student_updated = db.session.get(Student, '23CS001')
        self.assertEqual(student_updated.active_device.mac_address, '11:22:33:44:55:66')

    def test_06_duplicate_mac_prevention(self):
        """Verify student cannot register a MAC already owned by another student."""
        # 23CS002 has 52:54:00:12:34:56 registered
        res = self.client.post('/api/auth/student/login', json={
            'student_id': '23CS001',
            'password': 'Student@123',
            'observed_mac': '52:54:00:12:34:56' # MAC belongs to 23CS002
        })
        self.assertEqual(res.status_code, 403)
        data = res.get_json()
        self.assertEqual(data.get('decision'), 'DROP')
        self.assertEqual(data.get('status'), 'MAC_CONFLICT')
        self.assertEqual(data.get('severity'), 'CRITICAL')

    def test_07_role_based_authorization(self):
        """Verify student token cannot access admin routes."""
        # Login student
        s_res = self.client.post('/api/auth/student/login', json={
            'student_id': '23CS001',
            'password': 'Student@123',
            'observed_mac': 'AA:BB:CC:11:22:33'
        })
        student_token = s_res.get_json()['token']

        # Attempt to access admin students API
        res = self.client.get(
            '/api/admin/students',
            headers={'Authorization': f'Bearer {student_token}'}
        )
        self.assertEqual(res.status_code, 401)

if __name__ == '__main__':
    unittest.main()

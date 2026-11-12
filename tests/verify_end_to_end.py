import os
import sys
import json
import unittest

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.app import create_app
from backend.app.models import db, Student, RegisteredDevice, SecurityLog, NetworkFlowRule

class TestDemoEndToEndScenarios(unittest.TestCase):
    """
    End-to-End Test Suite for all 4 Key Demonstration Scenarios
    matching user requirements in Section 10 & Section 13.
    """

    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def setUp(self):
        # Reset demo state before tests
        self.client.post('/api/demo/reset')

    def test_01_health_check(self):
        """Verify health check endpoint returns 200."""
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get('sdn_ready'))

    def test_02_full_demo_walkthrough(self):
        """
        Executes TEST 1 -> TEST 2 -> TEST 3 -> TEST 4 in sequence.
        """
        print("\n--- STARTING DEMO WALKTHROUGH ---")

        # -------------------------------------------------------------
        # TEST 1: Login as student using the first device
        # Expected result: automatic registration and ALLOW
        # -------------------------------------------------------------
        print("[TEST 1] Student 23CS001 login from Device 1 (AA:BB:CC:11:22:33)...")
        res1 = self.client.post('/api/auth/student/login', json={
            'student_id': '23CS001',
            'password': 'Student@123',
            'observed_mac': 'AA:BB:CC:11:22:33'
        })
        self.assertEqual(res1.status_code, 200)
        d1 = res1.get_json()
        self.assertEqual(d1['decision'], 'ALLOW')
        self.assertEqual(d1['status'], 'FIRST_DEVICE_REGISTERED')
        print("  -> Result: ALLOW (Device AA:BB:CC:11:22:33 automatically registered)")

        # -------------------------------------------------------------
        # TEST 2: Login again using the same device
        # Expected result: ALLOW
        # -------------------------------------------------------------
        print("[TEST 2] Student 23CS001 login again from same Device 1 (AA:BB:CC:11:22:33)...")
        res2 = self.client.post('/api/auth/student/login', json={
            'student_id': '23CS001',
            'password': 'Student@123',
            'observed_mac': 'AA:BB:CC:11:22:33'
        })
        self.assertEqual(res2.status_code, 200)
        d2 = res2.get_json()
        self.assertEqual(d2['decision'], 'ALLOW')
        self.assertEqual(d2['status'], 'VERIFIED_DEVICE')
        print("  -> Result: ALLOW (Device verified, last_connected_at updated)")

        # -------------------------------------------------------------
        # TEST 3: Login using the second device
        # Expected result: DROP and security alert
        # -------------------------------------------------------------
        print("[TEST 3] Student 23CS001 attempts login from Unauthorized Device 2 (DD:EE:FF:44:55:66)...")
        res3 = self.client.post('/api/auth/student/login', json={
            'student_id': '23CS001',
            'password': 'Student@123',
            'observed_mac': 'DD:EE:FF:44:55:66'
        })
        self.assertEqual(res3.status_code, 403)
        d3 = res3.get_json()
        self.assertEqual(d3['decision'], 'DROP')
        self.assertEqual(d3['status'], 'UNAUTHORIZED_DEVICE_MISMATCH')
        self.assertEqual(d3['observed_mac'], 'DD:EE:FF:44:55:66')
        self.assertEqual(d3['registered_mac'], 'AA:BB:CC:11:22:33')
        print(f"  -> Result: DROP (One-device policy enforced. Security alert recorded with severity: {d3.get('severity')})")

        # -------------------------------------------------------------
        # TEST 4: Open admin dashboard
        # Expected result: updated device info, access decisions and security logs
        # -------------------------------------------------------------
        print("[TEST 4] Admin login and dashboard verification...")
        admin_auth = self.client.post('/api/auth/admin/login', json={
            'username': 'admin',
            'password': 'Admin@123'
        })
        self.assertEqual(admin_auth.status_code, 200)
        token = admin_auth.get_json()['token']
        headers = {'Authorization': f'Bearer {token}'}

        # Check KPI stats
        stats_res = self.client.get('/api/admin/stats', headers=headers)
        self.assertEqual(stats_res.status_code, 200)
        kpi = stats_res.get_json()['kpi']
        self.assertGreaterEqual(kpi['total_students'], 1)
        self.assertGreaterEqual(kpi['registered_devices'], 1)
        self.assertGreaterEqual(kpi['unauthorized_attempts'], 1)
        print(f"  -> KPI Stats: {kpi['registered_devices']} registered, {kpi['unauthorized_attempts']} unauthorized attempts detected")

        # Check Security Alerts
        alerts_res = self.client.get('/api/security/alerts', headers=headers)
        self.assertEqual(alerts_res.status_code, 200)
        alerts = alerts_res.get_json()
        unauth_alert = next((a for a in alerts if a['observed_mac'] == 'DD:EE:FF:44:55:66'), None)
        self.assertIsNotNone(unauth_alert)
        self.assertEqual(unauth_alert['severity'], 'HIGH')
        print(f"  -> Security Alert verified in feed: {unauth_alert['reason']}")

        # Check OpenFlow Flow Rules
        flows_res = self.client.get('/api/network/flows', headers=headers)
        self.assertEqual(flows_res.status_code, 200)
        flows = flows_res.get_json()
        drop_flow = next((f for f in flows if 'DD:EE:FF:44:55:66' in f['match']), None)
        self.assertIsNotNone(drop_flow)
        self.assertEqual(drop_flow['priority'], 200)
        self.assertEqual(drop_flow['rule_type'], 'DROP_UNAUTHORIZED')
        print(f"  -> OpenFlow 1.3 Flow Rule verified: Priority {drop_flow['priority']} {drop_flow['actions']} for MAC DD:EE:FF:44:55:66")

        print("--- ALL 4 DEMO SCENARIOS PASSED WITH 100% SUCCESS ---\n")

if __name__ == '__main__':
    unittest.main()

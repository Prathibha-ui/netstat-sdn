from datetime import datetime, timedelta, timezone
from backend.app.models import db, Admin, Student, RegisteredDevice, SecurityLog, AccessDecision
from backend.app.sdn_adapter import sdn_adapter

def seed_database():
    """Initializes the database with preconfigured accounts and demo data."""
    now = datetime.now(timezone.utc)

    # 1. Admin Account
    admin = Admin.query.filter_by(username='admin').first()
    if not admin:
        admin = Admin(
            username='admin',
            role='network_admin',
            created_at=now - timedelta(days=30)
        )
        admin.set_password('Admin@123')
        db.session.add(admin)

    # 2. Main Demo Student: 23CS001 (Starts with NO device so Test 1 can be shown live)
    student1 = db.session.get(Student, '23CS001')
    if not student1:
        student1 = Student(
            student_id='23CS001',
            name='Aarav Sharma',
            email='aarav.23cs001@university.edu',
            department='Computer Science & Engineering',
            year='3rd Year (B.Tech)',
            hostel_room='Hostel 4, Room 204',
            created_at=now - timedelta(days=15)
        )
        student1.set_password('Student@123')
        db.session.add(student1)

    # 3. Additional background students with existing registrations
    student2 = db.session.get(Student, '23CS002')
    if not student2:
        student2 = Student(
            student_id='23CS002',
            name='Sneha Patel',
            email='sneha.23cs002@university.edu',
            department='Computer Science & Engineering',
            year='3rd Year (B.Tech)',
            hostel_room='Hostel 2, Room 108',
            created_at=now - timedelta(days=14)
        )
        student2.set_password('Student@123')
        db.session.add(student2)
        db.session.flush()

        dev2 = RegisteredDevice(
            student_id='23CS002',
            mac_address='52:54:00:12:34:56',
            ip_address='10.0.0.102',
            status='ALLOWED',
            device_name="Sneha's MacBook Air M2",
            registered_at=now - timedelta(days=13),
            last_connected_at=now - timedelta(hours=2)
        )
        db.session.add(dev2)
        sdn_adapter.push_allow_flow('52:54:00:12:34:56', '10.0.0.102')

    student3 = db.session.get(Student, '23EC015')
    if not student3:
        student3 = Student(
            student_id='23EC015',
            name='Rohan Verma',
            email='rohan.23ec015@university.edu',
            department='Electronics & Communication',
            year='2nd Year (B.Tech)',
            hostel_room='Hostel 5, Room 312',
            created_at=now - timedelta(days=12)
        )
        student3.set_password('Student@123')
        db.session.add(student3)
        db.session.flush()

        dev3 = RegisteredDevice(
            student_id='23EC015',
            mac_address='B8:27:EB:AA:11:22',
            ip_address='10.0.0.103',
            status='ALLOWED',
            device_name="Rohan's ThinkPad T14",
            registered_at=now - timedelta(days=10),
            last_connected_at=now - timedelta(hours=5)
        )
        db.session.add(dev3)
        sdn_adapter.push_allow_flow('B8:27:EB:AA:11:22', '10.0.0.103')

    student4 = db.session.get(Student, '23IT042')
    if not student4:
        student4 = Student(
            student_id='23IT042',
            name='Priya Nair',
            email='priya.23it042@university.edu',
            department='Information Technology',
            year='4th Year (B.Tech)',
            hostel_room='Hostel 1, Room 405',
            created_at=now - timedelta(days=10)
        )
        student4.set_password('Student@123')
        db.session.add(student4)
        db.session.flush()

        dev4 = RegisteredDevice(
            student_id='23IT042',
            mac_address='DC:A6:32:88:99:00',
            ip_address='10.0.0.104',
            status='BLOCKED',
            device_name="Priya's Dell XPS (Blocked)",
            registered_at=now - timedelta(days=8),
            last_connected_at=now - timedelta(days=1)
        )
        db.session.add(dev4)
        sdn_adapter.push_drop_flow('DC:A6:32:88:99:00', 'Blocked due to policy audit')

    # Seed some initial historic security logs and access decisions
    if SecurityLog.query.count() == 0:
        log1 = SecurityLog(
            student_id='23CS002',
            observed_mac='52:54:00:12:34:56',
            registered_mac='52:54:00:12:34:56',
            event_type='DEVICE_AUTO_REGISTERED',
            decision='ALLOW',
            reason='Initial connection registered successfully for Sneha Patel',
            severity='LOW',
            timestamp=now - timedelta(days=13)
        )
        log2 = SecurityLog(
            student_id='23IT042',
            observed_mac='DC:A6:32:88:99:00',
            registered_mac='DC:A6:32:88:99:00',
            event_type='ADMIN_DEVICE_BLOCKED',
            decision='BLOCK',
            reason='Device administratively quarantined pending student ID verification',
            severity='HIGH',
            timestamp=now - timedelta(days=1)
        )
        db.session.add_all([log1, log2])

    if AccessDecision.query.count() == 0:
        d1 = AccessDecision(
            student_id='23CS002',
            observed_mac='52:54:00:12:34:56',
            ip_address='10.0.0.102',
            decision='ALLOW',
            reason='Verified registered MAC address. Policy compliant.',
            timestamp=now - timedelta(hours=2)
        )
        d2 = AccessDecision(
            student_id='23EC015',
            observed_mac='B8:27:EB:AA:11:22',
            ip_address='10.0.0.103',
            decision='ALLOW',
            reason='Verified registered MAC address. Policy compliant.',
            timestamp=now - timedelta(hours=5)
        )
        db.session.add_all([d1, d2])

    db.session.commit()

    # Initialize OpenFlow default table-miss and system flows
    sdn_adapter.init_default_flows()

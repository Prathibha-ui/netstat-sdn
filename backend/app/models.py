from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

def utcnow():
    return datetime.now(timezone.utc)

class Admin(db.Model):
    __tablename__ = 'admins'

    admin_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), default='network_admin', nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow)

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'admin_id': self.admin_id,
            'username': self.username,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Student(db.Model):
    __tablename__ = 'students'

    student_id = db.Column(db.String(32), primary_key=True, index=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    department = db.Column(db.String(80), nullable=False)
    year = db.Column(db.String(20), nullable=False)
    hostel_room = db.Column(db.String(50), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow)

    # Relationships
    devices = db.relationship('RegisteredDevice', backref='student', lazy=True, cascade='all, delete-orphan')
    security_logs = db.relationship('SecurityLog', backref='student', lazy=True)
    access_decisions = db.relationship('AccessDecision', backref='student', lazy=True)

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    @property
    def active_device(self):
        """Returns the currently active registered device if any."""
        for device in self.devices:
            if device.status in ['ALLOWED', 'BLOCKED']:
                return device
        return None

    def to_dict(self, include_device=True):
        data = {
            'student_id': self.student_id,
            'name': self.name,
            'email': self.email,
            'department': self.department,
            'year': self.year,
            'hostel_room': self.hostel_room,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'has_registered_device': self.active_device is not None
        }
        if include_device and self.active_device:
            data['device'] = self.active_device.to_dict(mask_mac=False)
        return data


class RegisteredDevice(db.Model):
    __tablename__ = 'registered_devices'

    device_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(32), db.ForeignKey('students.student_id'), nullable=False, index=True)
    mac_address = db.Column(db.String(17), nullable=False, index=True)
    ip_address = db.Column(db.String(45), nullable=True)
    # Status: 'ALLOWED', 'BLOCKED', 'REVOKED'
    status = db.Column(db.String(20), default='ALLOWED', nullable=False)
    device_name = db.Column(db.String(100), default='Hostel Student Laptop / Phone')
    registered_at = db.Column(db.DateTime, default=utcnow, nullable=False)
    last_connected_at = db.Column(db.DateTime, default=utcnow, nullable=False)

    __table_args__ = (
        db.Index('idx_student_status', 'student_id', 'status'),
    )

    @staticmethod
    def normalize_mac(mac: str) -> str:
        if not mac:
            return ""
        clean = mac.replace('-', ':').replace('.', ':').strip().upper()
        parts = clean.split(':')
        if len(parts) == 6:
            return ":".join(f"{int(p, 16):02X}" for p in parts)
        return clean

    @property
    def masked_mac(self) -> str:
        if not self.mac_address:
            return "UNKNOWN"
        parts = self.mac_address.split(':')
        if len(parts) == 6:
            return f"{parts[0]}:{parts[1]}:{parts[2]}:**:**:{parts[5]}"
        return self.mac_address[:8] + "**:**"

    def to_dict(self, mask_mac: bool = False):
        return {
            'device_id': self.device_id,
            'student_id': self.student_id,
            'student_name': self.student.name if self.student else None,
            'mac_address': self.masked_mac if mask_mac else self.mac_address,
            'raw_mac': self.mac_address,
            'ip_address': self.ip_address,
            'status': self.status,
            'device_name': self.device_name,
            'registered_at': self.registered_at.isoformat() if self.registered_at else None,
            'last_connected_at': self.last_connected_at.isoformat() if self.last_connected_at else None,
        }


class SecurityLog(db.Model):
    __tablename__ = 'security_logs'

    log_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(32), db.ForeignKey('students.student_id'), nullable=True, index=True)
    observed_mac = db.Column(db.String(17), nullable=False)
    registered_mac = db.Column(db.String(17), nullable=True)
    event_type = db.Column(db.String(64), nullable=False) # UNAUTHORIZED_DEVICE_ATTEMPT, MAC_CONFLICT, DEVICE_REGISTERED, ADMIN_BLOCK, etc.
    decision = db.Column(db.String(20), nullable=False)    # 'ALLOW', 'DROP', 'BLOCK', 'REVOKE'
    reason = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(20), default='MEDIUM', nullable=False) # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    timestamp = db.Column(db.DateTime, default=utcnow, nullable=False, index=True)

    def to_dict(self):
        return {
            'log_id': self.log_id,
            'student_id': self.student_id,
            'student_name': self.student.name if self.student else "Unknown / Unauthenticated",
            'observed_mac': self.observed_mac,
            'registered_mac': self.registered_mac,
            'event_type': self.event_type,
            'decision': self.decision,
            'reason': self.reason,
            'severity': self.severity,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }


class AccessDecision(db.Model):
    __tablename__ = 'access_decisions'

    decision_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(32), db.ForeignKey('students.student_id'), nullable=True, index=True)
    observed_mac = db.Column(db.String(17), nullable=False)
    ip_address = db.Column(db.String(45), nullable=True)
    decision = db.Column(db.String(20), nullable=False) # 'ALLOW', 'DROP'
    reason = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=utcnow, nullable=False, index=True)

    def to_dict(self):
        return {
            'decision_id': self.decision_id,
            'student_id': self.student_id,
            'student_name': self.student.name if self.student else "Unknown",
            'observed_mac': self.observed_mac,
            'ip_address': self.ip_address,
            'decision': self.decision,
            'reason': self.reason,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }


class NetworkFlowRule(db.Model):
    __tablename__ = 'network_flow_rules'

    rule_id = db.Column(db.Integer, primary_key=True)
    switch_dpid = db.Column(db.String(24), default='0000000000000001', nullable=False)
    table_id = db.Column(db.Integer, default=0, nullable=False)
    priority = db.Column(db.Integer, nullable=False)
    match_criteria = db.Column(db.String(255), nullable=False)
    actions = db.Column(db.String(255), nullable=False) # e.g. 'OUTPUT:CONTROLLER', 'OUTPUT:1', 'DROP'
    rule_type = db.Column(db.String(50), nullable=False) # 'ALLOW_REGISTERED', 'DROP_UNAUTHORIZED', 'DEFAULT_MISS', 'SYSTEM'
    packet_count = db.Column(db.Integer, default=0)
    byte_count = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    installed_at = db.Column(db.DateTime, default=utcnow)
    notes = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            'rule_id': self.rule_id,
            'switch_dpid': self.switch_dpid,
            'table_id': self.table_id,
            'priority': self.priority,
            'match': self.match_criteria,
            'actions': self.actions,
            'rule_type': self.rule_type,
            'packet_count': self.packet_count,
            'byte_count': self.byte_count,
            'is_active': self.is_active,
            'installed_at': self.installed_at.isoformat() if self.installed_at else None,
            'notes': self.notes
        }

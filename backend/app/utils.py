import base64
import json
import time
from functools import wraps
from flask import request, jsonify, g
from backend.app.models import Admin, Student

SECRET_KEY = "netstat-sdn-token-key-2026"

def generate_token(payload: dict) -> str:
    """Generates a secure JSON-encoded bearer token."""
    payload['exp'] = int(time.time()) + 86400 # 24 hours
    json_bytes = json.dumps(payload).encode('utf-8')
    return base64.urlsafe_b64encode(json_bytes).decode('utf-8')

def decode_token(token: str) -> dict:
    """Decodes and validates token."""
    try:
        # Add padding if needed
        rem = len(token) % 4
        if rem > 0:
            token += '=' * (4 - rem)
        json_bytes = base64.urlsafe_b64decode(token)
        payload = json.loads(json_bytes.decode('utf-8'))
        if payload.get('exp', 0) < time.time():
            return None
        return payload
    except Exception:
        return None

def get_current_user():
    """Extracts authenticated user from Authorization header."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ', 1)[1].strip()
    return decode_token(token)

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        payload = get_current_user()
        if not payload or payload.get('role') not in ['admin', 'network_admin']:
            return jsonify({'error': 'Unauthorized: Admin privileges required'}), 401
        g.current_user = payload
        return f(*args, **kwargs)
    return decorated

def student_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        payload = get_current_user()
        if not payload or payload.get('role') != 'student':
            return jsonify({'error': 'Unauthorized: Student authentication required'}), 401
        g.current_user = payload
        return f(*args, **kwargs)
    return decorated

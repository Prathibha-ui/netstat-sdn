import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'netstat-sdn-secure-super-secret-key-2026')
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL', f'sqlite:///{os.path.join(BASE_DIR, "netstat.db")}'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Ryu Controller REST API endpoints (if running locally or inside WSL/VM)
    RYU_API_URL = os.environ.get('RYU_API_URL', 'http://127.0.0.1:8080')
    RYU_TIMEOUT_SECONDS = 2
    
    # Simulation configuration
    ENABLE_SIMULATION_FALLBACK = True
    SIMULATED_SWITCH_DPID = '0000000000000001'
    SIMULATED_SWITCH_NAME = 's1 (Open vSwitch)'
    
    # Demo credentials
    DEMO_ADMIN_USER = 'admin'
    DEMO_ADMIN_PASS = 'Admin@123'
    DEMO_STUDENT_ID = '23CS001'
    DEMO_STUDENT_PASS = 'Student@123'
    
    # Demo test MACs
    DEMO_MAC_REGISTERED = 'AA:BB:CC:11:22:33'
    DEMO_MAC_UNAUTHORIZED = 'DD:EE:FF:44:55:66'

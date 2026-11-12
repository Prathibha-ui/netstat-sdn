import os
import sys

# Ensure backend root is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from backend.app import create_app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"============================================================")
    print(f" NETSTAT Backend & SDN Security Management System Starting")
    print(f" Serving API on: http://127.0.0.1:{port}")
    print(f" Default Admin: admin / Admin@123")
    print(f" Default Student: 23CS001 / Student@123")
    print(f"============================================================")
    app.run(host='0.0.0.0', port=port, debug=False)

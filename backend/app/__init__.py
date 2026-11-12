import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from backend.config import Config
from backend.app.models import db
from backend.app.seed_data import seed_database

def create_app(config_class=Config):
    dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'dist'))
    app = Flask(__name__, static_folder=dist_dir, static_url_path='')
    app.config.from_object(config_class)

    # Enable CORS for frontend development
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    db.init_app(app)

    # Register blueprints
    from backend.app.routes.auth import auth_bp
    from backend.app.routes.student import student_bp
    from backend.app.routes.devices import devices_bp
    from backend.app.routes.admin import admin_bp
    from backend.app.routes.network import network_bp
    from backend.app.routes.security import security_bp
    from backend.app.routes.demo import demo_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(devices_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(network_bp)
    app.register_blueprint(security_bp)
    app.register_blueprint(demo_bp)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'system': 'NETSTAT Network Access & Security Management System',
            'sdn_ready': True
        })

    # Serve built React frontend for production deployment
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        if path.startswith('api/'):
            return jsonify({'error': 'Not found'}), 404
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        elif os.path.exists(os.path.join(app.static_folder, 'index.html')):
            return send_from_directory(app.static_folder, 'index.html')
        else:
            return jsonify({
                'system': 'NETSTAT Backend API',
                'status': 'Frontend not built. Please run "pnpm build" in the frontend directory.'
            })

    with app.app_context():
        db.create_all()
        seed_database()

    return app

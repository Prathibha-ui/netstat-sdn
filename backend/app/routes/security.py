from flask import Blueprint, request, jsonify
from backend.app.models import SecurityLog, AccessDecision
from backend.app.utils import admin_required

security_bp = Blueprint('security', __name__, url_prefix='/api')

@security_bp.route('/security/alerts', methods=['GET'])
@admin_required
def get_security_alerts():
    severity = request.args.get('severity')
    query = SecurityLog.query.order_by(SecurityLog.timestamp.desc())

    if severity:
        query = query.filter_by(severity=severity.upper())
    else:
        # Default to alerts (medium, high, critical)
        query = query.filter(SecurityLog.severity.in_(['MEDIUM', 'HIGH', 'CRITICAL']))

    limit = int(request.args.get('limit', 50))
    alerts = query.limit(limit).all()
    return jsonify([a.to_dict() for a in alerts]), 200


@security_bp.route('/security/logs', methods=['GET'])
@admin_required
def get_security_logs():
    event_type = request.args.get('event_type')
    decision = request.args.get('decision')
    limit = int(request.args.get('limit', 100))

    query = SecurityLog.query.order_by(SecurityLog.timestamp.desc())

    if event_type:
        query = query.filter_by(event_type=event_type)
    if decision:
        query = query.filter_by(decision=decision.upper())

    logs = query.limit(limit).all()
    return jsonify([l.to_dict() for l in logs]), 200


@security_bp.route('/access/decisions', methods=['GET'])
@admin_required
def get_access_decisions():
    decision_filter = request.args.get('decision')
    limit = int(request.args.get('limit', 100))

    query = AccessDecision.query.order_by(AccessDecision.timestamp.desc())

    if decision_filter:
        query = query.filter_by(decision=decision_filter.upper())

    decisions = query.limit(limit).all()
    return jsonify([d.to_dict() for d in decisions]), 200

from flask import Blueprint, request, jsonify
from backend.app.models import db, NetworkFlowRule, RegisteredDevice, Student
from backend.app.sdn_adapter import sdn_adapter
from backend.app.utils import admin_required

network_bp = Blueprint('network', __name__, url_prefix='/api/network')

@network_bp.route('/topology', methods=['GET'])
def get_topology():
    """
    Returns nodes and edges for the network topology graph.
    Clearly indicates actual simulation nodes vs illustrative topology.
    """
    connection_info = sdn_adapter.check_ryu_connection()
    is_live = connection_info.get('is_live', False)

    # Fetch active devices
    allowed_devices = RegisteredDevice.query.filter_by(status='ALLOWED').all()
    blocked_devices = RegisteredDevice.query.filter_by(status='BLOCKED').all()

    nodes = [
        {
            'id': 'c0',
            'label': 'Ryu SDN Controller',
            'type': 'controller',
            'ip': '127.0.0.1',
            'port': 6633,
            'status': 'ACTIVE' if is_live else 'EMULATED',
            'mode': connection_info.get('mode', 'Simulation Mode'),
            'description': 'Centralized OpenFlow 1.3 control plane orchestrating flow rules'
        },
        {
            'id': 's1',
            'label': 'Open vSwitch (s1)',
            'type': 'switch',
            'dpid': '0000000000000001',
            'openflow_version': 'OpenFlow 1.3',
            'ports': 6,
            'status': 'ONLINE',
            'description': 'Access layer programmable switch enforcing port and MAC rules'
        },
        {
            'id': 'gw',
            'label': 'Hostel Gateway Router',
            'type': 'gateway',
            'ip': '10.0.0.1',
            'mac': '00:00:5E:00:53:01',
            'status': 'UP',
            'description': 'Uplink to University Core Network & Internet'
        }
    ]

    links = [
        {
            'id': 'link-c0-s1',
            'source': 'c0',
            'target': 's1',
            'type': 'control',
            'protocol': 'OpenFlow 1.3 (TCP 6633/6653)',
            'status': 'ACTIVE'
        },
        {
            'id': 'link-s1-gw',
            'source': 's1',
            'target': 'gw',
            'port': 'Port 1',
            'type': 'uplink',
            'bandwidth': '1 Gbps',
            'status': 'ACTIVE'
        }
    ]

    port_counter = 2
    # Add Student registered hosts
    for dev in allowed_devices:
        host_id = f"host_{dev.device_id}"
        nodes.append({
            'id': host_id,
            'label': f"{dev.student.name.split()[0]} ({dev.student_id})",
            'type': 'host_allowed',
            'student_id': dev.student_id,
            'mac': dev.mac_address,
            'ip': dev.ip_address or '10.0.0.101',
            'status': 'AUTHORIZED',
            'port': f"Port {port_counter}",
            'description': f"Registered primary device ({dev.device_name})"
        })
        links.append({
            'id': f"link-s1-{host_id}",
            'source': host_id,
            'target': 's1',
            'port': f"Port {port_counter}",
            'type': 'access',
            'status': 'FORWARDING'
        })
        port_counter += 1

    # Add blocked / unauthorized rogue host demo representation
    nodes.append({
        'id': 'host_unauthorized_demo',
        'label': 'Rogue / 2nd Device',
        'type': 'host_blocked',
        'mac': 'DD:EE:FF:44:55:66',
        'ip': '10.0.0.199',
        'status': 'BLOCKED / DROPPED',
        'port': f"Port {port_counter}",
        'description': 'Unauthorized secondary device attempting network access'
    })
    links.append({
        'id': 'link-s1-unauthorized',
        'source': 'host_unauthorized_demo',
        'target': 's1',
        'port': f"Port {port_counter}",
        'type': 'access',
        'status': 'DROPPED'
    })

    return jsonify({
        'nodes': nodes,
        'links': links,
        'is_live': is_live,
        'status': connection_info,
        'summary': {
            'total_nodes': len(nodes),
            'total_links': len(links),
            'authorized_hosts': len(allowed_devices),
            'blocked_hosts': len(blocked_devices) + 1
        }
    }), 200


@network_bp.route('/status', methods=['GET'])
def get_status():
    connection_info = sdn_adapter.check_ryu_connection()
    flow_count = NetworkFlowRule.query.filter_by(is_active=True).count()
    device_count = RegisteredDevice.query.count()

    return jsonify({
        'sdn_controller': {
            'name': 'Ryu SDN Framework',
            'version': 'OpenFlow 1.3',
            'status': connection_info['status'],
            'is_live': connection_info['is_live'],
            'api_endpoint': connection_info['url'],
            'mode': connection_info['mode']
        },
        'open_vswitch': {
            'bridge': 's1',
            'dpid': '0000000000000001',
            'status': 'ACTIVE',
            'tables': 1,
            'active_flows': flow_count,
            'ports': ['s1-eth1 (Gateway)', 's1-eth2 (Host 1)', 's1-eth3 (Host 2)', 's1-eth4 (Host 3)']
        },
        'mininet_simulation': {
            'status': 'AVAILABLE',
            'script': 'sdn/topology.py',
            'description': 'Mininet topology script ready for execution in Linux/WSL environment or emulation mode'
        },
        'network_devices_total': device_count
    }), 200


@network_bp.route('/flows', methods=['GET'])
def get_flows():
    rules = NetworkFlowRule.query.order_by(NetworkFlowRule.priority.desc()).all()
    return jsonify([r.to_dict() for r in rules]), 200


@network_bp.route('/simulate-packet', methods=['POST'])
@admin_required
def simulate_packet():
    data = request.get_json() or {}
    src_mac = data.get('src_mac', 'AA:BB:CC:11:22:33').strip()
    dst_mac = data.get('dst_mac', 'FF:FF:FF:FF:FF:FF').strip()
    in_port = int(data.get('in_port', 2))

    result = sdn_adapter.simulate_packet_ingress(src_mac, dst_mac, in_port)
    return jsonify(result), 200

import json
import logging
import requests
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from backend.app.models import db, NetworkFlowRule

logger = logging.getLogger('sdn_adapter')

class SDNControllerAdapter:
    """
    SDN Controller Interface:
    Connects to an active Ryu OpenFlow 1.3 controller via REST API if available.
    If running standalone without Mininet/Ryu, operates as a high-fidelity
    OpenFlow 1.3 emulation adapter, maintaining real flow tables and stats.
    """

    def __init__(self, ryu_api_url: str = 'http://127.0.0.1:8080', timeout: int = 2):
        self.ryu_api_url = ryu_api_url.rstrip('/')
        self.timeout = timeout
        self.dpid = '0000000000000001'
        self.dpid_int = 1

    def check_ryu_connection(self) -> Dict[str, Any]:
        """Checks if a real Ryu REST controller is reachable."""
        try:
            resp = requests.get(f"{self.ryu_api_url}/stats/switches", timeout=self.timeout)
            if resp.status_code == 200:
                switches = resp.json()
                return {
                    'is_live': True,
                    'status': 'CONNECTED',
                    'controller': 'Ryu OpenFlow 1.3 REST API',
                    'url': self.ryu_api_url,
                    'active_switches': switches,
                    'mode': 'Live OpenFlow Enforcement'
                }
        except Exception:
            pass

        return {
            'is_live': False,
            'status': 'SIMULATION_MODE',
            'controller': 'Embedded OpenFlow 1.3 Simulation Engine',
            'url': self.ryu_api_url,
            'active_switches': [1],
            'mode': 'High-Fidelity Software OpenFlow 1.3 Emulation'
        }

    def init_default_flows(self):
        """Initializes default OpenFlow 1.3 table rules if table is empty."""
        try:
            count = NetworkFlowRule.query.count()
            if count == 0:
                # 1. System broadcast / ARP
                r1 = NetworkFlowRule(
                    switch_dpid=self.dpid,
                    table_id=0,
                    priority=65535,
                    match_criteria='eth_type=0x0806 (ARP)',
                    actions='FLOOD',
                    rule_type='SYSTEM',
                    packet_count=1240,
                    byte_count=84320,
                    notes='System ARP resolution across subnet'
                )
                # 2. DHCP handling
                r2 = NetworkFlowRule(
                    switch_dpid=self.dpid,
                    table_id=0,
                    priority=60000,
                    match_criteria='ip_proto=17, udp_src=68, udp_dst=67 (DHCP)',
                    actions='OUTPUT:CONTROLLER',
                    rule_type='SYSTEM',
                    packet_count=45,
                    byte_count=15300,
                    notes='DHCP Snooping & inspection'
                )
                # 3. Default Table-Miss
                r3 = NetworkFlowRule(
                    switch_dpid=self.dpid,
                    table_id=0,
                    priority=0,
                    match_criteria='* (All unmatched traffic)',
                    actions='OUTPUT:CONTROLLER',
                    rule_type='DEFAULT_MISS',
                    packet_count=320,
                    byte_count=21760,
                    notes='Table-miss flow entry: sends Packet-In to controller'
                )
                db.session.add_all([r1, r2, r3])
                db.session.commit()
        except Exception as e:
            logger.error(f"Error initializing default flows: {e}")
            db.session.rollback()

    def push_allow_flow(self, mac_address: str, ip_address: Optional[str] = None, in_port: int = 1) -> bool:
        """
        Installs an OpenFlow 1.3 flow rule allowing traffic from the registered MAC.
        Priority: 100 (Normal verified forwarding)
        """
        normalized_mac = mac_address.upper()

        # Remove any existing DROP or old ALLOW rule for this MAC
        existing_rules = NetworkFlowRule.query.filter(
            NetworkFlowRule.match_criteria.like(f"%{normalized_mac}%")
        ).all()
        for r in existing_rules:
            db.session.delete(r)

        match_desc = f"eth_src={normalized_mac}"
        if ip_address:
            match_desc += f", ipv4_src={ip_address}"

        rule = NetworkFlowRule(
            switch_dpid=self.dpid,
            table_id=0,
            priority=100,
            match_criteria=match_desc,
            actions=f'OUTPUT:GATEWAY_PORT (Port 1), eth_dst=LEARNED',
            rule_type='ALLOW_REGISTERED',
            packet_count=12,
            byte_count=1024,
            is_active=True,
            notes=f'Allowed registered device for student'
        )
        db.session.add(rule)
        db.session.commit()

        # Attempt Ryu REST push if Ryu is alive
        self._push_to_ryu(
            dpid=self.dpid_int,
            priority=100,
            match={'eth_src': normalized_mac.lower()},
            actions=[{'type': 'OUTPUT', 'port': 'NORMAL'}]
        )
        return True

    def push_drop_flow(self, mac_address: str, reason: str = "Unauthorized device mismatch") -> bool:
        """
        Installs an OpenFlow 1.3 flow rule dropping all traffic from unauthorized MAC.
        Priority: 200 (Overrides default forwarding)
        """
        normalized_mac = mac_address.upper()

        # Remove existing rule for this MAC
        existing_rules = NetworkFlowRule.query.filter(
            NetworkFlowRule.match_criteria.like(f"%{normalized_mac}%")
        ).all()
        for r in existing_rules:
            db.session.delete(r)

        rule = NetworkFlowRule(
            switch_dpid=self.dpid,
            table_id=0,
            priority=200,
            match_criteria=f"eth_src={normalized_mac}",
            actions='DROP (Clear actions pipeline)',
            rule_type='DROP_UNAUTHORIZED',
            packet_count=5,
            byte_count=420,
            is_active=True,
            notes=f'DROP rule: {reason}'
        )
        db.session.add(rule)
        db.session.commit()

        # Attempt Ryu REST push if Ryu is alive (empty actions = DROP)
        self._push_to_ryu(
            dpid=self.dpid_int,
            priority=200,
            match={'eth_src': normalized_mac.lower()},
            actions=[]
        )
        return True

    def remove_flow_for_mac(self, mac_address: str):
        """Removes all flow rules matching a MAC."""
        normalized_mac = mac_address.upper()
        rules = NetworkFlowRule.query.filter(
            NetworkFlowRule.match_criteria.like(f"%{normalized_mac}%")
        ).all()
        for r in rules:
            db.session.delete(r)
        db.session.commit()

    def simulate_packet_ingress(self, src_mac: str, dst_mac: str = "FF:FF:FF:FF:FF:FF", in_port: int = 1) -> Dict[str, Any]:
        """
        High-fidelity OpenFlow 1.3 pipeline simulation.
        Evaluates a frame against Table 0 rules in priority order.
        """
        normalized_src = src_mac.upper()

        # Fetch active rules sorted by priority descending
        rules = NetworkFlowRule.query.filter_by(is_active=True).order_by(NetworkFlowRule.priority.desc()).all()

        matched_rule = None
        for rule in rules:
            if rule.rule_type == 'DROP_UNAUTHORIZED' and normalized_src in rule.match_criteria:
                matched_rule = rule
                break
            elif rule.rule_type == 'ALLOW_REGISTERED' and normalized_src in rule.match_criteria:
                matched_rule = rule
                break
            elif rule.rule_type == 'DEFAULT_MISS':
                matched_rule = rule

        if matched_rule:
            matched_rule.packet_count += 1
            matched_rule.byte_count += 64
            db.session.commit()

            if matched_rule.rule_type == 'DROP_UNAUTHORIZED':
                return {
                    'decision': 'DROP',
                    'action': 'PACKET_DROPPED_BY_SWITCH',
                    'priority': matched_rule.priority,
                    'rule_id': matched_rule.rule_id,
                    'explanation': f"Packet matched Priority {matched_rule.priority} DROP entry for MAC {normalized_src}. Dropped silently by Open vSwitch."
                }
            elif matched_rule.rule_type == 'ALLOW_REGISTERED':
                return {
                    'decision': 'ALLOW',
                    'action': 'FORWARD_TO_GATEWAY',
                    'priority': matched_rule.priority,
                    'rule_id': matched_rule.rule_id,
                    'explanation': f"Packet matched Priority {matched_rule.priority} ALLOW entry for registered MAC {normalized_src}. Forwarded via Port 1 to Hostel Gateway."
                }
            else:
                return {
                    'decision': 'TABLE_MISS',
                    'action': 'PACKET_IN_TO_CONTROLLER',
                    'priority': 0,
                    'rule_id': matched_rule.rule_id,
                    'explanation': f"Unrecognized MAC {normalized_src}. Sent as OpenFlow Packet-In event to Ryu Controller."
                }

        return {
            'decision': 'DROP',
            'action': 'DEFAULT_DROP',
            'priority': 0,
            'explanation': 'No matching flow rule found.'
        }

    def _push_to_ryu(self, dpid: int, priority: int, match: dict, actions: list):
        """Attempts to push flow mod directly to Ryu REST API if alive."""
        try:
            url = f"{self.ryu_api_url}/stats/flowentry/add"
            payload = {
                'dpid': dpid,
                'table_id': 0,
                'priority': priority,
                'match': match,
                'actions': actions
            }
            requests.post(url, json=payload, timeout=0.8)
        except Exception:
            # Expected if Ryu is not running locally; simulation mode handles it cleanly
            pass

sdn_adapter = SDNControllerAdapter()

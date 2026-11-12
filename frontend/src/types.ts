export type ThemeMode = 'light' | 'dark' | 'system';

export type UserRole = 'admin' | 'student' | null;

export interface AdminUser {
  admin_id: number;
  username: string;
  role: string;
  created_at?: string;
}

export interface StudentUser {
  student_id: string;
  name: string;
  email: string;
  department: string;
  year: string;
  hostel_room: string;
  created_at?: string;
  has_registered_device?: boolean;
  device?: RegisteredDevice | null;
}

export interface RegisteredDevice {
  device_id: number;
  student_id: string;
  student_name?: string;
  mac_address: string;
  raw_mac?: string;
  ip_address?: string;
  status: 'ALLOWED' | 'BLOCKED' | 'REVOKED';
  device_name: string;
  registered_at: string;
  last_connected_at: string;
}

export interface SecurityLog {
  log_id: number;
  student_id?: string;
  student_name?: string;
  observed_mac: string;
  registered_mac?: string;
  event_type: string;
  decision: 'ALLOW' | 'DROP' | 'BLOCK' | 'REVOKE';
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
}

export interface AccessDecision {
  decision_id: number;
  student_id?: string;
  student_name?: string;
  observed_mac: string;
  ip_address?: string;
  decision: 'ALLOW' | 'DROP';
  reason: string;
  timestamp: string;
}

export interface NetworkFlowRule {
  rule_id: number;
  switch_dpid: string;
  table_id: number;
  priority: number;
  match: string;
  actions: string;
  rule_type: 'ALLOW_REGISTERED' | 'DROP_UNAUTHORIZED' | 'DEFAULT_MISS' | 'SYSTEM';
  packet_count: number;
  byte_count: number;
  is_active: boolean;
  installed_at: string;
  notes?: string;
}

export interface TopologyNode {
  id: string;
  label: string;
  type: 'controller' | 'switch' | 'gateway' | 'host_allowed' | 'host_blocked';
  ip?: string;
  mac?: string;
  dpid?: string;
  port?: string;
  status: string;
  openflow_version?: string;
  student_id?: string;
  description?: string;
}

export interface TopologyLink {
  id: string;
  source: string;
  target: string;
  type: 'control' | 'uplink' | 'access';
  port?: string;
  protocol?: string;
  bandwidth?: string;
  status: 'ACTIVE' | 'FORWARDING' | 'DROPPED';
}

export interface NetworkTopologyData {
  nodes: TopologyNode[];
  links: TopologyLink[];
  is_live: boolean;
  status: {
    status: string;
    is_live: boolean;
    controller: string;
    mode: string;
  };
  summary: {
    total_nodes: number;
    total_links: number;
    authorized_hosts: number;
    blocked_hosts: number;
  };
}

export interface KPIStats {
  total_students: number;
  registered_devices: number;
  connected_devices: number;
  blocked_devices: number;
  unauthorized_attempts: number;
  security_alerts: number;
}

export interface AdminStatsResponse {
  kpi: KPIStats;
  sdn_status: {
    is_live: boolean;
    status: string;
    controller: string;
    url: string;
    mode: string;
  };
  traffic_history: Array<{
    time: string;
    inbound: number;
    outbound: number;
    blocked: number;
  }>;
}

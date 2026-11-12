import {
  AdminStatsResponse,
  NetworkTopologyData,
  NetworkFlowRule,
  RegisteredDevice,
  StudentUser,
  SecurityLog,
  AccessDecision
} from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('netstat_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const observedMac = localStorage.getItem('netstat_simulated_mac');
  if (observedMac) {
    headers['X-Observed-MAC'] = observedMac;
  }
  return headers;
}

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Cannot connect to NETSTAT backend on port 5000. Please ensure 'python backend/run.py' is running in your terminal.`
    );
  }
}

export const api = {
  // Auth
  async loginStudent(studentId: string, password: string, observedMac?: string) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/auth/student/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(observedMac ? { 'X-Observed-MAC': observedMac } : {}),
        },
        body: JSON.stringify({
          student_id: studentId,
          password,
          observed_mac: observedMac,
        }),
      });
    } catch {
      throw {
        status: 503,
        data: { error: "Cannot connect to backend. Please run 'python backend/run.py' in a terminal." }
      };
    }
    const data = await safeJson(res);
    if (!res.ok) {
      throw { status: res.status, data };
    }
    return data;
  },

  async registerStudent(studentData: {
    student_id: string;
    name: string;
    password: string;
    email?: string;
    department?: string;
    year?: string;
    hostel_room?: string;
    observed_mac?: string;
  }) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/auth/student/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(studentData.observed_mac ? { 'X-Observed-MAC': studentData.observed_mac } : {}),
        },
        body: JSON.stringify(studentData),
      });
    } catch {
      throw {
        status: 503,
        data: { error: "Cannot connect to backend. Please run 'python backend/run.py' in a terminal." }
      };
    }
    const data = await safeJson(res);
    if (!res.ok) {
      throw { status: res.status, data };
    }
    return data;
  },

  async loginAdmin(username: string, password: string) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
    } catch {
      throw {
        status: 503,
        data: { error: "Cannot connect to backend. Please run 'python backend/run.py' in a terminal." }
      };
    }
    const data = await safeJson(res);
    if (!res.ok) {
      throw { status: res.status, data };
    }
    return data;
  },

  async getCurrentUser() {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return null;
      return safeJson(res);
    } catch {
      return null;
    }
  },

  async logout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch {
      // ignore
    }
    localStorage.removeItem('netstat_token');
    localStorage.removeItem('netstat_user_role');
  },

  // Student Endpoints
  async getStudentProfile(): Promise<StudentUser> {
    const res = await fetch(`${API_BASE}/student/profile`, {
      headers: getAuthHeaders(),
    });
    return safeJson(res);
  },

  async getStudentDevice() {
    const res = await fetch(`${API_BASE}/student/device`, {
      headers: getAuthHeaders(),
    });
    return safeJson(res);
  },

  async getStudentActivity() {
    const res = await fetch(`${API_BASE}/student/activity`, {
      headers: getAuthHeaders(),
    });
    return safeJson(res);
  },

  // Admin Endpoints
  async getAdminStats(): Promise<AdminStatsResponse> {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: getAuthHeaders(),
    });
    return safeJson(res);
  },

  async getStudents(): Promise<StudentUser[]> {
    const res = await fetch(`${API_BASE}/admin/students`, {
      headers: getAuthHeaders(),
    });
    return safeJson(res);
  },

  async createStudent(studentData: Partial<StudentUser> & { password?: string }) {
    const res = await fetch(`${API_BASE}/admin/students`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(studentData),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || 'Failed to create student');
    return data;
  },

  async updateStudent(studentId: string, studentData: Partial<StudentUser> & { password?: string }) {
    const res = await fetch(`${API_BASE}/admin/students/${studentId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(studentData),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || 'Failed to update student');
    return data;
  },

  async deleteStudent(studentId: string) {
    const res = await fetch(`${API_BASE}/admin/students/${studentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return safeJson(res);
  },

  // Devices
  async getDevices(status?: string): Promise<RegisteredDevice[]> {
    const url = status ? `${API_BASE}/devices?status=${status}` : `${API_BASE}/devices`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return safeJson(res);
  },

  async registerDevice(deviceData: { student_id: string; mac_address: string; device_name?: string }) {
    const res = await fetch(`${API_BASE}/devices/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(deviceData),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || 'Failed to register device');
    return data;
  },

  async blockDevice(deviceId: number) {
    const res = await fetch(`${API_BASE}/devices/${deviceId}/block`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return safeJson(res);
  },

  async unblockDevice(deviceId: number) {
    const res = await fetch(`${API_BASE}/devices/${deviceId}/unblock`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return safeJson(res);
  },

  async resetDevice(deviceId: number) {
    const res = await fetch(`${API_BASE}/devices/${deviceId}/reset`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return safeJson(res);
  },

  // Network & Flows
  async getTopology(): Promise<NetworkTopologyData> {
    const res = await fetch(`${API_BASE}/network/topology`, {
      headers: getAuthHeaders(),
    });
    return safeJson(res);
  },

  async getNetworkStatus() {
    const res = await fetch(`${API_BASE}/network/status`, {
      headers: getAuthHeaders(),
    });
    return safeJson(res);
  },

  async getFlowRules(): Promise<NetworkFlowRule[]> {
    const res = await fetch(`${API_BASE}/network/flows`, {
      headers: getAuthHeaders(),
    });
    return safeJson(res);
  },

  async simulatePacket(srcMac: string, dstMac = 'FF:FF:FF:FF:FF:FF', inPort = 2) {
    const res = await fetch(`${API_BASE}/network/simulate-packet`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ src_mac: srcMac, dst_mac: dstMac, in_port: inPort }),
    });
    return safeJson(res);
  },

  // Security & Logs
  async getSecurityAlerts(severity?: string): Promise<SecurityLog[]> {
    const url = severity ? `${API_BASE}/security/alerts?severity=${severity}` : `${API_BASE}/security/alerts`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return safeJson(res);
  },

  async getSecurityLogs(eventType?: string): Promise<SecurityLog[]> {
    const url = eventType ? `${API_BASE}/security/logs?event_type=${eventType}` : `${API_BASE}/security/logs`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return safeJson(res);
  },

  async getAccessDecisions(decision?: string): Promise<AccessDecision[]> {
    const url = decision ? `${API_BASE}/access/decisions?decision=${decision}` : `${API_BASE}/access/decisions`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return safeJson(res);
  },

  // Demo Control
  async resetDemo() {
    const res = await fetch(`${API_BASE}/demo/reset`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return safeJson(res);
  },
};

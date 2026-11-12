import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AdminStatsResponse, AccessDecision, SecurityLog } from '../types';
import { KPICard } from '../components/KPICard';
import { TrafficChart } from '../components/TrafficChart';
import { StatusBadge } from '../components/StatusBadge';
import { PacketSimulatorModal } from '../components/PacketSimulatorModal';
import {
  Users,
  Laptop,
  Wifi,
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  Cpu,
  Server,
  Radio,
  ArrowUpRight,
  Send,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [recentDecisions, setRecentDecisions] = useState<AccessDecision[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPacketModalOpen, setIsPacketModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [statsData, decisionsData, alertsData] = await Promise.all([
        api.getAdminStats(),
        api.getAccessDecisions(),
        api.getSecurityAlerts(),
      ]);
      setStats(statsData);
      setRecentDecisions(decisionsData.slice(0, 6));
      setRecentAlerts(alertsData.slice(0, 5));
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-400 font-medium">Loading SDN telemetry...</span>
        </div>
      </div>
    );
  }

  const kpi = stats?.kpi || {
    total_students: 0,
    registered_devices: 0,
    connected_devices: 0,
    blocked_devices: 0,
    unauthorized_attempts: 0,
    security_alerts: 0,
  };

  const sdnStatus = stats?.sdn_status || {
    is_live: false,
    status: 'SIMULATION_MODE',
    controller: 'OpenFlow 1.3 Engine',
    url: 'http://127.0.0.1:8080',
    mode: 'High-Fidelity Software OpenFlow 1.3 Emulation',
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Status & Quick Packet Ingress Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-[#0c152d] border border-slate-200 dark:border-[#1e3160] rounded-xl p-4 gap-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Radio className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                SDN Controller & OpenFlow Control Plane
              </h2>
              <StatusBadge status={sdnStatus.status} size="sm" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {sdnStatus.mode} • Target Controller: {sdnStatus.url}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPacketModalOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Test Packet Ingress</span>
          </button>
        </div>
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Total Students"
          value={kpi.total_students}
          icon={Users}
          variant="blue"
          subtitle="Enrolled in hostel directory"
        />
        <KPICard
          title="Registered Devices"
          value={kpi.registered_devices}
          icon={Laptop}
          variant="cyan"
          subtitle="Bound MAC addresses"
        />
        <KPICard
          title="Connected / Allowed"
          value={kpi.connected_devices}
          icon={Wifi}
          variant="emerald"
          subtitle="Active OpenFlow rules"
        />
        <KPICard
          title="Blocked Devices"
          value={kpi.blocked_devices}
          icon={ShieldAlert}
          variant="rose"
          subtitle="Quarantined MACs"
        />
        <KPICard
          title="Unauthorized Attempts"
          value={kpi.unauthorized_attempts}
          icon={AlertTriangle}
          variant="amber"
          subtitle="Policy 2nd-device blocks"
        />
        <KPICard
          title="Security Alerts"
          value={kpi.security_alerts}
          icon={ShieldCheck}
          variant="purple"
          subtitle="High/Critical incidents"
        />
      </div>

      {/* Traffic Throughput & Enforcement Chart */}
      <TrafficChart data={stats?.traffic_history || []} />

      {/* Recent Access Decisions & Security Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Access Decisions */}
        <div className="rounded-xl border border-slate-200 dark:border-[#1e3160] bg-white dark:bg-[#0f1c3b] p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1e3160] mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Access Decisions
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Network access evaluations by student & MAC
              </p>
            </div>
            <Link
              to="/admin/decisions"
              className="text-xs text-sky-500 hover:text-sky-400 font-medium flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentDecisions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No recent access decisions recorded.</p>
            ) : (
              recentDecisions.map((dec) => (
                <div
                  key={dec.decision_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-[#0c152d] border border-slate-100 dark:border-[#14244a] text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {dec.student_name} ({dec.student_id})
                      </span>
                      <StatusBadge status={dec.decision} size="sm" />
                    </div>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      MAC: {dec.observed_mac} • IP: {dec.ip_address || '10.0.0.101'}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1">
                      {dec.reason}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap ml-2">
                    {dec.timestamp ? new Date(dec.timestamp).toLocaleTimeString() : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Security Alerts */}
        <div className="rounded-xl border border-slate-200 dark:border-[#1e3160] bg-white dark:bg-[#0f1c3b] p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1e3160] mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                High-Priority Security Alerts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unauthorized device mismatches & policy violations
              </p>
            </div>
            <Link
              to="/admin/alerts"
              className="text-xs text-sky-500 hover:text-sky-400 font-medium flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentAlerts.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No security alerts at this time.</p>
            ) : (
              recentAlerts.map((alt) => (
                <div
                  key={alt.log_id}
                  className="flex items-start justify-between p-3 rounded-lg bg-rose-500/5 dark:bg-[#1a0a14] border border-rose-500/20 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-rose-400 uppercase tracking-wider text-[11px]">
                        {alt.event_type.replace(/_/g, ' ')}
                      </span>
                      <StatusBadge status={alt.severity} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                      {alt.reason}
                    </p>
                    <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-400">
                      <span>Observed: {alt.observed_mac}</span>
                      {alt.registered_mac && <span>Registered: {alt.registered_mac}</span>}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap ml-2">
                    {alt.timestamp ? new Date(alt.timestamp).toLocaleTimeString() : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Packet Simulator Modal */}
      <PacketSimulatorModal
        isOpen={isPacketModalOpen}
        onClose={() => {
          setIsPacketModalOpen(false);
          fetchDashboardData();
        }}
      />
    </div>
  );
};

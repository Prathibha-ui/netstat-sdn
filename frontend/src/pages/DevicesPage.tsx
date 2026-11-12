import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { RegisteredDevice } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Laptop, ShieldAlert, ShieldCheck, RefreshCw, Plus, Search, Trash2 } from 'lucide-react';

export const DevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<RegisteredDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentId, setNewStudentId] = useState('');
  const [newMac, setNewMac] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchDevices = async () => {
    try {
      const data = await api.getDevices();
      setDevices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleBlock = async (deviceId: number) => {
    setActionLoading(deviceId);
    try {
      await api.blockDevice(deviceId);
      await fetchDevices();
    } catch (err: any) {
      alert(err.message || 'Error blocking device');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblock = async (deviceId: number) => {
    setActionLoading(deviceId);
    try {
      await api.unblockDevice(deviceId);
      await fetchDevices();
    } catch (err: any) {
      alert(err.message || 'Error unblocking device');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReset = async (deviceId: number, studentId: string) => {
    if (!confirm(`Are you sure you want to reset device registration for student ${studentId}? They will be able to register a new device on their next login.`)) {
      return;
    }
    setActionLoading(deviceId);
    try {
      await api.resetDevice(deviceId);
      await fetchDevices();
    } catch (err: any) {
      alert(err.message || 'Error resetting device');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.registerDevice({
        student_id: newStudentId,
        mac_address: newMac,
        device_name: newDeviceName || 'Hostel Student Device',
      });
      setShowAddModal(false);
      setNewStudentId('');
      setNewMac('');
      setNewDeviceName('');
      await fetchDevices();
    } catch (err: any) {
      alert(err.message || 'Failed to register device');
    }
  };

  const filteredDevices = devices.filter((d) => {
    const matchesFilter = filter === 'ALL' || d.status === filter;
    const matchesSearch =
      d.mac_address.toLowerCase().includes(search.toLowerCase()) ||
      d.student_id.toLowerCase().includes(search.toLowerCase()) ||
      (d.student_name && d.student_name.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Registered Network Devices
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            One-Device-Per-Student policy mapping table & OpenFlow enforcement
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDevices}
            className="p-2 rounded-lg border border-slate-200 dark:border-[#1e3160] hover:bg-slate-100 dark:hover:bg-[#14244a] text-slate-400 hover:text-white transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register Device</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#0c152d] border border-slate-200 dark:border-[#1e3160] rounded-xl p-3 shadow-sm">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {['ALL', 'ALLOWED', 'BLOCKED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === f
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold'
                  : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              {f} ({devices.filter((d) => (f === 'ALL' ? true : d.status === f)).length})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by MAC, Student ID or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-[#1e3160] bg-slate-50 dark:bg-[#0f1c3b] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Devices Table */}
      <div className="rounded-xl border border-slate-200 dark:border-[#1e3160] bg-white dark:bg-[#0f1c3b] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#0c152d] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#1e3160]">
              <tr>
                <th className="py-3 px-4 font-semibold">Student</th>
                <th className="py-3 px-4 font-semibold">MAC Address</th>
                <th className="py-3 px-4 font-semibold">IP Address</th>
                <th className="py-3 px-4 font-semibold">Device Name</th>
                <th className="py-3 px-4 font-semibold">Policy Status</th>
                <th className="py-3 px-4 font-semibold">Last Active</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1e3160]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading registered devices...
                  </td>
                </tr>
              ) : filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No devices match the criteria.
                  </td>
                </tr>
              ) : (
                filteredDevices.map((dev) => (
                  <tr key={dev.device_id} className="hover:bg-slate-50/50 dark:hover:bg-[#14244a]/50">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {dev.student_name || 'Student'}
                      </div>
                      <div className="text-[11px] text-sky-500 dark:text-sky-400 font-mono">
                        {dev.student_id}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {dev.mac_address}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                      {dev.ip_address || '10.0.0.101'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {dev.device_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={dev.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-400">
                      {dev.last_connected_at
                        ? new Date(dev.last_connected_at).toLocaleString()
                        : 'Never'}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {dev.status === 'ALLOWED' ? (
                        <button
                          onClick={() => handleBlock(dev.device_id)}
                          disabled={actionLoading === dev.device_id}
                          className="px-2.5 py-1 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 transition font-semibold"
                          title="Block this device in OpenFlow switch"
                        >
                          Block
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnblock(dev.device_id)}
                          disabled={actionLoading === dev.device_id}
                          className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition font-semibold"
                          title="Unblock device"
                        >
                          Unblock
                        </button>
                      )}

                      <button
                        onClick={() => handleReset(dev.device_id, dev.student_id)}
                        disabled={actionLoading === dev.device_id}
                        className="px-2.5 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition font-semibold"
                        title="Reset registration for replacement device"
                      >
                        Reset / Replace
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-[#1e3160] bg-white dark:bg-[#0c152d] shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Manually Register Student Device
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enforces one registered device per student. If student already has a registered device, reset it first.
            </p>

            <form onSubmit={handleAddDevice} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Student ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 23CS001"
                  required
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#1e3160] bg-slate-50 dark:bg-[#0f1c3b] text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Device MAC Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. AA:BB:CC:11:22:33"
                  required
                  value={newMac}
                  onChange={(e) => setNewMac(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 font-mono rounded-lg border border-slate-300 dark:border-[#1e3160] bg-slate-50 dark:bg-[#0f1c3b] text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Device Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dell XPS 15 / iPhone 15"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#1e3160] bg-slate-50 dark:bg-[#0f1c3b] text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold"
                >
                  Save Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

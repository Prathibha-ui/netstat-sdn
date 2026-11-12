import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { RegisteredDevice } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ShieldCheck, RefreshCw, AlertCircle, Laptop } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DeviceRegistrationsPage: React.FC = () => {
  const [devices, setDevices] = useState<RegisteredDevice[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleReset = async (deviceId: number, studentId: string) => {
    if (!confirm(`Revoke and reset device registration for student ${studentId}?`)) return;
    try {
      await api.resetDevice(deviceId);
      await fetchDevices();
    } catch (err: any) {
      alert(err.message || 'Error resetting device');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Hostel Device Registrations
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            One-Device-Per-Student policy bindings and active hardware identities
          </p>
        </div>

        <button
          onClick={fetchDevices}
          className="p-2 rounded-lg border border-slate-200 dark:border-[#1e3160] hover:bg-slate-100 dark:hover:bg-[#14244a] text-slate-400 hover:text-white transition w-fit"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Policy Explanation Banner */}
      <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-500/5 dark:bg-[#0c1e3d] flex items-start space-x-3 text-xs">
        <ShieldCheck className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-slate-900 dark:text-white">
            One-Device-Per-Student Enforcement Principle
          </h4>
          <p className="text-slate-600 dark:text-slate-300">
            Each student in the hostel may have exactly <strong>one</strong> verified hardware MAC address registered in the OpenFlow switch.
            When a student connects from a new device for the first time, NETSTAT binds that MAC. Any connection attempt from an unauthorized secondary device is automatically rejected and dropped by the SDN switch.
          </p>
        </div>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">
            Loading registrations...
          </div>
        ) : devices.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">
            No devices registered yet.
          </div>
        ) : (
          devices.map((dev) => (
            <div
              key={dev.device_id}
              className="rounded-xl border border-slate-200 dark:border-[#1e3160] bg-white dark:bg-[#0f1c3b] p-5 shadow-sm space-y-4 hover:border-sky-500/40 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {dev.student_name}
                    </h3>
                    <p className="text-xs font-mono text-sky-400">{dev.student_id}</p>
                  </div>
                </div>
                <StatusBadge status={dev.status} size="sm" />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0c152d] border border-slate-100 dark:border-[#14244a] space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">MAC Address:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{dev.mac_address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">IP Address:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300">{dev.ip_address || '10.0.0.101'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Device Model:</span>
                  <span className="text-slate-700 dark:text-slate-300">{dev.device_name}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Registered: {new Date(dev.registered_at).toLocaleDateString()}</span>
                <button
                  onClick={() => handleReset(dev.device_id, dev.student_id)}
                  className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition font-semibold"
                >
                  Revoke & Replace
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

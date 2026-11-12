import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDemo, DEVICE_2_MAC } from '../context/DemoContext';
import { StudentUser, RegisteredDevice } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { useNavigate, Link } from 'react-router-dom';
import {
  Wifi,
  Laptop,
  ShieldCheck,
  AlertTriangle,
  LogOut,
  Calendar,
  MapPin,
  BookOpen,
  History,
  Radio,
  ExternalLink,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { studentUser, logout } = useAuth();
  const { setSimulatedMac, setDemoFeedback } = useDemo();
  const [profile, setProfile] = useState<StudentUser | null>(studentUser);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [activity, setActivity] = useState<any>({ access_decisions: [], security_logs: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchStudentData = async () => {
    try {
      const [profData, devData, actData] = await Promise.all([
        api.getStudentProfile(),
        api.getStudentDevice(),
        api.getStudentActivity(),
      ]);
      setProfile(profData);
      setDeviceInfo(devData);
      setActivity(actData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/student/login');
  };

  const handleTestUnauthorizedSecondDevice = () => {
    // Switch simulation adapter to Device 2 and redirect to login to show TEST 3!
    setSimulatedMac(DEVICE_2_MAC);
    setDemoFeedback({
      type: 'DROP',
      title: 'TEST 3 Initiated: Secondary Device Attempt',
      message: 'Now log in as student 23CS001 with Device 2 (DD:EE:FF:44:55:66). The system will detect the MAC mismatch and DROP the connection.',
      observedMac: DEVICE_2_MAC,
      timestamp: new Date().toLocaleTimeString(),
    });
    handleLogout();
  };

  return (
    <div className="min-h-screen bg-[#070d1e] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Navbar */}
        <div className="flex items-center justify-between bg-[#0c152d] border border-[#1e3160] rounded-2xl p-4 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">
                NETSTAT Student Access Portal
              </h1>
              <p className="text-xs text-slate-400">
                Connected to Hostel Secure Wi-Fi Network
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/admin"
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold px-3 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 transition hidden sm:inline-flex items-center gap-1"
            >
              <span>Admin Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 transition text-xs font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>

        {/* Student Profile & Connection Status Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Identity Card */}
          <div className="rounded-2xl border border-[#1e3160] bg-[#0c152d] p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center font-bold text-sky-400 text-lg">
                {profile?.name?.charAt(0) || 'S'}
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{profile?.name}</h2>
                <p className="text-xs font-mono text-sky-400 font-bold">{profile?.student_id}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-[#1e3160]">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-slate-400" />
                <span>{profile?.department} ({profile?.year})</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{profile?.hostel_room}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400">
                  Registered: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Registered Device Card */}
          <div className="md:col-span-2 rounded-2xl border border-emerald-500/30 bg-[#0c152d] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e3160]">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Your Registered Device</h3>
                  <p className="text-xs text-slate-400">Assigned OpenFlow 1.3 Forwarding Rule</p>
                </div>
              </div>
              <StatusBadge status={deviceInfo?.device?.status || 'ALLOWED'} size="md" />
            </div>

            {deviceInfo?.registered ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-[#0f1c3b] border border-[#1e3160] space-y-1">
                  <span className="text-slate-400 text-[11px] block">Masked Hardware MAC:</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    {deviceInfo.device.mac_address}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    (Masked for privacy; full MAC stored in network controller)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#0f1c3b] border border-[#1e3160] space-y-1">
                  <span className="text-slate-400 text-[11px] block">Network Status:</span>
                  <div className="flex items-center space-x-2 text-sm font-bold text-white">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Authorized & Active</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    IP: {deviceInfo.device.ip_address || '10.0.0.101'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                No device currently registered. Next login from a trusted network-observed device will bind automatically.
              </div>
            )}

            {/* Test unauthorized device trigger */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="text-slate-400 text-[11px]">
                Want to test the security policy with an unauthorized secondary device?
              </span>
              <button
                onClick={handleTestUnauthorizedSecondDevice}
                className="px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition font-semibold whitespace-nowrap"
              >
                Simulate 2nd Device Connection (Test 3)
              </button>
            </div>
          </div>
        </div>

        {/* One-Device Policy Notice */}
        <div className="rounded-2xl border border-sky-500/30 bg-[#0c152d] p-5 shadow-xl flex items-start space-x-3.5 text-xs">
          <ShieldCheck className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-white">Hostel Wi-Fi One-Device Policy</h4>
            <p className="text-slate-300 leading-relaxed">
              To ensure equitable bandwidth distribution and prevent unauthorized network sharing, the university enforces a strict <strong>One-Device-Per-Student</strong> access policy via OpenFlow SDN.
              Your registered MAC address is bound to your student account. Any connection from a secondary laptop or phone will be automatically dropped. To change or replace your registered device, contact your hostel network administrator.
            </p>
          </div>
        </div>

        {/* Student Recent Activity */}
        <div className="rounded-2xl border border-[#1e3160] bg-[#0c152d] p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#1e3160]">
            <History className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold text-white">Your Recent Access History</h3>
          </div>

          <div className="space-y-2 text-xs">
            {activity.access_decisions.length === 0 ? (
              <p className="text-slate-400 text-center py-4">No recent connection logs.</p>
            ) : (
              activity.access_decisions.map((dec: any) => (
                <div
                  key={dec.decision_id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#0f1c3b] border border-[#1e3160]"
                >
                  <div className="flex items-center space-x-3">
                    <StatusBadge status={dec.decision} size="sm" />
                    <div>
                      <span className="font-medium text-slate-200">{dec.reason}</span>
                      <span className="block text-[11px] font-mono text-slate-400">
                        Observed MAC: {dec.observed_mac}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {dec.timestamp ? new Date(dec.timestamp).toLocaleTimeString() : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

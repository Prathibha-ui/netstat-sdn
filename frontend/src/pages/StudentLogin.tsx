import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDemo, DEVICE_1_MAC, DEVICE_2_MAC } from '../context/DemoContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  Wifi,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Radio,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';

export const StudentLogin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [studentId, setStudentId] = useState('23CS001');
  const [password, setPassword] = useState('Student@123');
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // New Student Registration form fields
  const [regId, setRegId] = useState('');
  const [regName, setRegName] = useState('');
  const [regDept, setRegDept] = useState('Computer Science & Engineering');
  const [regRoom, setRegRoom] = useState('Hostel 4, Room 204');
  const [regPassword, setRegPassword] = useState('Student@123');

  const { loginStudent } = useAuth();
  const { simulatedMac, setSimulatedMac, setDemoFeedback } = useDemo();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorDetails(null);
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await api.loginStudent(studentId, password, simulatedMac);
      loginStudent(res.token, res.student);

      setDemoFeedback({
        type: 'ALLOW',
        title: res.status === 'FIRST_DEVICE_REGISTERED' ? 'Device Auto-Registered' : 'Access Granted',
        message: res.message || 'Device verified. OpenFlow ALLOW rule installed in switch table.',
        observedMac: simulatedMac,
        timestamp: new Date().toLocaleTimeString(),
      });

      navigate('/student');
    } catch (err: any) {
      const errData = err.data || {};
      setErrorDetails({
        decision: errData.decision || 'DROP',
        status: errData.status,
        reason: errData.reason || errData.error || 'Invalid credentials or access denied by network policy',
        observedMac: errData.observed_mac || simulatedMac,
        registeredMac: errData.registered_mac,
      });

      setDemoFeedback({
        type: 'DROP',
        title: errData.error ? 'Authentication Failure' : 'Network Access Blocked',
        message: errData.reason || errData.error || 'One-device policy mismatch.',
        observedMac: errData.observed_mac || simulatedMac,
        registeredMac: errData.registered_mac,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorDetails(null);
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await api.registerStudent({
        student_id: regId.toUpperCase(),
        name: regName,
        password: regPassword,
        department: regDept,
        hostel_room: regRoom,
        observed_mac: simulatedMac,
      });

      loginStudent(res.token, res.student);

      setDemoFeedback({
        type: 'ALLOW',
        title: 'Student Registered & Device Bound',
        message: `Student ${regName} (${regId.toUpperCase()}) registered! Device [${simulatedMac}] is now your single authorized device. Access ALLOWED.`,
        observedMac: simulatedMac,
        timestamp: new Date().toLocaleTimeString(),
      });

      navigate('/student');
    } catch (err: any) {
      setErrorDetails({
        reason: err.data?.error || err.message || 'Registration failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setStudentId('23CS001');
    setPassword('Student@123');
    setErrorDetails(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070d1e] p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-3 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
            <Wifi className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-white">
            HOSTEL WI-FI ACCESS PORTAL
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            NETSTAT SDN Identity-Based Captive Access
          </p>
        </div>

        {/* Network Hardware Simulation Selection */}
        <div className="p-4 rounded-xl border border-cyan-500/30 bg-[#0c152d] space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
              <Radio className="w-4 h-4" />
              Observed Hardware Device (Network Simulation):
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400">
              L2 Packet-In
            </span>
          </div>

          <p className="text-slate-400 text-[11px]">
            The Wi-Fi Access Point observes this physical MAC address from the wireless frame:
          </p>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setSimulatedMac(DEVICE_1_MAC)}
              className={`p-2 rounded-lg border text-left transition ${
                simulatedMac === DEVICE_1_MAC
                  ? 'bg-sky-500/20 text-sky-300 border-sky-400 ring-1 ring-sky-400/50'
                  : 'bg-[#0f1c3b] text-slate-400 border-[#1e3160] hover:border-slate-500'
              }`}
            >
              <div className="flex items-center space-x-1 font-bold text-[10px]">
                <ShieldCheck className="w-3 h-3 text-sky-400" />
                <span>Dev 1 (Aarav)</span>
              </div>
              <span className="font-mono text-[9px] block mt-0.5">{DEVICE_1_MAC}</span>
            </button>

            <button
              type="button"
              onClick={() => setSimulatedMac(DEVICE_2_MAC)}
              className={`p-2 rounded-lg border text-left transition ${
                simulatedMac === DEVICE_2_MAC
                  ? 'bg-rose-500/20 text-rose-300 border-rose-400 ring-1 ring-rose-400/50'
                  : 'bg-[#0f1c3b] text-slate-400 border-[#1e3160] hover:border-slate-500'
              }`}
            >
              <div className="flex items-center space-x-1 font-bold text-[10px]">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>Dev 2 (Rogue)</span>
              </div>
              <span className="font-mono text-[9px] block mt-0.5">{DEVICE_2_MAC}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
                const newMac = `52:54:00:${hex()}:${hex()}:${hex()}`;
                setSimulatedMac(newMac);
              }}
              className="p-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-left transition text-indigo-300"
            >
              <div className="flex items-center space-x-1 font-bold text-[10px]">
                <span>🎲 New MAC</span>
              </div>
              <span className="font-mono text-[9px] block mt-0.5 truncate">{simulatedMac}</span>
            </button>
          </div>
        </div>

        {/* Dropped / Access Denied Security Box */}
        {errorDetails && (
          <div className="p-4 rounded-xl border border-rose-500/50 bg-rose-950/40 text-rose-200 text-xs space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center space-x-2 font-bold text-sm text-rose-400">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>ACCESS DENIED (Authentication / Policy Error)</span>
            </div>
            <p className="leading-relaxed">{errorDetails.reason}</p>
            {errorDetails.registeredMac && (
              <div className="p-2.5 rounded bg-black/40 border border-rose-500/30 font-mono text-[11px] space-y-1">
                <div>Observed Connection MAC: <span className="text-rose-400 font-bold">{errorDetails.observedMac}</span></div>
                <div>Currently Registered MAC: <span className="text-sky-400 font-bold">{errorDetails.registeredMac}</span></div>
                <div className="text-rose-300 font-semibold pt-1">
                  OpenFlow 1.3 Action: Priority 200 DROP Rule installed. Packets dropped by Open vSwitch.
                </div>
              </div>
            )}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Switcher: Login vs Self-Register */}
        <div className="rounded-2xl border border-[#1e3160] bg-[#0c152d] shadow-2xl overflow-hidden">
          <div className="flex border-b border-[#1e3160] text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorDetails(null);
              }}
              className={`flex-1 py-3 text-center transition ${
                activeTab === 'login'
                  ? 'bg-emerald-500/15 text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In (Enrolled Student)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorDetails(null);
              }}
              className={`flex-1 py-3 text-center transition flex items-center justify-center space-x-1.5 ${
                activeTab === 'register'
                  ? 'bg-emerald-500/15 text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New Student? Enroll Here</span>
            </button>
          </div>

          <div className="p-8">
            {activeTab === 'login' ? (
              /* Student Login Form */
              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    University Student ID
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#1e3160] bg-[#0f1c3b] text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="e.g. 23CS001"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Use enrolled account (e.g. <strong>23CS001</strong>) or enroll below.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Hostel Wi-Fi Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#1e3160] bg-[#0f1c3b] text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="Password (Default: Student@123)"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center space-x-2"
                >
                  <span>{loading ? 'Validating Policy...' : 'Connect to Hostel Wi-Fi'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Quick Demo Helper */}
                <div className="pt-3 border-t border-[#1e3160] flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={handleFillDemo}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    Autofill Demo Student (23CS001 / Student@123)
                  </button>
                </div>
              </form>
            ) : (
              /* New Student Self-Enrollment Form */
              <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
                <p className="text-slate-400 text-[11px] mb-2">
                  Create a new student identity to test custom login with your own roll number:
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Student ID / Roll No.
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 24CS105"
                      value={regId}
                      onChange={(e) => setRegId(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-lg font-mono border border-[#1e3160] bg-[#0f1c3b] text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pratham"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#1e3160] bg-[#0f1c3b] text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Hostel Room
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. H4-204"
                      value={regRoom}
                      onChange={(e) => setRegRoom(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#1e3160] bg-[#0f1c3b] text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#1e3160] bg-[#0f1c3b] text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 transition flex items-center justify-center space-x-2 mt-2"
                >
                  <span>{loading ? 'Enrolling & Connecting...' : 'Enroll & Connect First Time'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Switch to Admin */}
        <div className="text-center">
          <Link
            to="/admin/login"
            className="text-xs text-slate-400 hover:text-sky-400 transition"
          >
            Network Administrator? Sign in to Admin Console
          </Link>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useDemo, DEVICE_1_MAC, DEVICE_2_MAC, DEVICE_3_MAC } from '../context/DemoContext';
import { useAuth } from '../context/AuthContext';
import { Radio, AlertTriangle, ShieldCheck, Cpu, Dices, Laptop, UserCheck, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DemoBar: React.FC = () => {
  const {
    simulatedMac,
    setSimulatedMac,
    demoFeedback,
    setDemoFeedback,
    showDemoBar,
    setShowDemoBar,
  } = useDemo();

  const { logout } = useAuth();
  const navigate = useNavigate();

  if (!showDemoBar) {
    return (
      <button
        onClick={() => setShowDemoBar(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center space-x-2 bg-sky-600 hover:bg-sky-500 text-white text-xs px-3 py-2 rounded-full shadow-lg border border-sky-400/30 transition-all"
        title="Open SDN Simulation Adapter"
      >
        <Cpu className="w-4 h-4" />
        <span className="font-medium">SDN Demo Adapter</span>
      </button>
    );
  }

  const isDevice1 = simulatedMac === DEVICE_1_MAC;
  const isDevice2 = simulatedMac === DEVICE_2_MAC;
  const isDevice3 = simulatedMac === DEVICE_3_MAC;

  const handleRandomMac = () => {
    const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
    const newMac = `52:54:00:${hex()}:${hex()}:${hex()}`;
    setSimulatedMac(newMac);
    setDemoFeedback({
      type: 'INFO',
      title: 'New Hardware MAC Generated',
      message: `Active observed hardware set to new MAC: ${newMac}`,
      observedMac: newMac,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  const handleRunScenario = async (action: string) => {
    if (action === 'student_login') {
      await logout();
      setSimulatedMac(DEVICE_1_MAC);
      navigate('/student/login');
      setDemoFeedback({
        type: 'INFO',
        title: 'Student Wi-Fi Login Portal',
        message: 'Student logs in from their primary device (AA:BB:CC:11:22:33). On first login, device is auto-registered and granted ALLOW.',
        observedMac: DEVICE_1_MAC,
        timestamp: new Date().toLocaleTimeString(),
      });
    } else if (action === 'test_2') {
      setSimulatedMac(DEVICE_1_MAC);
      navigate('/student/login');
      setDemoFeedback({
        type: 'INFO',
        title: 'TEST 2: Same-Device Reconnection',
        message: 'Step 2: Student logs in again from the same registered Device 1 (AA:BB:CC:11:22:33). System verifies MAC match and returns ALLOW.',
        observedMac: DEVICE_1_MAC,
        timestamp: new Date().toLocaleTimeString(),
      });
    } else if (action === 'test_3') {
      setSimulatedMac(DEVICE_2_MAC);
      navigate('/student/login');
      setDemoFeedback({
        type: 'DROP',
        title: 'TEST 3: Different Device Policy Violation',
        message: 'Step 3: Student attempts login from Unauthorized 2nd Device (DD:EE:FF:44:55:66). System detects MAC mismatch, triggers DROP, and installs OpenFlow DROP rule!',
        observedMac: DEVICE_2_MAC,
        timestamp: new Date().toLocaleTimeString(),
      });
    } else if (action === 'admin_login') {
      await logout();
      navigate('/admin/login');
      setDemoFeedback({
        type: 'INFO',
        title: 'Admin Console Login',
        message: 'Sign in as administrator (admin / Admin@123) to open the dashboard and inspect live flow rules, security alerts, and network telemetry.',
        observedMac: simulatedMac,
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  };

  return (
    <div className="w-full bg-[#0a1532] text-slate-200 border-b border-[#1e3160] px-4 py-2 text-xs select-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Simulation Label */}
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="font-semibold text-cyan-400 tracking-wide flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5" />
            SIMULATED NETWORK ADAPTER:
          </span>
        </div>

        {/* Center: Device MAC Selectors */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 hidden xl:inline">Observed MAC:</span>

          <button
            onClick={() => setSimulatedMac(DEVICE_1_MAC)}
            className={`px-2 py-0.5 rounded font-mono text-[11px] border transition-all flex items-center space-x-1 ${
              isDevice1
                ? 'bg-sky-500/20 text-sky-300 border-sky-400 ring-1 ring-sky-400/50'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-500'
            }`}
            title="Aarav's Registered Laptop"
          >
            <ShieldCheck className="w-3 h-3 text-sky-400" />
            <span>Dev 1:</span>
            <span className="font-bold">{DEVICE_1_MAC}</span>
          </button>

          <button
            onClick={() => setSimulatedMac(DEVICE_2_MAC)}
            className={`px-2 py-0.5 rounded font-mono text-[11px] border transition-all flex items-center space-x-1 ${
              isDevice2
                ? 'bg-rose-500/20 text-rose-300 border-rose-400 ring-1 ring-rose-400/50'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-500'
            }`}
            title="Unauthorized 2nd Device"
          >
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Dev 2:</span>
            <span className="font-bold">{DEVICE_2_MAC}</span>
          </button>

          <button
            onClick={() => setSimulatedMac(DEVICE_3_MAC)}
            className={`px-2 py-0.5 rounded font-mono text-[11px] border transition-all flex items-center space-x-1 ${
              isDevice3
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 ring-1 ring-emerald-400/50'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-500'
            }`}
            title="Replacement / New Device"
          >
            <Laptop className="w-3 h-3 text-emerald-400" />
            <span>Dev 3:</span>
            <span className="font-bold">{DEVICE_3_MAC}</span>
          </button>

          <button
            onClick={handleRandomMac}
            className="px-2 py-0.5 rounded text-[11px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition flex items-center space-x-1 font-semibold"
            title="Generate a completely new random MAC address"
          >
            <Dices className="w-3 h-3 text-indigo-400" />
            <span>New Random MAC</span>
          </button>
        </div>

        {/* Right: Quick Action Navigation Buttons (No Reset Demo button) */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => handleRunScenario('student_login')}
              className="px-2.5 py-1 rounded text-xs hover:bg-slate-700 text-sky-400 font-bold transition flex items-center space-x-1"
              title="Open Student Login Portal"
            >
              <UserCheck className="w-3 h-3" />
              <span>Student Login</span>
            </button>
            <button
              onClick={() => handleRunScenario('test_2')}
              className="px-2 py-1 rounded text-xs hover:bg-slate-700 text-emerald-400 font-bold transition"
              title="Test 2: Reconnection from Same Device (ALLOW)"
            >
              Test 2
            </button>
            <button
              onClick={() => handleRunScenario('test_3')}
              className="px-2 py-1 rounded text-xs hover:bg-slate-700 text-rose-400 font-bold transition"
              title="Test 3: Different Device Policy Violation (DROP)"
            >
              Test 3
            </button>
            <button
              onClick={() => handleRunScenario('admin_login')}
              className="px-2.5 py-1 rounded text-xs hover:bg-slate-700 text-purple-400 font-bold transition flex items-center space-x-1"
              title="Open Admin Login and Dashboard"
            >
              <Shield className="w-3 h-3" />
              <span>Admin Login</span>
            </button>
          </div>

          <button
            onClick={() => setShowDemoBar(false)}
            className="text-slate-400 hover:text-white p-1"
            title="Minimize bar"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Dynamic Feedback Banner */}
      {demoFeedback && (
        <div
          className={`mt-2 p-2 rounded flex items-center justify-between border text-xs ${
            demoFeedback.type === 'DROP'
              ? 'bg-rose-950/60 border-rose-600/50 text-rose-200'
              : demoFeedback.type === 'ALLOW'
              ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-200'
              : 'bg-sky-950/60 border-sky-600/50 text-sky-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {demoFeedback.type === 'DROP' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-sky-400 flex-shrink-0" />
            )}
            <div>
              <span className="font-bold mr-1.5">{demoFeedback.title}:</span>
              <span>{demoFeedback.message}</span>
            </div>
          </div>
          <button
            onClick={() => setDemoFeedback(null)}
            className="text-slate-400 hover:text-white text-xs ml-3 font-mono"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

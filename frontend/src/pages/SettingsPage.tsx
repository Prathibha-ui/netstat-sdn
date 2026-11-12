import React, { useState } from 'react';
import { useDemo } from '../context/DemoContext';
import { useTheme } from '../context/ThemeContext';
import { Settings, RefreshCw, Cpu, Shield, Sun, Moon, Laptop, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { resetDemoData, isResetting } = useDemo();
  const { theme, setTheme } = useTheme();
  const [ryuUrl, setRyuUrl] = useState('http://127.0.0.1:8080');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          System & Controller Settings
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configuration parameters for NETSTAT SDN orchestrator, Ryu REST connector, and simulation engine
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* SDN Controller Configuration */}
      <div className="rounded-xl border border-slate-200 dark:border-[#1e3160] bg-white dark:bg-[#0f1c3b] p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-[#1e3160]">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Ryu OpenFlow 1.3 Controller REST API
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Endpoint used by backend to synchronize live OpenFlow 1.3 flow rules
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ryu REST URL
            </label>
            <input
              type="text"
              value={ryuUrl}
              onChange={(e) => setRyuUrl(e.target.value)}
              className="w-full sm:w-96 px-3 py-2 rounded-lg font-mono border border-slate-300 dark:border-[#1e3160] bg-slate-50 dark:bg-[#0c152d] text-slate-900 dark:text-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Default when running Ryu with <code className="text-cyan-400">ryu.app.ofctl_rest</code> is <code className="text-cyan-400">http://127.0.0.1:8080</code>.
            </p>
          </div>

          <div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-md shadow-sky-600/20 transition"
            >
              Save Controller Endpoint
            </button>
          </div>
        </form>
      </div>

      {/* Demo State Reset */}
      <div className="rounded-xl border border-amber-500/30 bg-white dark:bg-[#0f1c3b] p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-[#1e3160]">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Demonstration Environment Reset
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Reset database and clear registered devices for student 23CS001 for tomorrow's demo presentation
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300">
          Clicking Reset Demo will clear any registered device for student <strong>23CS001</strong> and flush all DROP flow rules, restoring the system to the initial state ready for <strong>TEST 1</strong>.
        </p>

        <button
          onClick={resetDemoData}
          disabled={isResetting}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition"
        >
          <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
          <span>{isResetting ? 'Resetting Demo...' : 'Reset Demo Environment'}</span>
        </button>
      </div>

      {/* Theme Selection */}
      <div className="rounded-xl border border-slate-200 dark:border-[#1e3160] bg-white dark:bg-[#0f1c3b] p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Appearance & Theme Mode
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'dark', label: 'Dark Mode (Navy Blue)', icon: Moon },
            { id: 'light', label: 'Light Mode', icon: Sun },
            { id: 'system', label: 'System Default', icon: Laptop },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = theme === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTheme(item.id as any)}
                className={`p-4 rounded-xl border text-left flex items-center space-x-3 transition ${
                  isSelected
                    ? 'border-sky-500 bg-sky-500/10 text-sky-400 font-bold'
                    : 'border-slate-200 dark:border-[#1e3160] hover:border-slate-400 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

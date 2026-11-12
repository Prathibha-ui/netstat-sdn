import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useDemo } from '../context/DemoContext';
import {
  Sun,
  Moon,
  Laptop,
  LogOut,
  Radio,
  Cpu,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  title?: string;
  collapsed: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ title = 'Dashboard', collapsed }) => {
  const { theme, setTheme } = useTheme();
  const { adminUser, studentUser, role, logout } = useAuth();
  const { showDemoBar, setShowDemoBar } = useDemo();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <header
      className={`h-16 border-b border-slate-200 dark:border-[#1e3160] bg-white/80 dark:bg-[#0c152d]/80 backdrop-blur-md px-6 flex items-center justify-between transition-all duration-300 sticky top-0 z-20 ${
        collapsed ? 'ml-20' : 'ml-64'
      }`}
    >
      {/* Left: Title & Status */}
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
            {title}
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Hostel Wi-Fi SDN Policy Enforcement
          </p>
        </div>

        {/* SDN Controller Status Badge */}
        <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border border-cyan-500/20 text-xs">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-medium">OpenFlow 1.3 Engine</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Toggle Demo Bar */}
        <button
          onClick={() => setShowDemoBar(!showDemoBar)}
          className={`p-2 rounded-lg text-xs font-medium border flex items-center space-x-1.5 transition ${
            showDemoBar
              ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
              : 'text-slate-500 hover:text-slate-200 border-slate-700 bg-slate-800/40'
          }`}
          title="Toggle Network Simulation Adapter"
        >
          <Radio className="w-4 h-4 text-cyan-400" />
          <span className="hidden md:inline">SDN Adapter</span>
        </button>

        {/* Theme Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-[#14244a] p-1 rounded-lg border border-slate-200 dark:border-[#1e3160]">
          <button
            onClick={() => setTheme('light')}
            className={`p-1.5 rounded-md transition ${
              theme === 'light'
                ? 'bg-white text-amber-500 shadow-sm'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            title="Light mode"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`p-1.5 rounded-md transition ${
              theme === 'dark'
                ? 'bg-[#0f1c3b] text-sky-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            title="Dark mode"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`p-1.5 rounded-md transition ${
              theme === 'system'
                ? 'bg-white dark:bg-[#0f1c3b] text-indigo-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            title="System theme"
          >
            <Laptop className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User Identity / Role */}
        <div className="flex items-center space-x-3 pl-2 border-l border-slate-200 dark:border-[#1e3160]">
          <div className="hidden sm:block text-right">
            <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              {role === 'admin'
                ? adminUser?.username || 'Admin'
                : studentUser?.name || 'Student'}
            </span>
            <span className="block text-[10px] uppercase font-bold text-sky-500 dark:text-sky-400">
              {role === 'admin' ? 'Network Admin' : studentUser?.student_id || 'Student'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

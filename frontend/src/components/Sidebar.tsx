import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Network,
  Laptop,
  Layers,
  Users,
  ShieldCheck,
  Scale,
  AlertOctagon,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCircle,
  ExternalLink,
  LucideIcon,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const navSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      ],
    },
    {
      title: 'Network',
      items: [
        { to: '/admin/topology', label: 'Network Topology', icon: Network },
        { to: '/admin/devices', label: 'Devices', icon: Laptop },
        { to: '/admin/flows', label: 'Flow Rules', icon: Layers },
      ],
    },
    {
      title: 'Access Control',
      items: [
        { to: '/admin/students', label: 'Students', icon: Users },
        { to: '/admin/registrations', label: 'Device Registrations', icon: ShieldCheck },
        { to: '/admin/decisions', label: 'Access Decisions', icon: Scale },
      ],
    },
    {
      title: 'Security',
      items: [
        { to: '/admin/alerts', label: 'Security Alerts', icon: AlertOctagon },
        { to: '/admin/logs', label: 'Activity Logs', icon: ScrollText },
      ],
    },
    {
      title: 'System',
      items: [
        { to: '/admin/settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 flex flex-col border-r border-slate-200 dark:border-[#1e3160] bg-white dark:bg-[#0c152d] ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-[#1e3160]">
        {!collapsed && (
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 text-sky-500 dark:text-sky-400 border border-sky-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-wider text-slate-900 dark:text-white">
                NETSTAT
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-sky-500 dark:text-sky-400 font-semibold">
                SDN Access Control
              </span>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="mx-auto p-2 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 text-sky-500 dark:text-sky-400 border border-sky-500/30">
            <Shield className="w-5 h-5" />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#14244a] transition hidden sm:block"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((sec, idx) => (
          <div key={idx}>
            {!collapsed && (
              <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {sec.title}
              </p>
            )}
            <ul className="space-y-1">
              {sec.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-sky-500/15 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#14244a] hover:text-slate-900 dark:hover:text-slate-200'
                        } ${collapsed ? 'justify-center' : 'space-x-3'}`
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Student Portal Switcher footer */}
      <div className="p-3 border-t border-slate-200 dark:border-[#1e3160]">
        <NavLink
          to="/student"
          className={`flex items-center p-2.5 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/20 transition ${
            collapsed ? 'justify-center' : 'justify-between'
          }`}
          title="Open Student Wi-Fi Portal"
        >
          <div className="flex items-center space-x-2">
            <UserCircle className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Student Portal</span>}
          </div>
          {!collapsed && <ExternalLink className="w-3.5 h-3.5" />}
        </NavLink>
      </div>
    </aside>
  );
};

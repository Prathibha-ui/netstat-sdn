import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { DemoBar } from './DemoBar';
import { useAuth } from '../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const { role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#070d1e] text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-400 font-medium">Checking admin session...</span>
        </div>
      </div>
    );
  }

  // If not authenticated as admin, redirect to admin login
  if (role !== 'admin') {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin') return 'Dashboard Overview';
    if (path.includes('topology')) return 'SDN Network Topology';
    if (path.includes('devices')) return 'Device Management';
    if (path.includes('flows')) return 'OpenFlow 1.3 Flow Rules';
    if (path.includes('students')) return 'Hostel Students Directory';
    if (path.includes('registrations')) return 'Device Registrations';
    if (path.includes('decisions')) return 'Access Decisions';
    if (path.includes('alerts')) return 'Security Incident Alerts';
    if (path.includes('logs')) return 'Activity Audit Logs';
    if (path.includes('settings')) return 'System Settings';
    return 'Admin Console';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070d1e] transition-colors duration-300">
      {/* Top Simulation Bar */}
      <DemoBar />

      {/* Collapsible Left Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Top Navbar */}
      <Navbar title={getPageTitle()} collapsed={collapsed} />

      {/* Main Content Area */}
      <main
        className={`transition-all duration-300 p-6 ${
          collapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DemoProvider } from './context/DemoContext';

// Pages
import { AdminLogin } from './pages/AdminLogin';
import { StudentLogin } from './pages/StudentLogin';
import { StudentDashboard } from './pages/StudentDashboard';
import { AdminLayout } from './components/AdminLayout';
import { AdminDashboard } from './pages/AdminDashboard';
import { NetworkTopologyPage } from './pages/NetworkTopologyPage';
import { DevicesPage } from './pages/DevicesPage';
import { FlowRulesPage } from './pages/FlowRulesPage';
import { StudentsPage } from './pages/StudentsPage';
import { DeviceRegistrationsPage } from './pages/DeviceRegistrationsPage';
import { AccessDecisionsPage } from './pages/AccessDecisionsPage';
import { SecurityAlertsPage } from './pages/SecurityAlertsPage';
import { ActivityLogsPage } from './pages/ActivityLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { DemoBar } from './components/DemoBar';

// Protected Student Route
const ProtectedStudentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#070d1e] text-white">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (role !== 'student') {
    return <Navigate to="/student/login" replace />;
  }
  return (
    <>
      <DemoBar />
      {children}
    </>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DemoProvider>
          <BrowserRouter>
            <Routes>
              {/* Default Redirect to Admin Console */}
              <Route path="/" element={<Navigate to="/admin" replace />} />

              {/* Authentication Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/student/login"
                element={
                  <>
                    <DemoBar />
                    <StudentLogin />
                  </>
                }
              />

              {/* Student Portal Protected Route */}
              <Route
                path="/student"
                element={
                  <ProtectedStudentRoute>
                    <StudentDashboard />
                  </ProtectedStudentRoute>
                }
              />

              {/* Admin Dashboard Protected Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="topology" element={<NetworkTopologyPage />} />
                <Route path="devices" element={<DevicesPage />} />
                <Route path="flows" element={<FlowRulesPage />} />
                <Route path="students" element={<StudentsPage />} />
                <Route path="registrations" element={<DeviceRegistrationsPage />} />
                <Route path="decisions" element={<AccessDecisionsPage />} />
                <Route path="alerts" element={<SecurityAlertsPage />} />
                <Route path="logs" element={<ActivityLogsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </BrowserRouter>
        </DemoProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

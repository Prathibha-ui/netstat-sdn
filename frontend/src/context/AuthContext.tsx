import React, { createContext, useContext, useEffect, useState } from 'react';
import { AdminUser, StudentUser, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  role: UserRole;
  adminUser: AdminUser | null;
  studentUser: StudentUser | null;
  token: string | null;
  loading: boolean;
  loginAdmin: (token: string, admin: AdminUser) => void;
  loginStudent: (token: string, student: StudentUser) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(() => {
    return (localStorage.getItem('netstat_user_role') as UserRole) || null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('netstat_token') || null;
  });
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [studentUser, setStudentUser] = useState<StudentUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkAuth = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.getCurrentUser();
      if (data && data.authenticated) {
        if (data.role === 'admin') {
          setRole('admin');
          setAdminUser(data.user);
        } else if (data.role === 'student') {
          setRole('student');
          setStudentUser(data.user);
        }
      } else {
        logout();
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [token]);

  const loginAdmin = (newToken: string, admin: AdminUser) => {
    localStorage.setItem('netstat_token', newToken);
    localStorage.setItem('netstat_user_role', 'admin');
    setToken(newToken);
    setRole('admin');
    setAdminUser(admin);
    setStudentUser(null);
  };

  const loginStudent = (newToken: string, student: StudentUser) => {
    localStorage.setItem('netstat_token', newToken);
    localStorage.setItem('netstat_user_role', 'student');
    setToken(newToken);
    setRole('student');
    setStudentUser(student);
    setAdminUser(null);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('netstat_token');
    localStorage.removeItem('netstat_user_role');
    setToken(null);
    setRole(null);
    setAdminUser(null);
    setStudentUser(null);
  };

  const refreshProfile = async () => {
    if (role === 'student') {
      try {
        const profile = await api.getStudentProfile();
        setStudentUser(profile);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        adminUser,
        studentUser,
        token,
        loading,
        loginAdmin,
        loginStudent,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

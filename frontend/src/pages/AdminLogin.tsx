import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, User, ArrowRight, UserCircle } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.loginAdmin(username, password);
      loginAdmin(res.token, res.admin);
      navigate('/admin');
    } catch (err: any) {
      setError(err.data?.error || 'Failed to authenticate administrator');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setUsername('admin');
    setPassword('Admin@123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070d1e] p-4">
      <div className="w-full max-w-md">
        {/* Logo & Heading */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/30 mb-3 shadow-[0_0_25px_rgba(14,165,233,0.2)]">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-white">
            NETSTAT ADMIN CONSOLE
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            SDN Network Access & Policy Management
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-[#1e3160] bg-[#0c152d] p-8 shadow-2xl space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Admin Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#1e3160] bg-[#0f1c3b] text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Username"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#1e3160] bg-[#0f1c3b] text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 transition flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In as Administrator'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="pt-4 border-t border-[#1e3160] flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-sky-400 hover:text-sky-300 font-semibold"
            >
              Autofill Demo Admin (admin / Admin@123)
            </button>
          </div>
        </div>

        {/* Link to Student Portal */}
        <div className="text-center mt-6">
          <Link
            to="/student/login"
            className="text-xs text-slate-400 hover:text-emerald-400 transition flex items-center justify-center space-x-1.5"
          >
            <UserCircle className="w-4 h-4" />
            <span>Looking for student Wi-Fi login? Open Student Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

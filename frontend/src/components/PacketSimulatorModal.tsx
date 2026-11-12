import React, { useState } from 'react';
import { api } from '../services/api';
import { Send, CheckCircle2, XCircle, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';
import { DEVICE_1_MAC, DEVICE_2_MAC } from '../context/DemoContext';

interface PacketSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PacketSimulatorModal: React.FC<PacketSimulatorModalProps> = ({ isOpen, onClose }) => {
  const [srcMac, setSrcMac] = useState(DEVICE_1_MAC);
  const [dstMac, setDstMac] = useState('00:00:5E:00:53:01'); // Gateway MAC
  const [inPort, setInPort] = useState(2);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await api.simulatePacket(srcMac, dstMac, inPort);
      setResult(res);
    } catch (err: any) {
      setResult({
        decision: 'ERROR',
        explanation: err.message || 'Simulation error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-[#1e3160] bg-white dark:bg-[#0c152d] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-[#1e3160] flex items-center justify-between bg-slate-50 dark:bg-[#0f1c3b]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                OpenFlow 1.3 Packet Ingress Simulator
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inject Ethernet frames to test Open vSwitch flow table pipeline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg font-mono p-1"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-sm">
          {/* Quick Preset Buttons */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Presets:</span>
            <button
              onClick={() => {
                setSrcMac(DEVICE_1_MAC);
                setInPort(2);
              }}
              className="px-2.5 py-1 text-xs rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition"
            >
              Host 1 (Trusted: {DEVICE_1_MAC})
            </button>
            <button
              onClick={() => {
                setSrcMac(DEVICE_2_MAC);
                setInPort(4);
              }}
              className="px-2.5 py-1 text-xs rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition"
            >
              Host 3 (Rogue: {DEVICE_2_MAC})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Source MAC (eth_src)
              </label>
              <input
                type="text"
                value={srcMac}
                onChange={(e) => setSrcMac(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-lg font-mono text-xs border border-slate-300 dark:border-[#1e3160] bg-slate-50 dark:bg-[#0f1c3b] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Destination MAC (eth_dst)
              </label>
              <input
                type="text"
                value={dstMac}
                onChange={(e) => setDstMac(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-lg font-mono text-xs border border-slate-300 dark:border-[#1e3160] bg-slate-50 dark:bg-[#0f1c3b] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ingress Physical Port (in_port)
            </label>
            <select
              value={inPort}
              onChange={(e) => setInPort(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg text-xs border border-slate-300 dark:border-[#1e3160] bg-slate-50 dark:bg-[#0f1c3b] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value={2}>Port 2 (Student Host 1 - 23CS001)</option>
              <option value={3}>Port 3 (Student Host 2 - 23CS002)</option>
              <option value={4}>Port 4 (Rogue / Unauthorized Host)</option>
              <option value={1}>Port 1 (Gateway Uplink)</option>
            </select>
          </div>

          <button
            onClick={handleSimulate}
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition flex items-center justify-center space-x-2 shadow-md shadow-sky-600/20"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? 'Evaluating Flow Pipeline...' : 'Inject Packet into Open vSwitch'}</span>
          </button>

          {/* Simulation Result Box */}
          {result && (
            <div
              className={`p-4 rounded-xl border transition-all ${
                result.decision === 'ALLOW'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : result.decision === 'DROP'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              <div className="flex items-center space-x-2 font-bold text-sm mb-1">
                {result.decision === 'ALLOW' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400" />
                )}
                <span>
                  Switch Action: {result.action || result.decision}
                </span>
              </div>
              <p className="text-xs text-slate-300 dark:text-slate-200 mt-1">
                {result.explanation}
              </p>
              {result.priority !== undefined && (
                <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center space-x-4">
                  <span>Matched Priority: {result.priority}</span>
                  {result.rule_id && <span>Rule ID: #{result.rule_id}</span>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-[#1e3160] flex justify-end bg-slate-50 dark:bg-[#0f1c3b]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface TrafficChartProps {
  data: Array<{
    time: string;
    inbound: number;
    outbound: number;
    blocked: number;
  }>;
}

export const TrafficChart: React.FC<TrafficChartProps> = ({ data }) => {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-[#1e3160] bg-white dark:bg-[#0f1c3b] p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1e3160] mb-4 gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Hostel Network Traffic & Enforcement
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time throughput (Mbps) and dropped unauthorized frames
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
            OpenFlow 1.3 Port Counters
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="outboundGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="blockedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3160" opacity={0.3} />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0c152d',
                borderColor: '#1e3160',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#fff',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="inbound"
              name="Inbound Traffic (Mbps)"
              stroke="#38bdf8"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#inboundGrad)"
            />
            <Area
              type="monotone"
              dataKey="outbound"
              name="Outbound Traffic (Mbps)"
              stroke="#818cf8"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#outboundGrad)"
            />
            <Area
              type="monotone"
              dataKey="blocked"
              name="Blocked / Dropped Frames"
              stroke="#f43f5e"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#blockedGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

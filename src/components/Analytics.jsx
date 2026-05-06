import { useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { fmt, calcDrawdown } from "../utils/helpers";
import { StatCard } from "./ui/StatCard";

export default function Analytics({ trades, settings }) {
  const chartData = useMemo(() => {
    const marketMap = {};
    const setupMap = {};
    const dayMap = { "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0 };
    const hourMap = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, pnl: 0 }));

    trades.forEach(t => {
      marketMap[t.market] = (marketMap[t.market] || 0) + t.pnl;
      setupMap[t.setup] = (setupMap[t.setup] || 0) + t.pnl;
      
      const date = new Date(t.date);
      const day = date.toLocaleDateString("en-US", { weekday: "short" });
      if (dayMap[day] !== undefined) dayMap[day] += t.pnl;
      
      const hour = date.getHours();
      hourMap[hour].pnl += t.pnl;
    });

    const drawdownData = calcDrawdown(trades);

    return {
      market: Object.entries(marketMap).map(([name, value]) => ({ name, value })),
      setup: Object.entries(setupMap).map(([name, value]) => ({ name, value })),
      days: Object.entries(dayMap).map(([name, pnl]) => ({ name, pnl })),
      hours: hourMap.filter(h => h.pnl !== 0),
      drawdown: drawdownData
    };
  }, [trades]);

  const COLORS_LIST = ["#00d4aa", "#f0c040", "#6366f1", "#ec4899", "#8b5cf6", "#06b6d4"];

  return (
    <div className="space-y-8 pb-20">
      {/* Drawdown Chart */}
      <div className="glass-card rounded-[2.5rem] p-8 border-red-500/10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-black text-white tracking-tight uppercase">Portfolio Drawdown</h3>
            <p className="text-gray-500 text-[10px] font-bold tracking-[0.2em] uppercase">Visual Risk Tracking</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Max Drawdown</p>
            <p className="text-xl font-black text-red-400">-{fmt(Math.max(...chartData.drawdown.map(d => d.drawdown), 0), settings.currency)}</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData.drawdown}>
            <defs>
              <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 10 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 10 }} />
            <Tooltip />
            <Area type="monotone" dataKey="drawdown" stroke="#ef4444" fill="url(#ddGrad)" strokeWidth={3} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Market Distribution */}
        <div className="glass-card rounded-[2.5rem] p-8">
          <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider">Market Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={chartData.market} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {chartData.market.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS_LIST[index % COLORS_LIST.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Setup Performance */}
        <div className="glass-card rounded-[2.5rem] p-8">
          <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider">Setup P&L</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.setup}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#00d4aa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Day of Week Distribution */}
        <div className="glass-card rounded-[2.5rem] p-8">
          <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider">Performance by Day</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.days}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {chartData.days.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "#10b981" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Time of Day Distribution */}
        <div className="glass-card rounded-[2.5rem] p-8">
          <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider">Hourly Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.hours}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {chartData.hours.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "#10b981" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

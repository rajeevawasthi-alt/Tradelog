// src/components/Analytics.jsx
import { useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line
} from "recharts";
import { fmt, calcDrawdown } from "../utils/helpers";
import { calculateStats, generateMonteCarlo } from "../utils/calculations";

export default function Analytics({ trades = [], settings = {} }) {
  // Aggregate stats
  const stats = useMemo(() => calculateStats(trades), [trades]);

  // Generate Monte Carlo projection curves
  const monteCarloData = useMemo(() => {
    // Generate 5 paths of 50 future steps
    const paths = generateMonteCarlo(trades, 100000, 50, 5);
    
    // Pivot data format from paths array to Recharts-friendly step objects
    const chartRows = [];
    for (let step = 0; step <= 50; step++) {
      const row = { step };
      paths.forEach((path, pathIdx) => {
        row[`path_${pathIdx}`] = path[step]?.equity || 100000;
      });
      chartRows.push(row);
    }
    return chartRows;
  }, [trades]);

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
  const MONTE_CARLO_COLORS = ["#00d4aa", "#f0c040", "#6366f1", "#ec4899", "#8b5cf6"];

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      
      {/* Retail Performance Math Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Sharpe Ratio", val: stats.sharpe, icon: "📊", sub: "Risk-Adjusted Ratio", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
          { label: "Sortino Ratio", val: stats.sortino, icon: "⚡", sub: "Downside Volatility", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
          { label: "Expectancy Ratio", val: fmt(stats.expectancy, settings.currency), icon: "💵", sub: "P&L Value per execution", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
          { label: "Profit Factor", val: `${stats.profitFactor}x`, icon: "📈", sub: "Gross Wins / Gross Losses", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" }
        ].map((s, idx) => (
          <div key={idx} className={`p-6 rounded-[2rem] border glass-card flex items-center justify-between transition-all duration-300 hover:scale-105`}>
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{s.label}</p>
              <h4 className="text-xl font-extrabold font-mono text-white mt-1">{s.val}</h4>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1">{s.sub}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 ${s.color}`}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Monte Carlo Future Projections */}
      <div className="glass-card rounded-[2.5rem] p-8 border-brand-primary/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-lg font-black text-white tracking-tight uppercase">Monte Carlo Future Projection</h3>
            <p className="text-gray-500 text-[10px] font-bold tracking-[0.2em] uppercase">Simulates 100 paths of 50 future trades based on historical edge</p>
          </div>
          <div className="text-left md:text-right bg-white/3 border border-white/5 px-4 py-3 rounded-2xl">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Confidence Range</p>
            <p className="text-sm font-black text-brand-primary mt-1 font-mono">Starting Equity: {fmt(100000, settings.currency)}</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monteCarloData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="step" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 10 }} label={{ value: "Future Execution Steps", position: "insideBottom", offset: -5, fill: "#6b7280", fontSize: 9, fontWeight: "bold" }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 10 }} domain={['auto', 'auto']} tickFormatter={val => fmt(val, settings.currency)} />
            <Tooltip formatter={value => [fmt(value, settings.currency), "Simulated Equity"]} />
            {Array.from({ length: 5 }).map((_, idx) => (
              <Line 
                key={idx}
                type="monotone" 
                dataKey={`path_${idx}`} 
                stroke={MONTE_CARLO_COLORS[idx]} 
                strokeWidth={2}
                dot={false}
                opacity={0.7}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

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

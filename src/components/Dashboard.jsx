import { useMemo } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { fmt, fmtDate, calcBrokerage, getStreak } from "../utils/helpers";
import { StatCard } from "./ui/StatCard";

export default function Dashboard({ trades, settings, setPage }) {
  const stats = useMemo(() => {
    if (trades.length === 0) return { 
      total: 0, wr: 0, profitFactor: 0, expectancy: 0, maxDD: 0, count: 0, brokerage: 0,
      streaks: { current: 0, maxWin: 0, maxLoss: 0, currentType: null }
    };
    
    const pnlList = trades.map(t => t.pnl || 0);
    const total = pnlList.reduce((s, p) => s + p, 0);
    const wins = pnlList.filter(p => p > 0);
    const losses = pnlList.filter(p => p < 0);
    
    const totalProfit = wins.reduce((s, p) => s + p, 0);
    const totalLoss = Math.abs(losses.reduce((s, p) => s + p, 0));
    
    const wr = ((wins.length / trades.length) * 100).toFixed(1);
    const profitFactor = totalLoss === 0 ? totalProfit.toFixed(2) : (totalProfit / totalLoss).toFixed(2);
    const expectancy = (total / trades.length).toFixed(2);
    
    // Brokerage calculation
    const totalBrokerage = trades.reduce((s, t) => s + calcBrokerage(t, settings), 0);
    
    // Max Drawdown
    let peak = 0;
    let currentCum = 0;
    let maxDD = 0;
    const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    sorted.forEach(t => {
      currentCum += t.pnl;
      if (currentCum > peak) peak = currentCum;
      const dd = peak - currentCum;
      if (dd > maxDD) maxDD = dd;
    });

    const avgRR = trades.filter(t => t.rr).reduce((s, t) => s + t.rr, 0) / (trades.filter(t => t.rr).length || 1);
    const streaks = getStreak(trades);

    return { 
      total, wr, wins: wins.length, losses: losses.length, 
      avgRR: avgRR.toFixed(2), count: trades.length,
      profitFactor, expectancy, maxDD: maxDD.toFixed(2),
      brokerage: totalBrokerage,
      streaks
    };
  }, [trades, settings]);

  const goalProgress = useMemo(() => {
    const goal = settings.monthlyGoal || 50000;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthPnL = trades.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).reduce((s, t) => s + t.pnl, 0);
    
    const percent = Math.min(100, Math.max(0, (monthPnL / goal) * 100));
    return { goal, current: monthPnL, percent: percent.toFixed(1) };
  }, [trades, settings.monthlyGoal]);

  const pnlChartData = useMemo(() => {
    const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    let cum = 0;
    return sorted.map(t => ({ date: fmtDate(t.date), pnl: t.pnl, cum: +(cum += t.pnl).toFixed(2) }));
  }, [trades]);

  const setupPerf = useMemo(() => {
    const map = {};
    trades.forEach(t => {
      if (!map[t.setup]) map[t.setup] = { total: 0, wins: 0, pnl: 0 };
      map[t.setup].total++;
      if (t.pnl > 0) map[t.setup].wins++;
      map[t.setup].pnl += t.pnl;
    });
    return Object.entries(map).map(([setup, d]) => ({ setup, wr: +((d.wins / d.total) * 100).toFixed(0), pnl: d.pnl, total: d.total }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  const recentTrades = [...trades].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className={`font-bold text-sm ${payload[0].value >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {fmt(payload[0].value, settings.currency)}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Goal Progress Section */}
      <div className="glass-card rounded-[2.5rem] p-8 border-[#00d4aa]/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Monthly Performance Goal</h3>
            <p className="text-gray-500 text-[10px] font-bold mt-1">Target: {fmt(goalProgress.goal, settings.currency)}</p>
          </div>
          <p className={`text-xl font-black font-mono ${goalProgress.current >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {fmt(goalProgress.current, settings.currency)} ({goalProgress.percent}%)
          </p>
        </div>
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <div 
            className={`h-full transition-all duration-1000 ease-out ${goalProgress.current >= 0 ? "bg-gradient-to-r from-[#00d4aa] to-emerald-400" : "bg-red-500"}`}
            style={{ width: `${goalProgress.percent}%` }}
          />
        </div>
      </div>

      {/* Top Section: Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Net Profit" value={fmt(stats.total, settings.currency)} color={stats.total >= 0 ? "text-emerald-400" : "text-red-400"} icon="💰" trend={12} />
        <StatCard label="Win Rate" value={`${stats.wr}%`} color={stats.wr >= 55 ? "text-emerald-400" : "text-red-400"} icon="🎯" sub={`${stats.wins}W / ${stats.losses}L`} />
        <StatCard label="Commissions" value={fmt(stats.brokerage, settings.currency)} color="text-amber-400" icon="💸" sub="Brokerage Paid" />
        <StatCard label="Profit Factor" value={stats.profitFactor} color="text-purple-400" icon="💎" sub="Risk efficiency" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Current Streak" value={`${stats.streaks.current} ${stats.streaks.currentType === "win" ? "🔥" : "💀"}`} color={stats.streaks.currentType === "win" ? "text-emerald-400" : "text-red-400"} icon="⚡" sub="Active run" />
        <StatCard label="Max Win Streak" value={stats.streaks.maxWin} color="text-emerald-400" icon="🏆" sub="Best run" />
        <StatCard label="Max Loss Streak" value={stats.streaks.maxLoss} color="text-red-400" icon="⚠️" sub="Worst run" />
        <StatCard label="Max Drawdown" value={fmt(stats.maxDD, settings.currency)} color="text-red-400" icon="📉" sub="Peak to Trough" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Equity Curve Chart */}
        <div className="md:col-span-2 lg:col-span-3 glass-card rounded-[2.5rem] p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">Equity Curve</h3>
              <p className="text-gray-500 text-[10px] font-bold tracking-[0.2em] uppercase">Cumulative Performance</p>
            </div>
          </div>
          {pnlChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={pnlChartData}>
                <defs>
                  <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00d4aa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 10, fontWeight: 700 }} tickFormatter={v => `${settings.currency}${v}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#00d4aa", strokeWidth: 2, strokeDasharray: "5 5" }} />
                <Area type="monotone" dataKey="cum" stroke="#00d4aa" fill="url(#pnlGrad)" strokeWidth={4} dot={false} activeDot={{ r: 6, fill: "#00d4aa", stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="h-64 flex items-center justify-center text-gray-600 font-bold uppercase tracking-widest text-xs">No trade data available</div>}
        </div>

        {/* Recent Activity Sidebar */}
        <div className="lg:col-span-1 glass-card rounded-[2.5rem] p-8 flex flex-col">
          <h3 className="text-lg font-black text-white tracking-tight mb-6">Recent Trades</h3>
          <div className="space-y-4 flex-1">
            {recentTrades.length === 0 && <p className="text-gray-600 text-[10px] font-bold text-center py-8 uppercase tracking-[0.2em]">No trades yet</p>}
            {recentTrades.map(t => (
              <div key={t.id} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black ${t.side === "Buy" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                    {t.side[0]}
                  </div>
                  <div>
                    <p className="text-white text-sm font-black group-hover:text-[#00d4aa] transition-colors">{t.market}</p>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">{fmtDate(t.date)}</p>
                  </div>
                </div>
                <span className={`font-black font-mono text-xs ${t.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {t.pnl >= 0 ? "+" : ""}{fmt(t.pnl, settings.currency)}
                </span>
              </div>
            ))}
          </div>
          <button onClick={() => setPage("history")} className="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 transition-all">
            View All History →
          </button>
        </div>
      </div>
    </div>
  );
}

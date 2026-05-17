// src/components/Calendar.jsx
import { useMemo, useState } from "react";
import { fmt, fmtDate } from "../utils/helpers";

export default function Calendar({ trades = [], settings = {} }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayTrades, setSelectedDayTrades] = useState(null);

  // Compute month calendar grid
  const { calendarDays, maxPnl } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    // Aggregate day-wise trades and net P&L
    const dayMap = {};
    trades.forEach(t => {
      const dStr = new Date(t.date).toISOString().split("T")[0];
      if (!dayMap[dStr]) {
        dayMap[dStr] = { pnl: 0, list: [] };
      }
      dayMap[dStr].pnl += t.pnl;
      dayMap[dStr].list.push(t);
    });

    // Find max absolute P&L in the current month for color scaling
    let currentMax = 0;
    const calendar = [];

    // Pre-padding empty boxes
    for (let i = 0; i < firstDayIndex; i++) {
      calendar.push(null);
    }
    
    for (let i = 1; i <= totalDays; i++) {
      const formattedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const dayData = dayMap[formattedDate] || { pnl: 0, list: [] };
      
      const absolutePnL = Math.abs(dayData.pnl);
      if (absolutePnL > currentMax) {
        currentMax = absolutePnL;
      }

      calendar.push({
        day: i,
        dateString: formattedDate,
        pnl: dayData.pnl,
        trades: dayData.list
      });
    }

    return { calendarDays: calendar, maxPnl: currentMax || 1000 };
  }, [currentDate, trades]);

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));

  const monthName = currentDate.toLocaleString("default", { month: "long" });

  // Custom color scaling based on profit/loss size
  const getIntensityColor = (day) => {
    if (!day || day.pnl === 0) return "bg-white/5 border-white/5 hover:bg-white/10";
    
    const ratio = Math.min(1, Math.max(0.15, Math.abs(day.pnl) / maxPnl));
    
    if (day.pnl > 0) {
      // Scale green intensity dynamically
      return `border-emerald-500/20 hover:border-emerald-400 bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,${ratio * 0.15})]`;
    } else {
      // Scale red intensity dynamically
      return `border-red-500/20 hover:border-red-400 bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,${ratio * 0.15})]`;
    }
  };

  const getOpacityStyle = (day) => {
    if (!day || day.pnl === 0) return {};
    const ratio = Math.min(1, Math.max(0.2, Math.abs(day.pnl) / maxPnl));
    return {
      backgroundColor: day.pnl > 0 
        ? `rgba(16, 185, 129, ${ratio * 0.45})` 
        : `rgba(239, 68, 68, ${ratio * 0.45})`
    };
  };

  return (
    <div className="glass-card rounded-[2.5rem] p-8 max-w-4xl mx-auto relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-brand-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header controls */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h3 className="text-2xl font-black text-white font-syne tracking-tight uppercase">{monthName} {currentDate.getFullYear()}</h3>
          <p className="text-gray-500 text-[10px] font-bold tracking-[0.2em] uppercase mt-1">Interactive Heatmap Calendar</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={prevMonth} 
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
          >
            ←
          </button>
          <button 
            onClick={nextMonth} 
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
          >
            →
          </button>
        </div>
      </div>

      {/* Week Headers */}
      <div className="grid grid-cols-7 gap-3 mb-3 relative z-10">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} className="text-center text-[10px] font-black text-gray-500 uppercase tracking-widest py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-3 relative z-10">
        {calendarDays.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} className="aspect-square bg-transparent border-transparent" />;
          
          return (
            <button 
              key={d.dateString}
              onClick={() => d.trades.length > 0 && setSelectedDayTrades(d)}
              style={getOpacityStyle(d)}
              className={`
                aspect-square rounded-2xl p-3 flex flex-col justify-between border transition-all duration-300 relative group
                ${getIntensityColor(d)}
                ${d.trades.length > 0 ? "cursor-pointer hover:scale-105 active:scale-95" : "cursor-default"}
              `}
            >
              {/* Day Number */}
              <span className={`text-xs font-black ${d.pnl !== 0 ? "text-white" : "text-gray-500"}`}>
                {d.day}
              </span>

              {/* Day Net P&L */}
              {d.pnl !== 0 && (
                <span className={`text-[10px] font-black font-mono truncate w-full text-left ${
                  d.pnl > 0 ? "text-emerald-300" : "text-red-300"
                }`}>
                  {d.pnl > 0 ? "+" : ""}{fmt(d.pnl, settings.currency)}
                </span>
              )}

              {/* Hover tooltip detailing count of trades */}
              {d.trades.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Day Inspector Popover Modal */}
      {selectedDayTrades && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-end justify-center p-4" onClick={() => setSelectedDayTrades(null)}>
          <div 
            className="w-full max-w-xl bg-card border border-border rounded-t-[2.5rem] p-8 shadow-2xl animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between pb-6 border-b border-border mb-6">
              <div>
                <h4 className="text-lg font-black text-white font-syne uppercase tracking-wider">
                  Trades for {fmtDate(selectedDayTrades.dateString)}
                </h4>
                <p className="text-gray-500 text-[10px] font-bold tracking-[0.2em] uppercase mt-1">
                  Net Day P&L: <span className={selectedDayTrades.pnl >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {selectedDayTrades.pnl >= 0 ? "+" : ""}{fmt(selectedDayTrades.pnl, settings.currency)}
                  </span>
                </p>
              </div>
              <button 
                onClick={() => setSelectedDayTrades(null)}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-subtext transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Trades List */}
            <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
              {selectedDayTrades.trades.map(t => (
                <div key={t.id} className="flex items-center justify-between p-4 bg-white/3 border border-white/5 rounded-2xl group hover:border-brand-primary/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${
                      t.side === "Buy" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {t.side[0]}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">{t.market}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">{t.setup}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black font-mono text-sm ${t.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {t.pnl >= 0 ? "+" : ""}{fmt(t.pnl, settings.currency)}
                    </p>
                    <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider mt-0.5">R:R: {t.rr || "N/A"}:1</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

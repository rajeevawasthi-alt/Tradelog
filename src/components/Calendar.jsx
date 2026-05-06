import { useMemo, useState } from "react";
import { fmt } from "../utils/helpers";

export default function Calendar({ trades, settings }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    
    // Day-wise P&L map
    const pnlMap = {};
    trades.forEach(t => {
      const d = new Date(t.date).toISOString().split("T")[0];
      pnlMap[d] = (pnlMap[d] || 0) + t.pnl;
    });

    const calendar = [];
    // Padding for first week
    for (let i = 0; i < firstDay; i++) calendar.push(null);
    
    for (let i = 1; i <= days; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      calendar.push({
        day: i,
        date: dateStr,
        pnl: pnlMap[dateStr] || 0
      });
    }
    return calendar;
  }, [currentDate, trades]);

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  return (
    <div className="glass-card rounded-[2.5rem] p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-black text-white font-syne tracking-tight">{monthName} {currentDate.getFullYear()}</h3>
          <p className="text-gray-500 text-[10px] font-bold tracking-[0.2em] uppercase">Interactive P&L Calendar</p>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all">←</button>
          <button onClick={nextMonth} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all">→</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} className="text-center text-[10px] font-black text-gray-500 uppercase py-2">{d}</div>
        ))}
        {daysInMonth.map((d, i) => (
          <div key={i} className={`aspect-square rounded-2xl p-2 flex flex-col justify-between border transition-all ${
            !d ? "bg-transparent border-transparent" : 
            d.pnl > 0 ? "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20" : 
            d.pnl < 0 ? "bg-red-500/10 border-red-500/20 hover:bg-red-500/20" : 
            "bg-white/5 border-white/5 hover:bg-white/10"
          }`}>
            {d && (
              <>
                <span className="text-xs font-black text-gray-400">{d.day}</span>
                {d.pnl !== 0 && (
                  <span className={`text-[10px] font-black font-mono truncate ${d.pnl > 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {d.pnl > 0 ? "+" : ""}{fmt(d.pnl, settings.currency)}
                  </span>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

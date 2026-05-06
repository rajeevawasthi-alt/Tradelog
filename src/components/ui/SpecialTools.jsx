import { useMemo, useState } from "react";
import { fmt } from "../../utils/helpers";
import { Input } from "./FormControls";

export function Heatmap({ trades, settings }) {
  const days = useMemo(() => {
    const map = {};
    trades.forEach(t => {
      const d = new Date(t.date).toISOString().split("T")[0];
      map[d] = (map[d] || 0) + t.pnl;
    });

    const data = [];
    const today = new Date();
    for (let i = 180; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      data.push({ date: ds, pnl: map[ds] || 0 });
    }
    return data;
  }, [trades]);

  const getColor = (pnl) => {
    if (pnl > 0) return "bg-emerald-500 opacity-" + Math.min(100, Math.max(20, Math.ceil(pnl / 1000) * 20));
    if (pnl < 0) return "bg-red-500 opacity-" + Math.min(100, Math.max(20, Math.ceil(Math.abs(pnl) / 1000) * 20));
    return "bg-gray-800";
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 overflow-x-auto">
      <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
        <span>📅</span> Trading Consistency (Last 6 Months)
      </h3>
      <div className="flex flex-wrap gap-1.5 min-w-[600px]">
        {days.map(d => (
          <div key={d.date} title={`${d.date}: ${fmt(d.pnl, settings.currency)}`}
            className={`w-3.5 h-3.5 rounded-sm transition-all hover:scale-125 ${getColor(d.pnl)}`} />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-end gap-3 text-[10px] text-gray-500 uppercase font-medium">
        <span>Loss</span>
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 bg-red-500 opacity-30 rounded-sm" />
          <div className="w-2.5 h-2.5 bg-red-500 opacity-60 rounded-sm" />
          <div className="w-2.5 h-2.5 bg-red-500 opacity-100 rounded-sm" />
        </div>
        <div className="w-2.5 h-2.5 bg-gray-800 rounded-sm" />
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 bg-emerald-500 opacity-30 rounded-sm" />
          <div className="w-2.5 h-2.5 bg-emerald-500 opacity-60 rounded-sm" />
          <div className="w-2.5 h-2.5 bg-emerald-500 opacity-100 rounded-sm" />
        </div>
        <span>Profit</span>
      </div>
    </div>
  );
}

export function PositionCalculator({ settings }) {
  const [risk, setRisk] = useState(1000);
  const [entry, setEntry] = useState(0);
  const [sl, setSl] = useState(0);
  const [res, setRes] = useState(null);

  const calc = () => {
    if (!risk || !entry || !sl) return;
    const points = Math.abs(entry - sl);
    if (!points) return;
    const qty = risk / points;
    setRes({ qty: qty.toFixed(2), points: points.toFixed(2) });
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-gray-300 mb-5 flex items-center gap-2">
        <span>🧮</span> Position Sizing Calculator
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Input label={`Risk Amount (${settings.currency})`} type="number" value={risk} onChange={setRisk} />
        <Input label="Entry Price" type="number" value={entry} onChange={setEntry} />
        <Input label="Stop Loss Price" type="number" value={sl} onChange={setSl} />
      </div>
      <button onClick={calc} className="w-full bg-[#00d4aa] hover:bg-[#00b08e] text-white font-bold py-3 rounded-xl transition-all mb-6">
        Calculate Size
      </button>
      {res && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Recommended Quantity</p>
            <p className="text-2xl font-black text-[#00d4aa] font-mono">{res.qty}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Risk Points</p>
            <p className="text-2xl font-black text-emerald-400 font-mono">{res.points}</p>
          </div>
        </div>
      )}
    </div>
  );
}

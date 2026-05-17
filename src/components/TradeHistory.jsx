import { useMemo, useState } from "react";
import { fmt, fmtDate, uid } from "../utils/helpers";

export default function TradeHistory({ trades, onEdit, onDelete, settings, onSave }) {
  const [filter, setFilter] = useState({ market: "", setup: "", result: "", search: "" });
  const [sort, setSort] = useState({ key: "date", dir: -1 });
  const [viewImg, setViewImg] = useState(null);

  const filtered = useMemo(() => {
    return trades.filter(t => {
      if (filter.market && t.market !== filter.market) return false;
      if (filter.setup && t.setup !== filter.setup) return false;
      if (filter.result && t.result !== filter.result) return false;
      if (filter.search && !JSON.stringify(t).toLowerCase().includes(filter.search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => {
      let va = a[sort.key], vb = b[sort.key];
      if (sort.key === "date") return sort.dir * (new Date(va) - new Date(vb));
      return sort.dir * ((va || 0) - (vb || 0));
    });
  }, [trades, filter, sort]);

  const exportCSV = () => {
    const headers = ["Date", "Market", "Setup", "Side", "Entry", "Exit", "Lot Size", "P&L", "Result", "R:R", "Tags"];
    const rows = filtered.map(t => [t.date, t.market, t.setup, t.side, t.entryPrice, t.exitPrice, t.lotSize, t.pnl, t.result, t.rr, t.tags?.join("|")]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "trades.csv";
    a.click();
  };

  const sortBy = (k) => setSort(s => ({ key: k, dir: s.key === k ? -s.dir : -1 }));

  return (
    <div className="space-y-4 pb-10">
      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <input value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
          placeholder="🔍 Search trades..." className="bg-bg border border-border rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:border-brand-primary flex-1 min-w-32" />
        <select value={filter.market} onChange={e => setFilter(f => ({ ...f, market: e.target.value }))}
          className="bg-bg border border-border rounded-xl px-3 py-2 text-sm text-text focus:outline-none">
          <option value="">All Markets</option>
          {settings.markets.map(m => <option key={m}>{m}</option>)}
        </select>
        <select value={filter.setup} onChange={e => setFilter(f => ({ ...f, setup: e.target.value }))}
          className="bg-bg border border-border rounded-xl px-3 py-2 text-sm text-text focus:outline-none">
          <option value="">All Setups</option>
          {settings.setups.map(s => <option key={s}>{s}</option>)}
        </select>

        <select value={filter.result} onChange={e => setFilter(f => ({ ...f, result: e.target.value }))}
          className="bg-bg border border-border rounded-xl px-3 py-2 text-sm text-text focus:outline-none">
          <option value="">All Results</option>
          <option>Profit</option>
          <option>Loss</option>
        </select>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-4 py-2 bg-bg hover:bg-card border border-border rounded-xl text-sm text-subtext font-medium transition-all">
            ↓ CSV
          </button>
          <input type="file" accept=".csv" id="csv-import" className="hidden" onChange={(e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
              const text = evt.target.result;
              const rows = text.split("\n").slice(1);
              const imported = rows.map(r => {
                const [date, market, setup, side, entry, exit, lot, pnl, result, rr] = r.split(",");
                if (!date || !market) return null;
                return {
                  id: uid(), date: date.trim(), market: market.trim(), setup: setup?.trim() || "Imported",
                  side: side?.trim() || "Buy", entryPrice: +entry || 0, exitPrice: +exit || 0,
                  lotSize: +lot || 1, pnl: +pnl || 0, result: result?.trim() || (+pnl > 0 ? "Profit" : "Loss"),
                  rr: +rr || 0, tags: ["Imported"]
                };
              }).filter(Boolean);
              if (imported.length) {
                if (window.confirm(`Import ${imported.length} trades?`)) {
                  imported.forEach(t => onSave(t));
                }
              }

            };
            reader.readAsText(file);
          }} />
          <label htmlFor="csv-import" className="px-4 py-2 bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/30 rounded-xl text-sm text-brand-primary font-medium transition-all cursor-pointer">
            ↑ Import
          </label>
        </div>
      </div>


      {/* Table */}
      <div className="glass-card rounded-[2.5rem] overflow-hidden border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg text-subtext text-[10px] font-black uppercase tracking-[0.2em]">
                {[["date", "Date"], ["market", "Market"], ["setup", "Setup"], ["side", "Side"], ["entryPrice", "Entry"], ["exitPrice", "Exit"], ["pnl", "P&L"], ["rr", "R:R"], ["", "Tags"], ["", "Actions"]].map(([k, h]) => (
                  <th key={h} onClick={() => k && sortBy(k)} className={`px-6 py-5 text-left ${k ? "cursor-pointer hover:text-text" : ""}`}>
                    {h} {k && sort.key === k && (sort.dir === 1 ? "↑" : "↓")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="text-center py-20 text-subtext font-bold uppercase tracking-widest text-xs">No matching trades found</td></tr>
              )}
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-bg transition-all group">
                  <td className="px-6 py-4 text-subtext font-medium">{fmtDate(t.date)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${t.side === "Buy" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                        {t.side[0]}
                      </div>
                      <span className="font-black text-text">{t.market}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-subtext font-bold text-xs">{t.setup}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${t.side === "Buy" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                      {t.side}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs font-bold text-gray-300">{t.entryPrice}</td>
                  <td className="px-6 py-4 font-mono text-xs font-bold text-gray-300">{t.exitPrice || "—"}</td>
                  <td className={`px-6 py-4 font-black font-mono text-sm ${t.pnl > 0 ? "text-emerald-400" : t.pnl < 0 ? "text-red-400" : "text-subtext"}`}>
                    {t.pnl > 0 ? "+" : ""}{fmt(t.pnl, settings.currency)}
                  </td>

                  <td className="px-6 py-4 text-subtext font-black text-xs">{t.rr ? `${t.rr}:1` : "—"}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(t.tags || []).slice(0, 2).map(tag => (
                        <span key={tag} className="text-[9px] px-2 py-0.5 bg-bg text-subtext rounded-full border border-border font-black uppercase tracking-wider">{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEdit(t)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all">✏️</button>
                      {t.screenshot && <button onClick={() => setViewImg(t.screenshot)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all">🖼️</button>}
                      <button onClick={() => { if (window.confirm("Delete this trade?")) onDelete(t.id); }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-8 py-4 bg-bg flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-subtext">
          <span>Total Records: {filtered.length}</span>
          <span>Net Performance: <span className={filtered.reduce((s, t) => s + t.pnl, 0) >= 0 ? "text-emerald-400" : "text-red-400"}>{fmt(filtered.reduce((s, t) => s + t.pnl, 0), settings.currency)}</span></span>
        </div>
      </div>

      {viewImg && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setViewImg(null)}>
          <div className="relative max-w-5xl w-full">
            <button className="absolute -top-12 right-0 text-white text-4xl hover:text-red-400 transition-colors" onClick={() => setViewImg(null)}>✕</button>
            <img src={viewImg} className="w-full rounded-2xl shadow-2xl border border-gray-800" alt="Trade Chart" />
          </div>
        </div>
      )}
    </div>
  );
}

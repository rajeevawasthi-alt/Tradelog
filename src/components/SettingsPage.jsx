import { useState } from "react";
import { Badge, Toggle } from "./ui/FormControls";

export default function SettingsPage({ settings, onUpdate, trades, onSeed, onPurge }) {
  const [form, setForm] = useState(settings);
  const [beCalc, setBeCalc] = useState({ entry: "", brokerage: 40, qty: "" });
  const [beRes, setBeRes] = useState(null);

  const save = (k, v) => {
    const next = { ...form, [k]: v };
    setForm(next);
    onUpdate(next);
  };

  const addItem = (k, val) => {
    if (!val) return;
    save(k, [...form[k], val]);
  };

  const removeItem = (k, val) => {
    save(k, form[k].filter(i => i !== val));
  };

  const calcBE = () => {
    const { entry, brokerage, qty } = beCalc;
    if (!entry || !qty) return;
    const totalCost = Number(brokerage);
    const offset = totalCost / Number(qty);
    setBeRes(Number(entry) + offset);
  };

  const requestNotif = () => {
    Notification.requestPermission().then(perm => {
      if (perm === "granted") alert("Notifications enabled! You will receive daily review reminders.");
    });
  };

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      {/* Quick Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-[3rem] p-8 border-[#00d4aa]/10">
          <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider">Breakeven Calculator</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Entry Price</label>
                <input type="number" value={beCalc.entry} onChange={e => setBeCalc({...beCalc, entry: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00d4aa]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Qty / Lots</label>
                <input type="number" value={beCalc.qty} onChange={e => setBeCalc({...beCalc, qty: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00d4aa]" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Round-trip Brokerage (₹)</label>
              <input type="number" value={beCalc.brokerage} onChange={e => setBeCalc({...beCalc, brokerage: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00d4aa]" />
            </div>
            <button onClick={calcBE} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Calculate Target</button>
            {beRes && (
              <div className="p-4 bg-[#00d4aa]/10 rounded-xl border border-[#00d4aa]/20 text-center">
                <p className="text-[10px] text-[#00d4aa] font-black uppercase tracking-widest mb-1">Target for Net 0</p>
                <p className="text-2xl font-black text-white font-mono">{beRes.toFixed(2)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-card rounded-[3rem] p-8 border-indigo-500/10">
          <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider">Review Reminders</h3>
          <p className="text-gray-500 text-xs mb-6 leading-relaxed">Stay disciplined. Get a daily reminder to log and review your trades at the end of market hours.</p>
          <button onClick={requestNotif} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all">Enable Desktop Notifications</button>
        </div>
      </div>

      <div className="glass-card rounded-[2.5rem] p-10">
        <h3 className="text-2xl font-black text-white mb-8 font-syne">Global Preferences</h3>
        
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Base Currency</p>
              <Toggle value={form.currency} onChange={v => save("currency", v)} options={["₹", "$", "€", "£"]} />
            </section>
            <section>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Brokerage per Order (Flat)</p>
              <input type="number" value={form.brokeragePerOrder} onChange={e => save("brokeragePerOrder", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00d4aa]" />
            </section>
          </div>

          <section>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Monthly Profit Goal ({form.currency})</p>
            <input type="number" value={form.monthlyGoal} onChange={e => save("monthlyGoal", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-5 text-2xl font-black text-[#00d4aa] focus:outline-none focus:border-[#00d4aa] font-mono" />
          </section>

          {["markets", "setups", "indicators", "emotions", "tags"].map(key => (
            <section key={key}>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">{key}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {form[key].map(item => (
                  <div key={item} className="group relative">
                    <Badge label={item} color="indigo" />
                    <button onClick={() => removeItem(key, item)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder={`Add new ${key.slice(0,-1)}...`}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#00d4aa] flex-1"
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      addItem(key, e.target.value);
                      e.target.value = "";
                    }
                  }}
                />
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-[2.5rem] p-10 border-red-500/10">
        <h3 className="text-xl font-black text-red-400 mb-4 font-syne">Danger Zone</h3>
        <p className="text-gray-500 text-xs mb-6">These actions are irreversible. Please proceed with caution.</p>
        <div className="flex gap-4">
          <button 
            onClick={() => {
              if(window.confirm("Seed 20 fake trades for testing?")) {
                const markets = ["Nifty", "BankNifty", "BTC", "ETH"];
                const setups = ["Breakout", "Mean Reversion", "Gap Fill"];
                const moods = ["🔥 Excited", "🧘 Calm", "😐 Neutral", "😰 Anxious", "😡 Angry"];
                const fakeTrades = [];
                for(let i=0; i<20; i++) {
                  const date = new Date();
                  date.setDate(date.getDate() - Math.floor(Math.random() * 30));
                  const isWin = Math.random() > 0.4;
                  const pnl = isWin ? (Math.random() * 5000 + 1000) : -(Math.random() * 3000 + 500);
                  fakeTrades.push({
                    id: "fake_" + Date.now() + i,
                    date: date.toISOString().slice(0, 16),
                    market: markets[Math.floor(Math.random() * markets.length)],
                    setup: setups[Math.floor(Math.random() * setups.length)],
                    side: Math.random() > 0.5 ? "Buy" : "Sell",
                    entryPrice: 20000 + Math.random() * 1000,
                    exitPrice: 20000 + Math.random() * 1000,
                    lotSize: 50,
                    pnl: Number(pnl.toFixed(2)),
                    result: isWin ? "Profit" : "Loss",
                    mood: moods[Math.floor(Math.random() * moods.length)],
                    notes: "Automated test data entry.",
                    tags: ["Test", "FakeData"],
                    exits: Math.random() > 0.7 ? [{price: 20500, qty: 25, id: 1}] : []
                  });
                }
                fakeTrades.forEach(t => onSeed(t));
                alert(`Successfully seeded ${fakeTrades.length} trades!`);
              }
            }}
            className="px-8 py-4 bg-[#00d4aa]/10 hover:bg-[#00d4aa] text-[#00d4aa] hover:text-[#07090f] border border-[#00d4aa]/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Seed Test Data
          </button>
          <button 
            onClick={() => { 
              if(window.confirm("ARE YOU SURE? This will delete all your trading history!")) { 
                trades.forEach(t => onPurge(t.id)); 
                alert("History purged.");
              } 
            }}
            className="px-8 py-4 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Purge All Trade Data
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Input, Select, Textarea, Toggle } from "./ui/FormControls";
import { MultiSelect } from "./ui/MultiSelect";
import { calcPnL, calcRR, fmt, uid } from "../utils/helpers";

const EMPTY_TRADE = {
  date: new Date().toISOString().slice(0, 16),
  market: "", setup: "", side: "Buy",
  entryPrice: "", stopLoss: "", target: "", exitPrice: "",
  lotSize: "", risk: "", riskType: "₹",
  result: "", pnl: 0, rr: null,
  condition: "", indicators: [],
  reasonForEntry: "", emotionBefore: "", emotionDuring: "",
  mistakeNotes: "", followedPlan: null,
  tags: [], notes: "", screenshot: null,
  exits: [], // { price, qty, time }
  mood: "Neutral",
};

export default function AddTradeForm({ onSave, editTrade, onClose, settings }) {
  const [form, setForm] = useState(editTrade || EMPTY_TRADE);
  const [section, setSection] = useState(0);
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklistValues, setChecklistValues] = useState({});

  const set = (k) => (v) => {
    setForm(f => {
      const next = { ...f, [k]: v };
      next.pnl = calcPnL(next, settings);
      next.rr = calcRR(next);
      next.result = next.pnl > 0 ? "Profit" : next.pnl < 0 ? "Loss" : "";
      return next;
    });
  };

  const addExit = () => {
    const nextExits = [...(form.exits || []), { price: "", qty: "", id: Date.now() }];
    set("exits")(nextExits);
  };

  const updateExit = (id, k, v) => {
    const nextExits = form.exits.map(ex => ex.id === id ? { ...ex, [k]: v } : ex);
    set("exits")(nextExits);
  };

  const removeExit = (id) => {
    set("exits")(form.exits.filter(ex => ex.id !== id));
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => set("screenshot")(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!form.market || !form.setup || !form.entryPrice) {
      alert("Please fill required fields: Market, Setup, Entry Price");
      return;
    }
    
    if (!showChecklist && settings.checklist?.length > 0) {
      setShowChecklist(true);
      return;
    }

    onSave({ ...form, id: form.id || uid() });
    onClose();
  };

  const sections = ["Trade Details", "Exits & Risk", "Psychology", "Review"];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative"
        onClick={e => e.stopPropagation()}>
        
        {showChecklist && (
          <div className="absolute inset-0 bg-[#07090f] z-50 p-8 flex flex-col">
            <h3 className="text-2xl font-black text-white mb-6 font-syne">Pre-Trade Checklist</h3>
            <div className="space-y-4 flex-1 overflow-y-auto">
              {settings.checklist.map((item, i) => (
                <label key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all border border-white/5">
                  <input type="checkbox" className="w-5 h-5 rounded border-white/10 bg-transparent text-[#00d4aa] focus:ring-[#00d4aa]" 
                    onChange={e => setChecklistValues(prev => ({ ...prev, [item]: e.target.checked }))} />
                  <span className="text-gray-300 font-bold text-sm uppercase tracking-wider">{item}</span>
                </label>
              ))}
            </div>
            <div className="pt-6 flex gap-4">
              <button onClick={() => setShowChecklist(false)} className="px-6 py-4 rounded-2xl bg-white/5 text-gray-500 font-black uppercase tracking-widest text-xs">Back</button>
              <button onClick={handleSave} className="flex-1 px-6 py-4 btn-premium rounded-2xl text-xs font-black uppercase tracking-widest">Confirm & Save Trade</button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">{editTrade ? "Edit Trade" : "Log New Trade"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl transition-colors">✕</button>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 px-6 pt-4">
          {sections.map((s, i) => (
            <button key={s} onClick={() => setSection(i)}
              className={`flex-1 py-2 text-xs rounded-lg font-medium transition-all ${section === i ? "bg-[#00d4aa]/10 text-[#00d4aa]" : "text-gray-500 hover:text-gray-300"}`}>
              {s}
            </button>
          ))}
        </div>

        {/* P&L Preview */}
        {form.pnl !== 0 && (
          <div className={`mx-8 mt-4 px-6 py-4 rounded-3xl flex items-center justify-between border ${form.pnl > 0 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}>
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Net P&L (incl. Brokerage)</p>
              <p className={`font-black font-mono text-2xl ${form.pnl > 0 ? "text-emerald-400" : "text-red-400"}`}>
                {form.pnl > 0 ? "+" : ""}{fmt(form.pnl, settings.currency)}
              </p>
            </div>
            {form.rr && (
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Risk Reward</p>
                <p className="text-indigo-400 font-black text-xl">{form.rr}:1</p>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {section === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <Input label="Date & Time" type="datetime-local" value={form.date} onChange={set("date")} className="col-span-2" required />
              <Select label="Market" value={form.market} onChange={set("market")} options={settings.markets} required />
              <Select label="Setup Type" value={form.setup} onChange={set("setup")} options={settings.setups} required />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-400 tracking-wide uppercase">Side *</label>
                <Toggle value={form.side} onChange={set("side")} options={["Buy", "Sell"]} />
              </div>
              <Input label="Entry Price" type="number" value={form.entryPrice} onChange={set("entryPrice")} placeholder="21500" required />
              <Input label="Total Lot Size" type="number" value={form.lotSize} onChange={set("lotSize")} placeholder="50" required />
              <Input label="Stop Loss" type="number" value={form.stopLoss} onChange={set("stopLoss")} placeholder="21400" />
              <Input label="Initial Target" type="number" value={form.target} onChange={set("target")} placeholder="21700" />
            </div>
          )}

          {section === 1 && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Partial Exits (Scale Out)</p>
                <button onClick={addExit} className="text-[#00d4aa] text-xs font-bold hover:underline">+ Add Exit</button>
              </div>
              
              {(form.exits || []).map((ex, i) => (
                <div key={ex.id} className="grid grid-cols-5 gap-3 items-end bg-white/5 p-4 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="col-span-2">
                    <Input label={`Exit ${i+1} Price`} type="number" value={ex.price} onChange={v => updateExit(ex.id, "price", v)} />
                  </div>
                  <div className="col-span-2">
                    <Input label="Qty" type="number" value={ex.qty} onChange={v => updateExit(ex.id, "qty", v)} />
                  </div>
                  <button onClick={() => removeExit(ex.id)} className="pb-4 text-red-400 text-xs font-bold">Remove</button>
                </div>
              ))}

              {!form.exits?.length && (
                <Input label="Single Exit Price" type="number" value={form.exitPrice} onChange={set("exitPrice")} placeholder="Optional if holding" />
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-400 tracking-wide uppercase">Risk Allocation</label>
                <div className="flex gap-2">
                  <Toggle value={form.riskType} onChange={set("riskType")} options={["₹", "%"]} />
                  <input type="number" value={form.risk} onChange={e => set("risk")(e.target.value)} placeholder="1000"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
            </div>
          )}

          {section === 2 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-gray-400 tracking-wide uppercase">Current Mood</label>
                <div className="flex gap-2">
                  {["🔥 Excited", "🧘 Calm", "😐 Neutral", "😰 Anxious", "😡 Angry"].map(m => (
                    <button key={m} onClick={() => set("mood")(m)}
                      className={`flex-1 py-3 rounded-2xl text-xs font-bold transition-all border ${form.mood === m ? "bg-indigo-600 border-indigo-500 text-white" : "bg-white/5 border-white/5 text-gray-500"}`}>
                      {m.split(' ')[1]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select label="Emotion During" value={form.emotionDuring} onChange={set("emotionDuring")} options={settings.emotions} />
                <Select label="Market Condition" value={form.condition} onChange={set("condition")} options={settings.conditions} />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-gray-400 tracking-wide uppercase">Followed Trading Plan?</label>
                <Toggle value={form.followedPlan === true ? "Yes" : form.followedPlan === false ? "No" : ""} onChange={v => set("followedPlan")(v === "Yes")} options={["Yes", "No"]} />
              </div>

              <Textarea label="Psychology Notes" value={form.mistakeNotes} onChange={set("mistakeNotes")} placeholder="What was your state of mind? Any FOMO or Greed?" />
            </div>
          )}

          {section === 3 && (
            <div className="flex flex-col gap-5">
              <MultiSelect label="Tags" options={settings.tags} selected={form.tags || []} onChange={set("tags")} />
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-gray-400 tracking-wide uppercase">Screenshot / Chart Image</label>
                <div className="flex gap-4 items-center">
                  <input type="file" accept="image/*" onChange={handleImage} className="hidden" id="chart-upload" />
                  <label htmlFor="chart-upload" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs text-gray-300 cursor-pointer transition-all">
                    {form.screenshot ? "Change Image" : "Upload Chart"}
                  </label>
                  {form.screenshot && <button onClick={() => set("screenshot")(null)} className="text-red-400 text-xs">Remove</button>}
                </div>
                {form.screenshot && (
                  <div className="mt-2 relative group w-full aspect-video rounded-xl overflow-hidden border border-gray-800">
                    <img src={form.screenshot} className="w-full h-full object-cover" alt="Chart preview" />
                  </div>
                )}
              </div>

              <Textarea label="Trade Notes" value={form.notes} onChange={set("notes")} placeholder="Key observations, mistakes, or future improvements..." />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-4 px-8 py-6 border-t border-white/5 bg-gray-900/50">
          <button onClick={() => setSection(Math.max(0, section - 1))} disabled={section === 0}
            className="px-6 py-3 rounded-2xl bg-white/5 text-gray-400 text-xs font-black uppercase tracking-widest disabled:opacity-20 hover:bg-white/10 transition-all">
            ← Previous
          </button>
          <div className="flex-1" />
          {section < 3
            ? <button onClick={() => setSection(s => s + 1)} className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20">Continue →</button>
            : <button onClick={handleSave} className="px-8 py-3 rounded-2xl bg-[#00d4aa] hover:bg-[#00b08e] text-[#07090f] text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-[#00d4aa]/20">
              {editTrade ? "Update Portfolio" : "Review & Log Trade"}
            </button>
          }
        </div>
      </div>
    </div>
  );
}

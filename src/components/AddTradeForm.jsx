// src/components/AddTradeForm.jsx
import { useState } from "react";
import { Input, Select, Textarea, Toggle } from "./ui/FormControls";
import { MultiSelect } from "./ui/MultiSelect";
import { calcPnL, calcRR, fmt, uid } from "../utils/helpers";
import { toast } from "./ui/Toast";

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
      toast.error("Required fields: Market, Setup, Entry Price must be filled");
      return;
    }
    
    // Checklist phase trigger
    if (!showChecklist && settings.checklist?.length > 0) {
      const uncheckedRules = settings.checklist.filter(rule => !checklistValues[rule]);
      if (uncheckedRules.length > 0) {
        setShowChecklist(true);
        return;
      }
    }

    onSave({ ...form, id: form.id || uid() });
    
    if (editTrade) {
      toast.success("Trade entry successfully updated in ledger!");
    } else {
      toast.success("New trade entry registered in portfolio!");
      if (form.pnl > 0) {
        toast.insight(`Excellent execution! You locked in a profit of ${fmt(form.pnl, settings.currency)}.`);
      }
    }
    onClose();
  };

  const sections = ["Trade Details", "Exits & Risk", "Psychology", "Review"];

  // Custom pre-trade checklist count
  const checkedCount = Object.values(checklistValues).filter(Boolean).length;
  const checklistRules = settings.checklist || [];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-card border border-border rounded-[2.5rem] w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col relative shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Pre-Trade Checklist Overlay Screen */}
        {showChecklist && (
          <div className="absolute inset-0 bg-bg z-50 p-8 flex flex-col animate-in fade-in duration-300">
            <div className="mb-6">
              <h3 className="text-2xl font-black text-white font-syne uppercase tracking-tight">Pre-Trade Checklist</h3>
              <p className="text-gray-500 text-[10px] font-bold tracking-[0.2em] uppercase mt-1">
                Sticking to Rules: {checkedCount}/{checklistRules.length} Verified
              </p>
            </div>
            
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {checklistRules.map((item, i) => (
                <label 
                  key={i} 
                  className={`
                    flex items-center gap-4 p-5 rounded-2xl cursor-pointer border transition-all duration-150
                    ${checklistValues[item] 
                      ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary" 
                      : "bg-white/3 border-white/5 text-gray-400 hover:bg-white/5"
                    }
                  `}
                >
                  <input 
                    type="checkbox" 
                    checked={!!checklistValues[item]}
                    className="w-5 h-5 rounded border-white/10 bg-transparent text-brand-primary focus:ring-brand-primary" 
                    onChange={e => setChecklistValues(prev => ({ ...prev, [item]: e.target.checked }))} 
                  />
                  <span className="font-bold text-xs uppercase tracking-wider">{item}</span>
                </label>
              ))}
            </div>
            
            <div className="pt-6 border-t border-border flex gap-4">
              <button 
                onClick={() => setShowChecklist(false)} 
                className="px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-subtext font-black uppercase tracking-widest text-[10px] transition-colors"
              >
                Back to details
              </button>
              <button 
                onClick={handleSave} 
                className="flex-grow px-6 py-4 btn-premium rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-brand-primary/10"
              >
                Confirm Rules & Save Trade
              </button>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-white/2">
          <div>
            <h2 className="text-base font-black text-white uppercase tracking-wider font-syne">
              {editTrade ? "Modify Journal Entry" : "Register Trade Execution"}
            </h2>
            <p className="text-gray-500 text-[9px] font-bold tracking-[0.2em] uppercase mt-0.5">
              Terminal Sheet Entry
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-xl hover:bg-white/5 flex items-center justify-center text-subtext hover:text-white transition-all text-lg"
          >
            ✕
          </button>
        </div>

        {/* Wizard Segment Bar */}
        <div className="flex gap-1 px-8 pt-4">
          {sections.map((s, i) => (
            <button 
              key={s} 
              onClick={() => setSection(i)}
              className={`
                flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-200 border
                ${section === i 
                  ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary" 
                  : "bg-white/3 border-transparent text-gray-500 hover:text-gray-300"
                }
              `}
            >
              {s}
            </button>
          ))}
        </div>

        {/* P&L Floating Display */}
        {form.pnl !== 0 && (
          <div 
            className={`
              mx-8 mt-4 px-6 py-4 rounded-2xl flex items-center justify-between border animate-in slide-in-from-top-4 duration-300
              ${form.pnl > 0 
                ? "bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.03)]" 
                : "bg-red-500/5 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.03)]"
              }
            `}
          >
            <div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Calculated P&L (incl. Commissions)</p>
              <p className={`font-black font-mono text-xl ${form.pnl > 0 ? "text-emerald-400" : "text-red-400"}`}>
                {form.pnl > 0 ? "+" : ""}{fmt(form.pnl, settings.currency)}
              </p>
            </div>
            {form.rr && (
              <div className="text-right">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Risk to Reward</p>
                <p className="text-indigo-400 font-black font-mono text-lg">{form.rr}:1</p>
              </div>
            )}
          </div>
        )}

        {/* Form Input Windows */}
        <div className="overflow-y-auto flex-1 px-8 py-5 custom-scrollbar">
          {section === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <Input label="Date & Execution Time" type="datetime-local" value={form.date} onChange={set("date")} className="col-span-2" required />
              <Select label="Market Asset" value={form.market} onChange={set("market")} options={settings.markets} required />
              <Select label="Setup Blueprint" value={form.setup} onChange={set("setup")} options={settings.setups} required />

              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Order Direction *</label>
                <Toggle value={form.side} onChange={set("side")} options={["Buy", "Sell"]} />
              </div>
              
              <Input label="Entry Price" type="number" value={form.entryPrice} onChange={set("entryPrice")} placeholder="Price executed" required />
              <Input label="Total Lot Size" type="number" value={form.lotSize} onChange={set("lotSize")} placeholder="Contracts/Shares" required />
              <Input label="Stop Loss Price" type="number" value={form.stopLoss} onChange={set("stopLoss")} placeholder="Invalidation line" />
              <Input label="Initial Target Price" type="number" value={form.target} onChange={set("target")} placeholder="Blueprint exit line" />
            </div>
          )}

          {section === 1 && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Partial Profit Target Exits</p>
                <button onClick={addExit} className="text-brand-primary text-xs font-black uppercase tracking-wider hover:underline">+ Scale Out</button>
              </div>
              
              {(form.exits || []).map((ex, i) => (
                <div key={ex.id} className="grid grid-cols-5 gap-3 items-end bg-white/3 p-4 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="col-span-2">
                    <Input label={`Exit ${i+1} Price`} type="number" value={ex.price} onChange={v => updateExit(ex.id, "price", v)} />
                  </div>
                  <div className="col-span-2">
                    <Input label="Contracts Sold" type="number" value={ex.qty} onChange={v => updateExit(ex.id, "qty", v)} />
                  </div>
                  <button onClick={() => removeExit(ex.id)} className="pb-4 text-red-400 text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity">Remove</button>
                </div>
              ))}

              {!form.exits?.length && (
                <Input label="Single Final Exit Price" type="number" value={form.exitPrice} onChange={set("exitPrice")} placeholder="Leave blank if still holding" />
              )}

              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Calculated Risk Amount</label>
                <div className="flex gap-2">
                  <Toggle value={form.riskType} onChange={set("riskType")} options={["₹", "%"]} />
                  <input 
                    type="number" 
                    value={form.risk} 
                    onChange={e => set("risk")(e.target.value)} 
                    placeholder="Allowed loss amount"
                    className="flex-1 bg-white/3 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-brand-primary transition-all font-medium" 
                  />
                </div>
              </div>
            </div>
          )}

          {section === 2 && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Mental Mood Before Entry</label>
                <div className="flex gap-2">
                  {["🔥 Excited", "🧘 Calm", "😐 Neutral", "😰 Anxious", "😡 Angry"].map(m => (
                    <button 
                      key={m} 
                      onClick={() => set("mood")(m)}
                      className={`
                        flex-1 py-3.5 rounded-2xl text-xs font-black transition-all duration-150 border
                        ${form.mood === m 
                          ? "bg-brand-primary border-brand-primary text-bg shadow-[0_0_20px_rgba(0,212,170,0.25)]" 
                          : "bg-white/3 border-white/5 text-gray-500 hover:text-gray-300"
                        }
                      `}
                    >
                      {m.split(' ')[1]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select label="Emotion During Trade" value={form.emotionDuring} onChange={set("emotionDuring")} options={settings.emotions} />
                <Select label="Market Condition Context" value={form.condition} onChange={set("condition")} options={settings.conditions} />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Stuck to your Blueprint Plan?</label>
                <Toggle value={form.followedPlan === true ? "Yes" : form.followedPlan === false ? "No" : ""} onChange={v => set("followedPlan")(v === "Yes")} options={["Yes", "No"]} />
              </div>

              <Textarea label="Psychological Mindset Notes" value={form.mistakeNotes} onChange={set("mistakeNotes")} placeholder="Describe any mental traps, panic, greed, or impulsive moves..." />
            </div>
          )}

          {section === 3 && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-300">
              <MultiSelect label="Asset Tags" options={settings.tags} selected={form.tags || []} onChange={set("tags")} />
              
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Screenshot / Chart Image</label>
                <div className="flex gap-4 items-center">
                  <input type="file" accept="image/*" onChange={handleImage} className="hidden" id="chart-upload" />
                  <label htmlFor="chart-upload" className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-300 cursor-pointer transition-all">
                    {form.screenshot ? "Change Image" : "Upload Chart Image"}
                  </label>
                  {form.screenshot && <button onClick={() => set("screenshot")(null)} className="text-red-400 text-xs font-bold hover:underline">Remove</button>}
                </div>
                {form.screenshot && (
                  <div className="mt-2 relative group w-full aspect-video rounded-3xl overflow-hidden border border-border shadow-2xl">
                    <img src={form.screenshot} className="w-full h-full object-cover" alt="Chart preview" />
                  </div>
                )}
              </div>

              <Textarea label="Execution Narrative Notes" value={form.notes} onChange={set("notes")} placeholder="Key context, indicators signals, technical setup narrative..." />
            </div>
          )}
        </div>

        {/* Wizard Navigation Footer */}
        <div className="flex gap-4 px-8 py-5 border-t border-border bg-white/2">
          <button 
            onClick={() => setSection(Math.max(0, section - 1))} 
            disabled={section === 0}
            className="px-6 py-3.5 rounded-2xl bg-white/5 text-gray-500 disabled:opacity-20 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
          >
            ← Back
          </button>
          
          <div className="flex-grow" />
          
          {section < 3 ? (
            <button 
              onClick={() => setSection(s => s + 1)} 
              className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/10"
            >
              Continue →
            </button>
          ) : (
            <button 
              onClick={handleSave} 
              className="px-8 py-3.5 rounded-2xl bg-brand-primary hover:scale-[1.02] active:scale-[0.98] text-bg text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-brand-primary/10"
            >
              {editTrade ? "Update Portfolio" : "Review & Log Trade"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

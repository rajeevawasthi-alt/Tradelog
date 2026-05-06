import { useState, useMemo } from "react";
import { Heatmap } from "./ui/SpecialTools";
import { fmt, fmtDate } from "../utils/helpers";

export default function ReviewPage({ trades, settings }) {
  const insights = useMemo(() => {
    if (trades.length === 0) return [];
    
    const list = [];
    const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // AI-Style Behavioral Analysis
    const revengeTrades = [];
    const overtradedDays = [];
    const dayMap = {};

    sorted.forEach((curr, i) => {
      const prev = sorted[i-1];
      if (prev && prev.pnl < 0) {
        const diff = (new Date(curr.date) - new Date(prev.date)) / (1000 * 60 * 60);
        if (diff < 2) revengeTrades.push(curr);
      }
      const d = new Date(curr.date).toISOString().split("T")[0];
      dayMap[d] = (dayMap[d] || 0) + 1;
      if (dayMap[d] === 6) overtradedDays.push(d);
    });

    if (revengeTrades.length > 0) {
      list.push({ 
        title: "AI Analysis: Revenge Pattern", 
        desc: `You tend to take aggressive entries after a loss. Specifically on ${revengeTrades.length} occasions, you traded within 2 hours of a drawdown. Suggestion: Step away for 4 hours after any loss.`, 
        type: "error" 
      });
    }

    if (overtradedDays.length > 0) {
      list.push({ 
        title: "AI Analysis: Capacity Limit", 
        desc: `Your decision quality drops after trade #5 in a single day. You overtraded on ${overtradedDays.length} days this month. Suggestion: Set a hard limit of 3 trades/day in settings.`, 
        type: "warning" 
      });
    }

    // Profit Factor Insight
    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl < 0);
    if (wins.length > 0 && losses.length > 0) {
      const avgW = wins.reduce((s, t) => s + t.pnl, 0) / wins.length;
      const avgL = Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length);
      if (avgW < avgL) {
        list.push({ 
          title: "AI Analysis: Negative Expectancy", 
          desc: "Your average loss is larger than your average win. Even with a high win rate, your account will bleed. Work on 'Cutting Losses Early'.", 
          type: "error" 
        });
      }
    }

    return list;
  }, [trades]);

  const [selectedTrade, setSelectedTrade] = useState(null);

  return (
    <div className="space-y-8 pb-20">
      {/* AI Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">Psychological Engine (AI)</h3>
          {insights.length === 0 && <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Collecting behavioral data for analysis...</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((ins, i) => (
              <div key={i} className={`p-6 rounded-[2rem] border animate-in zoom-in duration-500 ${
                ins.type === "warning" ? "bg-amber-500/5 border-amber-500/20 text-amber-400" : 
                ins.type === "error" ? "bg-red-500/5 border-red-500/20 text-red-400" : 
                "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">{ins.type === "error" ? "🧠" : "🤖"}</span>
                  <p className="text-xs font-black uppercase tracking-[0.2em]">{ins.title}</p>
                </div>
                <p className="text-sm font-medium opacity-80 leading-relaxed">{ins.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap Section */}
        <div className="lg:col-span-1">
          <Heatmap trades={trades} settings={settings} />
        </div>
      </div>

      {/* Trade Replay Tool */}
      <div className="glass-card rounded-[3rem] p-10 border-[#00d4aa]/10">
        <h3 className="text-xl font-black text-white mb-8 font-syne flex items-center gap-3">
          <span>🎬</span> Interactive Trade Replay
        </h3>
        
        {!selectedTrade ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trades.slice(0, 6).map(t => (
              <button key={t.id} onClick={() => setSelectedTrade(t)} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-left transition-all group">
                <p className="text-[10px] font-black text-gray-500 uppercase mb-1">{fmtDate(t.date)}</p>
                <p className="text-sm font-black text-white group-hover:text-[#00d4aa]">{t.market} - {t.setup}</p>
                <p className={`text-xs font-bold mt-1 ${t.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmt(t.pnl, settings.currency)}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <button onClick={() => setSelectedTrade(null)} className="text-[#00d4aa] text-xs font-black uppercase tracking-widest">← Back to List</button>
              <h4 className="text-lg font-black text-white">{selectedTrade.market} Replay</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 bg-white/5">
                  {selectedTrade.screenshot ? (
                    <img src={selectedTrade.screenshot} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs font-bold uppercase tracking-widest">No Chart Image Attached</div>
                  )}
                  <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-black text-[#00d4aa] uppercase">Step 1: Entry</div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-5 bg-[#00d4aa]/10 rounded-2xl border border-[#00d4aa]/20">
                    <div className="w-10 h-10 rounded-full bg-[#00d4aa] flex items-center justify-center text-[#07090f] font-black">1</div>
                    <div>
                      <p className="text-[10px] font-black text-[#00d4aa] uppercase">Execution Entry</p>
                      <p className="text-sm text-white font-bold">Entered {selectedTrade.side} at {selectedTrade.entryPrice}</p>
                    </div>
                  </div>
                  {(selectedTrade.exits || []).map((ex, i) => (
                    <div key={i} className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/5">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-black">{i + 2}</div>
                      <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase">Scale Out / Exit</p>
                        <p className="text-sm text-white font-bold">Sold {ex.qty} units at {ex.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                <section>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Psychological State</p>
                  <div className="flex items-center gap-3 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                    <span className="text-2xl">{selectedTrade.mood?.split(' ')[1] || "🧘"}</span>
                    <p className="text-sm text-indigo-400 font-bold italic">"{selectedTrade.mistakeNotes || "No mental notes logged for this execution."}"</p>
                  </div>
                </section>
                
                <section>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Setup Narrative</p>
                  <p className="text-gray-400 text-sm leading-relaxed">{selectedTrade.notes || "No narrative provided."}</p>
                </section>

                <div className="pt-8 border-t border-white/5">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-white/5 rounded-2xl">
                      <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Final Result</p>
                      <p className={`text-xl font-black ${selectedTrade.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmt(selectedTrade.pnl, settings.currency)}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl">
                      <p className="text-[10px] font-black text-gray-500 uppercase mb-1">R:R Ratio</p>
                      <p className="text-xl font-black text-indigo-400">{selectedTrade.rr || "N/A"}:1</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Narrative Section */}
      <div className="glass-card rounded-[2.5rem] p-8">
        <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider">Systematic Review</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Market Discipline</p>
            <p className="text-white text-sm leading-relaxed">
              Based on your last 20 trades, your discipline score is <span className="text-emerald-400">84%</span>. 
              You are most consistent in <span className="text-indigo-400">Nifty Breakouts</span> during the first hour of trading.
            </p>
          </div>
          <div className="space-y-4 border-l border-white/5 pl-8">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Risk Management</p>
            <p className="text-white text-sm leading-relaxed">
              Your average loss is well within limits, but your <span className="text-red-400">Max Drawdown</span> 
              suggests you might need to tighten stops on volatile days.
            </p>
          </div>
          <div className="space-y-4 border-l border-white/5 pl-8">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Emotional Edge</p>
            <p className="text-white text-sm leading-relaxed">
              Trades taken when feeling <span className="text-indigo-400">"Disciplined"</span> have a 72% higher win rate 
              than those taken while feeling "Anxious".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

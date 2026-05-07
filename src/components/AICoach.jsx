import React, { useState, useEffect, useMemo } from "react";
import { dbService } from "../db";
import { fmt, getStreak } from "../utils/helpers";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export default function AICoach({ trades, userId, settings }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    if (userId) {
      loadPreviousAnalysis();
    }
  }, [userId]);

  const loadPreviousAnalysis = async () => {
    const saved = await dbService.getAIAnalysis(userId);
    if (saved) {
      setAnalysis(saved);
      // Check rate limit: count requests from today
      const today = new Date().toDateString();
      const requestsToday = (saved.history || []).filter(h => new Date(h).toDateString() === today);
      setRequestCount(requestsToday.length);
    }
  };

  const aggregateData = () => {
    if (trades.length < 10) return null;

    const pnlList = trades.map(t => t.pnl || 0);
    const wins = pnlList.filter(p => p > 0);
    const wr = ((wins.length / trades.length) * 100).toFixed(1);
    const totalPnL = pnlList.reduce((s, p) => s + p, 0);
    const streaks = getStreak(trades);
    
    const dayMap = { "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0 };
    const hourMap = {};
    const instrumentMap = {};
    const emotions = [];

    trades.forEach(t => {
      const date = new Date(t.date);
      const day = date.toLocaleDateString("en-US", { weekday: "short" });
      if (dayMap[day] !== undefined) dayMap[day] += t.pnl;

      const hour = date.getHours();
      hourMap[hour] = (hourMap[hour] || 0) + t.pnl;

      instrumentMap[t.market] = (instrumentMap[t.market] || 0) + 1;

      if (t.emotions && t.emotions.length > 0) {
        emotions.push(...t.emotions);
      }
      if (t.notes) emotions.push(t.notes);
    });

    const sortedDays = Object.entries(dayMap).sort((a, b) => b[1] - a[1]);
    const sortedHours = Object.entries(hourMap).sort((a, b) => b[1] - a[1]);
    const sortedInstruments = Object.entries(instrumentMap).sort((a, b) => b[1] - a[1]);

    const last20 = [...trades]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 20)
      .map(t => ({
        date: t.date,
        market: t.market,
        side: t.side,
        entry: t.entryPrice,
        exit: t.exitPrice,
        pnl: t.pnl,
        notes: t.notes
      }));

    return {
      totalTrades: trades.length,
      winRate: `${wr}%`,
      avgRR: (trades.filter(t => t.rr).reduce((s, t) => s + t.rr, 0) / (trades.filter(t => t.rr).length || 1)).toFixed(2),
      totalPnL: fmt(totalPnL, settings.currency),
      bestDays: sortedDays.slice(0, 2).map(d => d[0]),
      worstDays: sortedDays.slice(-2).map(d => d[0]),
      bestTimeSlots: sortedHours.slice(0, 2).map(h => `${h[0]}:00`),
      mostTraded: sortedInstruments.slice(0, 3).map(i => i[0]),
      maxConsecutiveWins: streaks.maxWin,
      maxConsecutiveLosses: streaks.maxLoss,
      emotionalNotes: emotions.slice(-10), // Last 10 notes/emotions
      last20Trades: last20
    };
  };

  const getAnalysis = async () => {
    if (trades.length < 10) {
      setError("Add at least 10 trades for AI analysis");
      return;
    }

    if (requestCount >= 3) {
      setError("Daily limit reached (3/3). Try again tomorrow!");
      return;
    }

    if (!GEMINI_API_KEY) {
      setError("API Key missing. Please set VITE_GEMINI_API_KEY in .env");
      return;
    }

    setLoading(true);
    setError(null);

    const data = aggregateData();
    const systemPrompt = `You are an expert trading coach and performance analyst. Analyze this trader's data and provide honest, specific, actionable feedback. Be direct and data-driven. Format your response in exactly 3 sections:

🔴 WHAT'S WRONG (top 3 problems with data proof)
🟡 WHAT TO IMPROVE (top 3 specific action steps)  
🟢 WHAT'S WORKING (top 2 strengths to keep doing)

Also add:
📊 RISK SCORE: X/10 (with one line explanation)
🧠 PSYCHOLOGY ALERT: one specific behavioral pattern you notice

Keep response concise, max 300 words. 
Use trader language. Be brutally honest.`;

    const fullPrompt = `${systemPrompt}\n\nTRADER DATA:\n${JSON.stringify(data, null, 2)}`;

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }]
        })
      });

      const result = await response.json();
      if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
        const text = result.candidates[0].content.parts[0].text;
        
        const newHistory = [...(analysis?.history || []), new Date().toISOString()];
        const analysisData = {
          text,
          timestamp: new Date().toISOString(),
          history: newHistory
        };

        await dbService.saveAIAnalysis(userId, analysisData);
        setAnalysis(analysisData);
        setRequestCount(newHistory.filter(h => new Date(h).toDateString() === new Date().toDateString()).length);
      } else {
        throw new Error("Invalid response from Gemini");
      }
    } catch (err) {
      console.error(err);
      setError("Analysis unavailable, try again later");
    } finally {
      setLoading(false);
    }
  };

  const parseAnalysis = (text) => {
    if (!text) return null;
    
    const sections = {
      wrong: "",
      improve: "",
      working: "",
      riskScore: 0,
      riskNote: "",
      psychAlert: ""
    };

    const parts = text.split(/(🔴|🟡|🟢|📊|🧠)/);
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const next = parts[i+1] || "";
      if (part === "🔴") sections.wrong = next.replace("WHAT'S WRONG", "").trim();
      if (part === "🟡") sections.improve = next.replace("WHAT TO IMPROVE", "").trim();
      if (part === "🟢") sections.working = next.replace("WHAT'S WORKING", "").trim();
      if (part === "📊") {
        const riskMatch = next.match(/RISK SCORE:?\s*\*?\s*(\d+)\s*\*?\/10/i);
        sections.riskScore = riskMatch ? parseInt(riskMatch[1]) : 5;
        sections.riskNote = next.replace(/RISK SCORE:?\s*\*?\s*\d+\s*\*?\/10/i, "").trim();
      }
      if (part === "🧠") sections.psychAlert = next.replace("PSYCHOLOGY ALERT:", "").trim();
    }

    return sections;
  };

  const parsed = useMemo(() => parseAnalysis(analysis?.text), [analysis]);

  const lastAnalyzed = analysis?.timestamp ? 
    Math.round((new Date() - new Date(analysis.timestamp)) / (1000 * 60 * 60)) : null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-[#00d4aa] text-bg font-black px-6 py-4 rounded-2xl shadow-[0_10px_40px_rgba(0,212,170,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group"
      >
        <span className="text-xl group-hover:rotate-12 transition-transform">🤖</span>
        <span>AI COACH</span>
      </button>

      {/* Slide-up Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="relative w-full max-w-2xl bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00d4aa]/10 flex items-center justify-center text-xl">🤖</div>
                <div>
                  <h3 className="font-black text-text uppercase tracking-tight">Trading Coach AI</h3>
                  <p className="text-[10px] font-bold text-subtext uppercase tracking-widest">
                    {lastAnalyzed !== null ? `Last analyzed: ${lastAnalyzed} hours ago` : "No recent analysis"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 rounded-xl hover:bg-bg flex items-center justify-center text-subtext transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-6">
                  <div className="w-16 h-16 border-4 border-[#00d4aa]/20 border-t-[#00d4aa] rounded-full animate-spin" />
                  <div className="text-center">
                    <p className="font-black text-text uppercase tracking-widest animate-pulse">Analyzing your trades...</p>
                    <p className="text-xs text-subtext mt-2">Checking patterns and risk metrics</p>
                  </div>
                </div>
              ) : error ? (
                <div className="py-10 text-center">
                  <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">⚠️</div>
                  <p className="font-black text-text">{error}</p>
                  <button 
                    onClick={() => setError(null)}
                    className="mt-4 text-[10px] font-black text-[#00d4aa] uppercase tracking-widest"
                  >
                    Try Again
                  </button>
                </div>
              ) : parsed ? (
                <div className="space-y-6">
                  {/* Red Card */}
                  <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">🔴</span>
                      <h4 className="font-black text-red-400 uppercase tracking-widest text-sm">What's Wrong</h4>
                    </div>
                    <div className="text-sm text-text/80 leading-relaxed whitespace-pre-wrap">
                      {parsed.wrong}
                    </div>
                  </div>

                  {/* Yellow Card */}
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">🟡</span>
                      <h4 className="font-black text-amber-400 uppercase tracking-widest text-sm">What to Improve</h4>
                    </div>
                    <div className="text-sm text-text/80 leading-relaxed whitespace-pre-wrap">
                      {parsed.improve}
                    </div>
                  </div>

                  {/* Green Card */}
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">🟢</span>
                      <h4 className="font-black text-emerald-400 uppercase tracking-widest text-sm">What's Working</h4>
                    </div>
                    <div className="text-sm text-text/80 leading-relaxed whitespace-pre-wrap">
                      {parsed.working}
                    </div>
                  </div>

                  {/* Risk Score */}
                  <div className="bg-bg/50 rounded-3xl p-6 border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">📊</span>
                        <h4 className="font-black text-text uppercase tracking-widest text-sm">Risk Score</h4>
                      </div>
                      <span className="text-xl font-black text-[#00d4aa]">{parsed.riskScore}/10</span>
                    </div>
                    <div className="w-full h-3 bg-card rounded-full overflow-hidden mb-4 border border-border">
                      <div 
                        className={`h-full transition-all duration-1000 ${parsed.riskScore > 7 ? 'bg-red-500' : parsed.riskScore > 4 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${parsed.riskScore * 10}%` }}
                      />
                    </div>
                    <p className="text-xs text-subtext leading-relaxed">{parsed.riskNote}</p>
                  </div>

                  {/* Psychology Alert */}
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">🧠</span>
                      <h4 className="font-black text-purple-400 uppercase tracking-widest text-sm">Psychology Alert</h4>
                    </div>
                    <p className="text-sm text-text/90 italic">"{parsed.psychAlert}"</p>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <p className="text-subtext font-bold uppercase tracking-widest text-xs">Unlock professional insights</p>
                  <p className="text-[10px] text-gray-500 mt-2 mb-6">Analyze patterns, risk management, and psychology</p>
                  <button 
                    onClick={getAnalysis}
                    className="bg-[#00d4aa] text-bg font-black px-8 py-4 rounded-2xl hover:scale-105 transition-transform"
                  >
                    START ANALYSIS
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border flex items-center justify-between">
              <div className="text-[10px] font-black text-subtext uppercase tracking-widest">
                Requests today: {requestCount}/3
              </div>
              {parsed && !loading && (
                <button 
                  onClick={getAnalysis}
                  disabled={requestCount >= 3}
                  className="text-[10px] font-black text-[#00d4aa] uppercase tracking-[0.2em] hover:opacity-80 disabled:opacity-30 flex items-center gap-2"
                >
                  🔄 Refresh Analysis
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

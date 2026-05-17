// src/components/AICoachPage.jsx
import { useState, useEffect, useRef } from "react";
import { fmt, getStreak } from "../utils/helpers";
import { calculateStats } from "../utils/calculations";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export default function AICoachPage({ trades = [], settings = {} }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am your AI Trading Mentor. I have loaded your journal data and analyzed your performance metrics. What would you like to review or improve today?",
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Suggested prompts
  const suggestions = [
    { label: "📊 Analyze my last 10 trades", prompt: "Perform a brutal, honest review of my last 10 logged trades. Highlight recurring mistakes or good entries." },
    { label: "🧠 Spot my psychological traps", prompt: "Review my trade notes, emotions, and followed plan metrics. What mental mistakes (like FOMO, Revenge, Greed) am I repeating?" },
    { label: "⚖️ Check my risk management", prompt: "Evaluate my risk efficiency. Am I maintaining a valid Risk:Reward ratio and cutting losses, or is a single big drawdown wiping me out?" },
    { label: "📅 Identify my worst session", prompt: "Analyze my performance based on day of week and session timing. Which day or hour should I stay away from the market?" },
  ];

  // Helper: Compile contextual system prompt
  const getContextPrompt = () => {
    if (trades.length === 0) return "No trades logged yet. Prompt the trader to log some trades first.";

    const stats = calculateStats(trades);
    const streaks = getStreak(trades);
    
    // Day analysis
    const dayMap = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 };
    trades.forEach(t => {
      const d = new Date(t.date).toLocaleDateString("en-US", { weekday: "short" });
      if (dayMap[d] !== undefined) dayMap[d] += t.pnl;
    });
    const sortedDays = Object.entries(dayMap).sort((a, b) => a[1] - b[1]); // worst to best

    const recentSummary = trades.slice(0, 10).map(t => ({
      date: t.date,
      market: t.market,
      side: t.side,
      entry: t.entryPrice,
      exit: t.exitPrice,
      pnl: t.pnl,
      setup: t.setup,
      mood: t.mood || t.emotionBefore || "Neutral",
      planFollowed: t.followedPlan === true ? "Yes" : "No",
      notes: t.notes || t.mistakeNotes || ""
    }));

    return `You are TradeLog OS's elite performance mentor and professional risk manager.
    You have absolute access to the trader's historical records. Speak in a direct, professional, data-backed manner. Do not beat around the bush; be brutally honest if they are overtrading or breaking rules.

    TRADER STATS OVERVIEW:
    - Total Trades Logged: ${stats.count}
    - Overall Win Rate: ${stats.wr}%
    - Profit Factor: ${stats.profitFactor}x
    - Expectancy: ${fmt(stats.expectancy, settings.currency)} per trade
    - Sharpe Ratio: ${stats.sharpe} (Sortino: ${stats.sortino})
    - Discipline Score: ${stats.disciplineScore}/100
    - Max Win Streak: ${streaks.maxWin} trades (Current streak: ${streaks.current} ${streaks.currentType})
    - Worst Day (PnL): ${sortedDays[0]?.[0]} (${fmt(sortedDays[0]?.[1] || 0, settings.currency)})
    - Best Day (PnL): ${sortedDays[sortedDays.length-1]?.[0]} (${fmt(sortedDays[sortedDays.length-1]?.[1] || 0, settings.currency)})

    RECENT 10 TRADES LEDGER:
    ${JSON.stringify(recentSummary, null, 2)}

    Ensure your feedback is concise, formatted in clear lists, and offers one actionable 'prescription' step for improvements.`;
  };

  const handleSend = async (textToSend) => {
    const userMsg = textToSend || input;
    if (!userMsg.trim()) return;

    // Add user message to state
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      if (!GEMINI_API_KEY) {
        throw new Error("Gemini API key is missing. Please set VITE_GEMINI_API_KEY in your .env file.");
      }

      // Gather contextual prompt and message thread
      const systemContext = getContextPrompt();
      
      const thread = messages
        .filter(m => m.role !== "system")
        .map(m => `${m.role === "user" ? "Trader" : "Mentor"}: ${m.content}`)
        .join("\n");

      const promptPayload = `${systemContext}\n\nCONVERSATION THREAD SO FAR:\n${thread}\nTrader: ${userMsg}\n\nMentor response:`;

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptPayload }] }]
        })
      });

      const result = await response.json();
      if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
        const replyText = result.candidates[0].content.parts[0].text;
        setMessages(prev => [...prev, { role: "assistant", content: replyText }]);
      } else {
        throw new Error("Invalid API response format");
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev, 
        { 
          role: "assistant", 
          content: `⚠️ Coach Offline: ${err.message || "Failed to contact analysis model. Please verify your internet connection and VITE_GEMINI_API_KEY."}` 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-[2.5rem] p-8 border-brand-primary/10 h-[calc(100vh-220px)] flex flex-col overflow-hidden max-w-5xl mx-auto">
      {/* Mentor Heading */}
      <div className="flex items-center gap-4 pb-6 border-b border-border mb-6">
        <div className="w-12 h-12 bg-brand-primary/15 rounded-2xl flex items-center justify-center text-2xl animate-pulse">🤖</div>
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-wider font-syne">AI Performance Mentor</h3>
          <p className="text-gray-500 text-[10px] font-bold tracking-[0.2em] uppercase">Context-Aware Real-time Analysis</p>
        </div>
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-2 mb-6 custom-scrollbar">
        {messages.map((m, i) => (
          <div 
            key={i} 
            className={`flex items-start gap-4 ${m.role === "user" ? "flex-row-reverse" : "flex-row"} animate-in fade-in duration-300`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
              m.role === "user" ? "bg-indigo-600/20 text-indigo-400" : "bg-brand-primary/15 text-brand-primary"
            }`}>
              {m.role === "user" ? "👤" : "🤖"}
            </div>
            
            {/* Balloon */}
            <div className={`max-w-[75%] px-5 py-4 rounded-[1.5rem] text-sm leading-relaxed border ${
              m.role === "user" 
                ? "bg-indigo-600/10 border-indigo-600/20 text-white rounded-tr-sm" 
                : "bg-white/3 border-white/5 text-gray-300 rounded-tl-sm"
            }`}>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-4 animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-brand-primary/15 text-brand-primary flex items-center justify-center text-xs font-black">🤖</div>
            <div className="bg-white/3 border border-white/5 px-5 py-4 rounded-[1.5rem] rounded-tl-sm text-sm text-subtext">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-brand-primary rounded-full animate-bounce delay-100" />
                <div className="w-2.5 h-2.5 bg-brand-primary rounded-full animate-bounce delay-200" />
                <div className="w-2.5 h-2.5 bg-brand-primary rounded-full animate-bounce delay-300" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Grid */}
      {messages.length === 1 && (
        <div className="mb-6 animate-in slide-in-from-bottom-4 duration-500">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Quick Analysis Prompts</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestions.map((s, idx) => (
              <button 
                key={idx}
                onClick={() => handleSend(s.prompt)}
                disabled={loading}
                className="p-4 bg-white/5 border border-white/5 hover:bg-brand-primary/10 hover:border-brand-primary/20 rounded-2xl text-left text-xs font-bold text-gray-300 hover:text-brand-primary transition-all disabled:opacity-50"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Box */}
      <div className="flex items-center gap-3 bg-white/3 border border-white/10 rounded-2xl px-5 py-3 focus-within:border-brand-primary transition-all">
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask your mentor anything about your performance..."
          className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-gray-600"
          onKeyDown={e => {
            if (e.key === "Enter" && !loading) handleSend();
          }}
          disabled={loading}
        />
        <button 
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="px-5 py-2.5 bg-brand-primary hover:scale-105 active:scale-95 text-bg font-black rounded-xl text-xs uppercase tracking-widest transition-all disabled:opacity-20 disabled:scale-100"
        >
          Send
        </button>
      </div>
    </div>
  );
}

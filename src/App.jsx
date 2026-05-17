// src/App.jsx
import { useState, useEffect } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { dbService } from "./db";

// Components
import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";
import TradeHistory from "./components/TradeHistory";
import Analytics from "./components/Analytics";
import ReviewPage from "./components/ReviewPage";
import SettingsPage from "./components/SettingsPage";
import Calendar from "./components/Calendar";
import AddTradeForm from "./components/AddTradeForm";
import AICoach from "./components/AICoach";

// Upgraded Elite Components
import AICoachPage from "./components/AICoachPage";
import PsychologyPage from "./components/PsychologyPage";
import CommandPalette from "./components/ui/CommandPalette";
import { ToastContainer, toast } from "./components/ui/Toast";

// Utils
import { DEFAULT_SETTINGS, storage, uid } from "./utils/helpers";

export default function App() {
  const [user, setUser] = useState(storage.get("user", null));
  const [trades, setTrades] = useState(storage.get("trades", []));
  const [settings, setSettings] = useState(storage.get("settings", DEFAULT_SETTINGS));
  const [page, setPage] = useState("dashboard");
  const [showAdd, setShowAdd] = useState(false);
  const [editTrade, setEditTrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Theme Logic
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return 'dark'; // Default to dark
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    toast.info(`Theme toggled to ${nextTheme === 'dark' ? 'Dark Void' : 'Light Clean'} mode`);
  };

  // Keyboard Shortcuts Hook
  useEffect(() => {
    function handleGlobalKeys(e) {
      // Avoid triggering shortcuts if typing in input fields
      const activeEl = document.activeElement;
      const isInput = activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.hasAttribute("contenteditable");
      
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      } else if (e.key === "n" && !isInput && !showAdd) {
        e.preventDefault();
        setShowAdd(true);
        toast.info("Opening trade entry sheet");
      }
    }

    document.addEventListener("keydown", handleGlobalKeys);
    return () => document.removeEventListener("keydown", handleGlobalKeys);
  }, [showAdd]);

  // Sync with Firebase
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u ? { email: u.email, name: u.displayName || "Trader", id: u.uid } : null);
      setLoading(false);
    });

    let unsubTrades;
    if (user?.id) {
      unsubTrades = dbService.syncTrades(user.id, (data) => {
        setTrades(data);
        storage.set("trades", data);
      });
      dbService.getSettings(user.id).then(s => s && setSettings(s));
    }

    return () => {
      unsubAuth();
      if (unsubTrades) unsubTrades();
    };
  }, [user?.id]);

  const handleSaveTrade = async (trade) => {
    if (!user) return;
    const isEdit = trades.find(t => t.id === trade.id);
    const next = isEdit ? trades.map(t => t.id === trade.id ? trade : t) : [trade, ...trades];
    setTrades(next);
    await dbService.saveTrade(user.id, trade);
  };

  const handleDeleteTrade = async (id) => {
    if (!user) return;
    setTrades(trades.filter(t => t.id !== id));
    await dbService.deleteTrade(user.id, id);
    toast.success("Trade entry successfully deleted");
  };

  const handleUpdateSettings = async (s) => {
    if (!user) return;
    setSettings(s);
    await dbService.saveSettings(user.id, s);
    toast.success("Configuration successfully updated");
  };

  // Command Palette Handler
  const handleCommandPaletteAction = (actionId, data) => {
    if (actionId === "new-entry") {
      setShowAdd(true);
    } else if (actionId === "toggle-theme") {
      toggleTheme();
    } else if (actionId === "view-trade" && data) {
      setEditTrade(data);
      setShowAdd(true);
    } else if (actionId === "seed-data") {
      // Trigger demo seeding
      if (window.confirm("Seed 5 professional demo trades to test dashboards?")) {
        const demoSetups = ["Breakout", "Mean Reversion", "Trend Following"];
        const demoMarkets = settings.markets.length > 0 ? settings.markets : ["Nifty", "Crude Oil", "Gold"];
        
        for (let i = 0; i < 5; i++) {
          const isWin = Math.random() < 0.6;
          const pnl = isWin ? Math.round(Math.random() * 5000 + 2000) : -Math.round(Math.random() * 3000 + 1000);
          const demoTrade = {
            id: uid(),
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
            market: demoMarkets[Math.floor(Math.random() * demoMarkets.length)],
            setup: demoSetups[Math.floor(Math.random() * demoSetups.length)],
            side: Math.random() < 0.5 ? "Buy" : "Sell",
            entryPrice: 1000 + Math.round(Math.random() * 100),
            exitPrice: 1050 + Math.round(Math.random() * 100),
            lotSize: 10,
            pnl,
            followedPlan: Math.random() < 0.8,
            mood: isWin ? "🔥 Excited" : "😰 Anxious",
            tags: ["Demo", isWin ? "Profit" : "Loss"],
            notes: "Demo mock trade seeded via command palette."
          };
          handleSaveTrade(demoTrade);
        }
        toast.success("Successfully seeded 5 professional demo trades!");
      }
    }
  };

  const nav = [
    { id: "dashboard", label: "Terminal", icon: "📟" },
    { id: "history", label: "Ledger", icon: "📑" },
    { id: "analytics", label: "Metrics", icon: "🔬" },
    { id: "calendar", label: "Journal", icon: "🗓️" },
    { id: "mentor", label: "Mentor", icon: "🤖" },
    { id: "mindset", label: "Mindset", icon: "🧠" },
    { id: "review", label: "Review", icon: "👁️‍quoteright" },
    { id: "settings", label: "Config", icon: "⚙️" },
  ];

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary">Syncing Terminal...</p>
      </div>
    </div>
  );

  if (!user) return <AuthPage onLogin={setUser} />;

  return (
    <div className="min-h-screen bg-bg text-text flex font-sans selection:bg-brand-primary/30">
      
      {/* Toast Notifications */}
      <ToastContainer />

      {/* Global Command Palette */}
      <CommandPalette 
        isOpen={showCommandPalette} 
        onClose={() => setShowCommandPalette(false)}
        onNavigate={setPage}
        onAction={handleCommandPaletteAction}
        trades={trades}
        settings={settings}
      />

      {/* Theme Toggle Button */}
      <button className="theme-toggle-pill" onClick={toggleTheme}>
        <div className="thumb">
          {theme === 'dark' ? '🌙' : '☀️'}
        </div>
      </button>

      {/* Sidebar Navigation - Desktop */}
      <aside className="hidden md:flex w-64 border-r border-border flex-col p-6 z-20 bg-bg">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 9l-5 5-3-3-4 4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-extrabold tracking-tighter">TradeLog<span className="text-brand-primary">.</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          {nav.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                page === n.id ? "bg-brand-primary/10 text-brand-primary font-black" : "text-subtext hover:text-text hover:bg-card"
              }`}>
              <span className="text-xl grayscale group-hover:grayscale-0 transition-all">{n.icon}</span>
              <span className="text-[11px] font-black uppercase tracking-widest">{n.label}</span>
              {page === n.id && <div className="ml-auto w-1.5 h-1.5 bg-brand-primary rounded-full shadow-[0_0_10px_rgba(0,212,170,0.8)]" />}
            </button>
          ))}
        </nav>

        {/* Global Shortcut Help Chip */}
        <div className="my-4 px-4 py-3 bg-white/3 border border-white/5 rounded-2xl text-[10px] text-gray-500 font-bold uppercase tracking-wider">
          💡 Press <span className="text-brand-primary">⌘K</span> to search
        </div>

        <div className="mt-auto space-y-4 pt-6 border-t border-border">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-primary to-brand-secondary p-0.5 animate-pulse">
              <div className="w-full h-full rounded-full bg-bg flex items-center justify-center text-xs font-black">
                {user.name[0]}
              </div>
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-black truncate">{user.name}</p>
              <p className="text-[9px] text-subtext uppercase tracking-widest font-bold">Pro Trader</p>
            </div>
          </div>
          <button onClick={() => signOut(auth)} 
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-400 hover:bg-red-400/5 transition-all group">
            <span className="text-xl">🚪</span>
            <span className="text-[11px] font-black uppercase tracking-widest">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg/90 backdrop-blur-xl border-t border-border px-6 py-4 flex justify-between items-center z-50 overflow-x-auto gap-4 custom-scrollbar">
        {nav.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)}
            className={`flex flex-col items-center gap-1 transition-all shrink-0 ${page === n.id ? "text-brand-primary" : "text-subtext"}`}>
            <span className="text-xl">{n.icon}</span>
            <span className="text-[8px] font-black uppercase tracking-widest">{n.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto relative bg-bg pb-24 md:pb-0">
        <div className="max-w-7xl mx-auto p-6 md:p-12">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <p className="text-brand-primary text-[10px] font-black uppercase tracking-[0.3em] mb-1">Terminal / {page}</p>
              <h2 className="text-4xl font-extrabold tracking-tight">
                {nav.find(n => n.id === page)?.label} View
              </h2>
            </div>
            <button onClick={() => setShowAdd(true)}
              className="px-8 py-4 btn-premium rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3">
              <span>+</span> New Entry
            </button>
          </header>

          {/* Page Content */}
          <div key={page} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {page === "dashboard" && <Dashboard trades={trades} settings={settings} setPage={setPage} />}
            {page === "history" && <TradeHistory trades={trades} onEdit={t => { setEditTrade(t); setShowAdd(true); }} onDelete={handleDeleteTrade} settings={settings} onSave={handleSaveTrade} />}
            {page === "analytics" && <Analytics trades={trades} settings={settings} />}
            {page === "calendar" && <Calendar trades={trades} settings={settings} />}
            {page === "mentor" && <AICoachPage trades={trades} settings={settings} />}
            {page === "mindset" && <PsychologyPage trades={trades} settings={settings} />}
            {page === "review" && <ReviewPage trades={trades} settings={settings} />}
            {page === "settings" && <SettingsPage settings={settings} onUpdate={handleUpdateSettings} trades={trades} onSeed={handleSaveTrade} onPurge={handleDeleteTrade} />}
          </div>
        </div>

        {/* Floating Mini AI Coach Trigger */}
        <AICoach trades={trades} userId={user?.id} settings={settings} />

        {showAdd && (
          <AddTradeForm 
            onSave={handleSaveTrade} 
            editTrade={editTrade} 
            onClose={() => { setShowAdd(false); setEditTrade(null); }} 
            settings={settings} 
          />
        )}
      </main>
    </div>
  );
}

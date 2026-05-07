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

// Utils
import { DEFAULT_SETTINGS, storage } from "./utils/helpers";

export default function App() {
  const [user, setUser] = useState(storage.get("user", null));
  const [trades, setTrades] = useState(storage.get("trades", []));
  const [settings, setSettings] = useState(storage.get("settings", DEFAULT_SETTINGS));
  const [page, setPage] = useState("dashboard");
  const [showAdd, setShowAdd] = useState(false);
  const [editTrade, setEditTrade] = useState(null);
  const [loading, setLoading] = useState(true);

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
  };

  const handleUpdateSettings = async (s) => {
    if (!user) return;
    setSettings(s);
    await dbService.saveSettings(user.id, s);
  };

  const nav = [
    { id: "dashboard", label: "Terminal", icon: "📟" },
    { id: "history", label: "Ledger", icon: "📑" },
    { id: "analytics", label: "Metrics", icon: "🔬" },
    { id: "calendar", label: "Journal", icon: "🗓️" },
    { id: "review", label: "Review", icon: "👁️‍🗨️" },
    { id: "settings", label: "Config", icon: "⚙️" },
  ];

  if (loading) return (
    <div className="min-h-screen bg-[#07090f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#00d4aa]/20 border-t-[#00d4aa] rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00d4aa]">Syncing Terminal...</p>
      </div>
    </div>
  );

  if (!user) return <AuthPage onLogin={setUser} />;

  return (
    <div className="min-h-screen bg-[#07090f] text-white flex font-sans selection:bg-[#00d4aa]/30">
      {/* Sidebar Navigation - Desktop */}
      <aside className="hidden md:flex w-64 border-r border-white/5 flex-col p-6 z-20 bg-[#07090f]">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-8 h-8 bg-[#00d4aa] rounded-lg flex items-center justify-center text-white shadow-lg shadow-[#00d4aa]/20">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 9l-5 5-3-3-4 4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tighter font-syne">TradeLog<span className="text-[#00d4aa]">.</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          {nav.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                page === n.id ? "bg-[#00d4aa]/10 text-[#00d4aa]" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}>
              <span className="text-xl grayscale group-hover:grayscale-0 transition-all">{n.icon}</span>
              <span className="text-[11px] font-black uppercase tracking-widest">{n.label}</span>
              {page === n.id && <div className="ml-auto w-1.5 h-1.5 bg-[#00d4aa] rounded-full shadow-[0_0_10px_rgba(0,212,170,0.8)]" />}
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-4 pt-6 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00d4aa] to-[#f0c040] p-0.5">
              <div className="w-full h-full rounded-full bg-[#07090f] flex items-center justify-center text-xs font-black">
                {user.name[0]}
              </div>
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-black truncate">{user.name}</p>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Pro Trader</p>
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#07090f]/80 backdrop-blur-xl border-t border-white/5 px-6 py-4 flex justify-between items-center z-50">
        {nav.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)}
            className={`flex flex-col items-center gap-1 transition-all ${page === n.id ? "text-[#00d4aa]" : "text-gray-500"}`}>
            <span className="text-xl">{n.icon}</span>
            <span className="text-[8px] font-black uppercase tracking-widest">{n.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto relative bg-[#07090f] pb-24 md:pb-0">
        <div className="max-w-7xl mx-auto p-6 md:p-12">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <p className="text-[#00d4aa] text-[10px] font-black uppercase tracking-[0.3em] mb-1">Terminal / {page}</p>
              <h2 className="text-4xl font-extrabold font-syne tracking-tight">
                {nav.find(n => n.id === page)?.label} View
              </h2>
            </div>
            <button onClick={() => setShowAdd(true)}
              className="px-8 py-4 btn-premium rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3">
              <span>+</span> New Entry
            </button>
          </header>

          {/* Page Content */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {page === "dashboard" && <Dashboard trades={trades} settings={settings} setPage={setPage} />}
            {page === "history" && <TradeHistory trades={trades} onEdit={t => { setEditTrade(t); setShowAdd(true); }} onDelete={handleDeleteTrade} settings={settings} onSave={handleSaveTrade} />}
            {page === "analytics" && <Analytics trades={trades} settings={settings} />}
            {page === "calendar" && <Calendar trades={trades} settings={settings} />}
            {page === "review" && <ReviewPage trades={trades} settings={settings} />}
            {page === "settings" && <SettingsPage settings={settings} onUpdate={handleUpdateSettings} trades={trades} onSeed={handleSaveTrade} onPurge={handleDeleteTrade} />}
          </div>
        </div>

        {/* Global Components */}
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

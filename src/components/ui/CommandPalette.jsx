// src/components/ui/CommandPalette.jsx
import { useState, useEffect, useRef } from "react";
import { fmtDate, fmt } from "../../utils/helpers";

export default function CommandPalette({ isOpen, onClose, onNavigate, onAction, trades = [], settings = {} }) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Core navigation items
  const routeItems = [
    { type: "nav", id: "dashboard", label: "Go to Terminal (Dashboard)", icon: "📟" },
    { type: "nav", id: "history", label: "Go to Ledger (History)", icon: "📑" },
    { type: "nav", id: "analytics", label: "Go to Metrics (Analytics)", icon: "🔬" },
    { type: "nav", id: "calendar", label: "Go to Journal (Calendar)", icon: "🗓️" },
    { type: "nav", id: "mentor", label: "Go to Mentor (AI Coach)", icon: "🤖" },
    { type: "nav", id: "mindset", label: "Go to Mindset (Psychology)", icon: "🧠" },
    { type: "nav", id: "review", label: "Go to Review (Reflection)", icon: "👁️‍quoteright" },
    { type: "nav", id: "settings", label: "Go to Config (Settings)", icon: "⚙️" },
  ];

  const actionItems = [
    { type: "action", id: "new-entry", label: "Create New Entry", icon: "➕" },
    { type: "action", id: "toggle-theme", label: "Toggle Dark/Light Mode", icon: "🌓" },
    { type: "action", id: "seed-data", label: "Seed Demo Data", icon: "⚡" },
  ];

  // Filter items based on search
  const filteredRoutes = routeItems.filter(item => 
    item.label.toLowerCase().includes(search.toLowerCase())
  );
  
  const filteredActions = actionItems.filter(item => 
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTrades = trades
    .filter(t => 
      t.market.toLowerCase().includes(search.toLowerCase()) ||
      t.setup.toLowerCase().includes(search.toLowerCase()) ||
      (t.tags && t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())))
    )
    .slice(0, 5) // Limit to 5 results
    .map(t => ({
      type: "trade",
      id: t.id,
      label: `${t.market} - ${t.setup} (${t.side})`,
      sub: `${fmtDate(t.date)} • ${t.pnl >= 0 ? "+" : ""}${fmt(t.pnl, settings.currency || "₹")}`,
      icon: t.pnl >= 0 ? "🟢" : "🔴",
      trade: t
    }));

  const allItems = [...filteredRoutes, ...filteredActions, ...filteredTrades];

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e) {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, allItems.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + allItems.length) % Math.max(1, allItems.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (allItems[selectedIndex]) {
          handleSelect(allItems[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, allItems, selectedIndex]);

  const handleSelect = (item) => {
    if (item.type === "nav") {
      onNavigate(item.id);
    } else if (item.type === "action") {
      onAction(item.id);
    } else if (item.type === "trade") {
      onAction("view-trade", item.trade);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999] flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-200">
      <div 
        ref={containerRef}
        className="w-full max-w-xl bg-card border border-border rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[50vh] animate-in slide-in-from-top-8 duration-300"
      >
        {/* Search Input */}
        <div className="flex items-center px-6 py-5 border-b border-border bg-white/3">
          <span className="text-xl mr-4 grayscale text-gray-500">🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search trades..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent border-none text-white text-base focus:outline-none placeholder-gray-600 font-medium"
          />
          <span className="text-[10px] bg-white/10 px-2.5 py-1 rounded-lg text-subtext font-black uppercase tracking-widest">ESC</span>
        </div>

        {/* Results List */}
        <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
          {allItems.length === 0 ? (
            <div className="py-8 text-center text-subtext text-xs uppercase font-bold tracking-widest">
              No matching commands or trades found
            </div>
          ) : (
            <div className="space-y-4">
              {/* Routes & Actions Group */}
              {allItems.some(i => i.type !== "trade") && (
                <div>
                  <div className="px-3 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">System Commands</div>
                  <div className="space-y-1">
                    {allItems.map((item, idx) => {
                      if (item.type === "trade") return null;
                      const active = idx === selectedIndex;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`
                            w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-150
                            ${active ? "bg-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-[0_0_15px_rgba(0,212,170,0.05)]" : "text-subtext hover:text-text border border-transparent"}
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{item.icon}</span>
                            <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                          </div>
                          {active && (
                            <span className="text-[10px] text-brand-primary font-bold uppercase tracking-wider">⏎ Execute</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Trades Group */}
              {allItems.some(i => i.type === "trade") && (
                <div className="pt-2">
                  <div className="px-3 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Trade History</div>
                  <div className="space-y-1">
                    {allItems.map((item, idx) => {
                      if (item.type !== "trade") return null;
                      const active = idx === selectedIndex;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`
                            w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-left transition-all duration-150
                            ${active ? "bg-brand-primary/10 text-brand-primary border border-brand-primary/20" : "text-subtext hover:text-text border border-transparent"}
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{item.icon}</span>
                            <div>
                              <p className="text-xs font-black text-text group-hover:text-brand-primary">{item.label}</p>
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">{item.sub}</p>
                            </div>
                          </div>
                          {active && (
                            <span className="text-[10px] text-brand-primary font-bold uppercase tracking-wider">⏎ Inspect</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-bg/50 px-6 py-4 border-t border-border flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>TradeLog OS v1.0.0</span>
        </div>
      </div>
    </div>
  );
}

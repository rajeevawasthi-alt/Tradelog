// src/components/ui/Toast.jsx
import { useState, useEffect } from "react";

// Event channel for toast notifications
const listeners = new Set();

export const toast = {
  subscribe: (cb) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  show: (message, type = "info", duration = 4000) => {
    const id = Math.random().toString(36).slice(2, 9);
    listeners.forEach(cb => cb({ id, message, type, duration }));
  },
  success: (msg, dur) => toast.show(msg, "success", dur),
  error: (msg, dur) => toast.show(msg, "error", dur),
  info: (msg, dur) => toast.show(msg, "info", dur),
  insight: (msg, dur) => toast.show(msg, "insight", dur),
};

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe((newToast) => {
      setToasts(prev => [...prev, newToast]);

      // Auto dismiss
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, newToast.duration);
    });

    return () => unsubscribe();
  }, []);

  const getStyleClasses = (type) => {
    switch (type) {
      case "success":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_8px_32px_rgba(16,185,129,0.15)]";
      case "error":
        return "bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_8px_32px_rgba(239,68,68,0.15)]";
      case "insight":
        return "bg-purple-500/10 border-purple-500/20 text-purple-400 shadow-[0_8px_32px_rgba(139,92,246,0.15)]";
      case "info":
      default:
        return "bg-white/5 border-white/10 text-white shadow-[0_8px_32px_rgba(255,255,255,0.05)]";
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "success": return "🟢";
      case "error": return "🔴";
      case "insight": return "🧠";
      case "info":
      default: return "ℹ️";
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map(t => (
        <div 
          key={t.id}
          className={`
            pointer-events-auto flex items-center gap-4 px-5 py-4 rounded-2xl border backdrop-blur-xl 
            animate-in slide-in-from-bottom-4 fade-in duration-300 transition-all hover:scale-[1.02]
            ${getStyleClasses(t.type)}
          `}
        >
          <div className="text-xl flex-shrink-0">{getIcon(t.type)}</div>
          <div className="flex-1">
            {t.type === "insight" && (
              <p className="text-[9px] font-black uppercase tracking-wider text-purple-400 mb-0.5">AI Engine Insight</p>
            )}
            <p className="text-xs font-bold leading-relaxed">{t.message}</p>
          </div>
          <button 
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            className="text-[10px] text-gray-500 hover:text-white uppercase font-bold pl-2 transition-colors"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

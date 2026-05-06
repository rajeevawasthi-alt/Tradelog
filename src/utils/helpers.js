export const DEFAULT_SETTINGS = {
  markets: ["Nifty", "BankNifty", "Crypto", "Forex", "Stocks", "Commodities"],
  setups: ["Breakout", "Pullback", "Reversal", "Scalping", "Trend Follow", "Range"],
  conditions: ["Trending", "Sideways", "Volatile"],
  indicators: ["RSI", "EMA", "VWAP", "Volume", "Support/Resistance", "MACD", "Bollinger Bands", "Price Action"],
  emotions: ["Calm", "Confident", "Anxious", "Greedy", "FOMO", "Revenge", "Disciplined", "Uncertain"],
  tags: ["High Quality", "Mistake", "Best Setup", "Learning", "Overtraded", "Perfect Entry"],
  currency: "₹",
  brokeragePerOrder: 20, // Default for most Indian brokers
  monthlyGoal: 50000,
  theme: "dark",
  checklist: ["Plan followed?", "Risk-reward valid?", "No FOMO?", "Market context okay?"],
};

export const COLORS = {
  profit: "#00d4aa",
  loss: "#ef4444",
  neutral: "#6366f1",
  gold: "#f0c040",
  cyan: "#06b6d4",
  purple: "#8b5cf6",
};

export const storage = {
  get: (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
};

export const calcBrokerage = (t, settings) => {
  const perOrder = settings.brokeragePerOrder || 0;
  // Simple estimation: 1 entry order + N exit orders
  const exitCount = t.exits?.length || (t.exitPrice ? 1 : 0);
  if (exitCount === 0) return 0;
  return (1 + exitCount) * perOrder;
};

export const calcPnL = (t, settings = {}) => {
  if (!t.entryPrice || !t.lotSize) return 0;
  
  let totalPnL = 0;
  if (t.exits && t.exits.length > 0) {
    t.exits.forEach(ex => {
      if (!ex.price || !ex.qty) return;
      const diff = t.side === "Buy" ? ex.price - t.entryPrice : t.entryPrice - ex.price;
      totalPnL += diff * ex.qty;
    });
  } else if (t.exitPrice) {
    const diff = t.side === "Buy" ? t.exitPrice - t.entryPrice : t.entryPrice - t.exitPrice;
    totalPnL = diff * t.lotSize;
  } else {
    return 0;
  }

  const brokerage = calcBrokerage(t, settings);
  return +(totalPnL - brokerage).toFixed(2);
};

export const calcRR = (t) => {
  if (!t.entryPrice || !t.stopLoss || !t.target) return null;
  const risk = Math.abs(t.entryPrice - t.stopLoss);
  const reward = Math.abs(t.target - t.entryPrice);
  if (!risk) return null;
  return +(reward / risk).toFixed(2);
};

export const fmt = (n, cur = "₹") => {
  const abs = Math.abs(n);
  const s = abs >= 1000 ? `${cur}${(abs / 1000).toFixed(1)}k` : `${cur}${abs.toFixed(0)}`;
  return n < 0 ? `-${s}` : s;
};

export const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export const calcDrawdown = (trades) => {
  if (!trades.length) return [];
  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  let peak = 0;
  let currentCum = 0;
  return sorted.map(t => {
    currentCum += t.pnl;
    if (currentCum > peak) peak = currentCum;
    const dd = peak - currentCum;
    return { date: fmtDate(t.date), drawdown: +dd.toFixed(2), cum: +currentCum.toFixed(2) };
  });
};

export const getStreak = (trades) => {
  if (!trades.length) return { win: 0, loss: 0, current: 0 };
  const sorted = [...trades].sort((a, b) => new Date(b.date) - new Date(a.date));
  let win = 0, loss = 0, current = 0, type = null;

  // Max streaks
  let maxW = 0, maxL = 0, curW = 0, curL = 0;
  [...sorted].reverse().forEach(t => {
    if (t.pnl > 0) {
      curW++; curL = 0;
      if (curW > maxW) maxW = curW;
    } else if (t.pnl < 0) {
      curL++; curW = 0;
      if (curL > maxL) maxL = curL;
    }
  });

  // Current streak
  for (const t of sorted) {
    if (t.pnl === 0) continue;
    if (type === null) type = t.pnl > 0 ? "win" : "loss";
    if ((t.pnl > 0 && type === "win") || (t.pnl < 0 && type === "loss")) {
      current++;
    } else break;
  }

  return { maxWin: maxW, maxLoss: maxL, current, currentType: type };
};

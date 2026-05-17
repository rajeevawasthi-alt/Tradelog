// src/utils/calculations.js

/**
 * Calculates standard deviation of a series of numbers
 */
export function calculateStdDev(values, mean) {
  if (values.length <= 1) return 0;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Calculates downside deviation (for Sortino ratio)
 * Only considers negative returns
 */
export function calculateDownsideDev(values, mean) {
  const negativeValues = values.filter(val => val < 0);
  if (negativeValues.length <= 1) return 0;
  
  // For Sortino downside deviation, we sum squared differences of negative values from 0 (or target)
  const sumSq = negativeValues.reduce((sum, val) => sum + Math.pow(val, 2), 0);
  return Math.sqrt(sumSq / values.length);
}

/**
 * Compiles a comprehensive suite of stats for the given trades
 */
export function calculateStats(trades) {
  if (!trades || trades.length === 0) {
    return {
      total: 0,
      wr: 0,
      wins: 0,
      losses: 0,
      count: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      expectancy: 0,
      sharpe: 0,
      sortino: 0,
      disciplineScore: 100,
    };
  }

  const pnlList = trades.map(t => t.pnl || 0);
  const total = pnlList.reduce((s, p) => s + p, 0);
  const wins = pnlList.filter(p => p > 0);
  const losses = pnlList.filter(p => p < 0);

  const totalProfit = wins.reduce((s, p) => s + p, 0);
  const totalLoss = Math.abs(losses.reduce((s, p) => s + p, 0));

  const wr = (wins.length / trades.length) * 100;
  const avgWin = wins.length > 0 ? totalProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? totalLoss / losses.length : 0;

  const profitFactor = totalLoss === 0 ? totalProfit : totalProfit / totalLoss;
  
  // Sharpe & Sortino Calculations
  const meanPnL = total / trades.length;
  const stdDev = calculateStdDev(pnlList, meanPnL);
  const downsideDev = calculateDownsideDev(pnlList, meanPnL);

  // Sharpe Ratio (ratio of mean profit to standard deviation of profits)
  const sharpe = stdDev === 0 ? 0 : meanPnL / stdDev;
  
  // Sortino Ratio (ratio of mean profit to downside deviation)
  const sortino = downsideDev === 0 ? 0 : meanPnL / downsideDev;

  // Expectancy = (Win Rate * Avg Win) - (Loss Rate * Avg Loss)
  const lossRate = 1 - (wr / 100);
  const expectancy = ((wr / 100) * avgWin) - (lossRate * avgLoss);

  // Discipline Score
  let totalDisciplineScore = 0;
  trades.forEach(t => {
    let score = 100;
    if (t.followedPlan === false) score -= 40;
    if (t.followedPlan === true) score += 10; // reward plan followers
    
    // Deduct points for bad psychology
    const negativeEmotions = ["Greedy", "FOMO", "Revenge", "Anxious", "😡 Angry", "😰 Anxious", "🔥 Excited"];
    const tEmotions = Array.isArray(t.tags) ? t.tags : [];
    if (t.emotionBefore && negativeEmotions.some(e => t.emotionBefore.includes(e))) score -= 15;
    if (t.emotionDuring && negativeEmotions.some(e => t.emotionDuring.includes(e))) score -= 15;
    if (t.mood && negativeEmotions.some(e => t.mood.includes(e))) score -= 15;
    
    if (t.tags && t.tags.includes("Mistake")) score -= 20;
    if (t.tags && t.tags.includes("Overtraded")) score -= 20;

    totalDisciplineScore += Math.max(0, Math.min(100, score));
  });
  
  const disciplineScore = Math.round(totalDisciplineScore / trades.length);

  return {
    total,
    wr: wr.toFixed(1),
    wins: wins.length,
    losses: losses.length,
    count: trades.length,
    avgWin: +avgWin.toFixed(2),
    avgLoss: +avgLoss.toFixed(2),
    profitFactor: +profitFactor.toFixed(2),
    expectancy: +expectancy.toFixed(2),
    sharpe: +sharpe.toFixed(2),
    sortino: +sortino.toFixed(2),
    disciplineScore: Math.min(100, Math.max(0, disciplineScore)),
  };
}

/**
 * Monte Carlo Simulation
 * Generates future equity curve projections based on historical metrics
 */
export function generateMonteCarlo(trades, startEquity = 100000, numSteps = 50, numPaths = 5) {
  if (!trades || trades.length < 5) {
    // Generate default mock curves if there is insufficient trade history
    const mockPaths = [];
    for (let path = 0; path < numPaths; path++) {
      const data = [{ step: 0, equity: startEquity }];
      let eq = startEquity;
      for (let step = 1; step <= numSteps; step++) {
        const change = (Math.random() - 0.45) * 2000; // slightly positive drift
        eq = Math.max(0, +(eq + change).toFixed(2));
        data.push({ step, equity: eq });
      }
      mockPaths.push(data);
    }
    return mockPaths;
  }

  const pnlList = trades.map(t => t.pnl || 0);
  const wins = pnlList.filter(p => p > 0);
  const losses = pnlList.filter(p => p < 0);
  const winRate = wins.length / trades.length;

  const avgWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 1000;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length) : 800;

  const paths = [];

  for (let path = 0; path < numPaths; path++) {
    const data = [{ step: 0, equity: startEquity }];
    let currentEquity = startEquity;

    for (let step = 1; step <= numSteps; step++) {
      const isWin = Math.random() < winRate;
      let tradeResult = 0;

      if (isWin) {
        // Random win within ±20% of avgWin
        tradeResult = avgWin * (0.8 + Math.random() * 0.4);
      } else {
        // Random loss within ±20% of avgLoss
        tradeResult = -avgLoss * (0.8 + Math.random() * 0.4);
      }

      currentEquity = +(currentEquity + tradeResult).toFixed(2);
      if (currentEquity < 0) currentEquity = 0;

      data.push({ step, equity: currentEquity });
    }
    paths.push(data);
  }

  return paths;
}

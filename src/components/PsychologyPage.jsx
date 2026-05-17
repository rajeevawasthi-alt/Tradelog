// src/components/PsychologyPage.jsx
import { useMemo, useState, useEffect, useRef } from "react";
import { fmt } from "../utils/helpers";
import { calculateStats } from "../utils/calculations";

export default function PsychologyPage({ trades = [], settings = {} }) {
  const [activeTab, setActiveTab] = useState("discipline"); // discipline | achievements
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Compute stats
  const stats = useMemo(() => calculateStats(trades), [trades]);

  // Aggregate Emotion performance
  const emotionPerf = useMemo(() => {
    const emotionMap = {};
    
    trades.forEach(t => {
      // Gather all possible emotion sources: t.mood, t.emotionBefore, t.emotionDuring
      const emotionsList = [];
      if (t.mood) emotionsList.push(t.mood);
      if (t.emotionBefore) emotionsList.push(t.emotionBefore);
      if (t.emotionDuring) emotionsList.push(t.emotionDuring);

      // Clean emojis from emotion text for aggregation key
      const cleanEmotions = emotionsList.map(e => e.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim());
      
      const uniqueEmotions = [...new Set(cleanEmotions)].filter(Boolean);

      uniqueEmotions.forEach(e => {
        if (!emotionMap[e]) {
          emotionMap[e] = { wins: 0, total: 0, pnl: 0 };
        }
        emotionMap[e].total++;
        if (t.pnl > 0) emotionMap[e].wins++;
        emotionMap[e].pnl += t.pnl;
      });
    });

    return Object.entries(emotionMap).map(([name, data]) => ({
      name,
      wr: +((data.wins / data.total) * 100).toFixed(0),
      total: data.total,
      pnl: data.pnl
    })).sort((a, b) => b.wr - a.wr);
  }, [trades]);

  // Achievements Definition
  const achievements = useMemo(() => {
    const wins = trades.filter(t => t.pnl > 0);
    const planFollowedCount = trades.filter(t => t.followedPlan === true).length;
    
    // Streaks
    let currentWinStreak = 0;
    let maxWinStreak = 0;
    const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    sorted.forEach(t => {
      if (t.pnl > 0) {
        currentWinStreak++;
        if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
      } else if (t.pnl < 0) {
        currentWinStreak = 0;
      }
    });

    return [
      {
        id: "first_step",
        name: "First Step",
        desc: "Logged your first trade entry",
        icon: "🎯",
        unlocked: trades.length >= 1,
        color: "from-teal-400 to-emerald-500"
      },
      {
        id: "streak_3",
        name: "Strike Three",
        desc: "Earned a 3-trade win streak",
        icon: "⚡",
        unlocked: maxWinStreak >= 3,
        color: "from-amber-400 to-orange-500"
      },
      {
        id: "streak_5",
        name: "Unstoppable",
        desc: "Earned a 5-trade win streak",
        icon: "🔥",
        unlocked: maxWinStreak >= 5,
        color: "from-red-500 to-pink-500"
      },
      {
        id: "discipline_champion",
        name: "Zen Master",
        desc: "Achieved >= 90% discipline score over 5+ trades",
        icon: "🧘",
        unlocked: trades.length >= 5 && stats.disciplineScore >= 90,
        color: "from-indigo-400 to-purple-500"
      },
      {
        id: "professional",
        name: "Elite Ledger",
        desc: "Logged at least 20 trades in total",
        icon: "🏆",
        unlocked: trades.length >= 20,
        color: "from-cyan-400 to-blue-500"
      },
      {
        id: "plan_follower",
        name: "System Follower",
        desc: "Followed your strategy rules 10 times",
        icon: "📋",
        unlocked: planFollowedCount >= 10,
        color: "from-yellow-400 to-rose-500"
      }
    ];
  }, [trades, stats.disciplineScore]);

  // Confetti Particle System
  const triggerConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ["#00d4aa", "#f0c040", "#6366f1", "#ec4899", "#8b5cf6", "#06b6d4"];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height + 20,
        vx: (Math.random() - 0.5) * 20,
        vy: -Math.random() * 20 - 10,
        radius: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.4; // gravity
        p.vx *= 0.98; // wind resistance
        p.rotation += p.rotationSpeed;

        if (p.y < canvas.height + 20) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
          ctx.restore();
        }
      });

      if (alive) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animate();
  };

  // Trigger confetti when achievements count change (new unlock)
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  useEffect(() => {
    if (unlockedCount > 0) {
      triggerConfetti();
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [unlockedCount]);

  return (
    <div className="space-y-8 pb-20 relative max-w-5xl mx-auto">
      {/* Confetti Overlay Canvas */}
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 pointer-events-none z-[9999]"
      />

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border pb-4">
        <button 
          onClick={() => setActiveTab("discipline")}
          className={`pb-2 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === "discipline" ? "text-text" : "text-subtext hover:text-text"}`}
        >
          Discipline Engine
          {activeTab === "discipline" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary shadow-[0_0_10px_rgba(0,212,170,0.5)]" />}
        </button>
        <button 
          onClick={() => setActiveTab("achievements")}
          className={`pb-2 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === "achievements" ? "text-text" : "text-subtext hover:text-text"}`}
        >
          Badges & Achievements ({unlockedCount}/{achievements.length})
          {activeTab === "achievements" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary shadow-[0_0_10px_rgba(0,212,170,0.5)]" />}
        </button>
      </div>

      {activeTab === "discipline" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Discipline Gauge */}
          <div className="lg:col-span-1 glass-card rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center">
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-6">Rules Discipline Score</h3>
            
            {/* Custom gauge dial */}
            <div className="relative w-44 h-44 flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90">
                {/* Track */}
                <circle cx="88" cy="88" r="76" stroke="var(--border)" strokeWidth="12" fill="none" opacity="0.3" />
                {/* Progress */}
                <circle 
                  cx="88" cy="88" r="76" 
                  stroke={stats.disciplineScore >= 80 ? "#10b981" : stats.disciplineScore >= 50 ? "#f59e0b" : "#ef4444"} 
                  strokeWidth="12" fill="none" 
                  strokeDasharray={2 * Math.PI * 76}
                  strokeDashoffset={2 * Math.PI * 76 * (1 - stats.disciplineScore / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-extrabold font-mono text-white">{stats.disciplineScore}%</span>
                <span className="text-[9px] font-black uppercase tracking-wider text-subtext mt-1">Consistency</span>
              </div>
            </div>

            <p className="text-xs text-subtext leading-relaxed px-4">
              Calculated by verifying if you stuck to your planned targets, kept within standard risk guidelines, and followed checklists.
            </p>
          </div>

          {/* Right: Emotion performance comparison */}
          <div className="lg:col-span-2 glass-card rounded-[2.5rem] p-8">
            <h3 className="text-lg font-black text-white uppercase tracking-wider font-syne mb-2">Performance by Emotion</h3>
            <p className="text-gray-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-6">Win Rate vs Psychological State</p>
            
            {emotionPerf.length === 0 ? (
              <div className="py-12 text-center text-xs text-subtext font-bold uppercase tracking-widest">
                Add emotion notes to logged trades to populate psychological metrics
              </div>
            ) : (
              <div className="space-y-6">
                {emotionPerf.map(e => (
                  <div key={e.name} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black uppercase tracking-widest text-white">{e.name}</span>
                      <span className="font-bold font-mono text-subtext">
                        {e.wr}% Win Rate ({e.total} trades • {e.pnl >= 0 ? "+" : ""}{fmt(e.pnl, settings.currency)})
                      </span>
                    </div>
                    {/* Visual bar */}
                    <div className="w-full h-3 bg-bg border border-border rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          e.wr >= 60 ? "bg-emerald-500" : e.wr >= 45 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${e.wr}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "achievements" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider font-syne">Milestone Badges</h3>
              <p className="text-gray-500 text-[10px] font-bold tracking-[0.2em] uppercase">Unlock performance cards as you trade disciplined</p>
            </div>
            <button 
              onClick={triggerConfetti}
              className="px-4 py-2 bg-brand-primary/10 border border-brand-primary/20 hover:bg-brand-primary/20 text-brand-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              🎉 Confetti Shower
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map(a => (
              <div 
                key={a.id}
                className={`
                  relative border rounded-[2rem] p-6 flex flex-col items-center text-center justify-between min-h-[220px] transition-all duration-500
                  ${a.unlocked 
                    ? "glass-card border-brand-primary/20 bg-gradient-to-b from-brand-primary/5 to-transparent hover:scale-105" 
                    : "bg-white/1 border-white/5 opacity-40 select-none grayscale"
                  }
                `}
              >
                {/* Glow ring if unlocked */}
                {a.unlocked && (
                  <div className="absolute inset-0 bg-brand-primary/2 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                )}

                <div className={`w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center text-3xl mb-4 shadow-lg border border-white/10`}>
                  {a.icon}
                </div>

                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider mb-2 font-syne">{a.name}</h4>
                  <p className="text-xs text-subtext leading-relaxed px-2">{a.desc}</p>
                </div>

                <div className="mt-4">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                    a.unlocked 
                      ? "bg-brand-primary/15 border-brand-primary/30 text-brand-primary shadow-[0_0_15px_rgba(0,212,170,0.15)]" 
                      : "bg-white/5 border-white/10 text-gray-500"
                  }`}>
                    {a.unlocked ? "🔓 Unlocked" : "🔒 Locked"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

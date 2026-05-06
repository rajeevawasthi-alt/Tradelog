export function StatCard({ label, value, sub, color = "text-white", icon, trend }) {
  return (
    <div className="glass-card rounded-[2rem] p-6 flex flex-col justify-between min-h-[160px] group">
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-[#00d4aa]/10 transition-colors duration-500">
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${trend >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-gray-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-1">{label}</p>
        <h4 className={`text-3xl font-black font-mono tracking-tighter ${color}`}>{value}</h4>
        {sub && <p className="text-gray-600 text-[10px] font-medium mt-1">{sub}</p>}
      </div>
    </div>
  );
}

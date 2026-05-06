import { useState } from "react";

export function Input({ label, type = "text", value, onChange, placeholder, required, className = "", icon }) {
  const [focused, setFocused] = useState(false);
  
  return (
    <div className={`relative flex flex-col gap-1.5 ${className} group`}>
      <div className={`
        flex items-center bg-white/5 border rounded-2xl transition-all duration-300
        ${focused ? "border-[#00d4aa] ring-4 ring-[#00d4aa]/10" : "border-white/10 group-hover:border-white/20"}
      `}>
        {icon && (
          <div className={`pl-5 pr-1 transition-colors duration-300 ${focused ? "text-[#00d4aa]" : "text-gray-500"}`}>
            {icon}
          </div>
        )}
        <div className="relative flex-1">
          <input 
            type={type} 
            value={value} 
            onChange={e => onChange(e.target.value)} 
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={focused ? placeholder : ""}
            className="w-full bg-transparent px-4 py-4 text-white text-sm focus:outline-none placeholder-gray-600 font-medium" 
          />
          <label className={`
            absolute left-4 transition-all duration-300 pointer-events-none uppercase tracking-widest font-bold text-[10px]
            ${(focused || value) ? "-top-2 bg-[#07090f] px-2 text-[#00d4aa]" : "top-4 text-gray-500"}
          `}>
            {label}{required && " *"}
          </label>
        </div>
      </div>
    </div>
  );
}

export function Select({ label, value, onChange, options, required, className = "" }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-xs font-medium text-gray-400 tracking-wide uppercase">{label}{required && " *"}</label>}
      <select value={value} onChange={e => onChange(e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa]/30 transition-all appearance-none cursor-pointer">
        <option value="">Select {label}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export function Textarea({ label, value, onChange, placeholder, className = "" }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-xs font-medium text-gray-400 tracking-wide uppercase">{label}</label>}
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
        className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa]/30 transition-all placeholder-gray-600 resize-none" />
    </div>
  );
}

export function Badge({ label, color = "gray" }) {
  const colors = {
    green: "bg-emerald-900/50 text-emerald-400 border-emerald-800",
    red: "bg-red-900/50 text-red-400 border-red-800",
    blue: "bg-blue-900/50 text-blue-400 border-blue-800",
    purple: "bg-purple-900/50 text-purple-400 border-purple-800",
    yellow: "bg-yellow-900/50 text-yellow-400 border-yellow-800",
    gray: "bg-gray-800 text-gray-400 border-gray-700",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colors[color] || colors.gray}`}>
      {label}
    </span>
  );
}

export function Toggle({ value, onChange, options }) {
  return (
    <div className="flex bg-gray-800 rounded-xl p-1 gap-1">
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)}
          className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${value === o ? "bg-gray-600 text-white" : "text-gray-500 hover:text-gray-300"}`}>
          {o}
        </button>
      ))}
    </div>
  );
}

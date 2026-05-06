import { useState } from "react";

export function MultiSelect({ label, options, selected, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-gray-400 tracking-wide uppercase">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <button
            key={o}
            onClick={() => {
              const next = selected.includes(o) 
                ? selected.filter(s => s !== o) 
                : [...selected, o];
              onChange(next);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              selected.includes(o) 
                ? "bg-[#00d4aa] text-white border-[#00d4aa] shadow-lg shadow-[#00d4aa]/20" 
                : "bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

import React from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder = "Buscar camisas..." }) {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-[#00FF85]/20 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
      <div className="relative flex items-center bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden group-focus-within:border-[#00FF85]/50 transition-colors">
        <Search className="w-5 h-5 text-[#666] ml-4" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-3 py-3 text-white placeholder-[#666] outline-none text-sm"
        />
      </div>
    </div>
  );
}
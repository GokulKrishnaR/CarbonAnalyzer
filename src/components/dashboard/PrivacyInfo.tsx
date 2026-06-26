"use client";

import React, { useState } from "react";
import { ShieldCheck, Info, Trash2, CheckCircle2 } from "lucide-react";

interface PrivacyInfoProps {
  onClearData: () => void;
}

export default function PrivacyInfo({ onClearData }: PrivacyInfoProps) {
  const [cleared, setCleared] = useState(false);

  const handleClear = () => {
    if (confirm("Are you sure you want to clear all your saved lifestyle inputs and reset the application?")) {
      onClearData();
      setCleared(true);
      setTimeout(() => setCleared(false), 3000);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 shrink-0">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
            Privacy Guaranteed: Client-Side Engine
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            Carbon calculations run in your browser. Lifestyle inputs, eco streaks, and your Hugging Face API key are stored in
            browser <span className="font-semibold text-cyan-400">cookies</span> for up to 1 year.
            AI suggestions send your footprint data to Hugging Face using your own API key.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-stretch gap-2 shrink-0 w-full md:w-auto">
        <button
          onClick={handleClear}
          className="flex items-center justify-center gap-2 border border-rose-500/20 hover:border-rose-500/40 hover:bg-rose-500/10 text-rose-400 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
          Clear All Saved Data
        </button>
        {cleared && (
          <div className="text-[10px] text-emerald-400 text-center flex items-center gap-1 justify-center mt-1 font-semibold animate-fade-in">
            <CheckCircle2 className="h-3.5 w-3.5" /> All saved cookies cleared!
          </div>
        )}
      </div>
    </div>
  );
}

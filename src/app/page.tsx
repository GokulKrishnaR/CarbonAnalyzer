"use client";

import React, { useState, useEffect } from "react";
import { 
  calculateCarbonFootprint, 
  DEFAULT_INPUTS, 
  UserInputs 
} from "@/utils/carbonCalculator";
import DashboardForm from "@/components/dashboard/DashboardForm";
import CarbonCharts from "@/components/dashboard/CarbonCharts";
import WhatIfSimulator from "@/components/dashboard/WhatIfSimulator";
import AiRecommendations from "@/components/dashboard/AiRecommendations";
import GoalAndStreakTracker from "@/components/dashboard/GoalAndStreakTracker";
import PdfExporter from "@/components/dashboard/PdfExporter";
import PrivacyInfo from "@/components/dashboard/PrivacyInfo";
import { COOKIE_KEYS, getCookie, setCookie, clearAppCookies } from "@/utils/cookies";
import { Leaf, RefreshCcw, Share2, Shield, Info, HelpCircle } from "lucide-react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [inputs, setInputs] = useState<UserInputs>(DEFAULT_INPUTS);
  const [optimizedTotal, setOptimizedTotal] = useState<number | undefined>(undefined);
  const [shareStatus, setShareStatus] = useState(false);

  // 1. Load data from cookies on mount
  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const encodedData = params.get("data");
      if (encodedData) {
        try {
          const parsed = JSON.parse(decodeURIComponent(encodedData));
          if (parsed && typeof parsed === "object") {
            setInputs({ ...DEFAULT_INPUTS, ...parsed });
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
          }
        } catch (e) {
          console.error("Failed to parse shared URL carbon data:", e);
        }
      }
    }

    const saved = getCookie(COOKIE_KEYS.USER_INPUTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setInputs({ ...DEFAULT_INPUTS, ...parsed });
      } catch (e) {
        console.error("Failed to parse saved inputs cookie:", e);
      }
    }
  }, []);

  const handleInputChange = (updatedInputs: UserInputs) => {
    setInputs(updatedInputs);
    setCookie(COOKIE_KEYS.USER_INPUTS, JSON.stringify(updatedInputs));
  };

  const handleClearData = () => {
    clearAppCookies();
    setInputs(DEFAULT_INPUTS);
    setOptimizedTotal(undefined);
  };

  // 3. Share profile configuration (URL Encoder)
  const handleShare = () => {
    if (typeof window !== "undefined") {
      // Exclude monthlyGoal & token paths to keep URL size small
      const shareablePayload = { ...inputs };
      delete (shareablePayload as any).monthlyGoal;
      
      const jsonStr = JSON.stringify(shareablePayload);
      const encoded = encodeURIComponent(jsonStr);
      const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encoded}`;
      
      navigator.clipboard.writeText(shareUrl).then(() => {
        setShareStatus(true);
        setTimeout(() => setShareStatus(false), 3000);
      });
    }
  };

  // Real-time carbon calculations
  const results = calculateCarbonFootprint(inputs);

  // Prevent SSR mismatch on dynamic charts & storage checks
  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-400 min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold animate-pulse">Loading Carbon Footprint Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-950 text-slate-50 min-h-screen flex flex-col font-sans relative overflow-hidden">
      {/* Decorative Blur Backdrops */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full filter blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full filter blur-[150px] pointer-events-none -z-10" />

      {/* Main Navigation Bar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-xl shadow-lg shadow-emerald-500/10">
              <Leaf className="h-5 w-5 text-slate-950 font-black" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                CarbonAnalyzer
                <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-500/20">
                  METRIC ONLY
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Personal Footprint Simulator & Climate Guide</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white font-semibold py-2 px-4 rounded-xl border border-slate-800 text-xs transition-all cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5" />
              {shareStatus ? "URL Copied!" : "Share Profile"}
            </button>
            <button
              onClick={handleClearData}
              className="hidden sm:flex items-center gap-1.5 bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-400 font-semibold py-2 px-4 rounded-xl border border-slate-800 text-xs transition-all cursor-pointer"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Reset App
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col gap-8 w-full">
        {/* Row 1: Questionnaire Inputs (Full width, above everything) */}
        <section className="w-full">
          <DashboardForm inputs={inputs} onChange={handleInputChange} />
        </section>

        {/* Row 2: EXECUTIVE METRICS DASHBOARD ROW */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {/* Carbon Score */}
          <div className="glass-panel rounded-2xl p-5 shadow-lg border border-slate-800/60 relative overflow-hidden flex flex-col justify-between h-[110px]">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Eco Score Rating</span>
              <Leaf className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-3xl font-black text-emerald-400">{results.ecoScore}</span>
              <span className="text-xs text-slate-500 font-medium">/ 100</span>
            </div>
            <p className="text-[10px] text-slate-500">Based on yearly metric carbon footprint index.</p>
          </div>

          {/* Monthly Emissions */}
          <div className="glass-panel rounded-2xl p-5 shadow-lg border border-slate-800/60 relative overflow-hidden flex flex-col justify-between h-[110px]">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Monthly CO₂ Emissions</span>
              <span className="text-[10px] font-bold bg-slate-800 text-slate-300 py-0.5 px-1.5 rounded">kg CO₂e</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-3xl font-black text-white">{results.monthly.total.toLocaleString()}</span>
              <span className="text-xs text-slate-500 font-medium">kg/mo</span>
            </div>
            <p className="text-[10px] text-slate-500">Approx. {(results.daily.total).toFixed(1)} kg CO₂e emitted per day.</p>
          </div>

          {/* Yearly Emissions */}
          <div className="glass-panel rounded-2xl p-5 shadow-lg border border-slate-800/60 relative overflow-hidden flex flex-col justify-between h-[110px]">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Yearly CO₂ Footprint</span>
              <span className="text-[10px] font-bold bg-slate-800 text-emerald-400 py-0.5 px-1.5 rounded">Metric Tons</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-3xl font-black text-cyan-400">{(results.yearly.total / 1000).toFixed(2)}</span>
              <span className="text-xs text-slate-500 font-medium">tons/yr</span>
            </div>
            <p className="text-[10px] text-slate-500">
              {results.comparisonPercentage > 0 
                ? `⚠️ ${results.comparisonPercentage}% more than global avg (~4.5t).` 
                : `✓ ${Math.abs(results.comparisonPercentage)}% less than global avg.`}
            </p>
          </div>

          {/* Highest Contributor */}
          <div className="glass-panel rounded-2xl p-5 shadow-lg border border-slate-800/60 relative overflow-hidden flex flex-col justify-between h-[110px]">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Primary Carbon Driver</span>
              <span className="text-[10px] font-bold bg-rose-500/10 text-rose-400 py-0.5 px-1.5 rounded">Impact</span>
            </div>
            <div className="flex items-baseline mt-2">
              <span className="text-lg font-black text-rose-400 truncate max-w-[200px]">{results.biggestContributor.label}</span>
            </div>
            <p className="text-[10px] text-slate-500">
              Responsible for {results.biggestContributor.percentage}% of your profile emissions.
            </p>
          </div>
        </section>

        {/* Row 3: PROFILE TRACKER PORTION */}
        <section className="w-full">
          <GoalAndStreakTracker inputs={inputs} results={results} onChange={handleInputChange} />
        </section>

        {/* Row 4: Visual Outputs, Simulation & Recommendations (Below inputs & headers) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-start">
          {/* COLUMN 1: CHARTS (Left 50% - 6 Cols) */}
          <div className="lg:col-span-6 space-y-8 flex flex-col">
            {/* Visual Charts (Pie, Bar, Line stacked vertically) */}
            <CarbonCharts inputs={inputs} results={results} optimizedTotal={optimizedTotal} />
          </div>

          {/* COLUMN 2: SIMULATOR, AI RECOMMENDATIONS, EXPORT (Right 50% - 6 Cols) */}
          <div className="lg:col-span-6 space-y-8 flex flex-col">
            {/* What If Simulator */}
            <WhatIfSimulator 
              inputs={inputs} 
              currentResults={results} 
              onOptimizedTotalChange={setOptimizedTotal} 
            />

            {/* AI suggestions container */}
            <AiRecommendations inputs={inputs} results={results} />

            {/* Exporter Block */}
            <div className="grid grid-cols-1 gap-4">
              <PdfExporter inputs={inputs} results={results} />
              <PrivacyInfo onClearData={handleClearData} />
            </div>
          </div>
        </section>
      </main>

      {/* Main Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© 2026 CarbonAnalyzer: Personal Carbon Footprint Analyzer. Open Source. Under MIT license.</p>
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-emerald-500" />
              100% Client-Side Private
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { UserInputs, CalculationResults } from "@/utils/carbonCalculator";
import { COOKIE_KEYS, getCookie, setCookie } from "@/utils/cookies";
import { OPTIMUM_MONTHLY_KG } from "@/utils/carbonConstants";
import { Leaf, Award, Flame, CheckCircle, Target } from "lucide-react";

interface GoalAndStreakTrackerProps {
  inputs: UserInputs;
  results: CalculationResults;
  onChange?: (updatedInputs: UserInputs) => void;
}

export default function GoalAndStreakTracker({ inputs, results, onChange }: GoalAndStreakTrackerProps) {
  const [streak, setStreak] = useState(0);
  const [lastLoggedDate, setLastLoggedDate] = useState<string | null>(null);
  const [loggedToday, setLoggedToday] = useState(false);

  useEffect(() => {
    const savedStreak = getCookie(COOKIE_KEYS.ECO_STREAK);
    const savedDate = getCookie(COOKIE_KEYS.ECO_LAST_LOGGED);
    
    if (savedStreak) {
      setStreak(Number(savedStreak));
    }
    
    if (savedDate) {
      setLastLoggedDate(savedDate);
      const todayStr = new Date().toDateString();
      if (savedDate === todayStr) {
        setLoggedToday(true);
      } else {
        const lastDate = new Date(savedDate);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 1) {
          setStreak(0);
          setCookie(COOKIE_KEYS.ECO_STREAK, "0");
        }
      }
    }
  }, []);

  const handleLogChoice = () => {
    const todayStr = new Date().toDateString();
    let newStreak = streak;

    if (loggedToday) return;

    if (lastLoggedDate) {
      const lastDate = new Date(lastLoggedDate);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day - increment streak
        newStreak += 1;
      } else if (diffDays > 1) {
        // Streak broken, reset to 1
        newStreak = 1;
      }
    } else {
      // First log ever
      newStreak = 1;
    }

    setStreak(newStreak);
    setLoggedToday(true);
    setLastLoggedDate(todayStr);
    
    setCookie(COOKIE_KEYS.ECO_STREAK, newStreak.toString());
    setCookie(COOKIE_KEYS.ECO_LAST_LOGGED, todayStr);
  };

  // Budget calculations
  const budgetPercentage = Math.min(200, Math.round((results.monthly.total / inputs.monthlyGoal) * 100));
  const isOverBudget = results.monthly.total > inputs.monthlyGoal;

  // Score description
  let scoreTitle = "High Footprint";
  let scoreColor = "text-rose-400";
  let scoreDesc = "Your emissions profile is higher than sustainable. Review recommendations for reductions.";

  if (results.ecoScore >= 75) {
    scoreTitle = "Eco Champion";
    scoreColor = "text-emerald-450";
    scoreDesc = "Excellent! Your carbon footprint is outstandingly low. Keep leading by example!";
  } else if (results.ecoScore >= 45) {
    scoreTitle = "Eco Moderate";
    scoreColor = "text-yellow-450";
    scoreDesc = "Average emissions. Minor modifications in your diet or driving habits could make you an Eco Champion.";
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      {/* 1. Monthly Goal Progress */}
      <div className="glass-panel rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Carbon Budget Goal</span>
          <Target className={`h-4.5 w-4.5 ${isOverBudget ? "text-rose-400" : "text-emerald-400"}`} />
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-black text-white">
              {results.monthly.total} <span className="text-xs font-normal text-slate-400">/ {inputs.monthlyGoal} kg</span>
            </span>
            <span className={`text-xs font-bold ${isOverBudget ? "text-rose-400" : "text-emerald-400"}`}>
              {budgetPercentage}% used
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isOverBudget 
                  ? "bg-gradient-to-r from-orange-500 to-rose-500" 
                  : "bg-gradient-to-r from-emerald-500 to-cyan-500"
              }`}
              style={{ width: `${Math.min(100, budgetPercentage)}%` }}
            />
          </div>

          {/* Budget Adjustment Slider */}
          {onChange && (
            <div className="mt-3 pt-2.5 border-t border-slate-800/60">
              <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1.5 font-medium">
                <span>Adjust Monthly Budget:</span>
                <span className="font-extrabold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">{inputs.monthlyGoal} kg</span>
              </div>
              <input
                type="range"
                min="100"
                max="1500"
                step="25"
                value={inputs.monthlyGoal}
                onChange={(e) => {
                  onChange({
                    ...inputs,
                    monthlyGoal: Number(e.target.value)
                  });
                }}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[8px] text-slate-500 mt-1 font-semibold uppercase">
                <span>100 kg (Ultra Eco)</span>
                <span>1500 kg</span>
              </div>
            </div>
          )}
        </div>

        <p className="text-[10px] text-slate-400 mt-3">
          {isOverBudget 
            ? "⚠️ You are over your monthly targets. Reduce activities in the simulator." 
            : "✓ Great work! You are keeping within your personal greenhouse budget."}
        </p>

        <div className="mt-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2.5 text-[10px] text-slate-400">
          <span className="font-extrabold text-emerald-400 block mb-0.5">Optimum Goal (Best Target): {OPTIMUM_MONTHLY_KG} kg/mo</span>
          This is the global sustainable limit (~2.0 metric tons/year per person) required to combat climate change.
        </div>
      </div>

      {/* 2. Streak Counter */}
      <div className="glass-panel rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Eco Streak Challenge</span>
          <Flame className={`h-4.5 w-4.5 ${streak > 0 ? "text-orange-500 animate-bounce" : "text-slate-500"}`} />
        </div>
        
        <div className="flex items-center gap-4 my-1">
          <span className="text-3xl font-black text-white flex items-baseline gap-1">
            {streak} <span className="text-xs font-semibold text-slate-400">Days</span>
          </span>
          {streak > 0 && (
            <span className="bg-orange-500/10 text-orange-400 border border-orange-500/25 px-2 py-0.5 rounded text-[10px] font-bold">
              Streak active 🔥
            </span>
          )}
        </div>

        <button
          onClick={handleLogChoice}
          disabled={loggedToday}
          className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            loggedToday
              ? "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700/60"
              : "bg-orange-500 hover:bg-orange-600 text-slate-950 shadow-md shadow-orange-950/20"
          }`}
        >
          {loggedToday ? (
            <>
              <CheckCircle className="h-3.5 w-3.5" />
              Logged for Today
            </>
          ) : (
            "Log Eco Choice Today"
          )}
        </button>
        <p className="text-[9px] text-slate-500 mt-2">
          Click when you cycle, reduce waste, or decline meat to maintain your daily streak.
        </p>
      </div>

      {/* 3. Rating & Eco Score Description */}
      <div className="glass-panel rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Climate Rating</span>
          <Award className="h-4.5 w-4.5 text-emerald-400" />
        </div>
        <div className="space-y-1">
          <h4 className={`text-base font-extrabold ${scoreColor}`}>
            {scoreTitle}
          </h4>
          <p className="text-[10px] leading-relaxed text-slate-400">
            {scoreDesc}
          </p>
        </div>
        <div className="text-[9px] text-slate-500 mt-3 border-t border-slate-800/80 pt-2 flex items-center gap-1">
          <Leaf className="h-3 w-3 text-emerald-500" />
          Eco Score: {results.ecoScore}/100. Lower emissions yield higher scores.
        </div>
      </div>
    </div>
  );
}

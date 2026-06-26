"use client";

import React, { useState, useEffect } from "react";
import { UserInputs, CalculationResults, calculateCarbonFootprint } from "@/utils/carbonCalculator";
import { EMISSION_FACTORS } from "@/utils/emissionFactors";
import { Sliders, Leaf, TrendingDown, RefreshCw } from "lucide-react";

interface WhatIfSimulatorProps {
  inputs: UserInputs;
  currentResults: CalculationResults;
  onOptimizedTotalChange: (total: number) => void;
}

export default function WhatIfSimulator({ inputs, currentResults, onOptimizedTotalChange }: WhatIfSimulatorProps) {
  const weeksPerMonth = 52 / 12;

  // Max bounds calculated dynamically based on current inputs
  const maxReduceCarKm = inputs.carDistance;
  const maxMeatFreeMeals = inputs.beefMeals;
  const maxHvacReduction = inputs.acHeatingHours;
  const maxClothingReduction = inputs.clothingItems;
  const maxExtraRecycle = Math.max(0, 100 - inputs.recyclePercent);

  // Simulator Sliders State (initialized to recommended values based on inputs)
  const [reduceCarKm, setReduceCarKm] = useState(() => 
    Math.min(30, Math.round(inputs.carDistance * 0.2))
  );
  const [transitShiftKm, setTransitShiftKm] = useState(() => 
    Math.min(20, Math.round(inputs.carDistance * 0.1))
  );
  const [meatFreeMeals, setMeatFreeMeals] = useState(() => 
    Math.min(3, Math.round(inputs.beefMeals * 0.5))
  );
  const [hvacReduction, setHvacReduction] = useState(() => 
    Math.min(2, Math.round(inputs.acHeatingHours * 0.25 * 2) / 2)
  );
  const [clothingReduction, setClothingReduction] = useState(() => 
    Math.min(2, Math.round(inputs.clothingItems * 0.5))
  );
  const [extraRecycle, setExtraRecycle] = useState(() => 
    Math.min(30, Math.round((100 - inputs.recyclePercent) * 0.3))
  );

  // Safely clamp values when base inputs change
  useEffect(() => {
    if (reduceCarKm > maxReduceCarKm) setReduceCarKm(maxReduceCarKm);
    if (meatFreeMeals > maxMeatFreeMeals) setMeatFreeMeals(maxMeatFreeMeals);
    if (hvacReduction > maxHvacReduction) setHvacReduction(maxHvacReduction);
    if (clothingReduction > maxClothingReduction) setClothingReduction(maxClothingReduction);
    if (extraRecycle > maxExtraRecycle) setExtraRecycle(maxExtraRecycle);
    
    // Total transit shift + reduce car km cannot exceed carDistance
    if (reduceCarKm + transitShiftKm > inputs.carDistance) {
      setTransitShiftKm(Math.max(0, inputs.carDistance - reduceCarKm));
    }
  }, [inputs, maxReduceCarKm, maxMeatFreeMeals, maxHvacReduction, maxClothingReduction, maxExtraRecycle, reduceCarKm, transitShiftKm]);

  // Reset simulator to 0
  const handleClear = () => {
    setReduceCarKm(0);
    setTransitShiftKm(0);
    setMeatFreeMeals(0);
    setHvacReduction(0);
    setClothingReduction(0);
    setExtraRecycle(0);
  };

  // Set simulator to recommended cuts
  const handleRecommended = () => {
    setReduceCarKm(Math.min(30, Math.round(inputs.carDistance * 0.2)));
    setTransitShiftKm(Math.min(20, Math.round(inputs.carDistance * 0.1)));
    setMeatFreeMeals(Math.min(3, Math.round(inputs.beefMeals * 0.5)));
    setHvacReduction(Math.min(2, Math.round(inputs.acHeatingHours * 0.25 * 2) / 2));
    setClothingReduction(Math.min(2, Math.round(inputs.clothingItems * 0.5)));
    setExtraRecycle(Math.min(30, Math.round((100 - inputs.recyclePercent) * 0.3)));
  };

  // Perform virtual calculation based on sliders
  // We construct simulated inputs and run the calculator! This is extremely robust and avoids duplicate logic.
  const simulatedInputs: UserInputs = {
    ...inputs,
    // Reduce car distance and transit shift (limit total reduced to carDistance)
    carDistance: Math.max(0, inputs.carDistance - reduceCarKm - transitShiftKm),
    // Increase public transit by shifted amount
    publicTransitDistance: inputs.publicTransitDistance + transitShiftKm,
    // Swap beef meals with veg meals
    beefMeals: Math.max(0, inputs.beefMeals - meatFreeMeals),
    vegMeals: inputs.vegMeals + meatFreeMeals,
    // Reduce HVAC
    acHeatingHours: Math.max(0, inputs.acHeatingHours - hvacReduction),
    // Reduce clothing purchases
    clothingItems: Math.max(0, inputs.clothingItems - clothingReduction),
    // Boost recycling
    recyclePercent: Math.min(100, inputs.recyclePercent + extraRecycle),
  };

  const simulatedResults = calculateCarbonFootprint(simulatedInputs);
  const monthlySavings = Math.max(0, currentResults.monthly.total - simulatedResults.monthly.total);
  const percentageReduction = currentResults.monthly.total > 0 
    ? Math.round((monthlySavings / currentResults.monthly.total) * 100)
    : 0;

  // Propagate total to line chart
  useEffect(() => {
    onOptimizedTotalChange(simulatedResults.monthly.total);
  }, [simulatedResults.monthly.total, onOptimizedTotalChange]);

  return (
    <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">What-If Simulator</h3>
            <p className="text-xs text-slate-400">Test how daily lifestyle tweaks immediately shrink your footprint.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRecommended}
            className="flex items-center gap-1.5 text-xs text-emerald-450 hover:text-white transition-colors bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 py-1.5 px-3 rounded-lg font-medium cursor-pointer"
          >
            <Leaf className="h-3.5 w-3.5" />
            Recommended Defaults
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors bg-slate-850 hover:bg-slate-800 border border-slate-700 py-1.5 px-3 rounded-lg font-medium cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            Clear All
          </button>
        </div>
      </div>

      {/* Simulator Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 mb-6">
        {/* Reduce Car Km */}
        {maxReduceCarKm > 0 && (
          <div>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-slate-300">Reduce driving mileage</span>
              <span className="text-cyan-400">Cut {reduceCarKm} km/week</span>
            </div>
            <input
              type="range"
              min="0"
              max={maxReduceCarKm}
              step="5"
              value={reduceCarKm}
              onChange={(e) => {
                const val = Number(e.target.value);
                setReduceCarKm(val);
                // Ensure total car reductions don't exceed current car mileage
                if (val + transitShiftKm > inputs.carDistance) {
                  setTransitShiftKm(inputs.carDistance - val);
                }
              }}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        )}

        {/* Shift car to transit */}
        {inputs.carDistance > 0 && (
          <div>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-slate-300">Shift driving to public transit</span>
              <span className="text-teal-400">Shift {transitShiftKm} km/week</span>
            </div>
            <input
              type="range"
              min="0"
              max={inputs.carDistance - reduceCarKm}
              step="5"
              value={transitShiftKm}
              onChange={(e) => setTransitShiftKm(Number(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-400"
            />
          </div>
        )}

        {/* Swapping beef meals */}
        {maxMeatFreeMeals > 0 && (
          <div>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-slate-300">Beef meals to vegetable meals</span>
              <span className="text-emerald-400">Swap {meatFreeMeals} meals/week</span>
            </div>
            <input
              type="range"
              min="0"
              max={maxMeatFreeMeals}
              step="1"
              value={meatFreeMeals}
              onChange={(e) => setMeatFreeMeals(Number(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>
        )}

        {/* Reduce HVAC */}
        {maxHvacReduction > 0 && (
          <div>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-slate-300">Reduce Heating/Cooling runtime</span>
              <span className="text-rose-400">Cut {hvacReduction} hrs/day</span>
            </div>
            <input
              type="range"
              min="0"
              max={maxHvacReduction}
              step="0.5"
              value={hvacReduction}
              onChange={(e) => setHvacReduction(Number(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-400"
            />
          </div>
        )}

        {/* Reduce clothing purchases */}
        {maxClothingReduction > 0 && (
          <div>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-slate-300">Buy fewer clothing items</span>
              <span className="text-indigo-400">Reduce by {clothingReduction} items/month</span>
            </div>
            <input
              type="range"
              min="0"
              max={maxClothingReduction}
              step="1"
              value={clothingReduction}
              onChange={(e) => setClothingReduction(Number(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-400"
            />
          </div>
        )}

        {/* Extra recycle percent */}
        {maxExtraRecycle > 0 && (
          <div>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-slate-300">Increase recycling rate</span>
              <span className="text-emerald-400">Add +{extraRecycle}% recycling</span>
            </div>
            <input
              type="range"
              min="0"
              max={maxExtraRecycle}
              step="5"
              value={extraRecycle}
              onChange={(e) => setExtraRecycle(Number(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>
        )}
      </div>

      {/* Simulator Feedback Dashboard */}
      <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <TrendingDown className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Estimated Monthly Carbon Savings</p>
              <h4 className="text-2xl font-black text-emerald-400">
                {monthlySavings.toLocaleString()} <span className="text-sm font-normal text-slate-300">kg CO₂e/month</span>
              </h4>
            </div>
          </div>
          <div className="flex items-center gap-8 self-end md:self-auto">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Footprint Shrunk</p>
              <p className="text-xl font-bold text-white">-{percentageReduction}%</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">New Eco Score</p>
              <p className="text-xl font-bold text-emerald-400">{simulatedResults.ecoScore} <span className="text-xs text-slate-500 font-normal">/100</span></p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Simulated Yearly</p>
              <p className="text-xl font-bold text-white">
                {(simulatedResults.yearly.total / 1000).toFixed(2)} <span className="text-xs text-slate-500 font-normal">Tons</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { UserInputs } from "@/utils/carbonCalculator";
import { REGIONAL_ELECTRICITY_FACTORS } from "@/utils/emissionFactors";
import { 
  Car, Zap, Utensils, ShoppingBag, Trash2, 
  Leaf, Info, Plane, Calendar, Monitor, Compass
} from "lucide-react";

interface DashboardFormProps {
  inputs: UserInputs;
  onChange: (inputs: UserInputs) => void;
}

type TabType = "transport" | "energy" | "diet" | "consumption" | "waste" | "lifestyle";

export default function DashboardForm({ inputs, onChange }: DashboardFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>("transport");

  const updateField = (key: keyof UserInputs, value: any) => {
    onChange({
      ...inputs,
      [key]: value,
    });
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "transport", label: "Transport", icon: <Car className="h-4 w-4" /> },
    { id: "energy", label: "Home Energy", icon: <Zap className="h-4 w-4" /> },
    { id: "diet", label: "Diet & Food", icon: <Utensils className="h-4 w-4" /> },
    { id: "consumption", label: "Consumption", icon: <ShoppingBag className="h-4 w-4" /> },
    { id: "waste", label: "Waste", icon: <Trash2 className="h-4 w-4" /> },
    { id: "lifestyle", label: "Digital Lifestyle", icon: <Compass className="h-4 w-4" /> },
  ];

  return (
    <div className="glass-panel glass-panel-glow rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full">
      {/* Mobile Tab Select */}
      <div className="block lg:hidden border-b border-slate-800 bg-slate-900/60 p-4">
        <label htmlFor="form-tab-select" className="sr-only">Select Category</label>
        <select
          id="form-tab-select"
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as TabType)}
          className="w-full bg-slate-800 text-white rounded-lg border border-slate-700 p-2.5 outline-none focus:border-emerald-500 text-sm"
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop Tabs Sidebar */}
      <div className="hidden lg:flex border-b border-slate-800/80 bg-slate-900/40 p-2 gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 shrink-0 cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Form Content */}
      <div className="p-6 md:p-8 flex-1 overflow-y-auto max-h-[550px]">
        {/* Interactive Input Alert Banner */}
        <div className="bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-indigo-500/10 border border-emerald-500/45 rounded-2xl p-4 mb-6 flex items-start gap-3 shadow-lg shadow-emerald-950/20 animate-pulse-slow">
          <span className="relative flex h-3.5 w-3.5 shrink-0 mt-0.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
          </span>
          <div>
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              Interactive Lifestyle Input Grid
            </h4>
            <p className="text-[11px] text-slate-300 font-medium leading-relaxed mt-0.5">
              Change the values, selections, and sliders in each tab below. All carbon emission totals, comparison statistics, simulated what-if charts, and AI-powered recommendations will recalculate **instantly**!
            </p>
          </div>
        </div>

        {/* TRANSPORT TAB */}
        {activeTab === "transport" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Car className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">Transport Emissions</h3>
                <p className="text-xs text-slate-400">Calculate emissions from your weekly transit habits.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Car type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Car Engine Type</label>
                <select
                  value={inputs.carType}
                  onChange={(e) => updateField("carType", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  <option value="petrol">Petrol (ICE)</option>
                  <option value="diesel">Diesel (ICE)</option>
                  <option value="electric">Electric (EV)</option>
                  <option value="none">No Car (Don't drive)</option>
                </select>
              </div>

              {/* Car distance */}
              {inputs.carType !== "none" && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-300">Car Distance (per week)</label>
                    <span className="text-sm font-semibold text-cyan-400">{inputs.carDistance} km</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    value={inputs.carDistance}
                    onChange={(e) => updateField("carDistance", Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>0 km</span>
                    <span>500 km</span>
                    <span>1000 km</span>
                  </div>
                </div>
              )}

              {/* Public Transit */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-300">Public Transport (per week)</label>
                  <span className="text-sm font-semibold text-emerald-400">{inputs.publicTransitDistance} km</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="5"
                  value={inputs.publicTransitDistance}
                  onChange={(e) => updateField("publicTransitDistance", Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>0 km</span>
                  <span>250 km</span>
                  <span>500 km</span>
                </div>
              </div>

              {/* Ride sharing trips */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-300">Ride-Sharing Trips (per week)</label>
                  <span className="text-sm font-semibold text-teal-400">{inputs.rideShareTrips} trips</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateField("rideShareTrips", Math.max(0, inputs.rideShareTrips - 1))}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg p-2 transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={inputs.rideShareTrips}
                    onChange={(e) => updateField("rideShareTrips", Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1.5 px-3 text-white text-center text-sm focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => updateField("rideShareTrips", inputs.rideShareTrips + 1)}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg p-2 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Flight Hours */}
              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-300 flex items-center gap-1.5">
                    <Plane className="h-4 w-4 text-sky-400" />
                    Annual Flight Time (hours per year)
                  </label>
                  <span className="text-sm font-semibold text-sky-400">{inputs.flightHours} hours</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  step="1"
                  value={inputs.flightHours}
                  onChange={(e) => updateField("flightHours", Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>0 hrs (No flying)</span>
                  <span>50 hrs (Moderate travel)</span>
                  <span>150 hrs (Frequent flyer)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ENERGY TAB */}
        {activeTab === "energy" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-400">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">Home Energy Habits</h3>
                <p className="text-xs text-slate-400">Assess electricity, cooling, and cooking fuel consumption.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Electricity Region */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1">
                  Electricity Grid Region
                  <span className="group relative cursor-pointer text-slate-500 hover:text-slate-300">
                    <Info className="h-3.5 w-3.5" />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 hidden group-hover:block bg-slate-900 border border-slate-800 p-2 rounded text-[10px] leading-relaxed text-slate-300 z-10 shadow-xl">
                      Emission factors vary greatly depending on whether your grid uses coal, solar, or nuclear energy.
                    </span>
                  </span>
                </label>
                <select
                  value={inputs.electricityRegion}
                  onChange={(e) => updateField("electricityRegion", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  {REGIONAL_ELECTRICITY_FACTORS.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Electricity Usage */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-300">Monthly Electricity Consumption</label>
                  <span className="text-sm font-semibold text-yellow-400">{inputs.electricityUsage} kWh</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="10"
                  value={inputs.electricityUsage}
                  onChange={(e) => updateField("electricityUsage", Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>0 kWh</span>
                  <span>500 kWh</span>
                  <span>1000 kWh</span>
                </div>
              </div>

              {/* Cooking LPG Cylinder usage */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-300 flex items-center gap-1.5">
                    Cooking Fuel (LPG in kg/month)
                  </label>
                  <span className="text-sm font-semibold text-orange-400">{inputs.cookingLpg} kg</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateField("cookingLpg", Math.max(0, inputs.cookingLpg - 1))}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg p-2 transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={inputs.cookingLpg}
                    onChange={(e) => updateField("cookingLpg", Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1.5 px-3 text-white text-center text-sm focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => updateField("cookingLpg", inputs.cookingLpg + 1)}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg p-2 transition-colors"
                  >
                    +
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5">Note: A standard residential LPG tank is usually ~14.2 kg.</p>
              </div>

              {/* Heating/Cooling usage hours */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-300">HVAC/AC Runtime (hours/day)</label>
                  <span className="text-sm font-semibold text-rose-400">{inputs.acHeatingHours} hours</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="1"
                  value={inputs.acHeatingHours}
                  onChange={(e) => updateField("acHeatingHours", Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>0 hrs</span>
                  <span>12 hrs</span>
                  <span>24 hrs</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DIET TAB */}
        {activeTab === "diet" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Utensils className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">Dietary & Food Habits</h3>
                <p className="text-xs text-slate-400">Adjust weekly meals. Meat production has a substantial global footprint.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Beef Meals */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-rose-300">Beef Meals (per week)</label>
                  <span className="text-sm font-semibold text-rose-400">{inputs.beefMeals} meals</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="21"
                  step="1"
                  value={inputs.beefMeals}
                  onChange={(e) => updateField("beefMeals", Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>0 meals</span>
                  <span>10 meals</span>
                  <span>21 meals</span>
                </div>
              </div>

              {/* Chicken Meals */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-orange-300">Chicken/Poultry Meals (per week)</label>
                  <span className="text-sm font-semibold text-orange-400">{inputs.chickenMeals} meals</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="21"
                  step="1"
                  value={inputs.chickenMeals}
                  onChange={(e) => updateField("chickenMeals", Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>0 meals</span>
                  <span>10 meals</span>
                  <span>21 meals</span>
                </div>
              </div>

              {/* Vegetarian Meals */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-emerald-300">Vegetarian Meals (per week)</label>
                  <span className="text-sm font-semibold text-emerald-400">{inputs.vegMeals} meals</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="21"
                  step="1"
                  value={inputs.vegMeals}
                  onChange={(e) => updateField("vegMeals", Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>0 meals</span>
                  <span>10 meals</span>
                  <span>21/21 meals</span>
                </div>
              </div>

              {/* Vegan Days */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-teal-300">100% Vegan Days (per week)</label>
                  <span className="text-sm font-semibold text-teal-400">{inputs.veganDays} days</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="7"
                  step="1"
                  value={inputs.veganDays}
                  onChange={(e) => updateField("veganDays", Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>0 days</span>
                  <span>4 days</span>
                  <span>7 days</span>
                </div>
              </div>

              {/* Food waste estimate */}
              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-300">Estimated Food Waste (kg per week)</label>
                  <span className="text-sm font-semibold text-amber-400">{inputs.foodWaste} kg</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={inputs.foodWaste}
                  onChange={(e) => updateField("foodWaste", Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>0 kg (Zero Waste)</span>
                  <span>7.5 kg</span>
                  <span>15 kg</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONSUMPTION TAB */}
        {activeTab === "consumption" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">Shopping & Consumption</h3>
                <p className="text-xs text-slate-400">Track industrial manufacturing emissions from new items purchased.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Clothing items */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-300">New Clothes Purchased (per month)</label>
                  <span className="text-sm font-semibold text-indigo-400">{inputs.clothingItems} items</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateField("clothingItems", Math.max(0, inputs.clothingItems - 1))}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg p-2 transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={inputs.clothingItems}
                    onChange={(e) => updateField("clothingItems", Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1.5 px-3 text-white text-center text-sm focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => updateField("clothingItems", inputs.clothingItems + 1)}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg p-2 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Electronics items */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-300">New Electronics/Gadgets (per year)</label>
                  <span className="text-sm font-semibold text-indigo-400">{inputs.electronicsItems} devices</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateField("electronicsItems", Math.max(0, inputs.electronicsItems - 1))}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg p-2 transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={inputs.electronicsItems}
                    onChange={(e) => updateField("electronicsItems", Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1.5 px-3 text-white text-center text-sm focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => updateField("electronicsItems", inputs.electronicsItems + 1)}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg p-2 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* General Shopping frequency */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">General Shopping Habit</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["low", "medium", "high"] as const).map((level) => {
                    const descriptions = {
                      low: "Minimalist (Essential goods only)",
                      medium: "Moderate (Occasional lifestyle purchases)",
                      high: "Active (Frequent online packages & deliveries)",
                    };
                    const isSelected = inputs.shoppingLevel === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => updateField("shoppingLevel", level)}
                        className={`p-3 rounded-xl border text-center text-xs font-semibold capitalize transition-all duration-200 ${
                          isSelected
                            ? "bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-950/20"
                            : "bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <div>{level}</div>
                        <div className="text-[9px] font-normal text-slate-500 mt-1 hidden sm:block">
                          {descriptions[level]}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WASTE TAB */}
        {activeTab === "waste" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">Waste Management</h3>
                <p className="text-xs text-slate-400">Manage landfill volumes. Proper sorting lowers methane emissions.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Landfill waste amount */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-300">General Household Waste (kg/week)</label>
                  <span className="text-sm font-semibold text-teal-400">{inputs.wasteAmount} kg</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={inputs.wasteAmount}
                  onChange={(e) => updateField("wasteAmount", Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>0 kg</span>
                  <span>20 kg</span>
                  <span>40 kg</span>
                </div>
              </div>

              {/* Recycling percentage */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-300">Recycled Waste Ratio</label>
                  <span className="text-sm font-semibold text-teal-400">{inputs.recyclePercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={inputs.recyclePercent}
                  onChange={(e) => updateField("recyclePercent", Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>0% (Landfill only)</span>
                  <span>50%</span>
                  <span>100% (Full sorting)</span>
                </div>
              </div>

              {/* Composting */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Do you compost organic food waste?</label>
                <div className="flex gap-4">
                  {[
                    { val: true, label: "Yes, I compost organic waste" },
                    { val: false, label: "No, organic waste goes to landfill" }
                  ].map((opt) => {
                    const isSelected = inputs.compost === opt.val;
                    return (
                      <button
                        key={opt.val.toString()}
                        type="button"
                        onClick={() => updateField("compost", opt.val)}
                        className={`flex-1 p-3 rounded-xl border text-center text-xs font-semibold transition-all duration-200 ${
                          isSelected
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/20"
                            : "bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LIFESTYLE & GOALS TAB */}
        {activeTab === "lifestyle" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">Digital Lifestyle</h3>
                <p className="text-xs text-slate-400">Enter your daily time and how often you travel.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Device usage hours */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-300 flex items-center gap-1.5">
                    <Monitor className="h-4 w-4 text-cyan-400" />
                    Daily Active Screen Time (hours)
                  </label>
                  <span className="text-sm font-semibold text-cyan-400">{inputs.deviceHours} hours</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="18"
                  step="0.5"
                  value={inputs.deviceHours}
                  onChange={(e) => updateField("deviceHours", Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>0 hrs</span>
                  <span>9 hrs</span>
                  <span>18 hrs</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5">Estimates server infrastructure and local device power.</p>
              </div>

              {/* Leisure Travel frequency */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">General Travel Profile</label>
                <select
                  value={inputs.travelLevel}
                  onChange={(e) => updateField("travelLevel", e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  <option value="low">Low (Mostly stay local)</option>
                  <option value="medium">Medium (Average occasional trips)</option>
                  <option value="high">High (Active travel / hotels / tours)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

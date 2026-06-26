"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";
import { CalculationResults, UserInputs } from "@/utils/carbonCalculator";
import { buildTwelveMonthSimulation } from "@/utils/carbonSimulation";
import {
  GLOBAL_AVERAGE_YEARLY_TONS,
  OPTIMUM_MONTHLY_KG,
  OPTIMUM_YEARLY_TONS,
} from "@/utils/carbonConstants";

interface CarbonChartsProps {
  inputs: UserInputs;
  results: CalculationResults;
  optimizedTotal?: number;
}

export default function CarbonCharts({ inputs, results, optimizedTotal }: CarbonChartsProps) {
  const pieData = [
    { name: "Transport", value: results.monthly.transport, color: "#38bdf8" },
    { name: "Home Energy", value: results.monthly.energy, color: "#fbbf24" },
    { name: "Diet & Food", value: results.monthly.food, color: "#28ac45" },
    { name: "Consumption", value: results.monthly.consumption, color: "#818cf8" },
    { name: "Waste Management", value: results.monthly.waste, color: "#00f0d0" },
    { name: "Digital Lifestyle", value: results.monthly.lifestyle, color: "#f472b6" },
  ].filter(item => item.value > 0);

  const barData = [
    {
      name: "Your Footprint",
      "Yearly CO2 (Tons)": Number((results.yearly.total / 1000).toFixed(2)),
      fill: "url(#ecoGradient)",
    },
    {
      name: "Global Average",
      "Yearly CO2 (Tons)": GLOBAL_AVERAGE_YEARLY_TONS,
      fill: "#475569",
    },
    {
      name: "Optimum Goal (Best)",
      "Yearly CO2 (Tons)": OPTIMUM_YEARLY_TONS,
      fill: "#10b981",
    }
  ];

  const lineData = useMemo(
    () =>
      buildTwelveMonthSimulation(
        results,
        inputs.monthlyGoal,
        inputs.flightHours,
        optimizedTotal
      ),
    [results, inputs.monthlyGoal, inputs.flightHours, optimizedTotal]
  );

  const chartLineData = lineData.map((point) => ({
    name: point.name,
    "Current Lifestyle": point.currentLifestyle,
    ...(point.optimizedTarget !== null
      ? { "What-If Path": point.optimizedTarget }
      : {}),
    "Budget Goal": point.budgetGoal,
    "Optimum Goal (Best)": point.optimumGoal,
  }));

  const yearEndCurrent = lineData[11]?.currentLifestyle ?? 0;
  const yearEndOptimized = lineData[11]?.optimizedTarget;
  const yearEndBudget = lineData[11]?.budgetGoal ?? 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
          <p className="text-xs font-semibold text-slate-400 mb-1">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} className="text-sm font-medium" style={{ color: item.color || item.payload.fill }}>
              {item.name}: <span className="font-bold text-white">{item.value.toLocaleString()} kg</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
          <p className="text-xs font-semibold text-slate-400 mb-1">{label}</p>
          <p className="text-sm font-bold text-emerald-400">
            {payload[0].value} Metric Tons CO₂e
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="glass-panel rounded-2xl p-6 shadow-xl flex flex-col h-[350px]">
        <h4 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Category Contribution</h4>
        <div className="flex-1 min-h-0 relative flex items-center justify-center">
          {pieData.length === 0 ? (
            <div className="text-slate-500 text-sm">No emissions data to display</div>
          ) : (
            <div className="w-full h-full flex flex-col sm:flex-row items-center">
              <div className="w-full sm:w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [`${value} kg CO₂e`, "Emissions"]}
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "10px", color: "#fff" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:w-1/2 flex flex-col gap-1.5 px-4 overflow-y-auto max-h-[220px]">
                {pieData.map((item, idx) => {
                  const percent = Math.round((item.value / results.monthly.total) * 100);
                  return (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-300 font-medium truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <span className="text-slate-400 font-semibold">
                        {item.value} kg ({percent}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6 shadow-xl flex flex-col h-[350px]">
        <h4 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">How You Compare</h4>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="ecoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: "Tons CO₂ / Year", angle: -90, position: "insideLeft", fill: "#64748b", style: { textAnchor: "middle" } }} />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(51, 65, 85, 0.15)" }} />
              <Bar dataKey="Yearly CO2 (Tons)" radius={[8, 8, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6 shadow-xl flex flex-col">
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            12-Month Cumulative Carbon Simulation
          </h4>
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
            Seasonal HVAC & travel patterns from today, with What-If changes phased in over the year.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-800/80">
            <p className="text-[9px] text-slate-500 uppercase font-semibold">Year-end (current)</p>
            <p className="text-sm font-bold text-rose-400">{yearEndCurrent.toLocaleString()} kg</p>
          </div>
          {yearEndOptimized !== null && yearEndOptimized !== undefined && (
            <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-800/80">
              <p className="text-[9px] text-slate-500 uppercase font-semibold">Year-end (what-if)</p>
              <p className="text-sm font-bold text-cyan-400">{yearEndOptimized.toLocaleString()} kg</p>
            </div>
          )}
          <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-800/80">
            <p className="text-[9px] text-slate-500 uppercase font-semibold">Budget cap</p>
            <p className="text-sm font-bold text-amber-400">{yearEndBudget.toLocaleString()} kg</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-800/80">
            <p className="text-[9px] text-slate-500 uppercase font-semibold">Optimum target</p>
            <p className="text-sm font-bold text-emerald-400">{(OPTIMUM_MONTHLY_KG * 12).toLocaleString()} kg</p>
          </div>
        </div>

        <div className="w-full h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartLineData} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.25)" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={56}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                label={{ value: "Cumulative CO₂ (kg)", angle: -90, position: "insideLeft", fill: "#64748b", style: { textAnchor: "middle" }, offset: 10 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={40} wrapperStyle={{ fontSize: "11px" }} />
              <Line
                type="monotone"
                dataKey="Current Lifestyle"
                stroke="#f43f5e"
                strokeWidth={3}
                dot={{ r: 3, fill: "#f43f5e", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
              {optimizedTotal !== undefined && (
                <Line
                  type="monotone"
                  dataKey="What-If Path"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: "#06b6d4", strokeWidth: 0 }}
                />
              )}
              <Line
                type="monotone"
                dataKey="Budget Goal"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: "#f59e0b", strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="Optimum Goal (Best)"
                stroke="#10b981"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
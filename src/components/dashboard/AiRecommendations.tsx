"use client";

import React, { useState, useEffect } from "react";
import { UserInputs, CalculationResults } from "@/utils/carbonCalculator";
import { getRuleSuggestions } from "@/utils/ruleSuggestions";
import { COOKIE_KEYS, getCookie, setCookie, deleteCookie } from "@/utils/cookies";
import {
  Sparkles, Shield, AlertTriangle,
  Loader2, ListFilter, Key, CheckCircle2, ExternalLink
} from "lucide-react";

interface AiRecommendationsProps {
  inputs: UserInputs;
  results: CalculationResults;
}

export default function AiRecommendations({ inputs, results }: AiRecommendationsProps) {
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hfToken, setHfToken] = useState("");
  const [tokenSaved, setTokenSaved] = useState(false);

  const [recMode, setRecMode] = useState<"rules" | "ai">("rules");

  useEffect(() => {
    const saved = getCookie(COOKIE_KEYS.HF_TOKEN);
    if (saved) {
      setHfToken(saved);
      setTokenSaved(true);
    }
  }, []);

  const saveHfToken = (token: string) => {
    const trimmed = token.trim();
    if (trimmed) {
      setCookie(COOKIE_KEYS.HF_TOKEN, trimmed);
      setTokenSaved(true);
    } else {
      deleteCookie(COOKIE_KEYS.HF_TOKEN);
      setTokenSaved(false);
    }
  };

  const handleTokenChange = (value: string) => {
    setHfToken(value);
    setTokenSaved(false);
  };

  const handleTokenBlur = () => {
    if (hfToken.trim()) saveHfToken(hfToken);
  };

  const generateAiSuggestions = async () => {
    if (!hfToken.trim()) {
      setError("Please enter your Hugging Face API key below before running AI suggestions.");
      return;
    }

    setLoading(true);
    setError(null);
    setAiResponse(null);
    setAiSource(null);

    saveHfToken(hfToken);

    try {
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${hfToken.trim()}`,
        },
        body: JSON.stringify({
          inputs,
          results,
          hfToken: hfToken.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate suggestions. Check your Hugging Face API key.");
      }

      setAiResponse(data.markdown);
      setAiSource(data.source);
      setRecMode("ai");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An unexpected error occurred while contacting the suggestions server.");
      setRecMode("rules"); // Fallback on error
    } finally {
      setLoading(false);
    }
  };

  // Local fallback calculations
  const ruleSuggestions = getRuleSuggestions(inputs);

  // Markdown client-side bullet text parser
  const renderBoldText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-cyan-400 font-bold">{part}</strong> : part);
  };

  const parseMarkdown = (text: string) => {
    return text.split("\n").map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={i} className="h-2" />;

      if (trimmed.startsWith("###")) {
        return <h5 key={i} className="text-sm font-bold text-cyan-400 mt-4 mb-2">{trimmed.replace("###", "").trim()}</h5>;
      }
      if (trimmed.startsWith("##")) {
        return <h4 key={i} className="text-base font-extrabold text-white mt-5 mb-2 border-b border-slate-800 pb-1">{trimmed.replace("##", "").trim()}</h4>;
      }
      if (trimmed.startsWith("#")) {
        return <h3 key={i} className="text-lg font-black text-emerald-400 mt-6 mb-3">{trimmed.replace("#", "").trim()}</h3>;
      }

      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const bulletText = trimmed.substring(1).trim();
        return (
          <li key={i} className="text-sm text-slate-300 ml-4 list-disc mb-1.5 leading-relaxed">
            {renderBoldText(bulletText)}
          </li>
        );
      }

      return <p key={i} className="text-sm text-slate-350 mb-2 leading-relaxed">{renderBoldText(trimmed)}</p>;
    });
  };

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case "transport": return { border: "border-sky-500/20", bg: "bg-sky-500/5", text: "text-sky-400" };
      case "energy": return { border: "border-yellow-500/20", bg: "bg-yellow-500/5", text: "text-yellow-400" };
      case "food": return { border: "border-emerald-500/20", bg: "bg-emerald-500/5", text: "text-emerald-400" };
      case "consumption": return { border: "border-indigo-500/20", bg: "bg-indigo-500/5", text: "text-indigo-400" };
      case "waste": return { border: "border-teal-500/20", bg: "bg-teal-500/5", text: "text-teal-400" };
      default: return { border: "border-pink-500/20", bg: "bg-pink-500/5", text: "text-pink-400" };
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 animate-pulse">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Actionable Reduction Plan</h3>
            <p className="text-xs text-slate-400">Discover AI-powered recommendations or use our rules engine.</p>
          </div>
        </div>

        {/* Toggle Display Mode */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setRecMode("rules")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${recMode === "rules"
                ? "bg-slate-850 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
              }`}
          >
            <ListFilter className="h-3.5 w-3.5" />
            Rules Engine ({ruleSuggestions.length})
          </button>
          <button
            onClick={() => {
              if (aiResponse) setRecMode("ai");
              else generateAiSuggestions();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${recMode === "ai"
                ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 shadow-sm border border-cyan-500/20"
                : "text-slate-400 hover:text-slate-200"
              }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Suggestion
          </button>
        </div>
      </div>

      {/* Hugging Face API key */}
      <div className="mb-5 p-4 rounded-xl border border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between gap-2 mb-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Key className="h-3.5 w-3.5 text-cyan-400" />
            Your Hugging Face API Key
          </label>
          {tokenSaved && hfToken.trim() && (
            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Saved (1 year)
            </span>
          )}
        </div>
        <input
          type="password"
          value={hfToken}
          onChange={(e) => handleTokenChange(e.target.value)}
          onBlur={handleTokenBlur}
          placeholder="hf_..."
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
        />
        <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
          Stored in your browser cookie for 1 year. Create a free fine-grained token with{" "}
          <span className="text-slate-400">Make calls to Inference Providers</span> enabled.{" "}
          <a
            href="https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-0.5"
          >
            Get token <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </p>
      </div>

      {/* Main recommendation body */}
      <div className="flex-1 overflow-y-auto min-h-[250px] pr-2">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
            <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
            <p className="text-sm text-slate-400 font-semibold animate-pulse">
              Consulting Hugging Face Inference API...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs mb-4 flex gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <div>
              <span className="font-bold">AI Request Failed:</span> {error}
              <p className="mt-1 text-slate-400">
                Add a valid Hugging Face API key above, or review local recommendations below.
              </p>
            </div>
          </div>
        )}

        {/* AI response panel */}
        {!loading && recMode === "ai" && aiResponse && (
          <div className="space-y-4">
            <div className="flex justify-start">
              {aiSource === "ai" ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/25 rounded-full text-xs font-bold text-cyan-400">
                  <span>🤖 Generated by Hugging Face AI</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/25 rounded-full text-xs font-bold text-amber-400 animate-pulse">
                  <span>🛡 Rule-based Recommendation</span>
                </div>
              )}
            </div>
            <div className="bg-slate-900/40 rounded-xl p-5 border border-slate-800/80 shadow-inner prose prose-invert max-w-none">
              {parseMarkdown(aiResponse)}
            </div>
          </div>
        )}

        {/* Rules fallback dashboard */}
        {!loading && recMode === "rules" && (
          <div className="space-y-4">
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/25 rounded-full text-xs font-bold text-amber-400">
                <span>🛡 Rule-based Recommendation</span>
              </div>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-emerald-400" />
                Carbon Reduction Suggestions
              </span>
              <button
                onClick={generateAiSuggestions}
                disabled={loading}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-[10px] rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                Run AI
              </button>
            </div>

            {ruleSuggestions.length === 0 ? (
              <div className="text-slate-500 text-sm text-center py-10">
                Excellent habits! No localized recommendations found. Try adjusting inputs to generate items.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {ruleSuggestions.map((item) => {
                  const theme = getCategoryTheme(item.category);
                  return (
                    <div
                      key={item.id}
                      className={`border ${theme.border} ${theme.bg} rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}
                    >
                      <div className="space-y-1">
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${theme.text}`}>
                          {item.category}
                        </span>
                        <h4 className="text-sm font-bold text-white">{item.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-xl">{item.description}</p>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto border-t sm:border-t-0 border-slate-800/40 pt-3 sm:pt-0 shrink-0">
                        <span className="text-xs text-slate-400 font-medium">Estimated savings</span>
                        <span className="text-sm font-black text-emerald-400">
                          -{item.savings} kg/mo
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

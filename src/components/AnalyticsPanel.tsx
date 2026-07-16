/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { TradeEntry, JournalStats } from "../types";
import { 
  TrendingUp, BarChart3, AlertOctagon, RefreshCw, Sparkles, BookOpen, 
  Percent, DollarSign, Activity, Award, Compass, Heart
} from "lucide-react";

interface AnalyticsPanelProps {
  trades: TradeEntry[];
  onGenerateDiagnostics: () => Promise<string>;
  cachedDiagnostics: string;
}

export default function AnalyticsPanel({ trades, onGenerateDiagnostics, cachedDiagnostics }: AnalyticsPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportText, setReportText] = useState(cachedDiagnostics);
  const [errMessage, setErrMessage] = useState("");

  // Calculate statistics
  const totalTrades = trades.length;
  const wins = trades.filter((t) => t.status === "WIN");
  const losses = trades.filter((t) => t.status === "LOSS");
  const holds = trades.filter((t) => t.status === "HOLD");

  const winCount = wins.length;
  const lossCount = losses.length;
  const holdCount = holds.length;

  // Win rate based on resolved trades (wins vs losses)
  const resolvedTrades = winCount + lossCount;
  const winRate = resolvedTrades > 0 ? Math.round((winCount / resolvedTrades) * 100) : 0;

  // Total volume traded
  const totalVolume = trades.reduce((acc, t) => acc + (t.price * t.amount * t.leverage), 0);

  // Buy vs Sell distribution
  const buyTrades = trades.filter((t) => t.action === "BUY");
  const sellTrades = trades.filter((t) => t.action === "SELL");
  const buyVolume = buyTrades.reduce((acc, t) => acc + (t.price * t.amount * t.leverage), 0);
  const sellVolume = sellTrades.reduce((acc, t) => acc + (t.price * t.amount * t.leverage), 0);

  // Calculate leverage hazard metrics
  const highLeverageTrades = trades.filter((t) => t.leverage > 20);
  const avgLeverage = totalTrades > 0 ? Math.round(trades.reduce((sum, t) => sum + t.leverage, 0) / totalTrades) : 0;

  const triggerDiagnostics = async () => {
    setIsGenerating(true);
    setErrMessage("");
    try {
      const report = await onGenerateDiagnostics();
      setReportText(report);
    } catch (err: any) {
      setErrMessage(err.message || "Portfel diagnostikasini yuklab bo'lmadi.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Custom Inline SVG Pie/Doughnut calculation
  const totalSlices = winCount + lossCount + holdCount;
  const winAngle = totalSlices > 0 ? (winCount / totalSlices) * 360 : 120;
  const lossAngle = totalSlices > 0 ? (lossCount / totalSlices) * 360 : 120;
  const holdAngle = totalSlices > 0 ? (holdCount / totalSlices) * 360 : 120;

  // Let's draw a beautiful horizontal stacked bar chart or a clean dial for WinRate
  const strokeDash = 2 * Math.PI * 30; // Radius 30 circle
  const strokeOffset = strokeDash - (winRate / 100) * strokeDash;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Trades Card */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider">Jami Savdolar</span>
            <Activity className="h-4 w-4 text-sky-400" />
          </div>
          <div className="font-mono text-2xl font-extrabold text-white">{totalTrades}</div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5 font-mono">
            <span className="text-emerald-400">W:{winCount}</span>
            <span className="text-slate-600">|</span>
            <span className="text-rose-400">L:{lossCount}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">H:{holdCount}</span>
          </div>
        </div>

        {/* Win Rate Card */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md flex items-center justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider">Yutuq Ko'rsatkichi</span>
            </div>
            <div className="font-mono text-2xl font-extrabold text-emerald-400">
              {winRate}%
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">
              {resolvedTrades} yopiq savdodan
            </div>
          </div>
          
          {/* SVG Progress Circle */}
          <div className="relative h-12 w-12 flex-shrink-0">
            <svg className="h-full w-full transform -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r="30"
                className="stroke-slate-800 fill-none"
                strokeWidth="6"
              />
              <circle
                cx="40"
                cy="40"
                r="30"
                className="stroke-emerald-400 fill-none transition-all duration-500"
                strokeWidth="6"
                strokeDasharray={strokeDash}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-300 font-mono">
              <Percent className="h-3 w-3 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Volume Card */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider">Umumiy Hajm (Traded)</span>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </div>
          <div className="font-mono text-xl font-bold text-white leading-8">
            ${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-amber-500 mt-1 font-mono">
            Leverage hisobga olingan holda
          </div>
        </div>

        {/* Leverage Monitor */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider">O'rtacha Leverage</span>
            <Award className="h-4 w-4 text-amber-400" />
          </div>
          <div className="font-mono text-2xl font-extrabold text-amber-400">
            {avgLeverage}x
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono flex items-center gap-1.5">
            {highLeverageTrades.length > 0 ? (
              <span className="text-rose-400 flex items-center gap-1">
                <AlertOctagon className="h-3 w-3 text-rose-400" />
                {highLeverageTrades.length} ta yuqori xavfli setup
              </span>
            ) : (
              <span className="text-emerald-400">Me'yoriy xavfsizlik</span>
            )}
          </div>
        </div>
      </div>

      {/* Visual Charts and Distribution Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Buy vs Sell Volume Bar Chart */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-4">
          <h3 className="text-xs font-semibold font-display text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-slate-400" />
            BUY vs SELL Hajm Taqsimoti
          </h3>
          
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-emerald-400">BUY (Ko'pkon): ${buyVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              <span className="text-rose-400">SELL (Slvon): ${sellVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>

            {/* Custom Bar representation */}
            <div className="h-4 w-full rounded-lg bg-slate-950 overflow-hidden flex border border-slate-800">
              {buyVolume === 0 && sellVolume === 0 ? (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-500 font-bold uppercase">
                  Ma'lumotlar yo'q
                </div>
              ) : (
                <>
                  <div 
                    style={{ width: `${(buyVolume / (buyVolume + sellVolume || 1)) * 100}%` }} 
                    className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full transition-all duration-500"
                    title="BUY Volume Ratio"
                  />
                  <div 
                    style={{ width: `${(sellVolume / (buyVolume + sellVolume || 1)) * 100}%` }} 
                    className="bg-gradient-to-r from-rose-600 to-rose-400 h-full transition-all duration-500"
                    title="SELL Volume Ratio"
                  />
                </>
              )}
            </div>

            <div className="flex justify-between text-[10px] text-slate-500 pt-1">
              <span>{buyTrades.length} ta kirish setupi</span>
              <span>{sellTrades.length} ta chiqish setupi</span>
            </div>
          </div>
        </div>

        {/* Win/Loss/Hold Status breakdown circles */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/30 flex items-center justify-between">
          <div className="space-y-3 flex-1">
            <h3 className="text-xs font-semibold font-display text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-slate-400" />
              Savdo Natijalari Ulushi
            </h3>
            
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                <span className="text-slate-400">WIN:</span>
                <span className="text-white font-bold">{winCount}</span>
                <span className="text-slate-600">({totalTrades > 0 ? Math.round((winCount / totalTrades) * 100) : 0}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-400"></span>
                <span className="text-slate-400">LOSS:</span>
                <span className="text-white font-bold">{lossCount}</span>
                <span className="text-slate-600">({totalTrades > 0 ? Math.round((lossCount / totalTrades) * 100) : 0}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-slate-500"></span>
                <span className="text-slate-400">HOLD:</span>
                <span className="text-white font-bold">{holdCount}</span>
                <span className="text-slate-600">({totalTrades > 0 ? Math.round((holdCount / totalTrades) * 100) : 0}%)</span>
              </div>
            </div>
          </div>

          {/* SVG Slices Dial representation */}
          <div className="h-24 w-24 flex-shrink-0 relative flex items-center justify-center mr-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {totalTrades === 0 ? (
                <circle cx="50" cy="50" r="35" className="stroke-slate-800 fill-none" strokeWidth="12" />
              ) : (
                <>
                  {/* Dynamic Pie chart circles or simply dynamic dashes */}
                  <circle cx="50" cy="50" r="35" className="stroke-slate-800 fill-none" strokeWidth="12" />
                  {/* Wins */}
                  <circle 
                    cx="50" cy="50" r="35" 
                    className="stroke-emerald-400 fill-none transition-all duration-500" 
                    strokeWidth="12"
                    strokeDasharray={`${2 * Math.PI * 35}`}
                    strokeDashoffset={`${2 * Math.PI * 35 - (winCount / totalTrades) * 2 * Math.PI * 35}`}
                  />
                  {/* Losses */}
                  <circle 
                    cx="50" cy="50" r="35" 
                    className="stroke-rose-400 fill-none transition-all duration-500" 
                    strokeWidth="12"
                    strokeDasharray={`${2 * Math.PI * 35}`}
                    strokeDashoffset={`${2 * Math.PI * 35 - (lossCount / totalTrades) * 2 * Math.PI * 35}`}
                    style={{ transform: `rotate(${(winCount / totalTrades) * 360}deg)`, transformOrigin: "50px 50px" }}
                  />
                </>
              )}
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Jami</span>
              <span className="text-xs font-mono font-extrabold text-white">{totalTrades}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PORTFOLIO DIAGNOSTICS & AI INTELLIGENCE */}
      <div className="p-5 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-slate-950 via-slate-900/60 to-purple-950/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white font-display">Apex AI Portfel Diagnostikasi</h3>
              <p className="text-[10px] text-slate-400 font-mono">Tizimli hisobot va risk boshqaruvi tahlillari</p>
            </div>
          </div>

          <button
            onClick={triggerDiagnostics}
            disabled={isGenerating}
            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Diagnostika tayyorlanmoqda...
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                AI Diagnostika Hisoboti
              </>
            )}
          </button>
        </div>

        {errMessage && (
          <div className="p-3 bg-rose-950/20 text-rose-400 text-xs rounded-xl border border-rose-500/20">
            Xatolik: {errMessage}
          </div>
        )}

        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-900 text-xs text-slate-300 leading-relaxed font-sans max-h-96 overflow-y-auto space-y-3 scrollbar-thin">
          {reportText ? (
            <div className="prose prose-invert max-w-none text-slate-300 space-y-2">
              {reportText.split("\n").map((line, i) => {
                const trimmed = line.trim();
                if (trimmed.startsWith("###")) {
                  return <h4 key={i} className="text-xs font-bold text-purple-300 mt-3 border-b border-slate-800/60 pb-1 font-display">{trimmed.replace("###", "")}</h4>;
                }
                if (trimmed.startsWith("##")) {
                  return <h3 key={i} className="text-sm font-bold text-purple-200 mt-4 border-b border-slate-850 pb-1 font-display">{trimmed.replace("##", "")}</h3>;
                }
                if (trimmed.startsWith("**")) {
                  return <p key={i} className="font-semibold text-white mt-1">{trimmed.replace(/\*\*/g, "")}</p>;
                }
                if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
                  return <li key={i} className="list-disc ml-4 text-slate-300 mt-0.5">{trimmed.substring(1).trim()}</li>;
                }
                return line === "" ? <div key={i} className="h-1" /> : <p key={i}>{line}</p>;
              })}
            </div>
          ) : (
            <div className="py-8 text-center space-y-2">
              <BookOpen className="h-6 w-6 text-slate-600 mx-auto" />
              <p className="text-slate-500 font-mono text-[11px]">Batafsil tahlil generatsiya qilinmagan.</p>
              <p className="text-slate-600 text-[10px]">Diagnostika tugmasini bosib, jurnalingiz tahlili va risk bahosini yuklang.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

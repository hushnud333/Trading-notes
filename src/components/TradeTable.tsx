/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { TradeEntry } from "../types";
import { 
  Search, Trash2, Edit2, Sparkles, TrendingUp, TrendingDown, Clock, HelpCircle, 
  Filter, RotateCcw, ChevronDown, ChevronUp, ChevronRight, MessageSquareCode, CheckCircle2, AlertTriangle, AlertCircle
} from "lucide-react";

interface TradeTableProps {
  trades: TradeEntry[];
  onDeleteTrade: (id: string) => void;
  onClearAll: () => void;
  onSelectEdit: (trade: TradeEntry) => void;
  onAnalyzeTrade: (trade: TradeEntry) => Promise<string>;
  analyzingTradeId: string | null;
}

type SortField = "timestamp" | "coin" | "price" | "total" | "status";
type SortOrder = "asc" | "desc";

export default function TradeTable({ 
  trades, 
  onDeleteTrade, 
  onClearAll, 
  onSelectEdit, 
  onAnalyzeTrade,
  analyzingTradeId
}: TradeTableProps) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  
  // Show single trade AI coach modal state
  const [aiModalTrade, setAiModalTrade] = useState<TradeEntry | null>(null);
  const [aiModalText, setAiModalText] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Clear all safety confirm state
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Handle individual trade analysis
  const handleSingleTradeCoach = async (trade: TradeEntry) => {
    setAiModalTrade(trade);
    setAiModalText("");
    setIsAiLoading(true);
    try {
      const result = await onAnalyzeTrade(trade);
      setAiModalText(result);
    } catch (err: any) {
      setAiModalText(`Xatolik yuz berdi: ${err.message || "Tahlilni yuklab bo'lmadi."}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Filter and sort trades
  const filteredTrades = trades
    .filter((t) => {
      const matchSearch = t.coin.toLowerCase().includes(search.toLowerCase().trim());
      const matchAction = actionFilter === "ALL" || t.action === actionFilter;
      const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
      return matchSearch && matchAction && matchStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === "timestamp") {
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortField === "coin") {
        comparison = a.coin.localeCompare(b.coin);
      } else if (sortField === "price") {
        comparison = a.price - b.price;
      } else if (sortField === "status") {
        comparison = a.status.localeCompare(b.status);
      } else if (sortField === "total") {
        const totalA = a.price * a.amount * a.leverage;
        const totalB = b.price * b.amount * b.leverage;
        comparison = totalA - totalB;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("uz-UZ", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderSortArrow = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? <ChevronUp className="h-3 w-3 inline ml-1 text-amber-400" /> : <ChevronDown className="h-3 w-3 inline ml-1 text-amber-400" />;
  };

  return (
    <div className="space-y-4">
      {/* Filters and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between bg-slate-900/40 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Koin nomi bo'yicha qidirish (BTC, SOL...)"
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:border-slate-700"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs bg-slate-950 text-slate-300 border border-slate-800 px-3 py-2 rounded-xl focus:outline-none"
            >
              <option value="ALL">Barcha Amallar</option>
              <option value="BUY">BUY (Ko'pkon)</option>
              <option value="SELL">SELL (Slvon)</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-950 text-slate-300 border border-slate-800 px-3 py-2 rounded-xl focus:outline-none"
          >
            <option value="ALL">Barcha Natijalar</option>
            <option value="WIN">WIN (Yutuq)</option>
            <option value="LOSS">LOSS (Zarar)</option>
            <option value="HOLD">HOLD (Kutish)</option>
          </select>

          {/* Clear Filters Button */}
          {(search || actionFilter !== "ALL" || statusFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setActionFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="p-2 text-slate-400 hover:text-white bg-slate-850 hover:bg-slate-800 rounded-xl transition"
              title="Filtrlarni tozalash"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Clear All Trades Button */}
          {trades.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-3 py-2 bg-rose-950/20 text-rose-400 hover:bg-rose-950/40 border border-rose-500/20 hover:border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Tozalash
            </button>
          )}
        </div>
      </div>

      {/* Trades Counter */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-mono text-slate-400">
          Ko'rsatilyapti: <span className="text-white font-semibold">{filteredTrades.length}</span> ta savdo
          {trades.length > filteredTrades.length && ` (jami: ${trades.length} tadan)`}
        </span>
      </div>

      {/* Main Table for Desktop / Laptop, Cards for Mobile */}
      {filteredTrades.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-slate-900/20 border border-slate-800/50">
          <AlertCircle className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-slate-300">Hech qanday savdo topilmadi</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {trades.length === 0 
              ? "Chap tomondagi tahlil shakli orqali birinchi crypto savdongizni qayd eting va monitoringni boshlang."
              : "Filtrlaringizga mos keluvchi savdo yo'q. Qidiruv so'zini o'zgartiring yoki filtrlarni tozalang."}
          </p>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-hidden bg-slate-900/30 rounded-2xl border border-slate-800/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs font-mono uppercase bg-slate-950/40">
                    <th onClick={() => handleSort("coin")} className="py-3.5 px-4 font-semibold cursor-pointer hover:text-white select-none">
                      Koin {renderSortArrow("coin")}
                    </th>
                    <th className="py-3.5 px-4 font-semibold select-none">Amal</th>
                    <th onClick={() => handleSort("price")} className="py-3.5 px-4 font-semibold cursor-pointer hover:text-white select-none text-right">
                      Narx ($) {renderSortArrow("price")}
                    </th>
                    <th className="py-3.5 px-4 font-semibold text-right select-none">Hajm & Leverage</th>
                    <th onClick={() => handleSort("total")} className="py-3.5 px-4 font-semibold cursor-pointer hover:text-white select-none text-right">
                      Umumiy Hajm {renderSortArrow("total")}
                    </th>
                    <th onClick={() => handleSort("status")} className="py-3.5 px-4 font-semibold cursor-pointer hover:text-white select-none text-center">
                      Natija {renderSortArrow("status")}
                    </th>
                    <th onClick={() => handleSort("timestamp")} className="py-3.5 px-4 font-semibold cursor-pointer hover:text-white select-none">
                      Vaqt {renderSortArrow("timestamp")}
                    </th>
                    <th className="py-3.5 px-4 font-semibold text-right">Boshqaruv</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm font-sans">
                  {filteredTrades.map((t) => {
                    const totalVal = t.price * t.amount;
                    const leveragedVal = totalVal * t.leverage;

                    return (
                      <tr key={t.id} className="hover:bg-slate-900/40 transition-all group">
                        <td className="py-3.5 px-4 font-mono font-bold text-white flex items-center gap-1.5">
                          <span className="w-1 h-4 rounded bg-amber-500"></span>
                          {t.coin}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            t.action === "BUY"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                          }`}>
                            {t.action === "BUY" ? "BUY" : "SELL"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                          ${t.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-400 text-xs">
                          <div>{t.amount} units</div>
                          <div className="text-[10px] text-amber-500/80 font-bold">L: {t.leverage}x</div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-white">
                          ${leveragedVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                            t.status === "WIN"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : t.status === "LOSS"
                                ? "bg-rose-500/20 text-rose-300"
                                : "bg-slate-800 text-slate-300"
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">
                          {formatDate(t.timestamp)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition">
                            <button
                              onClick={() => handleSingleTradeCoach(t)}
                              disabled={analyzingTradeId === t.id}
                              className="p-1.5 bg-slate-800 hover:bg-purple-950/40 text-purple-400 hover:text-purple-300 border border-slate-700 hover:border-purple-500/30 rounded-lg transition"
                              title="Gemini AI Tahlili"
                            >
                              <Sparkles className={`h-3.5 w-3.5 ${analyzingTradeId === t.id ? "animate-pulse text-yellow-400" : ""}`} />
                            </button>
                            <button
                              onClick={() => onSelectEdit(t)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg transition"
                              title="Tahrirlash"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteTrade(t.id)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 rounded-lg transition"
                              title="O'chirish"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARD VIEW */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredTrades.map((t) => {
              const totalVal = t.price * t.amount;
              const leveragedVal = totalVal * t.leverage;

              return (
                <div 
                  key={t.id} 
                  className={`p-4 rounded-xl border bg-slate-900/50 backdrop-blur-md transition-all ${
                    t.status === "WIN" 
                      ? "border-emerald-500/10 hover:border-emerald-500/30 terminal-border-glow-green" 
                      : t.status === "LOSS" 
                        ? "border-rose-500/10 hover:border-rose-500/30 terminal-border-glow-red" 
                        : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-white text-base">{t.coin}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        t.action === "BUY"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-rose-500/15 text-rose-400"
                      }`}>
                        {t.action === "BUY" ? "BUY" : "SELL"}
                      </span>
                      <span className="text-[10px] font-mono text-amber-500 bg-amber-950/30 border border-amber-950/40 px-1.5 py-0.2 rounded font-bold">
                        {t.leverage}x
                      </span>
                    </div>
                    
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      t.status === "WIN"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : t.status === "LOSS"
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-slate-800 text-slate-300"
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  {/* Mobile Stats Table */}
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-mono bg-slate-950/30 p-2.5 rounded-lg border border-slate-900/60 mb-3">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Narx</span>
                      <span className="text-slate-300 font-semibold">${t.price.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Miqdor</span>
                      <span className="text-slate-300 font-semibold">{t.amount} units</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Hajm</span>
                      <span className="text-white font-bold">${leveragedVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Vaqt</span>
                      <span className="text-slate-400 text-[10px]">{formatDate(t.timestamp)}</span>
                    </div>
                  </div>

                  {t.notes && (
                    <div className="text-xs text-slate-400 italic bg-slate-950/20 p-2 rounded border border-slate-900 mb-3.5 max-h-16 overflow-y-auto">
                      "{t.notes}"
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between border-t border-slate-800/40 pt-2.5">
                    <button
                      onClick={() => handleSingleTradeCoach(t)}
                      className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 py-1 px-2.5 bg-slate-950 border border-purple-500/10 hover:border-purple-500/30 rounded-lg transition"
                    >
                      <Sparkles className="h-3 w-3" />
                      Gemini Tahlili
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectEdit(t)}
                        className="p-1.5 bg-slate-950 text-slate-300 hover:text-white border border-slate-800 rounded-lg transition"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTrade(t.id)}
                        className="p-1.5 bg-slate-950 text-slate-400 hover:text-rose-400 border border-slate-800 rounded-lg transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* SINGLE TRADE INSTANT AI COACH DIALOG MODAL */}
      {aiModalTrade && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-purple-500/40 rounded-2xl shadow-[0_0_40px_rgba(147,51,234,0.15)] flex flex-col max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Sparkles className="h-4.5 w-4.5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold font-display text-white">Apex AI Savdo Tahlilchisi</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Setup Optimization: {aiModalTrade.coin} {aiModalTrade.action}</p>
                </div>
              </div>
              <button
                onClick={() => setAiModalTrade(null)}
                className="text-slate-400 hover:text-white text-sm bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg transition"
              >
                Yopish
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Summary card inside modal */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Koin</span>
                  <span className="text-white font-bold">{aiModalTrade.coin}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Harakat</span>
                  <span className={`font-semibold ${aiModalTrade.action === "BUY" ? "text-emerald-400" : "text-rose-400"}`}>
                    {aiModalTrade.action === "BUY" ? "BUY (Ko'pkon)" : "SELL (Slvon)"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Leverage</span>
                  <span className="text-amber-400 font-semibold">{aiModalTrade.leverage}x</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Status</span>
                  <span className="text-slate-300">{aiModalTrade.status}</span>
                </div>
              </div>

              {aiModalTrade.notes && (
                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/50">
                  <span className="text-slate-400 text-[10px] font-mono block uppercase mb-1">Mening tahlillarim (Notes):</span>
                  <p className="text-xs text-slate-300 italic">"{aiModalTrade.notes}"</p>
                </div>
              )}

              {/* AI response content */}
              <div className="border-t border-slate-800 pt-4 space-y-2">
                <span className="text-purple-400 text-xs font-mono font-semibold flex items-center gap-1 uppercase tracking-wider">
                  <Sparkles className="h-3 w-3 animate-spin" />
                  AI Coach Diagnostics:
                </span>

                {isAiLoading ? (
                  <div className="py-8 text-center space-y-3">
                    <div className="h-7 w-7 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto"></div>
                    <p className="text-xs text-purple-300 font-mono">Setup tekshirilmoqda, strategiya tayyorlanmoqda...</p>
                  </div>
                ) : (
                  <div className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/30 p-4 rounded-xl border border-slate-800 prose prose-invert max-w-none">
                    {aiModalText.split("\n").map((para, i) => (
                      <p key={i} className={para.trim() === "" ? "h-2" : "mb-2"}>
                        {para}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 text-right">
              <button
                onClick={() => setAiModalTrade(null)}
                className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-semibold py-1.5 px-4 rounded-lg transition"
              >
                Tushunarli
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR ALL SAFETY CONFIRM MODAL */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="text-center">
              <div className="h-10 w-10 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Barcha qaydlarni o'chirish?</h3>
              <p className="text-xs text-slate-400 mt-2">
                Ushbu amalni ortga qaytarib bo'lmaydi. Savdo jurnalingizdagi barcha ma'lumotlar butunlay tozalanadi.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="py-1.5 px-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 text-xs font-semibold transition"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => {
                  onClearAll();
                  setShowClearConfirm(false);
                }}
                className="py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition"
              >
                Ha, hammasini o'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

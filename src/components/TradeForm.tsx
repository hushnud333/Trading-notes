/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { TradeEntry } from "../types";
import { Coins, Flame, DollarSign, Calendar, FileText, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

interface TradeFormProps {
  onAddTrade: (trade: Omit<TradeEntry, "id" | "timestamp"> & { timestamp: string }) => void;
  editingTrade: TradeEntry | null;
  onUpdateTrade: (trade: TradeEntry) => void;
  onCancelEdit: () => void;
}

const COMMON_COINS = ["BTC", "ETH", "SOL", "XRP", "BNB", "DOGE", "NEAR"];

export default function TradeForm({ onAddTrade, editingTrade, onUpdateTrade, onCancelEdit }: TradeFormProps) {
  const [coin, setCoin] = useState("BTC");
  const [customCoin, setCustomCoin] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [action, setAction] = useState<"BUY" | "SELL">("BUY");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("1");
  const [status, setStatus] = useState<"WIN" | "LOSS" | "HOLD">("HOLD");
  const [timestamp, setTimestamp] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string>("");

  // Populate form when editing
  useEffect(() => {
    if (editingTrade) {
      if (COMMON_COINS.includes(editingTrade.coin)) {
        setCoin(editingTrade.coin);
        setIsCustom(false);
      } else {
        setCoin("CUSTOM");
        setCustomCoin(editingTrade.coin);
        setIsCustom(true);
      }
      setAction(editingTrade.action);
      setPrice(editingTrade.price.toString());
      setAmount(editingTrade.amount.toString());
      setStatus(editingTrade.status);
      setNotes(editingTrade.notes);

      // Format ISO string to datetime-local friendly format (YYYY-MM-DDTHH:MM)
      try {
        const dt = new Date(editingTrade.timestamp);
        // Correct offset for local date input
        const localISO = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setTimestamp(localISO);
      } catch (e) {
        setTimestamp(editingTrade.timestamp);
      }
    } else {
      resetForm();
    }
  }, [editingTrade]);

  // Default to local time on mount
  useEffect(() => {
    if (!editingTrade) {
      const now = new Date();
      const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setTimestamp(localISO);
    }
  }, []);

  const resetForm = () => {
    setCoin("BTC");
    setCustomCoin("");
    setIsCustom(false);
    setAction("BUY");
    setPrice("");
    setAmount("1");
    setStatus("HOLD");
    setNotes("");
    setError("");
    const now = new Date();
    const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setTimestamp(localISO);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedCoin = isCustom ? customCoin.toUpperCase().trim() : coin;
    if (!selectedCoin) {
      setError("Iltimos, koin nomini kiriting!");
      return;
    }

    const priceNum = parseFloat(price);
    const amountNum = parseFloat(amount);

    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Narx noto'g'ri kiritilgan!");
      return;
    }

    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Hajm/Miqdor noto'g'ri kiritilgan!");
      return;
    }

    setError("");

    // Convert input datetime-local value to ISO string
    const isoTimestamp = new Date(timestamp).toISOString();

    const tradeData = {
      coin: selectedCoin,
      action,
      price: priceNum,
      amount: amountNum,
      status,
      timestamp: isoTimestamp,
      notes: notes.trim(),
    };

    if (editingTrade) {
      onUpdateTrade({
        ...editingTrade,
        ...tradeData,
      });
    } else {
      onAddTrade(tradeData);
      resetForm();
    }
  };

  const handleCoinChange = (val: string) => {
    setCoin(val);
    if (val === "CUSTOM") {
      setIsCustom(true);
    } else {
      setIsCustom(false);
    }
  };

  const totalValue = (parseFloat(price) || 0) * (parseFloat(amount) || 0);

  return (
    <div className={`p-6 rounded-2xl border bg-slate-900/60 backdrop-blur-xl transition-all duration-300 ${
      editingTrade 
        ? "border-blue-500/50 terminal-border-glow-blue" 
        : action === "BUY" 
          ? "border-emerald-500/20 hover:border-emerald-500/40" 
          : "border-rose-500/20 hover:border-rose-500/40"
    }`}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold font-display tracking-wide text-white flex items-center gap-2">
          {editingTrade ? (
            <>
              <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />
              Pozitsiyani Tahrirlash
            </>
          ) : (
            <>
              <Flame className={`h-5 w-5 ${action === "BUY" ? "text-emerald-400" : "text-rose-400"}`} />
              Yangi Savdo Qayd Etish
            </>
          )}
        </h2>
        {editingTrade && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-xs px-3 py-1 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 hover:text-white transition"
          >
            Bekor qilish
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-950/30 text-rose-400 text-xs rounded-xl border border-rose-500/20 flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 animate-pulse" />
            <span>{error}</span>
          </div>
        )}
        {/* Action Selector: Buy (Ko'pkon) vs Sell (Slvon) */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Savdo Yo'nalishi</label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setAction("BUY")}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${
                action === "BUY"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${action === "BUY" ? "bg-emerald-400" : "bg-slate-500"}`}></span>
              BUY (Ko'pkon)
            </button>
            <button
              type="button"
              onClick={() => setAction("SELL")}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${
                action === "SELL"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(239,68,68,0.15)]"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${action === "SELL" ? "bg-rose-400" : "bg-slate-500"}`}></span>
              SELL (Slvon)
            </button>
          </div>
        </div>

        {/* Coin Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Koin</label>
            <div className="relative">
              <Coins className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <select
                value={coin}
                onChange={(e) => handleCoinChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 text-slate-200 text-sm rounded-xl border border-slate-800 focus:outline-none focus:border-slate-700 font-mono"
              >
                {COMMON_COINS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="CUSTOM">Boshqa...</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Koin Nomi (Custom)</label>
            <input
              type="text"
              disabled={!isCustom}
              value={isCustom ? customCoin : ""}
              onChange={(e) => setCustomCoin(e.target.value)}
              placeholder="Masalan: PEPE"
              className={`w-full px-3 py-2 text-sm bg-slate-950 rounded-xl border font-mono focus:outline-none text-white ${
                isCustom 
                  ? "border-slate-800 focus:border-slate-600" 
                  : "border-slate-900/50 bg-slate-950/40 text-slate-600 cursor-not-allowed"
              }`}
            />
          </div>
        </div>

        {/* Price and Amount */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Narx ($)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="number"
                step="any"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:border-slate-700 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Hajm / Miqdor</label>
            <input
              type="number"
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1.0"
              className="w-full px-3 py-2 text-sm bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:border-slate-700 font-mono"
            />
          </div>
        </div>

        {/* Estimated Total */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Umumiy Qiymat:</span>
            <span className="font-mono text-white font-semibold">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
          </div>
        </div>

        {/* Status selection */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Savdo Natijasi</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setStatus("WIN")}
              className={`py-1.5 px-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                status === "WIN"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-slate-950 text-slate-500 border border-slate-900 hover:text-slate-300"
              }`}
            >
              <CheckCircle2 className="h-3 w-3" />
              WIN
            </button>
            <button
              type="button"
              onClick={() => setStatus("LOSS")}
              className={`py-1.5 px-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                status === "LOSS"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : "bg-slate-950 text-slate-500 border border-slate-900 hover:text-slate-300"
              }`}
            >
              <AlertTriangle className="h-3 w-3" />
              LOSS
            </button>
            <button
              type="button"
              onClick={() => setStatus("HOLD")}
              className={`py-1.5 px-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                status === "HOLD"
                  ? "bg-slate-800 text-slate-300 border border-slate-700"
                  : "bg-slate-950 text-slate-500 border border-slate-900 hover:text-slate-300"
              }`}
            >
              <Flame className="h-3 w-3" />
              HOLD
            </button>
          </div>
        </div>

        {/* Timestamp Field */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Sana va Vaqt</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="datetime-local"
              required
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:border-slate-700 font-mono"
            />
          </div>
        </div>

        {/* Trade Notes / Setup Analysis */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Tahlil & Setup Qaydlar</label>
          <div className="relative">
            <FileText className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Masalan: RSI divergence ko'rindi. EMA 20/50 kesishuvida kirdim. MACD momentum o'syapti..."
              rows={3}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:border-slate-700 resize-none font-sans"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`w-full py-2.5 rounded-xl text-sm font-semibold tracking-wide text-white transition-all shadow-lg active:scale-95 cursor-pointer ${
            editingTrade
              ? "bg-blue-600 hover:bg-blue-500 shadow-blue-900/30"
              : action === "BUY"
                ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50"
                : "bg-rose-600 hover:bg-rose-500 shadow-rose-950/50"
          }`}
        >
          {editingTrade ? "Savdoni Yangilash" : action === "BUY" ? "KIRISh (Ko'pkon Qayd Etish)" : "ChIQISh (Slvon Qayd Etish)"}
        </button>
      </form>
    </div>
  );
}

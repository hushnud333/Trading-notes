/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PriceAlert } from "../types";
import { Bell, BellOff, Plus, Trash2, TrendingUp, TrendingDown, CheckCircle2, Volume2, AlertTriangle } from "lucide-react";

interface PriceAlertsProps {
  alerts: PriceAlert[];
  onAddAlert: (coin: 'BTC' | 'ETH' | 'SOL', condition: 'ABOVE' | 'BELOW', targetPrice: number) => void;
  onDeleteAlert: (id: string) => void;
  onToggleMute?: () => void;
  isMuted?: boolean;
  currentPrices: { BTC: number; ETH: number; SOL: number };
}

export default function PriceAlerts({
  alerts,
  onAddAlert,
  onDeleteAlert,
  onToggleMute,
  isMuted = false,
  currentPrices
}: PriceAlertsProps) {
  const [coin, setCoin] = useState<'BTC' | 'ETH' | 'SOL'>('BTC');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [targetPrice, setTargetPrice] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(targetPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert("Iltimos, to'g'ri nishon narxini kiriting!");
      return;
    }
    onAddAlert(coin, condition, priceNum);
    setTargetPrice("");
  };

  const handleSetQuickPrice = (percentage: number) => {
    const curPrice = currentPrices[coin];
    if (!curPrice) return;
    const factor = 1 + (condition === 'ABOVE' ? percentage : -percentage) / 100;
    setTargetPrice((curPrice * factor).toFixed(2));
  };

  return (
    <div className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold font-display uppercase tracking-wider text-white flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-500 animate-swing" />
          Narx Signallari (Alerts)
        </h2>
        {onToggleMute && (
          <button
            onClick={onToggleMute}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
            title={isMuted ? "Ovozni yoqish" : "Ovozni o'chirish"}
          >
            {isMuted ? <BellOff className="h-3.5 w-3.5 text-rose-400" /> : <Volume2 className="h-3.5 w-3.5 text-emerald-400" />}
          </button>
        )}
      </div>

      {/* Quick Info & Price Reference */}
      <div className="grid grid-cols-3 gap-2 p-2 bg-slate-950/80 rounded-xl border border-slate-900 font-mono text-[10px]">
        <div>
          <span className="text-slate-500 block uppercase">BTC</span>
          <span className="text-white font-semibold">${currentPrices.BTC.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
        </div>
        <div>
          <span className="text-slate-500 block uppercase">ETH</span>
          <span className="text-white font-semibold">${currentPrices.ETH.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
        </div>
        <div>
          <span className="text-slate-500 block uppercase">SOL</span>
          <span className="text-white font-semibold">${currentPrices.SOL.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3 pt-1">
        <div className="grid grid-cols-3 gap-2">
          {/* Coin Select */}
          <select
            value={coin}
            onChange={(e) => setCoin(e.target.value as 'BTC' | 'ETH' | 'SOL')}
            className="px-2 py-1.5 bg-slate-950 text-slate-300 text-xs rounded-lg border border-slate-800 focus:outline-none"
          >
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
            <option value="SOL">SOL</option>
          </select>

          {/* Condition Select */}
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as 'ABOVE' | 'BELOW')}
            className="px-2 py-1.5 bg-slate-950 text-slate-300 text-xs rounded-lg border border-slate-800 focus:outline-none"
          >
            <option value="ABOVE">≥ (Tepada)</option>
            <option value="BELOW">≤ (Pastda)</option>
          </select>

          {/* Price Input */}
          <input
            type="number"
            step="any"
            required
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            placeholder="Nishon ($)"
            className="px-2 py-1.5 bg-slate-950 text-white text-xs rounded-lg border border-slate-800 focus:outline-none font-mono"
          />
        </div>

        {/* Quick Percent Buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-slate-500 uppercase font-mono">Tezkor:</span>
          {[0.1, 0.5, 1.0].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => handleSetQuickPrice(pct)}
              className="text-[9px] px-2 py-0.5 bg-slate-950 hover:bg-slate-850 hover:text-white border border-slate-900 rounded-md text-slate-400 font-mono"
            >
              {condition === 'ABOVE' ? '+' : '-'}{pct}%
            </button>
          ))}
        </div>

        {/* Add Button */}
        <button
          type="submit"
          className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold tracking-wide transition flex items-center justify-center gap-1 cursor-pointer active:scale-98"
        >
          <Plus className="h-3.5 w-3.5 stroke-[3]" />
          Signal O'rnatish
        </button>
      </form>

      {/* Alerts List */}
      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
        {alerts.length === 0 ? (
          <div className="text-center py-4 text-slate-500 text-[11px] font-mono">
            Signallar o'rnatilmagan
          </div>
        ) : (
          alerts.map((alert) => {
            const isTargetMet = alert.triggered;
            return (
              <div
                key={alert.id}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-mono border transition-all ${
                  isTargetMet
                    ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400"
                    : "bg-slate-950/60 border-slate-900 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{alert.coin}</span>
                  <span className="text-[10px] text-slate-500">
                    {alert.condition === "ABOVE" ? "≥" : "≤"}
                  </span>
                  <span className={isTargetMet ? "text-emerald-400 font-bold" : "text-amber-400 font-semibold"}>
                    ${alert.targetPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                  {isTargetMet && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-emerald-500/10 px-1 py-0.2 rounded uppercase text-emerald-400">
                      Met
                    </span>
                  )}
                </div>

                <button
                  onClick={() => onDeleteAlert(alert.id)}
                  className="p-1 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded transition"
                  title="O'chirish"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

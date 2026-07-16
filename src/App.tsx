/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { TradeEntry, ChatMessage, PriceAlert } from "./types";
import TradeForm from "./components/TradeForm";
import TradeTable from "./components/TradeTable";
import AnalyticsPanel from "./components/AnalyticsPanel";
import GeminiChat from "./components/GeminiChat";
import PriceAlerts from "./components/PriceAlerts";
import { 
  Sparkles, TrendingUp, BookOpen, LineChart, MessageSquare, Flame, 
  HelpCircle, ChevronRight, LayoutDashboard, Database, Radio, RefreshCw,
  Bell, Volume2, BellOff, X
} from "lucide-react";

// Safe localStorage wrapper to prevent crash in sandboxed iframes or private windows (e.g. in Firefox)
const memoryStorage: Record<string, string> = {};
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`[safeStorage] getItem failed for key "${key}":`, e);
      return memoryStorage[key] || null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[safeStorage] setItem failed for key "${key}":`, e);
      memoryStorage[key] = value;
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[safeStorage] removeItem failed for key "${key}":`, e);
      delete memoryStorage[key];
    }
  }
};

export default function App() {
  const [trades, setTrades] = useState<TradeEntry[]>([]);
  const [editingTrade, setEditingTrade] = useState<TradeEntry | null>(null);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Diagnostics Cache
  const [cachedDiagnostics, setCachedDiagnostics] = useState<string>("");

  // Price Alerts State
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [activeAlertTrigger, setActiveAlertTrigger] = useState<PriceAlert | null>(null);

  // UI state: 'JOURNAL' | 'ANALYTICS' | 'COACH'
  const [activeTab, setActiveTab] = useState<"JOURNAL" | "ANALYTICS" | "COACH">("JOURNAL");
  const [isCoachOpen, setIsCoachOpen] = useState(false); // Collapsible drawer on desktop
  const [analyzingTradeId, setAnalyzingTradeId] = useState<string | null>(null);

  // Live Crypto Prices Ticker (Mock WebSocket feed for beautiful terminal experience)
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({
    BTC: 91450.80,
    ETH: 2580.40,
    SOL: 182.15,
  });

  const btcPrice = currentPrices.BTC || 91450.80;
  const ethPrice = currentPrices.ETH || 2580.40;
  const solPrice = currentPrices.SOL || 182.15;

  useEffect(() => {
    // Load data from LocalStorage
    const savedTrades = safeStorage.getItem("apex_trading_trades");
    const savedChat = safeStorage.getItem("apex_trading_chat");
    const savedDiagnostics = safeStorage.getItem("apex_trading_diagnostics");
    const savedAlerts = safeStorage.getItem("apex_trading_alerts");

    if (savedTrades) {
      try {
        setTrades(JSON.parse(savedTrades));
      } catch (e) {
        console.error("Error parsing saved trades:", e);
      }
    } else {
      // Seed initial dummy crypto journal setup for first-time premium feeling
      const initialSeed: TradeEntry[] = [
        {
          id: "seed_1",
          coin: "BTC",
          action: "BUY",
          price: 90200.00,
          amount: 0.15,
          status: "WIN",
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), // 24 hours ago
          notes: "Daily support level test at $90k. EMA 50 holding strong on 1H chart. Confirmed entry after bullish pinbar closed.",
        },
        {
          id: "seed_2",
          coin: "SOL",
          action: "SELL",
          price: 185.50,
          amount: 50,
          status: "LOSS",
          timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
          notes: "Breakout attempt above key resistance level of $185. Fakeout triggered stop loss early before dumping. Lesson: wait for volume confirmation.",
        }
      ];
      setTrades(initialSeed);
      safeStorage.setItem("apex_trading_trades", JSON.stringify(initialSeed));
    }

    if (savedChat) {
      try {
        setChatMessages(JSON.parse(savedChat));
      } catch (e) {
        console.error("Error parsing saved chat messages:", e);
      }
    }

    if (savedDiagnostics) {
      setCachedDiagnostics(savedDiagnostics);
    }

    if (savedAlerts) {
      try {
        setPriceAlerts(JSON.parse(savedAlerts));
      } catch (e) {
        console.error("Error parsing saved alerts:", e);
      }
    } else {
      // Seed some dummy initial alerts slightly above/below current mock prices so they can see triggers easily!
      const initialAlerts: PriceAlert[] = [
        {
          id: "alert_1",
          coin: "BTC",
          condition: "ABOVE",
          targetPrice: 91480.00,
          triggered: false,
          createdAt: new Date().toISOString()
        },
        {
          id: "alert_2",
          coin: "SOL",
          condition: "BELOW",
          targetPrice: 181.80,
          triggered: false,
          createdAt: new Date().toISOString()
        }
      ];
      setPriceAlerts(initialAlerts);
      safeStorage.setItem("apex_trading_alerts", JSON.stringify(initialAlerts));
    }

    // Tick mockup prices for live feed feeling
    const timer = setInterval(() => {
      setCurrentPrices((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((coin) => {
          const currentVal = updated[coin];
          const tickSize = currentVal * 0.0005; // 0.05% max change per tick
          updated[coin] = currentVal + (Math.random() - 0.5) * tickSize * 2;
        });
        return updated;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  // Track and initialize live prices for custom coins logged in the journal
  useEffect(() => {
    setCurrentPrices((prev) => {
      const updated = { ...prev };
      let hasChanges = false;
      trades.forEach((t) => {
        if (!updated[t.coin]) {
          updated[t.coin] = t.price;
          hasChanges = true;
        }
      });
      return hasChanges ? updated : prev;
    });
  }, [trades]);

  // CRUD implementation
  const handleAddTrade = (newTradeData: Omit<TradeEntry, "id">) => {
    const newEntry: TradeEntry = {
      ...newTradeData,
      id: "trade_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    };
    const updated = [newEntry, ...trades];
    setTrades(updated);
    safeStorage.setItem("apex_trading_trades", JSON.stringify(updated));
  };

  const handleDeleteTrade = (id: string) => {
    const updated = trades.filter((t) => t.id !== id);
    setTrades(updated);
    safeStorage.setItem("apex_trading_trades", JSON.stringify(updated));
    if (editingTrade?.id === id) {
      setEditingTrade(null);
    }
  };

  const handleClearAll = () => {
    setTrades([]);
    setEditingTrade(null);
    safeStorage.setItem("apex_trading_trades", JSON.stringify([]));
    // Also clear diagnostics when clearing journal
    setCachedDiagnostics("");
    safeStorage.removeItem("apex_trading_diagnostics");
  };

  const handleUpdateTrade = (updatedTrade: TradeEntry) => {
    const updated = trades.map((t) => (t.id === updatedTrade.id ? updatedTrade : t));
    setTrades(updated);
    safeStorage.setItem("apex_trading_trades", JSON.stringify(updated));
    setEditingTrade(null);
  };

  // API Call: Chat Send Message
  const handleSendMessage = async (msgText: string) => {
    const userMsg: ChatMessage = {
      id: "msg_user_" + Date.now(),
      role: "user",
      content: msgText,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    safeStorage.setItem("apex_trading_chat", JSON.stringify(newMessages));
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msgText, history: chatMessages }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Ulanishda xatolik yuz berdi.");
      }

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: "msg_ai_" + Date.now(),
        role: "model",
        content: data.content,
        timestamp: data.timestamp || new Date().toISOString(),
      };

      const finalMessages = [...newMessages, aiMsg];
      setChatMessages(finalMessages);
      safeStorage.setItem("apex_trading_chat", JSON.stringify(finalMessages));
    } catch (err: any) {
      console.error("Chat fetch error:", err);
      // Append temporary error message so user has feedback
      const errMsg: ChatMessage = {
        id: "msg_err_" + Date.now(),
        role: "model",
        content: `⚠️ Xatolik yuz berdi: ${err.message || "Ulanishda muammo. Iltimos, server va kalitni tekshiring."}`,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleClearChat = () => {
    setChatMessages([]);
    safeStorage.removeItem("apex_trading_chat");
  };

  // API Call: Portfolio Diagnostics
  const handleGenerateDiagnostics = async (): Promise<string> => {
    try {
      const response = await fetch("/api/analyze-journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trades }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Portfel diagnostikasini olishda xatolik.");
      }

      const data = await response.json();
      setCachedDiagnostics(data.analysis);
      safeStorage.setItem("apex_trading_diagnostics", data.analysis);
      return data.analysis;
    } catch (err: any) {
      console.error("Diagnostics error:", err);
      throw err;
    }
  };

  // API Call: Single Trade Diagnostics
  const handleAnalyzeTrade = async (trade: TradeEntry): Promise<string> => {
    setAnalyzingTradeId(trade.id);
    try {
      const response = await fetch("/api/analyze-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trade }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Savdo tahlilini olishda xatolik.");
      }

      const data = await response.json();
      
      // Optionally cache the analysis on the trade object
      const updatedTrades = trades.map((t) => {
        if (t.id === trade.id) {
          return { ...t, aiAnalysis: data.analysis };
        }
        return t;
      });
      setTrades(updatedTrades);
      safeStorage.setItem("apex_trading_trades", JSON.stringify(updatedTrades));

      return data.analysis;
    } catch (err: any) {
      console.error("Single trade analysis error:", err);
      throw err;
    } finally {
      setAnalyzingTradeId(null);
    }
  };

  // Price Alert Sound synthesis using Web Audio API
  const playAlertSound = () => {
    if (isMuted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 tone
      osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.35); // ramp up for alert feel

      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn("Audio Context trigger blocked or unsupported:", e);
    }
  };

  const getCurrentPrice = (coin: 'BTC' | 'ETH' | 'SOL') => {
    if (coin === 'BTC') return btcPrice;
    if (coin === 'ETH') return ethPrice;
    return solPrice;
  };

  // Alert CRUD
  const handleAddPriceAlert = (coin: 'BTC' | 'ETH' | 'SOL', condition: 'ABOVE' | 'BELOW', targetPrice: number) => {
    // Request permission for push notifications
    try {
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    } catch (e) {
      console.warn("Notification permission request failed or is blocked in this browser:", e);
    }

    const newAlert: PriceAlert = {
      id: "alert_" + Date.now() + "_" + Math.floor(Math.random() * 100),
      coin,
      condition,
      targetPrice,
      triggered: false,
      createdAt: new Date().toISOString()
    };

    const updated = [newAlert, ...priceAlerts];
    setPriceAlerts(updated);
    safeStorage.setItem("apex_trading_alerts", JSON.stringify(updated));
  };

  const handleDeletePriceAlert = (id: string) => {
    const updated = priceAlerts.filter((a) => a.id !== id);
    setPriceAlerts(updated);
    safeStorage.setItem("apex_trading_alerts", JSON.stringify(updated));
    if (activeAlertTrigger?.id === id) {
      setActiveAlertTrigger(null);
    }
  };

  // Monitor Live Prices and Trigger Alerts
  useEffect(() => {
    const activeAlerts = priceAlerts.filter(a => !a.triggered);
    if (activeAlerts.length === 0) return;

    const prices = { BTC: btcPrice, ETH: ethPrice, SOL: solPrice };
    let triggeredAlert: PriceAlert | null = null;
    let hasChanges = false;

    const updatedAlerts = priceAlerts.map((alert) => {
      if (alert.triggered) return alert;

      const currentPrice = prices[alert.coin];
      const isConditionMet = alert.condition === "ABOVE"
        ? currentPrice >= alert.targetPrice
        : currentPrice <= alert.targetPrice;

      if (isConditionMet) {
        triggeredAlert = { ...alert, triggered: true };
        hasChanges = true;
        return triggeredAlert;
      }
      return alert;
    });

    if (hasChanges && triggeredAlert) {
      setPriceAlerts(updatedAlerts);
      safeStorage.setItem("apex_trading_alerts", JSON.stringify(updatedAlerts));
      setActiveAlertTrigger(triggeredAlert);
      playAlertSound();

      // Trigger Browser Notification safely
      try {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`🚨 Apex Signal: ${triggeredAlert.coin} hit ${triggeredAlert.condition === 'ABOVE' ? '≥' : '≤'} $${triggeredAlert.targetPrice}`, {
            body: `Hozirgi narx: $${prices[triggeredAlert.coin].toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          });
        }
      } catch (e) {
        console.warn("Desktop Notification trigger failed or is blocked in this browser:", e);
      }
    }
  }, [btcPrice, ethPrice, solPrice, priceAlerts, isMuted]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col antialiased selection:bg-purple-600 selection:text-white">
      {/* Floating Active Price Alert visual highlight banner */}
      {activeAlertTrigger && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-[#0b0f19] border-2 border-amber-500 rounded-2xl p-4 shadow-[0_0_25px_rgba(245,158,11,0.25)] flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Bell className="h-5 w-5 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">Apex Price Alert!</h3>
              <button
                onClick={() => setActiveAlertTrigger(null)}
                className="text-slate-500 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm font-bold text-white mt-1">
              {activeAlertTrigger.coin} hit {activeAlertTrigger.condition === 'ABOVE' ? '≥' : '≤'} ${activeAlertTrigger.targetPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-emerald-400 font-mono mt-0.5">
              Hozirgi: ${activeAlertTrigger.coin === 'BTC' ? btcPrice.toLocaleString(undefined, { maximumFractionDigits: 2 }) : activeAlertTrigger.coin === 'ETH' ? ethPrice.toLocaleString(undefined, { maximumFractionDigits: 2 }) : solPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <div className="mt-2.5 flex justify-end">
              <button
                onClick={() => setActiveAlertTrigger(null)}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded-lg tracking-wider transition uppercase"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Trading Ticker bar */}
      <div className="bg-[#0b0f19] border-b border-slate-900 px-4 py-2 flex items-center justify-between text-xs overflow-x-auto scrollbar-none font-mono">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
            <span className="text-slate-500 text-[10px] uppercase">Live Feeds:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold">BTC/USDT</span>
            <span className="text-emerald-400 font-semibold">${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold">ETH/USDT</span>
            <span className="text-emerald-400 font-semibold">${ethPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold">SOL/USDT</span>
            <span className="text-emerald-400 font-semibold">${solPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-500 uppercase">
          <Database className="h-3.5 w-3.5 text-slate-500" />
          <span>Local Storage: Sync Active</span>
        </div>
      </div>

      {/* Main Header navigation */}
      <header className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-md border-b border-slate-900 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(217,119,6,0.15)]">
            <Flame className="h-5.5 w-5.5 text-white" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold font-display tracking-tight text-white leading-none">Apex Trader</h1>
            <p className="text-[10px] md:text-xs text-slate-400 font-mono">Crypto Journal & AI Intelligence</p>
          </div>
        </div>

        {/* Responsive view buttons */}
        <div className="flex items-center gap-1.5">
          {/* Main Views Toggles */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-900">
            <button
              onClick={() => setActiveTab("JOURNAL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === "JOURNAL"
                  ? "bg-slate-900 text-white border border-slate-800"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Journal</span>
            </button>
            <button
              onClick={() => setActiveTab("ANALYTICS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === "ANALYTICS"
                  ? "bg-slate-900 text-white border border-slate-800"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LineChart className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Diagnostics & Stats</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("COACH");
                setIsCoachOpen(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === "COACH"
                  ? "bg-slate-900 text-white border border-slate-800"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 text-purple-400" />
              <span className="hidden sm:inline">Apex AI Coach</span>
              {chatMessages.length > 0 && (
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
              )}
            </button>
          </div>

          {/* Quick sliding toggle on Large screens */}
          <button
            onClick={() => setIsCoachOpen(!isCoachOpen)}
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-slate-950 border border-slate-900 hover:border-slate-800 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            Coach Panel
            <span className={`text-[10px] font-mono px-1.5 py-0.2 bg-slate-900 rounded ${isCoachOpen ? "text-emerald-400" : "text-slate-500"}`}>
              {isCoachOpen ? "ON" : "OFF"}
            </span>
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT/CENTER WORKSPACE COLUMN (Tabs & Grid Layout) */}
          <div className={`space-y-6 ${isCoachOpen ? "lg:col-span-8" : "lg:col-span-12"} min-w-0 transition-all duration-300`}>
            
            {/* View Tab 1: Journal Log */}
            {activeTab === "JOURNAL" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Form & Alerts column */}
                <div className="md:col-span-4 space-y-6">
                  <TradeForm
                    onAddTrade={handleAddTrade}
                    editingTrade={editingTrade}
                    onUpdateTrade={handleUpdateTrade}
                    onCancelEdit={() => setEditingTrade(null)}
                  />
                  <PriceAlerts
                    alerts={priceAlerts}
                    onAddAlert={handleAddPriceAlert}
                    onDeleteAlert={handleDeletePriceAlert}
                    onToggleMute={() => setIsMuted(!isMuted)}
                    isMuted={isMuted}
                    currentPrices={{ BTC: btcPrice, ETH: ethPrice, SOL: solPrice }}
                  />
                </div>

                {/* Table column */}
                <div className="md:col-span-8 space-y-4">
                  <TradeTable
                    trades={trades}
                    onDeleteTrade={handleDeleteTrade}
                    onClearAll={handleClearAll}
                    onSelectEdit={setEditingTrade}
                    onAnalyzeTrade={handleAnalyzeTrade}
                    analyzingTradeId={analyzingTradeId}
                    currentPrices={currentPrices}
                  />
                </div>
              </div>
            )}

            {/* View Tab 2: Analytics & AI Diagnostics */}
            {activeTab === "ANALYTICS" && (
              <AnalyticsPanel
                trades={trades}
                onGenerateDiagnostics={handleGenerateDiagnostics}
                cachedDiagnostics={cachedDiagnostics}
                currentPrices={currentPrices}
              />
            )}

            {/* View Tab 3: Dedicated Full-screen Coach on Mobile */}
            {activeTab === "COACH" && (
              <div className="block lg:hidden h-[60vh]">
                <GeminiChat
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  isChatLoading={isChatLoading}
                  onClearChat={handleClearChat}
                />
              </div>
            )}
          </div>

          {/* RIGHT FLOATING/COLLAPSIBLE SIDEBAR: AI Trading Coach (Desktop view only) */}
          {isCoachOpen && (
            <div className="hidden lg:block lg:col-span-4 h-[75vh] sticky top-24">
              <GeminiChat
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                isChatLoading={isChatLoading}
                onClearChat={handleClearChat}
              />
            </div>
          )}

        </div>
      </main>

      {/* Modern, clean footer */}
      <footer className="border-t border-slate-900 bg-slate-950/40 py-6 mt-12 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>Apex Crypto Terminal © 2026. All Rights Reserved.</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Powered by Gemini 3.5 Flash</span>
            <Sparkles className="h-3 w-3 text-purple-400 animate-pulse" />
          </div>
        </div>
      </footer>

      {/* Visual Alert Highlight Overlay / Banner Toast */}
      {activeAlertTrigger && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl border border-amber-500/30 bg-slate-900/95 backdrop-blur-md shadow-[0_4px_24px_rgba(245,158,11,0.2)] max-w-sm flex items-start gap-3 animate-bounce">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
            <Bell className="h-5 w-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">Price Alert Met</h3>
            <p className="text-sm font-semibold text-white mt-1">
              {activeAlertTrigger.coin} passed its target of ${activeAlertTrigger.targetPrice.toLocaleString()}!
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Current mock price: ${getCurrentPrice(activeAlertTrigger.coin).toLocaleString()}
            </p>
          </div>
          <button 
            onClick={() => setActiveAlertTrigger(null)}
            className="p-1 hover:bg-slate-850 rounded transition text-slate-500 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

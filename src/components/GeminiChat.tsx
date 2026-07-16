/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../types";
import { Send, Sparkles, User, Terminal, Trash2, HelpCircle } from "lucide-react";

interface GeminiChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isChatLoading: boolean;
  onClearChat: () => void;
}

const QUICK_PROMPTS = [
  "RSI indikatori bo'yicha RSI divergenceni qanday aniqlayman?",
  "Trading jurnali yuritishning qanday psixologik foydalari bor?",
  "Crypto savdoda Stop-Loss darajasini o'rnatish qoidalari qanday?",
  "Foyda nisbatini (Risk-to-Reward) optimallashtirish bo'yicha maslahat ber",
];

export default function GeminiChat({ messages, onSendMessage, isChatLoading, onClearChat }: GeminiChatProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isChatLoading) return;

    const messageToSend = input.trim();
    setInput("");
    await onSendMessage(messageToSend);
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isChatLoading) return;
    onSendMessage(prompt);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden backdrop-blur-xl">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold font-display text-white">Apex AI Coach</h3>
            <p className="text-[10px] text-slate-400 font-mono">Faol chat (models/gemini-3.5-flash)</p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={onClearChat}
            className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded-lg transition"
            title="Chat tarixini tozalash"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[500px] scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-6 px-4 space-y-4">
            <div className="h-10 w-10 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-300 font-display">Crypto Trading Murabbiyi</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Sizning crypto savdolaringiz, RSI/MACD setup tahlillari va risk boshqaruvi bo'yicha maslahatlar bera oladigan shaxsiy yordamchi.
              </p>
            </div>

            {/* Quick Prompts Grid */}
            <div className="w-full space-y-2 pt-2">
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider text-left">Quick Prompts:</p>
              <div className="grid grid-cols-1 gap-1.5 text-left">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="text-xs p-2.5 bg-slate-950/60 hover:bg-slate-950 text-slate-400 hover:text-purple-300 rounded-xl border border-slate-900 hover:border-purple-500/20 transition cursor-pointer text-left block"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] ${
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {/* Avatar */}
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                  msg.role === "user"
                    ? "bg-slate-800 text-slate-300 border-slate-700"
                    : "bg-purple-950/40 text-purple-400 border-purple-500/20"
                }`}>
                  {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : <Terminal className="h-3.5 w-3.5" />}
                </div>

                {/* Message Bubble */}
                <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-purple-600 text-white rounded-tr-none"
                    : "bg-slate-950 text-slate-300 rounded-tl-none border border-slate-850/60"
                }`}>
                  <div className="prose prose-invert max-w-none text-xs font-sans whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}

            {isChatLoading && (
              <div className="flex gap-2.5 mr-auto max-w-[85%]">
                <div className="h-7 w-7 rounded-lg bg-purple-950/40 text-purple-400 border border-purple-500/20 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Terminal className="h-3.5 w-3.5" />
                </div>
                <div className="bg-slate-950 p-3 rounded-2xl rounded-tl-none border border-slate-850/60 flex items-center gap-1.5 py-3 px-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Quick advice notice at bottom of history */}
      {messages.length > 0 && (
        <div className="px-4 py-1 border-t border-slate-800/40 bg-slate-950/30 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none scroll-smooth">
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Mavzular:</span>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickPrompt(prompt)}
              disabled={isChatLoading}
              className="text-[10px] px-2.5 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-purple-300 rounded-lg transition font-medium"
            >
              {prompt.slice(0, 32)}...
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-950/50 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isChatLoading ? "Murabbiy javob bermoqda..." : "RSI haqida so'rang yoki setup kiritib tahlil so'rang..."}
          disabled={isChatLoading}
          className="flex-1 px-3.5 py-2 bg-slate-950 text-slate-200 text-xs rounded-xl border border-slate-800 focus:outline-none focus:border-purple-500/50 font-sans"
        />
        <button
          type="submit"
          disabled={!input.trim() || isChatLoading}
          className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

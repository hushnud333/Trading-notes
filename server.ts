/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK safely
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI features will be unavailable.");
}

// Helper to check AI availability
function checkAI(res: express.Response): boolean {
  if (!ai) {
    res.status(503).json({
      error: "Gemini API service is not configured. Please add your GEMINI_API_KEY in the Secrets panel.",
    });
    return false;
  }
  return true;
}

// 1. API: Multi-turn Chatbot Interface
app.post("/api/chat", async (req, res) => {
  if (!checkAI(res)) return;

  try {
    const { message, history } = req.body;

    if (!message) {
      res.status(400).json({ error: "Message is required." });
      return;
    }

    // Convert history to Gemini format
    const contents = (history || []).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Append current user message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await ai!.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: `You are a professional Crypto Trading Coach and Analyst named Apex AI. 
You help users analyze crypto market setups, trade psychology, risk management, indicators (like RSI, MACD, EMA), and specific trade entries in Uzbek (Uzbek slang if requested) or English (match the language of the user's message).
Offer educational, high-precision technical feedback on their trade setups.
Keep your tone analytical, encouraging, and direct. Use structured lists and markdown. 
Always include a brief polite disclaimer that you provide educational analysis, not financial advice.`,
      },
    });

    res.json({
      content: response.text || "I was unable to formulate a response. Please try again.",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during your request." });
  }
});

// 2. API: Entire Journal Portfolio Intelligence & Diagnostics
app.post("/api/analyze-journal", async (req, res) => {
  if (!checkAI(res)) return;

  try {
    const { trades } = req.body;

    if (!trades || !Array.isArray(trades)) {
      res.status(400).json({ error: "Trades data is required." });
      return;
    }

    if (trades.length === 0) {
      res.json({
        analysis: "Your trading journal is currently empty. Add some trades with coins, prices, action types (Buy/Ko'pkon, Sell/Slvon), and notes to generate personalized AI-powered portfolio insights!",
      });
      return;
    }

    // Format the trades journal into readable text for Gemini
    const journalText = trades
      .map((t: any, index: number) => {
        return `Trade #${index + 1}:
- Coin: ${t.coin}
- Action: ${t.action} (Price: $${t.price})
- Position Size: ${t.amount || 1} units
- Leverage: ${t.leverage || 1}x
- Status: ${t.status}
- Notes: ${t.notes || "No custom setup notes provided"}
- Time: ${t.timestamp}`;
      })
      .join("\n\n");

    const response = await ai!.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Please analyze the following crypto trading journal and provide a concise, high-value dashboard diagnostic report.
      
Here are the trades:
${journalText}

Structure your diagnostic report with the following clean markdown sections:
1. **📊 Portfolio Overview & Win/Loss Diagnostics**: Summarize the performance, highlight which action or coins are most/least profitable, and flag leverage risks.
2. **⚠️ Risk Management & Setup Flaws**: Identify any psychological traps, bad setups, or inconsistent leverage.
3. **💡 Strategic AI Suggestions**: Give 3 direct, actionable rules or techniques the trader should adopt immediately based on this data.
4. **🧠 Peak Performance Recommendation**: Provide a tailored mindset exercise or trading ruleset for this trader.

Keep the report encouraging but firm, using highly professional trading desk vocabulary. Match the user's preferred language (blend English and Uzbek trading slang like "Ko'pkon" and "Slvon" to be friendly and native!).`,
    });

    res.json({
      analysis: response.text || "AI Diagnostics failed to generate.",
    });
  } catch (error: any) {
    console.error("Gemini Journal Analysis Error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze your journal." });
  }
});

// 3. API: Single Trade Instant Setup Coach
app.post("/api/analyze-trade", async (req, res) => {
  if (!checkAI(res)) return;

  try {
    const { trade } = req.body;

    if (!trade) {
      res.status(400).json({ error: "Trade data is required." });
      return;
    }

    const response = await ai!.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Analyze this specific trade setup and provide an instant optimization coach review.

Trade Setup:
- Coin: ${trade.coin}
- Action: ${trade.action} (Buy/Ko'pkon or Sell/Slvon)
- Entry Price: $${trade.price}
- Size: ${trade.amount || 1} units (Leverage: ${trade.leverage || 1}x)
- Status: ${trade.status}
- Trader's Analysis Notes: "${trade.notes}"

Generate a short 1-2 paragraph review of this setup. Estimate if the trader used technical indicators wisely, suggest standard Stop-Loss and Take-Profit zones for this setup (assuming standard supports/resistances), and evaluate the overall risk score (1 to 10 scale). Be clear, technical, and helpful.`,
    });

    res.json({
      analysis: response.text || "Setup review failed to generate.",
    });
  } catch (error: any) {
    console.error("Gemini Single Trade Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate setup feedback." });
  }
});

// Vite / static file middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Crypto Trading Journal & Notes Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

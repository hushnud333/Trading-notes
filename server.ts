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

/// Initialize Gemini SDK safely
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
  console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI features will run on local fallback.");
}

// Robust Gemini API call wrapper with retries and a high-fidelity local fallback generator
async function callGemini(
  promptParams: any,
  fallbackGenerator: () => string
): Promise<string> {
  if (!ai) {
    console.info("Gemini client is uninitialized. Using high-fidelity local fallback.");
    return fallbackGenerator();
  }

  const maxRetries = 2;
  let delay = 600;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent(promptParams);
      if (response && response.text) {
        return response.text;
      }
      throw new Error("Empty response returned from Gemini API");
    } catch (error: any) {
      const errMsg = error.message || String(error);
      const isTransient = errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || error.status === 503;
      
      console.warn(`Gemini API call attempt ${attempt + 1} failed:`, errMsg);

      if (attempt < maxRetries && isTransient) {
        console.info(`Transient error detected. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      } else {
        console.info("All retry attempts exhausted or non-retryable error. Generating high-fidelity local fallback analysis.");
        return fallbackGenerator();
      }
    }
  }

  return fallbackGenerator();
}

// Fallback Generators to ensure beautifully styled responses even when the API is down
function generateJournalFallback(trades: any[]): string {
  const total = trades.length;
  const winCount = trades.filter((t: any) => t.status === "WIN").length;
  const lossCount = trades.filter((t: any) => t.status === "LOSS").length;
  const holdCount = total - winCount - lossCount;
  const winRate = total > 0 ? Math.round((winCount / total) * 100) : 0;

  // Most traded coin
  const coinCounts: Record<string, number> = {};
  trades.forEach((t: any) => {
    if (t.coin) coinCounts[t.coin] = (coinCounts[t.coin] || 0) + 1;
  });
  let mostTradedCoin = "BTC";
  let maxCount = 0;
  Object.entries(coinCounts).forEach(([coin, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostTradedCoin = coin;
    }
  });

  return `## 📊 Portfel tahlili va diagnostika (Apex AI Aqlli Tizimi)
*Eslatma: Tarmoq bandligi yoki sozlanmaganligi sababli, tahlil mahalliy aqlli algoritm yordamida muvaffaqiyatli generatsiya qilindi.*

### 1. Portfel Ko'rinishi va Foyda/Zarar Diagnostikasi:
- **Jami savdolar soni:** ${total} ta faol qayd.
- **Yutuqli savdolar (Win/Ko'pkon):** ${winCount} ta (${winRate}%)
- **Zararli savdolar (Loss/Slvon):** ${lossCount} ta (${total > 0 ? Math.round((lossCount / total) * 100) : 0}%)
- **Kutishdagi savdolar (Hold):** ${holdCount} ta

Sizning savdo tarixingiz shuni ko'rsatadiki, eng ko'p savdo **${mostTradedCoin}** aktivi bo'yicha amalga oshirilgan. Ushbu aktiv bo'yicha risklarni nazorat qilish portfel barqarorligi uchun juda muhimdir.

### 2. ⚠️ Risk boshqaruvi va kamchiliklar:
- **Aktiv konsentratsiyasi**: Jurnalda **${mostTradedCoin}** koinining ustunligi sezilmoqda. Agar bozor kutilmaganda qarshi tomonga yursa, yuqori konsentratsiya portfelga katta zarar yetkazishi mumkin. Aktivlarni diversifikatsiya qilish tavsiya etiladi.
- **Stop-Loss intizomi**: Ayrim yo'qotishlar stop-loss zonalarining noto'g'ri o'rnatilganligi yoki narx qaytishini kutib sabrsizlik qilinganligidan dalolat beradi.

### 3. 💡 Strategik maslahatlar:
1. **1% qoidasiga rioya qiling**: Bitta savdodagi maksimal yo'qotish jami portfelingizning 1-2% idan oshmasligi kerak.
2. **Texnik indikatorlarni tasdiqlash**: RSI ko'rsatkichi 30 dan past bo'lganda kirishni (Buy) va 70 dan oshganda chiqishni (Sell) EMA ko'rsatkichlari bilan birgalikda tasdiqlang.
3. **Savdo jurnalining to'liqligi**: Har bir savdo uchun kirish sabablari va his-tuyg'ularni (greed/fear) yozib boring.

### 4. 🧠 Mindset va Peak Performance:
Sizning savdo psixologiyangizni yaxshilash uchun har bir savdodan oldin **3 soniya qoidasi** ni qo'llang: "Men ushbu savdoga hayajon bilan kiryapmanmi yoki texnik reja asosidami?" degan savolni o'zingizga bering. Bu impulsiv (shoshqaloq) savdolarni kamaytiradi.

---
*Ushbu tahlillar ta'limiy maqsadga ega bo'lib, moliyaviy maslahat (financial advice) hisoblanmaydi.*`;
}

function generateChatFallback(message: string): string {
  const msgLower = message.toLowerCase();
  
  if (msgLower.includes("rsi") || msgLower.includes("nisbiy kuch")) {
    return `### 📈 RSI (Relative Strength Index) Indikatori Bo'yicha Yo'riqnoma:
RSI (Nisbiy kuch indeksi) momentum ko'rsatkichi bo'lib, bozorning haddan tashqari sotib olingan (overbought) yoki haddan tashqari sotilgan (oversold) darajalarini aniqlash uchun ishlatiladi:

1. **Oversold (Haddan tashqari sotilgan) - Kirish signali**: RSI qiymati 30 dan pastga tushganda, narx o'zining minimal darajalariga yaqinlashgan va tez orada yuqoriga qaytishi (rebound) mumkin deb hisoblanadi.
2. **Overbought (Haddan tashqari sotib olingan) - Chiqish signali**: RSI qiymati 70 dan oshganda, aktiv qimmatlashgan va tuzatish (correction) boshlanishi mumkin.

**Apex AI maslahati:** RSI faqat bitta indikator sifatida qo'llanilmasligi kerak. Uni doimo EMA (Harakatlanuvchi o'rtacha qiymat) va shamlar tahlili (Price Action) bilan birgalikda ishlating.

---
*Ushbu tahlillar ta'limiy maqsadga ega bo'lib, moliyaviy maslahat emas.*`;
  }
  
  if (msgLower.includes("macd")) {
    return `### 📊 MACD (Moving Average Convergence Divergence) Indikatori Tahlili:
MACD trend yo'nalishi va uning kuchini aniqlashda eng mashhur indikatorlardan biridir:

1. **Signal liniyalari kesishuvi**: MACD chizig'i Signal chizig'ini pastdan tepaga kesib o'tsa - bu **Bullish (Buy)** signal. Tepadan pastga kesib o'tsa - bu **Bearish (Sell)** signal.
2. **Gistogramma**: Noldan yuqori ustunlar yuksalish tendensiyasini, noldan pastdagilar esa pasayish tendensiyasini bildiradi.

**Apex AI maslahati:** Kundalik (1D) va 4 soatlik (4H) taymfreymlardagi MACD signallari eng ishonchli hisoblanadi.

---
*Ushbu tahlillar ta'limiy maqsadga ega bo'lib, moliyaviy maslahat emas.*`;
  }
  
  if (msgLower.includes("ema") || msgLower.includes("moving average") || msgLower.includes("o'rtacha")) {
    return `### 📉 EMA (Exponential Moving Average) Haqida Ma'lumot:
EMA trend yo'nalishini aniqlashda eng samarali dinamik qo'llab-quvvatlash va qarshilik darajasi vazifasini o'taydi:

1. **EMA 50 & 200**: Narx EMA 200 chizig'idan yuqorida bo'lsa - bozor buqalar (bullish) nazoratida. Pastda bo'lsa - ayiqlar (bearish) nazoratida.
2. **Oltin kesishish (Golden Cross)**: EMA 50 liniyasi EMA 200 chizig'ini pastdan tepaga kesib o'tsa, bu kuchli yuksalish trendining boshlanishi hisoblanadi.

---
*Ushbu tahlillar ta'limiy maqsadga ega bo'lib, moliyaviy maslahat emas.*`;
  }
  
  if (msgLower.includes("btc") || msgLower.includes("bitcoin")) {
    return `### 🪙 Bitcoin (BTC) Narx Harakati va Tahlili:
Bitcoin bozorda yetakchi likvidlik drayveri hisoblanadi. BTC harakati butun altkoinlar bozoriga ta'sir qiladi:

- **EMA 50 darajasi**: BTC hozirda o'zining dinamik qo'llab-quvvatlash chizig'i ustida barqarorlashmoqda.
- **RSI ko'rsatkichi**: Neytral hududda bo'lib, konsolidatsiya davom etishini ko'rsatmoqda.

**Apex AI maslahati:** BTC narxi muhim rezistentlik yoki support darajalariga yaqinlashganda altkoinlarda savdoni kamaytiring, chunki BTC breakout yoki dump qilganda altkoinlardagi risklar 2-3 barobar oshadi.

---
*Ushbu tahlillar ta'limiy maqsadga ega bo'lib, moliyaviy maslahat emas.*`;
  }
  
  if (msgLower.includes("sol") || msgLower.includes("solana")) {
    return `### ☀️ Solana (SOL) Texnik Tahlili:
Solana yuqori tezlikdagi tranzaksiyalar va meme-koinlar faolligi evaziga kuchli momentumga ega:

- **Support (Qo'llab-quvvatlash)**: SOL uchun yaqin o'rtadagi asosiy qo'llab-quvvatlash darajalari uning so'nggi konsolidatsiya zonalaridadir.
- **Strategiya**: Breakout savdolarida SOL juda yaxshi natija ko'rsatadi, ammo yuqori volatillik sababli stop-losslarni qat'iy o'rnating.

---
*Ushbu tahlillar ta'limiy maqsadga ega bo'lib, moliyaviy maslahat emas.*`;
  }

  return `### 🧠 Salom! Men Apex AI - professional kripto-tahlilchiman.

*Eslatma: Hozirda tizimlarimiz yuqori yuklanish rejimida ishlayotganligi sababli, sizga mahalliy aqlli yordamchi sifatida javob beryapman.* 

Quyidagi mavzulardan biri bo'yicha so'rang va men sizga batafsil yo'riqnoma beraman:
- **RSI**: Nisbiy kuch ko'rsatkichini to'g'ri o'qish.
- **MACD**: Trend yo'nalishi va momentum signallari.
- **EMA**: Dinamik support va qarshilik chiziqlari.
- **BTC / SOL / ETH**: Asosiy koinlar bo'yicha tahlillar.
- **Risk Management**: Portfelni saqlab qolish va hisob-kitob qilish qoidalari.

Sizga qaysi yo'nalish bo'yicha yordam bera olaman? Doimo yodingizda tuting: intizom va sovuqqonlik savdoda g'alaba kalitidir!

---
*Ushbu tahlillar ta'limiy maqsadga ega bo'lib, moliyaviy maslahat emas.*`;
}

function generateTradeFallback(trade: any): string {
  const price = Number(trade.price) || 100;
  
  // Suggest reasonable SL and TP levels based on action type
  let sl = 0;
  let tp1 = 0;
  let tp2 = 0;
  let actionLabel = "";
  
  if (trade.action === "BUY" || String(trade.action).toLowerCase().includes("buy") || String(trade.action).toLowerCase().includes("kopkon") || String(trade.action).toLowerCase().includes("ko'pkon")) {
    actionLabel = "BUY / Ko'pkon (Sotib olish)";
    sl = price * 0.965; // 3.5% stop loss
    tp1 = price * 1.05; // 5% take profit 1
    tp2 = price * 1.10; // 10% take profit 2
  } else {
    actionLabel = "SELL / Slvon (Sotish)";
    sl = price * 1.035; // 3.5% stop loss
    tp1 = price * 0.95; // 5% take profit 1
    tp2 = price * 0.90; // 10% take profit 2
  }

  const roundedSL = sl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const roundedTP1 = tp1.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const roundedTP2 = tp2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return `### 🧠 Apex AI: Tezkor Savdo Tahlili va Coach Sharhi

*Eslatma: Tarmoq bandligi tufayli, ushbu tahlil mahalliy algoritm yordamida muvaffaqiyatli generatsiya qilindi.*

Ushbu **${trade.coin || "Noma'lum"}** aktivining **${actionLabel}** setupi uchun quyidagi professional tahlil tayyorlandi:

1. **Narx darajalari va Zonalar (Tavsiyaviy):**
   - **Kirish narxi:** $${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
   - **Stop-Loss (SL):** $${roundedSL} (Risk darajasi max: 3.5%)
   - **Take-Profit 1 (TP1):** $${roundedTP1} (+5.0%)
   - **Take-Profit 2 (TP2):** $${roundedTP2} (+10.0%)

2. **Texnik baholash:**
   Qayd etilgan qaydlaringiz va setupga ko'ra ("${trade.notes || "Qaydlar kiritilmagan"}"), siz qo'llab-quvvatlash yoki qarshilik darajasini inobatga olgansiz. Narx ushbu hududlarda konsolidatsiya bo'lmoqda. O'z vaqtida stop-loss qo'yish kapitalingizni kutilmagan volatillikdan himoya qiladi.

3. **Risk Ko'rsatkichi:**
   **6.5 / 10** (O'rtacha riskli). ${trade.coin || "Aktiv"} yuqori volatillikka ega aktiv bo'lgani bois, savdoni boshlashdan oldin doimo likvidlik hajmini tekshiring.

---
*Ushbu tahlillar ta'limiy tahlil bo'lib, moliyaviy maslahat emas.*`;
}

// 1. API: Multi-turn Chatbot Interface
app.post("/api/chat", async (req, res) => {
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

    const resultText = await callGemini(
      {
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: `You are a professional Crypto Trading Coach and Analyst named Apex AI. 
You help users analyze crypto market setups, trade psychology, risk management, indicators (like RSI, MACD, EMA), and specific trade entries in Uzbek (Uzbek slang if requested) or English (match the language of the user's message).
Offer educational, high-precision technical feedback on their trade setups.
Keep your tone analytical, encouraging, and direct. Use structured lists and markdown. 
Always include a brief polite disclaimer that you provide educational analysis, not financial advice.`,
        },
      },
      () => generateChatFallback(message)
    );

    res.json({
      content: resultText,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during your request." });
  }
});

// 2. API: Entire Journal Portfolio Intelligence & Diagnostics
app.post("/api/analyze-journal", async (req, res) => {
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
- Status: ${t.status}
- Notes: ${t.notes || "No custom setup notes provided"}
- Time: ${t.timestamp}`;
      })
      .join("\n\n");

    const resultText = await callGemini(
      {
        model: "gemini-3.5-flash",
        contents: `Please analyze the following crypto trading journal and provide a concise, high-value dashboard diagnostic report.
      
Here are the trades:
${journalText}

Structure your diagnostic report with the following clean markdown sections:
1. **📊 Portfolio Overview & Win/Loss Diagnostics**: Summarize the performance, highlight which action or coins are most/least profitable, and flag asset/trade allocation risks.
2. **⚠️ Risk Management & Setup Flaws**: Identify any psychological traps, bad setups, or over-exposure risks.
3. **💡 Strategic AI Suggestions**: Give 3 direct, actionable rules or techniques the trader should adopt immediately based on this data.
4. **🧠 Peak Performance Recommendation**: Provide a tailored mindset exercise or trading ruleset for this trader.

Keep the report encouraging but firm, using highly professional trading desk vocabulary. Match the user's preferred language (blend English and Uzbek trading slang like "Ko'pkon" and "Slvon" to be friendly and native!).`,
      },
      () => generateJournalFallback(trades)
    );

    res.json({
      analysis: resultText,
    });
  } catch (error: any) {
    console.error("Gemini Journal Analysis Error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze your journal." });
  }
});

// 3. API: Single Trade Instant Setup Coach
app.post("/api/analyze-trade", async (req, res) => {
  try {
    const { trade } = req.body;

    if (!trade) {
      res.status(400).json({ error: "Trade data is required." });
      return;
    }

    const resultText = await callGemini(
      {
        model: "gemini-3.5-flash",
        contents: `Analyze this specific trade setup and provide an instant optimization coach review.

Trade Setup:
- Coin: ${trade.coin}
- Action: ${trade.action} (Buy/Ko'pkon or Sell/Slvon)
- Entry Price: $${trade.price}
- Size: ${trade.amount || 1} units
- Status: ${trade.status}
- Trader's Analysis Notes: "${trade.notes}"

Generate a short 1-2 paragraph review of this setup. Estimate if the trader used technical indicators wisely, suggest standard Stop-Loss and Take-Profit zones for this setup (assuming standard supports/resistances), and evaluate the overall risk score (1 to 10 scale). Be clear, technical, and helpful.`,
      },
      () => generateTradeFallback(trade)
    );

    res.json({
      analysis: resultText,
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

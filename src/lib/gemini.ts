import axios from "axios";

export interface MarketData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradeSignal {
  symbol: string;
  action: "BUY" | "SELL" | "HOLD";
  price: number;
  confidence: number;
  reasoning: string;
  targets: number[];
  stopLoss: number;
  timestamp: number;
  provider?: string;
}

export interface NewsItem {
  title: string;
  publisher: string;
  link?: string;
}

export const generateSignal = async (
  symbol: string,
  data: MarketData[],
  news?: NewsItem[]
): Promise<TradeSignal | null> => {
  if (!data || data.length === 0) return null;

  const customKey = localStorage.getItem("GEMINI_API_KEY") || "";
  const claudeKey = localStorage.getItem("CLAUDE_API_KEY") || "";
  const provider = localStorage.getItem("AI_PROVIDER") || "gemini";

  try {
    const response = await axios.post(
      "/api/analyze-signal",
      {
        symbol,
        data,
        news,
        apiKey: customKey.trim() || undefined,
        claudeApiKey: claudeKey.trim() || undefined,
        provider,
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      }
    );

    if (response.data?.signal) {
      return response.data.signal;
    }
    throw new Error(response.data?.error || "Analisis AI tidak mengembalikan hasil.");
  } catch (err: any) {
    console.warn("Server API signal request error, applying fallback calculation:", err.message);

    // If client is completely offline or proxy is blocked, compute fallback locally
    const currentPrice = data[data.length - 1].close;
    const closes = data.map((d) => d.close);
    const sma7 = closes.slice(-7).reduce((a, b) => a + b, 0) / Math.min(closes.length, 7);
    const sma21 = closes.slice(-21).reduce((a, b) => a + b, 0) / Math.min(closes.length, 21);

    const isBull = sma7 >= sma21;
    const action: "BUY" | "SELL" | "HOLD" = isBull ? "BUY" : "SELL";
    const mult = action === "BUY" ? 1 : -1;

    return {
      symbol,
      action,
      price: currentPrice,
      confidence: 72,
      reasoning: `Analisis teknikal kuantitatif untuk ${symbol}: Indikator SMA-7 (${sma7.toFixed(2)}) bergerak ${isBull ? "di atas" : "di bawah"} SMA-21 (${sma21.toFixed(2)}) menunjukkan momentum ${isBull ? "Bullish Accumulation" : "Bearish Distribution"}.`,
      targets: [
        Number((currentPrice * (1 + 0.025 * mult)).toFixed(4)),
        Number((currentPrice * (1 + 0.05 * mult)).toFixed(4)),
      ],
      stopLoss: Number((currentPrice * (1 - 0.025 * mult)).toFixed(4)),
      timestamp: Date.now(),
      provider: "Kuantitatif (SMA-7/21)",
    };
  }
};

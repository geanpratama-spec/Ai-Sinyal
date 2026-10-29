import React, { useState, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Building2,
  TrendingUp,
  TrendingDown,
  BarChart2,
  DollarSign,
  Activity,
  Globe,
  BookOpen,
  Target,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Star,
} from "lucide-react";
import { cn } from "../lib/utils";

interface FundamentalData {
  symbol: string;
  longName: string;
  sector: string;
  industry: string;
  website: string;
  longBusinessSummary: string;
  per: number | string;
  pbv: number | string;
  eps: number | string;
  dividendYield: number;
  marketCap: number;
  beta: number | string;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  currentPrice: number;
  targetHighPrice: number;
  targetLowPrice: number;
  targetMeanPrice: number;
  recommendationMean: number | null;
  recommendationKey: string;
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  grossMargins: number | null;
  operatingMargins: number | null;
  profitMargins: number | null;
  earningsHistory: {
    date: string;
    netIncome: number;
    totalRevenue: number;
    grossProfit: number;
  }[];
  balanceHistory: {
    date: string;
    cash: number;
    shortTermDebt: number;
    longTermDebt: number;
    totalDebt: number;
    totalAssets: number;
  }[];
}

function formatIDR(val: number): string {
  if (!val || isNaN(val)) return "N/A";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(val);
}

function formatPct(val: number | null): string {
  if (val === null || val === undefined || isNaN(val)) return "N/A";
  return `${(val * 100).toFixed(2)}%`;
}

function formatNum(val: number | string | null): string {
  if (val === null || val === undefined || val === "N/A") return "N/A";
  const n = Number(val);
  if (isNaN(n)) return "N/A";
  return n.toFixed(2);
}

const RECOMMENDATION_LABELS: Record<string, { label: string; color: string }> = {
  "strong-buy": { label: "Strong Buy", color: "text-emerald-400" },
  buy: { label: "Buy", color: "text-emerald-400" },
  hold: { label: "Hold", color: "text-amber-400" },
  underperform: { label: "Underperform", color: "text-orange-400" },
  sell: { label: "Sell", color: "text-rose-400" },
  "strong-sell": { label: "Strong Sell", color: "text-rose-500" },
};

// Quick access popular emitens
const POPULAR_EMITENS = [
  "BBCA", "BBRI", "BMRI", "BBNI", "TLKM",
  "ASII", "GOTO", "UNVR", "ICBP", "KLBF",
  "INDF", "PTBA", "ADRO", "ANTM", "MDKA",
];

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, color, icon }) => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4">
    <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">
      {icon}
      {label}
    </div>
    <div className={cn("font-mono text-sm sm:text-base font-bold", color || "text-white")}>
      {typeof value === "number" && isNaN(value) ? "N/A" : value}
    </div>
    {sub && <div className="text-white/30 text-[10px] mt-0.5 font-medium">{sub}</div>}
  </div>
);

export const EmitSearch: React.FC = () => {
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FundamentalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFullBio, setShowFullBio] = useState(false);

  const fetchEmiten = useCallback(async (code: string) => {
    const clean = code.trim().toUpperCase().replace(".JK", "");
    if (!clean || clean.length < 2) {
      setError("Masukkan minimal 2 karakter kode emiten.");
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await axios.get("/api/stock-fundamentals", {
        params: { symbol: clean },
        timeout: 12000,
      });

      if (!res.data) {
        setError(`Data untuk emiten ${clean} tidak ditemukan. Pastikan kode emiten benar.`);
        return;
      }

      setData(res.data);
    } catch (err: any) {
      setError(
        err.response?.status === 404
          ? `Emiten ${clean} tidak ditemukan.`
          : `Gagal mengambil data: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEmiten(inputCode);
  };

  const recKey = data?.recommendationKey || "";
  const recInfo = RECOMMENDATION_LABELS[recKey] || null;

  const currentVs52Low = data?.fiftyTwoWeekLow
    ? ((data.currentPrice - data.fiftyTwoWeekLow) /
        (data.fiftyTwoWeekHigh - data.fiftyTwoWeekLow)) *
      100
    : null;

  return (
    <div className="space-y-4">
      {/* Search Form */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Search className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-white">Cari Kode Emiten BEI</h3>
            <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">
              Analisis kinerja saham Indonesia
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="Contoh: BBCA, TLKM, GOTO"
              maxLength={10}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:normal-case placeholder:font-normal placeholder:text-white/20"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !inputCode.trim()}
            className="px-5 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white font-black rounded-xl flex items-center gap-2 transition-all text-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Cari</span>
          </button>
        </form>

        {/* Quick access chips */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {POPULAR_EMITENS.map((code) => (
            <button
              key={code}
              onClick={() => {
                setInputCode(code);
                fetchEmiten(code);
              }}
              className="px-2.5 py-1 bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/40 rounded-lg text-[10px] font-bold font-mono transition-all"
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400"
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </motion.div>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white/5 rounded-xl h-20" />
          ))}
        </div>
      )}

      {/* Data display */}
      <AnimatePresence mode="wait">
        {data && (
          <motion.div
            key={data.symbol}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Header Card */}
            <div className="bg-gradient-to-br from-blue-500/10 via-white/5 to-purple-500/10 border border-white/10 rounded-2xl p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl sm:text-3xl font-black font-mono tracking-tighter">
                      {data.symbol.replace(".JK", "")}
                    </span>
                    {recInfo && (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider",
                          recInfo.color === "text-emerald-400"
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : recInfo.color === "text-rose-400"
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                            : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        )}
                      >
                        {recInfo.label}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white/90 mb-1">
                    {data.longName || data.symbol}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                    {data.sector && <span>{data.sector}</span>}
                    {data.industry && (
                      <>
                        <span className="text-white/20">·</span>
                        <span>{data.industry}</span>
                      </>
                    )}
                    {data.website && (
                      <a
                        href={data.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-400 hover:underline"
                      >
                        <Globe className="w-3 h-3" />
                        Website
                      </a>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-black font-mono">
                    {formatIDR(data.currentPrice)}
                  </div>
                  <div className="text-white/40 text-xs mt-0.5">
                    Market Cap: {formatIDR(data.marketCap)}
                  </div>
                </div>
              </div>

              {/* 52-week range bar */}
              {data.fiftyTwoWeekHigh > 0 && (
                <div className="mt-5">
                  <div className="flex items-center justify-between text-[10px] text-white/40 font-bold mb-1.5">
                    <span>52W Low: {formatIDR(data.fiftyTwoWeekLow)}</span>
                    <span>52W High: {formatIDR(data.fiftyTwoWeekHigh)}</span>
                  </div>
                  <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 rounded-full"
                      style={{ width: "100%" }}
                    />
                    {currentVs52Low !== null && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-black"
                        style={{
                          left: `calc(${Math.min(Math.max(currentVs52Low, 2), 98)}% - 6px)`,
                        }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Target Price */}
              {data.targetMeanPrice > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                    <Target className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="text-[9px] text-white/40 font-bold uppercase">Target Analis</div>
                      <div className="font-mono font-bold text-sm">
                        {formatIDR(data.targetLowPrice)} –{" "}
                        {formatIDR(data.targetHighPrice)}
                      </div>
                      <div className="text-[10px] text-blue-400 font-bold">
                        Mean: {formatIDR(data.targetMeanPrice)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Company Bio */}
            {data.longBusinessSummary && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
                <button
                  onClick={() => setShowFullBio(!showFullBio)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-white/40" />
                    <span className="text-xs font-bold uppercase tracking-widest text-white/60">
                      Profil Perusahaan
                    </span>
                  </div>
                  {showFullBio ? (
                    <ChevronUp className="w-4 h-4 text-white/40" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/40" />
                  )}
                </button>
                <AnimatePresence>
                  {showFullBio && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 text-sm text-white/60 leading-relaxed overflow-hidden"
                    >
                      {data.longBusinessSummary}
                    </motion.p>
                  )}
                </AnimatePresence>
                {!showFullBio && (
                  <p className="mt-2 text-sm text-white/60 line-clamp-2 leading-relaxed">
                    {data.longBusinessSummary}
                  </p>
                )}
              </div>
            )}

            {/* Valuation Stats */}
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 flex items-center gap-2">
                <Star className="w-3 h-3 text-amber-400" />
                Valuasi & Rasio Keuangan
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <StatCard
                  label="P/E Ratio"
                  value={formatNum(data.per)}
                  sub="Price to Earnings"
                  icon={<BarChart2 className="w-3 h-3" />}
                  color={
                    Number(data.per) > 25
                      ? "text-rose-400"
                      : Number(data.per) > 15
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }
                />
                <StatCard
                  label="P/B Ratio"
                  value={formatNum(data.pbv)}
                  sub="Price to Book"
                  icon={<BarChart2 className="w-3 h-3" />}
                  color={
                    Number(data.pbv) > 3
                      ? "text-rose-400"
                      : Number(data.pbv) > 1.5
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }
                />
                <StatCard
                  label="EPS"
                  value={
                    data.eps !== "N/A" ? formatIDR(Number(data.eps)) : "N/A"
                  }
                  sub="Earn. Per Share"
                  icon={<DollarSign className="w-3 h-3" />}
                  color={Number(data.eps) > 0 ? "text-emerald-400" : "text-rose-400"}
                />
                <StatCard
                  label="Dividend Yield"
                  value={
                    data.dividendYield
                      ? `${(data.dividendYield * 100).toFixed(2)}%`
                      : "0%"
                  }
                  sub="Yield tahunan"
                  icon={<DollarSign className="w-3 h-3" />}
                  color={data.dividendYield > 0 ? "text-emerald-400" : "text-white/60"}
                />
                <StatCard
                  label="Beta"
                  value={formatNum(data.beta)}
                  sub="Volatilitas vs pasar"
                  icon={<Activity className="w-3 h-3" />}
                  color={
                    Number(data.beta) > 1.5
                      ? "text-rose-400"
                      : Number(data.beta) > 1
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }
                />
                <StatCard
                  label="ROE"
                  value={formatPct(data.returnOnEquity)}
                  sub="Return on Equity"
                  icon={<TrendingUp className="w-3 h-3" />}
                  color={
                    (data.returnOnEquity ?? 0) > 0.15
                      ? "text-emerald-400"
                      : (data.returnOnEquity ?? 0) > 0
                      ? "text-amber-400"
                      : "text-rose-400"
                  }
                />
                <StatCard
                  label="ROA"
                  value={formatPct(data.returnOnAssets)}
                  sub="Return on Assets"
                  icon={<TrendingUp className="w-3 h-3" />}
                  color={
                    (data.returnOnAssets ?? 0) > 0.05
                      ? "text-emerald-400"
                      : (data.returnOnAssets ?? 0) > 0
                      ? "text-amber-400"
                      : "text-rose-400"
                  }
                />
                <StatCard
                  label="Debt/Equity"
                  value={formatNum(data.debtToEquity)}
                  sub="Rasio utang"
                  icon={<AlertTriangle className="w-3 h-3" />}
                  color={
                    (data.debtToEquity ?? 0) > 200
                      ? "text-rose-400"
                      : (data.debtToEquity ?? 0) > 100
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }
                />
              </div>
            </div>

            {/* Margin Stats */}
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 flex items-center gap-2">
                <Activity className="w-3 h-3 text-blue-400" />
                Margin & Pertumbuhan
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  {
                    label: "Gross Margin",
                    value: formatPct(data.grossMargins),
                    raw: data.grossMargins,
                  },
                  {
                    label: "Oper. Margin",
                    value: formatPct(data.operatingMargins),
                    raw: data.operatingMargins,
                  },
                  {
                    label: "Net Margin",
                    value: formatPct(data.profitMargins),
                    raw: data.profitMargins,
                  },
                  {
                    label: "Rev. Growth",
                    value: formatPct(data.revenueGrowth),
                    raw: data.revenueGrowth,
                  },
                  {
                    label: "Earn. Growth",
                    value: formatPct(data.earningsGrowth),
                    raw: data.earningsGrowth,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-white/5 border border-white/10 rounded-xl p-3"
                  >
                    <div className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1">
                      {item.label}
                    </div>
                    <div
                      className={cn(
                        "font-mono text-sm font-bold",
                        item.raw === null
                          ? "text-white/30"
                          : item.raw > 0
                          ? "text-emerald-400"
                          : "text-rose-400"
                      )}
                    >
                      {item.value}
                    </div>
                    {item.raw !== null && (
                      <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            item.raw > 0 ? "bg-emerald-500" : "bg-rose-500"
                          )}
                          style={{
                            width: `${Math.min(
                              Math.abs(item.raw * 100),
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Historical Table */}
            {data.earningsHistory?.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  Riwayat Kinerja Keuangan (Income Statement)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono min-w-[500px]">
                    <thead>
                      <tr className="text-white/30 border-b border-white/5">
                        <th className="pb-2 font-medium">Tahun</th>
                        <th className="pb-2 font-medium text-right">
                          Total Revenue
                        </th>
                        <th className="pb-2 font-medium text-right">
                          Gross Profit
                        </th>
                        <th className="pb-2 font-medium text-right">
                          Net Income
                        </th>
                        <th className="pb-2 font-medium text-right">
                          YoY Growth
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.earningsHistory.map((h, idx) => {
                        const year = new Date(h.date).getFullYear();
                        const prev = data.earningsHistory[idx + 1];
                        const growth =
                          prev && prev.netIncome
                            ? ((h.netIncome - prev.netIncome) /
                                Math.abs(prev.netIncome)) *
                              100
                            : null;
                        return (
                          <tr
                            key={`${year}-${idx}`}
                            className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                          >
                            <td className="py-2.5 text-white/70 font-bold">
                              {year}
                            </td>
                            <td className="py-2.5 text-right text-white/80">
                              {formatIDR(h.totalRevenue)}
                            </td>
                            <td className="py-2.5 text-right text-blue-400">
                              {formatIDR(h.grossProfit)}
                            </td>
                            <td
                              className={cn(
                                "py-2.5 text-right font-bold",
                                h.netIncome >= 0
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                              )}
                            >
                              {formatIDR(h.netIncome)}
                            </td>
                            <td
                              className={cn(
                                "py-2.5 text-right font-bold text-[11px]",
                                growth === null
                                  ? "text-white/30"
                                  : growth > 0
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                              )}
                            >
                              {growth !== null
                                ? `${growth > 0 ? "▲" : "▼"} ${Math.abs(growth).toFixed(1)}%`
                                : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Balance History */}
            {data.balanceHistory?.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-4 flex items-center gap-2">
                  <BarChart2 className="w-3 h-3 text-blue-400" />
                  Neraca (Balance Sheet)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono min-w-[500px]">
                    <thead>
                      <tr className="text-white/30 border-b border-white/5">
                        <th className="pb-2 font-medium">Tahun</th>
                        <th className="pb-2 font-medium text-right">
                          Total Aset
                        </th>
                        <th className="pb-2 font-medium text-right">Kas</th>
                        <th className="pb-2 font-medium text-right">
                          Total Utang
                        </th>
                        <th className="pb-2 font-medium text-right">
                          Kas/Utang
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.balanceHistory.map((h, idx) => {
                        const year = new Date(h.date).getFullYear();
                        const ratio = h.totalDebt > 0 ? h.cash / h.totalDebt : null;
                        return (
                          <tr
                            key={`${year}-${idx}`}
                            className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                          >
                            <td className="py-2.5 text-white/70 font-bold">
                              {year}
                            </td>
                            <td className="py-2.5 text-right text-white/70">
                              {formatIDR(h.totalAssets)}
                            </td>
                            <td className="py-2.5 text-right text-emerald-400">
                              {formatIDR(h.cash)}
                            </td>
                            <td className="py-2.5 text-right text-rose-400">
                              {formatIDR(h.totalDebt)}
                            </td>
                            <td
                              className={cn(
                                "py-2.5 text-right font-bold",
                                ratio === null
                                  ? "text-white/30"
                                  : ratio >= 1
                                  ? "text-emerald-400"
                                  : ratio >= 0.5
                                  ? "text-amber-400"
                                  : "text-rose-400"
                              )}
                            >
                              {ratio !== null ? `${ratio.toFixed(2)}x` : "N/A"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

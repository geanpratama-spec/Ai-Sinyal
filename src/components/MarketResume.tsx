import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

interface MarketData {
  symbol: string;
  price: number;
  change: number;
}

interface SummaryProps {
  title: string;
  category: 'crypto' | 'forex' | 'saham';
  symbols: string[];
  activeSymbol?: string;
  onSelectSymbol?: (symbol: string, category: 'crypto' | 'forex' | 'saham') => void;
}

export const MarketResumeCard: React.FC<SummaryProps> = ({ 
  title, 
  category, 
  symbols, 
  activeSymbol, 
  onSelectSymbol 
}) => {
  const [data, setData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async (retries = 2) => {
    try {
      const res = await axios.get('/api/market-summary', {
        params: { symbols: symbols.join(','), category },
        timeout: 15000 // 15s timeout
      });
      setData(res.data);
    } catch (err: any) {
      console.error(`Failed to fetch ${title} summary:`, err.message);
      if (retries > 0) {
        console.log(`Retrying ${title} summary... (${retries} left)`);
        setTimeout(() => fetchSummary(retries - 1), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Stagger initial fetch to avoid simultaneous pressure
    const delay = Math.random() * 2000;
    const timer = setTimeout(() => {
      fetchSummary();
    }, delay);
    
    const interval = setInterval(fetchSummary, 45000); // 45s auto-refresh
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 flex-1">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white/60 text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          {title}
          {loading && <RefreshCcw className="w-3 h-3 animate-spin text-white/40" />}
        </h3>
      </div>
      <div className="space-y-1 sm:space-y-2">
        {data.map((item, idx) => {
          const isSelected = activeSymbol === item.symbol;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectSymbol?.(item.symbol, category)}
              className={cn(
                "w-full flex items-center justify-between group cursor-pointer p-1.5 rounded-xl transition-all text-left border",
                isSelected
                  ? "bg-emerald-500/15 border-emerald-500/50 shadow-sm"
                  : "bg-transparent border-transparent hover:bg-white/10 hover:border-white/10"
              )}
            >
              <span className={cn(
                "font-mono text-[10px] sm:text-xs font-bold uppercase tracking-tight flex items-center gap-1.5",
                isSelected ? "text-emerald-400 font-extrabold" : "text-white/80 group-hover:text-white"
              )}>
                {(item.symbol || '').replace('=X', '').replace('.JK', '').replace('USDT', '')}
              </span>
              <div className="text-right">
                <div className={cn(
                  "font-mono text-xs sm:text-sm font-bold",
                  isSelected ? "text-emerald-300" : "text-white"
                )}>
                  {formatCurrency(item.price, item.symbol, category as any)}
                </div>
                <div className={cn(
                  "text-[9px] sm:text-[10px] font-bold flex items-center justify-end gap-0.5",
                  item.change >= 0 ? "text-emerald-400" : "text-rose-400"
                )}>
                  {item.change >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {Math.abs(item.change).toFixed(2)}%
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

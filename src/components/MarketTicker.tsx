import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Bitcoin, DollarSign, Activity } from "lucide-react";

interface TickerItem {
  symbol: string;
  label: string;
  price: number;
  change: number;
  icon: React.ElementType;
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const width = 60;
  const height = 20;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function generateSparkline(base: number, volatility: number): number[] {
  const points: number[] = [];
  let current = base;
  for (let i = 0; i < 20; i++) {
    current += (Math.random() - 0.48) * volatility;
    points.push(current);
  }
  return points;
}

export default function MarketTicker() {
  const [tickers, setTickers] = useState<TickerItem[]>([
    { symbol: "BTC/USD", label: "Bitcoin", price: 68432.50, change: 2.34, icon: Bitcoin },
    { symbol: "USD/KES", label: "Dollar", price: 129.45, change: -0.12, icon: DollarSign },
    { symbol: "ETH/USD", label: "Ethereum", price: 3521.80, change: 1.87, icon: Activity },
  ]);
  
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({
    "BTC/USD": generateSparkline(68432, 200),
    "USD/KES": generateSparkline(129.45, 0.3),
    "ETH/USD": generateSparkline(3521, 50),
  });

  const [flashIndex, setFlashIndex] = useState<number | null>(null);

  // Simulate live price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTickers(prev => {
        const idx = Math.floor(Math.random() * prev.length);
        setFlashIndex(idx);
        setTimeout(() => setFlashIndex(null), 600);
        
        return prev.map((t, i) => {
          if (i !== idx) return t;
          const volatility = t.symbol === "BTC/USD" ? 150 : t.symbol === "ETH/USD" ? 30 : 0.15;
          const delta = (Math.random() - 0.48) * volatility;
          const newPrice = Math.max(0.01, t.price + delta);
          const newChange = t.change + (Math.random() - 0.5) * 0.1;
          return { ...t, price: newPrice, change: newChange };
        });
      });

      setSparklines(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          const arr = [...updated[key]];
          const last = arr[arr.length - 1];
          const vol = key === "BTC/USD" ? 200 : key === "ETH/USD" ? 50 : 0.3;
          arr.shift();
          arr.push(last + (Math.random() - 0.48) * vol);
          updated[key] = arr;
        });
        return updated;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Fetch real prices on mount
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true");
        if (!res.ok) return;
        const data = await res.json();
        
        setTickers(prev => prev.map(t => {
          if (t.symbol === "BTC/USD" && data.bitcoin) {
            return { ...t, price: data.bitcoin.usd, change: data.bitcoin.usd_24h_change ?? t.change };
          }
          if (t.symbol === "ETH/USD" && data.ethereum) {
            return { ...t, price: data.ethereum.usd, change: data.ethereum.usd_24h_change ?? t.change };
          }
          return t;
        }));
        
        setSparklines(prev => ({
          ...prev,
          "BTC/USD": generateSparkline(data.bitcoin?.usd ?? 68432, 200),
          "ETH/USD": generateSparkline(data.ethereum?.usd ?? 3521, 50),
        }));
      } catch {
        // Use simulated prices
      }
    };

    // Fetch USD/KES
    const fetchForex = async () => {
      try {
        const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        if (!res.ok) return;
        const data = await res.json();
        if (data.rates?.KES) {
          setTickers(prev => prev.map(t =>
            t.symbol === "USD/KES" ? { ...t, price: data.rates.KES } : t
          ));
          setSparklines(prev => ({
            ...prev,
            "USD/KES": generateSparkline(data.rates.KES, 0.3),
          }));
        }
      } catch {
        // Use simulated rate
      }
    };

    fetchPrices();
    fetchForex();
  }, []);

  const fmtPrice = (symbol: string, price: number) => {
    if (symbol === "USD/KES") return `KES ${price.toFixed(2)}`;
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="relative overflow-hidden">
      {/* Animated scan line */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent z-10"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      
      <div className="flex items-center gap-1 py-2 px-3 glass-card rounded-lg overflow-x-auto scrollbar-thin">
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 pr-3 border-r border-border/50 shrink-0">
          <motion.div
            className="h-1.5 w-1.5 rounded-full bg-profit"
            animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium">Live</span>
        </div>

        {tickers.map((t, i) => (
          <motion.div
            key={t.symbol}
            className={`flex items-center gap-2 px-3 py-1 rounded-md shrink-0 transition-colors duration-300 ${
              flashIndex === i ? (t.change >= 0 ? "bg-profit/10" : "bg-loss/10") : ""
            }`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <t.icon className="h-3.5 w-3.5 text-primary" />
            <div className="flex flex-col">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{t.symbol}</span>
              <div className="flex items-center gap-1.5">
                <motion.span
                  className="text-xs font-mono font-semibold text-foreground"
                  key={t.price.toFixed(2)}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                >
                  {fmtPrice(t.symbol, t.price)}
                </motion.span>
                <span className={`text-[10px] font-mono flex items-center gap-0.5 ${t.change >= 0 ? "text-profit" : "text-loss"}`}>
                  {t.change >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                  {t.change >= 0 ? "+" : ""}{t.change.toFixed(2)}%
                </span>
              </div>
            </div>
            <MiniSparkline
              data={sparklines[t.symbol] || []}
              color={t.change >= 0 ? "hsl(152, 70%, 48%)" : "hsl(0, 72%, 55%)"}
            />
          </motion.div>
        ))}
      </div>
      
      {/* Bottom scan line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"
        animate={{ x: ["100%", "-100%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, ChevronDown, BarChart3 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PricePoint {
  time: string;
  price: number;
}

interface PairConfig {
  id: string;
  label: string;
  coingeckoId?: string;
  vsCurrency: string;
  isForex?: boolean;
  formatter: (v: number) => string;
  yTickFormatter: (v: number) => string;
}

const PAIRS: PairConfig[] = [
  {
    id: "btc-usd",
    label: "BTC / USD",
    coingeckoId: "bitcoin",
    vsCurrency: "usd",
    formatter: (v) => `$${v.toLocaleString()}`,
    yTickFormatter: (v) => `$${(v / 1000).toFixed(0)}K`,
  },
  {
    id: "eth-usd",
    label: "ETH / USD",
    coingeckoId: "ethereum",
    vsCurrency: "usd",
    formatter: (v) => `$${v.toLocaleString()}`,
    yTickFormatter: (v) => `$${(v / 1000).toFixed(1)}K`,
  },
  {
    id: "eth-kes",
    label: "ETH / KES",
    coingeckoId: "ethereum",
    vsCurrency: "usd",
    formatter: (v) => `KES ${v.toLocaleString()}`,
    yTickFormatter: (v) => `${(v / 1000000).toFixed(1)}M`,
  },
  {
    id: "bnb-usd",
    label: "BNB / USD",
    coingeckoId: "binancecoin",
    vsCurrency: "usd",
    formatter: (v) => `$${v.toLocaleString()}`,
    yTickFormatter: (v) => `$${v.toFixed(0)}`,
  },
  {
    id: "sol-usd",
    label: "SOL / USD",
    coingeckoId: "solana",
    vsCurrency: "usd",
    formatter: (v) => `$${v.toLocaleString()}`,
    yTickFormatter: (v) => `$${v.toFixed(0)}`,
  },
  {
    id: "xrp-usd",
    label: "XRP / USD",
    coingeckoId: "ripple",
    vsCurrency: "usd",
    formatter: (v) => `$${v.toFixed(4)}`,
    yTickFormatter: (v) => `$${v.toFixed(2)}`,
  },
  {
    id: "usd-kes",
    label: "USD / KES",
    isForex: true,
    vsCurrency: "kes",
    formatter: (v) => `KES ${v.toFixed(2)}`,
    yTickFormatter: (v) => `${v.toFixed(0)}`,
  },
  {
    id: "eur-usd",
    label: "EUR / USD",
    isForex: true,
    vsCurrency: "usd",
    formatter: (v) => `$${v.toFixed(4)}`,
    yTickFormatter: (v) => `$${v.toFixed(2)}`,
  },
  {
    id: "gbp-usd",
    label: "GBP / USD",
    isForex: true,
    vsCurrency: "usd",
    formatter: (v) => `$${v.toFixed(4)}`,
    yTickFormatter: (v) => `$${v.toFixed(2)}`,
  },
];

const chartTooltipStyle = {
  background: "hsl(225, 22%, 8%)",
  border: "1px solid hsl(217, 91%, 60%, 0.2)",
  borderRadius: 12,
  fontSize: 11,
  boxShadow: "0 8px 32px hsl(225, 25%, 5%, 0.5)",
};

export default function MultiCryptoCharts() {
  const [selectedPair, setSelectedPair] = useState("btc-usd");
  const [data, setData] = useState<PricePoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [change24h, setChange24h] = useState(0);
  const [kesRate, setKesRate] = useState(130);
  const [loading, setLoading] = useState(false);

  const pair = useMemo(() => PAIRS.find((p) => p.id === selectedPair)!, [selectedPair]);

  // Fetch KES rate once
  useEffect(() => {
    fetch("https://api.exchangerate-api.com/v4/latest/USD")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.rates?.KES) setKesRate(d.rates.KES);
      })
      .catch(() => {});
  }, []);

  // Fetch data when pair changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchData = async () => {
      try {
        if (pair.isForex) {
          // Generate simulated forex data
          const base = pair.id === "usd-kes" ? kesRate : pair.id === "eur-usd" ? 1.085 : 1.27;
          const points: PricePoint[] = [];
          let price = base;
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            price += (Math.random() - 0.5) * base * 0.005;
            points.push({
              time: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              price: Number(price.toFixed(4)),
            });
          }
          if (!cancelled) {
            setData(points);
            setCurrentPrice(points[points.length - 1].price);
            setChange24h((Math.random() - 0.45) * 2);
            setLoading(false);
          }
          return;
        }

        // Crypto pair
        const res = await fetch(
          `https://api.coingecko.com/api/v3/coins/${pair.coingeckoId}/market_chart?vs_currency=usd&days=7&interval=daily`
        );
        if (!res.ok) throw new Error("API error");
        const json = await res.json();

        const multiplier = pair.id.endsWith("-kes") ? kesRate : 1;

        if (json.prices && !cancelled) {
          const points: PricePoint[] = json.prices.map(([ts, p]: [number, number]) => ({
            time: new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            price: Math.round(p * multiplier * 100) / 100,
          }));
          setData(points);
          if (points.length > 0) setCurrentPrice(points[points.length - 1].price);
        }

        // Fetch 24h change
        const res2 = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${pair.coingeckoId}&vs_currencies=usd&include_24hr_change=true`
        );
        if (res2.ok && !cancelled) {
          const json2 = await res2.json();
          const coinData = json2[pair.coingeckoId!];
          if (coinData?.usd_24h_change) setChange24h(coinData.usd_24h_change);
          if (coinData?.usd) {
            const multiplier = pair.id.endsWith("-kes") ? kesRate : 1;
            setCurrentPrice(Math.round(coinData.usd * multiplier * 100) / 100);
          }
        }
      } catch {
        // Generate fallback data
        const basePrice = pair.id.includes("btc") ? 68000 : pair.id.includes("eth") ? 3500 : pair.id.includes("bnb") ? 600 : pair.id.includes("sol") ? 170 : 0.5;
        const multiplier = pair.id.endsWith("-kes") ? kesRate : 1;
        const points: PricePoint[] = [];
        let price = basePrice * multiplier;
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          price += (Math.random() - 0.48) * basePrice * 0.02 * multiplier;
          points.push({
            time: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            price: Math.round(price * 100) / 100,
          });
        }
        if (!cancelled) {
          setData(points);
          setCurrentPrice(points[points.length - 1].price);
          setChange24h((Math.random() - 0.45) * 5);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [selectedPair, pair, kesRate]);

  // Simulate live ticks
  useEffect(() => {
    if (data.length === 0) return;
    const interval = setInterval(() => {
      setData((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        const volatility = pair.isForex ? last.price * 0.0002 : last.price * 0.001;
        const delta = (Math.random() - 0.48) * volatility;
        const newPrice = Math.max(0.001, last.price + delta);
        const rounded = Math.round(newPrice * 100) / 100;
        updated[updated.length - 1] = { ...last, price: rounded };
        setCurrentPrice(rounded);
        return updated;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [data.length, pair]);

  const isUp = change24h >= 0;

  return (
    <motion.div
      className="glass-card-hover rounded-xl p-5 space-y-3 animate-border-shimmer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -2, scale: 1.005 }}
    >
      {/* Header with dropdown */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <motion.div
            className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <BarChart3 className="h-4 w-4 text-primary" />
          </motion.div>
          <Select value={selectedPair} onValueChange={setSelectedPair}>
            <SelectTrigger className="h-8 w-[140px] text-xs bg-background/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Crypto
              </div>
              {PAIRS.filter((p) => !p.isForex).map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  {p.label}
                </SelectItem>
              ))}
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">
                Forex
              </div>
              {PAIRS.filter((p) => p.isForex).map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-right shrink-0">
          {currentPrice !== null && (
            <motion.p
              className="text-sm font-mono font-bold text-foreground"
              key={`${selectedPair}-${currentPrice}`}
              initial={{ opacity: 0.5, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {pair.formatter(currentPrice)}
            </motion.p>
          )}
          <div className={`flex items-center gap-1 text-[10px] font-mono justify-end ${isUp ? "text-profit" : "text-loss"}`}>
            {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{isUp ? "+" : ""}{change24h.toFixed(2)}%</span>
            <motion.div
              className={`h-1.5 w-1.5 rounded-full ${isUp ? "bg-profit" : "bg-loss"}`}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </div>
      </div>

      {/* Chart */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedPair}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {loading ? (
            <div className="h-[180px] flex items-center justify-center">
              <motion.div
                className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id={`multiGrad-${selectedPair}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isUp ? "hsl(152, 70%, 48%)" : "hsl(0, 72%, 55%)"} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={isUp ? "hsl(152, 70%, 48%)" : "hsl(0, 72%, 55%)"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 14%)" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: "hsl(220, 10%, 40%)" }} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(220, 10%, 40%)" }} tickFormatter={pair.yTickFormatter} />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value: number) => [pair.formatter(value), pair.label]}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={isUp ? "hsl(152, 70%, 48%)" : "hsl(0, 72%, 55%)"}
                  fill={`url(#multiGrad-${selectedPair})`}
                  strokeWidth={2}
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between text-[9px] text-muted-foreground">
        <span>7-day chart · {PAIRS.length} pairs available</span>
        <div className="flex items-center gap-1">
          <motion.div
            className="h-1 w-1 rounded-full bg-profit"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span>Live</span>
        </div>
      </div>
    </motion.div>
  );
}

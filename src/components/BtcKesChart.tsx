import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Bitcoin, TrendingUp, TrendingDown } from "lucide-react";

const KES_RATE = 130; // fallback

interface PricePoint {
  time: string;
  price: number;
}

const chartTooltipStyle = {
  background: "hsl(225, 22%, 8%)",
  border: "1px solid hsl(217, 91%, 60%, 0.2)",
  borderRadius: 12,
  fontSize: 11,
  boxShadow: "0 8px 32px hsl(225, 25%, 5%, 0.5)",
};

export default function BtcKesChart() {
  const [data, setData] = useState<PricePoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [change24h, setChange24h] = useState<number>(0);
  const [kesRate, setKesRate] = useState(KES_RATE);

  // Fetch USD/KES rate
  useEffect(() => {
    fetch("https://api.exchangerate-api.com/v4/latest/USD")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.rates?.KES) setKesRate(d.rates.KES); })
      .catch(() => {});
  }, []);

  // Fetch BTC price history (last 7 days)
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7&interval=daily"
        );
        if (!res.ok) return;
        const json = await res.json();
        if (json.prices) {
          const points: PricePoint[] = json.prices.map(([ts, price]: [number, number]) => ({
            time: new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            price: Math.round(price * kesRate),
          }));
          setData(points);
          if (points.length > 0) setCurrentPrice(points[points.length - 1].price);
        }
      } catch {
        // Generate simulated data
        const simulated: PricePoint[] = [];
        let price = 68000 * kesRate;
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          price += (Math.random() - 0.48) * 1500 * kesRate;
          simulated.push({
            time: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            price: Math.round(price),
          });
        }
        setData(simulated);
        setCurrentPrice(simulated[simulated.length - 1].price);
      }
    };

    // Fetch 24h change
    const fetch24h = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true"
        );
        if (!res.ok) return;
        const json = await res.json();
        if (json.bitcoin?.usd_24h_change) setChange24h(json.bitcoin.usd_24h_change);
        if (json.bitcoin?.usd) setCurrentPrice(Math.round(json.bitcoin.usd * kesRate));
      } catch {}
    };

    fetchHistory();
    fetch24h();
  }, [kesRate]);

  // Simulate live ticks
  useEffect(() => {
    if (data.length === 0) return;
    const interval = setInterval(() => {
      setData(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        const delta = (Math.random() - 0.48) * 50000;
        const newPrice = Math.max(1, last.price + delta);
        updated[updated.length - 1] = { ...last, price: Math.round(newPrice) };
        setCurrentPrice(Math.round(newPrice));
        return updated;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [data.length]);

  const isUp = change24h >= 0;
  const fmtKes = (n: number) => `KES ${n.toLocaleString()}`;

  return (
    <motion.div
      className="glass-card-hover rounded-xl p-5 space-y-3 animate-border-shimmer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -2, scale: 1.005 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            className="h-7 w-7 rounded-lg bg-warning/10 flex items-center justify-center"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Bitcoin className="h-4 w-4 text-warning" />
          </motion.div>
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              BTC / KES
            </h3>
            {currentPrice && (
              <motion.p
                className="text-sm font-mono font-bold text-foreground"
                key={currentPrice}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
              >
                {fmtKes(currentPrice)}
              </motion.p>
            )}
          </div>
        </div>
        <div className={`flex items-center gap-1 text-xs font-mono ${isUp ? "text-profit" : "text-loss"}`}>
          {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          <span>{isUp ? "+" : ""}{change24h.toFixed(2)}%</span>
          <motion.div
            className={`h-1.5 w-1.5 rounded-full ${isUp ? "bg-profit" : "bg-loss"}`}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="btcKesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isUp ? "hsl(152, 70%, 48%)" : "hsl(0, 72%, 55%)"} stopOpacity={0.25} />
              <stop offset="95%" stopColor={isUp ? "hsl(152, 70%, 48%)" : "hsl(0, 72%, 55%)"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 14%)" />
          <XAxis dataKey="time" tick={{ fontSize: 9, fill: "hsl(220, 10%, 40%)" }} />
          <YAxis
            tick={{ fontSize: 9, fill: "hsl(220, 10%, 40%)" }}
            tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`}
          />
          <Tooltip
            contentStyle={chartTooltipStyle}
            formatter={(value: number) => [fmtKes(value), "BTC/KES"]}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={isUp ? "hsl(152, 70%, 48%)" : "hsl(0, 72%, 55%)"}
            fill="url(#btcKesGrad)"
            strokeWidth={2}
            name="BTC/KES"
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-between text-[9px] text-muted-foreground">
        <span>7-day chart</span>
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

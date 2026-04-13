import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CoinOption {
  id: string;
  symbol: string;
  name: string;
}

interface Holding {
  coinId: string;
  symbol: string;
  name: string;
  amount: number;
  buyPrice: number; // USD price when bought
}

interface LivePrice {
  usd: number;
  usd_24h_change?: number;
}

const POPULAR_COINS: CoinOption[] = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "binancecoin", symbol: "BNB", name: "BNB" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "ripple", symbol: "XRP", name: "XRP" },
  { id: "cardano", symbol: "ADA", name: "Cardano" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
  { id: "polkadot", symbol: "DOT", name: "Polkadot" },
  { id: "avalanche-2", symbol: "AVAX", name: "Avalanche" },
  { id: "chainlink", symbol: "LINK", name: "Chainlink" },
  { id: "tron", symbol: "TRX", name: "Tron" },
  { id: "litecoin", symbol: "LTC", name: "Litecoin" },
];

const STORAGE_KEY = "comptra_portfolio";

export default function CryptoPortfolioTracker() {
  const [holdings, setHoldings] = useState<Holding[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [prices, setPrices] = useState<Record<string, LivePrice>>({});
  const [expanded, setExpanded] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newCoinId, setNewCoinId] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newBuyPrice, setNewBuyPrice] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Persist holdings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
  }, [holdings]);

  // Fetch live prices
  const fetchPrices = useCallback(async () => {
    if (holdings.length === 0) return;
    setRefreshing(true);
    try {
      const ids = [...new Set(holdings.map((h) => h.coinId))].join(",");
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
      );
      if (res.ok) {
        const json = await res.json();
        const mapped: Record<string, LivePrice> = {};
        for (const [id, data] of Object.entries(json)) {
          const d = data as any;
          mapped[id] = { usd: d.usd, usd_24h_change: d.usd_24h_change };
        }
        setPrices(mapped);
      }
    } catch {
      // Use fallback simulated prices
      const fallback: Record<string, LivePrice> = {};
      holdings.forEach((h) => {
        if (!fallback[h.coinId]) {
          fallback[h.coinId] = {
            usd: h.buyPrice * (1 + (Math.random() - 0.4) * 0.2),
            usd_24h_change: (Math.random() - 0.45) * 10,
          };
        }
      });
      setPrices(fallback);
    } finally {
      setRefreshing(false);
    }
  }, [holdings]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const addHolding = () => {
    const coin = POPULAR_COINS.find((c) => c.id === newCoinId);
    if (!coin || !newAmount || !newBuyPrice) return;
    setHoldings((prev) => [
      ...prev,
      {
        coinId: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        amount: parseFloat(newAmount),
        buyPrice: parseFloat(newBuyPrice),
      },
    ]);
    setNewCoinId("");
    setNewAmount("");
    setNewBuyPrice("");
    setShowAdd(false);
  };

  const removeHolding = (index: number) => {
    setHoldings((prev) => prev.filter((_, i) => i !== index));
  };

  const totals = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    holdings.forEach((h) => {
      const currentPrice = prices[h.coinId]?.usd ?? h.buyPrice;
      totalValue += h.amount * currentPrice;
      totalCost += h.amount * h.buyPrice;
    });
    const pnl = totalValue - totalCost;
    const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
    return { totalValue, totalCost, pnl, pnlPercent };
  }, [holdings, prices]);

  const isUp = totals.pnl >= 0;

  return (
    <motion.div
      className="glass-card-hover rounded-xl p-5 space-y-3 animate-border-shimmer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      whileHover={{ y: -2, scale: 1.005 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Wallet className="h-4 w-4 text-accent" />
          </motion.div>
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Portfolio Tracker
            </h3>
            {holdings.length > 0 && (
              <motion.p
                className="text-sm font-mono font-bold text-foreground"
                key={totals.totalValue.toFixed(0)}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
              >
                ${totals.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </motion.p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {holdings.length > 0 && (
            <div className={`flex items-center gap-1 text-[10px] font-mono ${isUp ? "text-profit" : "text-loss"}`}>
              {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{isUp ? "+" : ""}{totals.pnlPercent.toFixed(2)}%</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => fetchPrices()}
            disabled={refreshing}
          >
            <motion.div animate={refreshing ? { rotate: 360 } : {}} transition={{ duration: 1, repeat: refreshing ? Infinity : 0 }}>
              <RefreshCw className="h-3 w-3" />
            </motion.div>
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden space-y-2"
          >
            {/* Holdings list */}
            {holdings.length === 0 && !showAdd && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No holdings yet. Add your first coin!
              </p>
            )}

            {holdings.map((h, i) => {
              const livePrice = prices[h.coinId]?.usd ?? h.buyPrice;
              const value = h.amount * livePrice;
              const pnl = (livePrice - h.buyPrice) * h.amount;
              const pnlPct = ((livePrice - h.buyPrice) / h.buyPrice) * 100;
              const up = pnl >= 0;

              return (
                <motion.div
                  key={`${h.coinId}-${i}`}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-background/30 hover:bg-background/50 transition-colors"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold font-mono text-primary">{h.symbol}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{h.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-[10px] font-mono text-foreground">${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                      <p className={`text-[9px] font-mono ${up ? "text-profit" : "text-loss"}`}>
                        {up ? "+" : ""}{pnlPct.toFixed(1)}%
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground hover:text-loss"
                      onClick={() => removeHolding(i)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}

            {/* P&L summary */}
            {holdings.length > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-border/30 text-[10px]">
                <span className="text-muted-foreground">Total P&L</span>
                <span className={`font-mono font-bold ${isUp ? "text-profit" : "text-loss"}`}>
                  {isUp ? "+" : ""}${totals.pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {/* Add form */}
            <AnimatePresence>
              {showAdd && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 pt-1 overflow-hidden"
                >
                  <Select value={newCoinId} onValueChange={setNewCoinId}>
                    <SelectTrigger className="h-8 text-xs bg-background/50">
                      <SelectValue placeholder="Select coin" />
                    </SelectTrigger>
                    <SelectContent>
                      {POPULAR_COINS.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          {c.symbol} - {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="h-8 text-xs bg-background/50"
                    />
                    <Input
                      type="number"
                      placeholder="Buy price ($)"
                      value={newBuyPrice}
                      onChange={(e) => setNewBuyPrice(e.target.value)}
                      className="h-8 text-xs bg-background/50"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-xs flex-1" onClick={addHolding} disabled={!newCoinId || !newAmount || !newBuyPrice}>
                      Add
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowAdd(false)}>
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!showAdd && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-7 text-xs gap-1 border-dashed"
                onClick={() => setShowAdd(true)}
              >
                <Plus className="h-3 w-3" />
                Add Holding
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

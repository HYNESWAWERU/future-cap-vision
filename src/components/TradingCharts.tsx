import { useMemo } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format } from "date-fns";
import type { DayEntry } from "@/hooks/useTradingEngine";

interface Props {
  entries: DayEntry[];
  startingCapital: number;
}

const chartTooltipStyle = {
  background: "hsl(225, 22%, 8%)",
  border: "1px solid hsl(45, 90%, 55%, 0.15)",
  borderRadius: 12,
  fontSize: 11,
  boxShadow: "0 8px 32px hsl(225, 25%, 5%, 0.5)",
};

export default function TradingCharts({ entries, startingCapital }: Props) {
  const filledEntries = useMemo(() => entries.filter((e) => !e.isProjected), [entries]);
  const chartEntries = filledEntries.length > 0 ? filledEntries : entries.slice(0, 90);

  const capitalData = useMemo(() => {
    let cumulativeDeposits = 0;
    let cumulativeWithdrawals = 0;
    return chartEntries.map((e) => {
      cumulativeDeposits += e.deposit;
      cumulativeWithdrawals += e.withdrawal;
      const netCashflow = cumulativeDeposits - cumulativeWithdrawals;
      const tradingOnly = e.closingCapital - netCashflow;
      return {
        date: format(e.date, "dd MMM"),
        account: e.closingCapital,
        tradingOnly,
        target: e.targetCapital,
      };
    });
  }, [chartEntries]);

  const pnlData = useMemo(() =>
    chartEntries.map((e) => ({
      date: format(e.date, "dd MMM"),
      pnl: e.dailyProfitLoss,
    })), [chartEntries]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <motion.div
        className="glass-card-hover rounded-xl p-5 space-y-3 animate-border-shimmer"
        whileHover={{ y: -2, scale: 1.005 }}
        transition={{ duration: 0.2 }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Equity Curves
          </h3>
          <motion.div
            className="h-1.5 w-1.5 rounded-full bg-profit"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={capitalData}>
            <defs>
              <linearGradient id="capitalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="tradingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(152, 70%, 48%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(152, 70%, 48%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 14%)" />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(220, 10%, 40%)" }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9, fill: "hsl(220, 10%, 40%)" }} />
            <Tooltip contentStyle={chartTooltipStyle} />
            <Area type="monotone" dataKey="target" stroke="hsl(220, 10%, 30%)" strokeDasharray="4 4" fill="none" name="Target" strokeWidth={1} />
            <Area type="monotone" dataKey="tradingOnly" stroke="hsl(152, 70%, 48%)" fill="url(#tradingGrad)" name="Trading Only" strokeWidth={1.5} />
            <Area type="monotone" dataKey="account" stroke="hsl(217, 91%, 60%)" fill="url(#capitalGrad)" name="Account Balance" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        className="glass-card-hover rounded-xl p-5 space-y-3 animate-border-shimmer"
        whileHover={{ y: -2, scale: 1.005 }}
        transition={{ duration: 0.2 }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Daily P/L
          </h3>
          <motion.div
            className="h-1.5 w-1.5 rounded-full bg-primary"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          />
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={pnlData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 14%)" />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(220, 10%, 40%)" }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9, fill: "hsl(220, 10%, 40%)" }} />
            <Tooltip contentStyle={chartTooltipStyle} />
            <ReferenceLine y={0} stroke="hsl(220, 10%, 25%)" />
            <Bar dataKey="pnl" name="P/L" radius={[3, 3, 0, 0]}
              shape={(props: any) => {
                const { x, y, width, height, pnl } = props;
                const color = pnl >= 0 ? "hsl(152, 70%, 48%)" : "hsl(0, 72%, 55%)";
                return <rect x={x} y={y} width={width} height={height} fill={color} rx={3} opacity={0.85} />;
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}

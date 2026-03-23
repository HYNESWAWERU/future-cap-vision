import { useMemo } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format } from "date-fns";
import type { DayEntry } from "@/hooks/useTradingEngine";

interface Props {
  entries: DayEntry[];
}

export default function TradingCharts({ entries }: Props) {
  const filledEntries = useMemo(() => entries.filter((e) => !e.isProjected), [entries]);
  
  // Show first 90 days of projected if no actuals
  const chartEntries = filledEntries.length > 0 ? filledEntries : entries.slice(0, 90);

  const capitalData = useMemo(() =>
    chartEntries.map((e) => ({
      date: format(e.date, "dd MMM"),
      actual: e.closingCapital,
      target: e.targetCapital,
    })), [chartEntries]);

  const pnlData = useMemo(() =>
    chartEntries.map((e) => ({
      date: format(e.date, "dd MMM"),
      pnl: e.dailyProfitLoss,
    })), [chartEntries]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Capital Growth</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={capitalData}>
            <defs>
              <linearGradient id="capitalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 72%, 45%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(142, 72%, 45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(215, 12%, 50%)" }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: "hsl(215, 12%, 50%)" }} />
            <Tooltip contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="target" stroke="hsl(215, 12%, 35%)" strokeDasharray="4 4" fill="none" name="Target" />
            <Area type="monotone" dataKey="actual" stroke="hsl(142, 72%, 45%)" fill="url(#capitalGrad)" name="Actual" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Daily P/L</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={pnlData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(215, 12%, 50%)" }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: "hsl(215, 12%, 50%)" }} />
            <Tooltip contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: 8, fontSize: 12 }} />
            <ReferenceLine y={0} stroke="hsl(215, 12%, 35%)" />
            <Bar dataKey="pnl" name="P/L" fill="hsl(142, 72%, 45%)"
              shape={(props: any) => {
                const { x, y, width, height, pnl } = props;
                const color = pnl >= 0 ? "hsl(142, 72%, 45%)" : "hsl(0, 72%, 55%)";
                return <rect x={x} y={y} width={width} height={height} fill={color} rx={2} />;
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

import { useState, useRef, useCallback } from "react";
import { format } from "date-fns";
import { Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toKES, type DayEntry } from "@/hooks/useTradingEngine";

interface Props {
  entries: DayEntry[];
  setActualResult: (day: number, value: number | null) => void;
  toggleVerified: (day: number) => void;
}

const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PAGE_SIZE = 31;

export default function TradingTable({ entries, setActualResult, toggleVerified }: Props) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(entries.length / PAGE_SIZE);
  const pageEntries = entries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleActual = useCallback((dayIndex: number, val: string) => {
    const num = parseFloat(val);
    setActualResult(dayIndex, isNaN(num) ? null : num);
  }, [setActualResult]);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <h3 className="text-sm font-semibold uppercase tracking-wider">Daily Trading Log</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
            className="px-2 py-1 rounded bg-secondary hover:bg-muted disabled:opacity-30">Prev</button>
          <span className="font-mono">{page + 1}/{totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
            className="px-2 py-1 rounded bg-secondary hover:bg-muted disabled:opacity-30">Next</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-secondary">
            <tr className="text-muted-foreground uppercase tracking-wider">
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-right">Starting ($)</th>
              <th className="px-3 py-2 text-right">Target ($)</th>
              <th className="px-3 py-2 text-right w-32">Actual ($)</th>
              <th className="px-3 py-2 text-right">Closing ($)</th>
              <th className="px-3 py-2 text-right">P/L ($)</th>
              <th className="px-3 py-2 text-right">P/L (KES)</th>
              <th className="px-3 py-2 text-right">Deviation</th>
              <th className="px-3 py-2 text-center">✓</th>
            </tr>
          </thead>
          <tbody>
            {pageEntries.map((e) => {
              const pnlColor = e.dailyProfitLoss > 0 ? "text-profit" : e.dailyProfitLoss < 0 ? "text-loss" : "text-muted-foreground";
              return (
                <tr key={e.dayOfYear} className={`border-t border-border hover:bg-secondary/50 ${e.isProjected ? "opacity-50" : ""}`}>
                  <td className="px-3 py-1.5 font-mono">{format(e.date, "dd MMM")}</td>
                  <td className="px-3 py-1.5 font-mono text-right">{fmt(e.startingCapital)}</td>
                  <td className="px-3 py-1.5 font-mono text-right text-muted-foreground">{fmt(e.targetCapital)}</td>
                  <td className="px-3 py-1.5 text-right">
                    <Input
                      type="number" step={0.01}
                      placeholder="—"
                      defaultValue={e.actualResult ?? ""}
                      onBlur={(ev) => handleActual(e.dayOfYear, ev.target.value)}
                      className="h-6 w-28 text-xs font-mono bg-secondary border-border text-right ml-auto"
                    />
                  </td>
                  <td className="px-3 py-1.5 font-mono text-right">{fmt(e.closingCapital)}</td>
                  <td className={`px-3 py-1.5 font-mono text-right ${pnlColor}`}>
                    {e.dailyProfitLoss >= 0 ? "+" : ""}{fmt(e.dailyProfitLoss)}
                  </td>
                  <td className={`px-3 py-1.5 font-mono text-right ${pnlColor}`}>
                    {toKES(e.dailyProfitLoss) >= 0 ? "+" : ""}{toKES(e.dailyProfitLoss).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className={`px-3 py-1.5 font-mono text-right ${e.deviation > 0 ? "text-loss" : "text-profit"}`}>
                    {e.deviation >= 0 ? "+" : ""}{fmt(e.deviation)}
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <Checkbox checked={e.verified} onCheckedChange={() => toggleVerified(e.dayOfYear)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toKES, type DayEntry } from "@/hooks/useTradingEngine";

interface Props {
  entries: DayEntry[];
  setActualResult: (day: number, value: number | null) => void;
  toggleVerified: (day: number) => void;
  readOnly?: boolean;
  onEdit?: (field: string, oldValue: string, newValue: string, dayIndex?: number) => void;
}

const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function TradingTable({ entries, setActualResult, toggleVerified, readOnly = false, onEdit }: Props) {
  const [month, setMonth] = useState(() => new Date().getMonth());

  const monthEntries = useMemo(
    () => entries.filter((e) => e.date.getMonth() === month),
    [entries, month]
  );

  const today = new Date().toDateString();

  const handleActual = useCallback((dayIndex: number, val: string, oldVal: number | null) => {
    if (readOnly) return;
    const num = parseFloat(val);
    const newVal = isNaN(num) ? null : num;
    setActualResult(dayIndex, newVal);
    onEdit?.("Actual Result", oldVal !== null ? String(oldVal) : "", newVal !== null ? String(newVal) : "", dayIndex);
  }, [setActualResult, readOnly, onEdit]);

  const handleVerified = useCallback((dayIndex: number, currentState: boolean) => {
    if (readOnly) return;
    toggleVerified(dayIndex);
    onEdit?.("Verified", String(currentState), String(!currentState), dayIndex);
  }, [toggleVerified, readOnly, onEdit]);

  const goToToday = () => setMonth(new Date().getMonth());

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border flex-wrap gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider">Daily Trading Log</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMonth(Math.max(0, month - 1))} disabled={month === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-32 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMonth(Math.min(11, month + 1))} disabled={month === 11}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={goToToday}>
            <CalendarDays className="h-3 w-3" /> Today
          </Button>
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
              <th className="px-3 py-2 text-center">Status</th>
              <th className="px-3 py-2 text-center">✓</th>
            </tr>
          </thead>
          <tbody>
            {monthEntries.map((e) => {
              const isToday = e.date.toDateString() === today;
              const pnlColor = e.dailyProfitLoss > 0 ? "text-profit" : e.dailyProfitLoss < 0 ? "text-loss" : "text-muted-foreground";

              if (e.isBeforeStart) {
                return (
                  <tr key={e.dayOfYear} className="border-t border-border opacity-30">
                    <td className="px-3 py-1.5 font-mono">{format(e.date, "dd MMM")}</td>
                    <td colSpan={8} className="px-3 py-1.5 text-center text-muted-foreground italic">Before trading start</td>
                    <td />
                  </tr>
                );
              }

              const statusLabel = e.isProjected
                ? "⏳ Pending"
                : e.verified
                ? e.dailyProfitLoss >= 0 ? "✅ Verified" : "✅ Verified"
                : "⚠️ Unverified";

              return (
                <tr key={e.dayOfYear} className={`border-t border-border hover:bg-secondary/50 ${e.isProjected ? "opacity-50" : ""} ${isToday ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : ""}`}>
                  <td className={`px-3 py-1.5 font-mono ${isToday ? "font-bold text-primary" : ""}`}>{format(e.date, "dd MMM")}</td>
                  <td className="px-3 py-1.5 font-mono text-right">{fmt(e.startingCapital)}</td>
                  <td className="px-3 py-1.5 font-mono text-right text-muted-foreground">{fmt(e.targetCapital)}</td>
                  <td className="px-3 py-1.5 text-right">
                    <Input
                      type="number" step={0.01}
                      placeholder="—"
                      defaultValue={e.actualResult ?? ""}
                      onBlur={(ev) => handleActual(e.dayOfYear, ev.target.value, e.actualResult)}
                      disabled={readOnly}
                      className="h-6 w-28 text-xs font-mono bg-secondary border-border text-right ml-auto disabled:opacity-40"
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
                  <td className="px-3 py-1.5 text-center text-xs whitespace-nowrap">{statusLabel}</td>
                  <td className="px-3 py-1.5 text-center">
                    <Checkbox checked={e.verified} onCheckedChange={() => handleVerified(e.dayOfYear, e.verified)}
                      disabled={readOnly}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary disabled:opacity-40" />
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

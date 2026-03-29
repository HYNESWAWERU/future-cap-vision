import { useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toKES, type DayEntry } from "@/hooks/useTradingEngine";

interface Props {
  entries: DayEntry[];
  setActualResult: (key: string, value: number | null) => void;
  toggleVerified: (key: string) => void;
  setDeposit: (key: string, value: number) => void;
  setWithdrawal: (key: string, value: number) => void;
  availableYears: number[];
  readOnly?: boolean;
  onEdit?: (field: string, oldValue: string, newValue: string, dayIndex?: number) => void;
}

const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function dateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default function TradingTable({ entries, setActualResult, toggleVerified, setDeposit, setWithdrawal, availableYears, readOnly = false, onEdit }: Props) {
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());

  const monthEntries = useMemo(
    () => entries.filter((e) => e.date.getMonth() === month && e.date.getFullYear() === viewYear),
    [entries, month, viewYear]
  );

  const today = new Date().toDateString();

  const handleActual = useCallback((key: string, val: string, oldVal: number | null) => {
    if (readOnly) return;
    const num = parseFloat(val);
    const newVal = isNaN(num) ? null : num;
    setActualResult(key, newVal);
    onEdit?.("Actual Result", oldVal !== null ? String(oldVal) : "", newVal !== null ? String(newVal) : "");
  }, [setActualResult, readOnly, onEdit]);

  const handleDeposit = useCallback((key: string, val: string, oldVal: number) => {
    if (readOnly) return;
    const num = parseFloat(val);
    const newVal = isNaN(num) ? 0 : num;
    setDeposit(key, newVal);
    onEdit?.("Deposit", String(oldVal), String(newVal));
  }, [setDeposit, readOnly, onEdit]);

  const handleWithdrawal = useCallback((key: string, val: string, oldVal: number) => {
    if (readOnly) return;
    const num = parseFloat(val);
    const newVal = isNaN(num) ? 0 : num;
    setWithdrawal(key, newVal);
    onEdit?.("Withdrawal", String(oldVal), String(newVal));
  }, [setWithdrawal, readOnly, onEdit]);

  const handleVerified = useCallback((key: string, currentState: boolean) => {
    if (readOnly) return;
    toggleVerified(key);
    onEdit?.("Verified", String(currentState), String(!currentState));
  }, [toggleVerified, readOnly, onEdit]);

  const goToToday = () => {
    setMonth(new Date().getMonth());
    setViewYear(new Date().getFullYear());
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setViewYear(viewYear - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setViewYear(viewYear + 1); }
    else setMonth(month + 1);
  };

  return (
    <motion.div
      className="glass-card rounded-xl overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 flex-wrap gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gradient-gold">Daily Trading Log</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10 hover:text-primary transition-colors" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-32 h-7 text-xs bg-muted/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {availableYears.length > 1 && (
            <Select value={String(viewYear)} onValueChange={(v) => setViewYear(Number(v))}>
              <SelectTrigger className="w-24 h-7 text-xs bg-muted/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10 hover:text-primary transition-colors" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-border/50 hover:border-primary/30 hover:text-primary" onClick={goToToday}>
            <CalendarDays className="h-3 w-3" /> Today
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
            <tr className="text-muted-foreground uppercase tracking-[0.15em]">
              <th className="px-3 py-2.5 text-left text-[10px]">Date</th>
              <th className="px-3 py-2.5 text-right text-[10px]">Deposit ($)</th>
              <th className="px-3 py-2.5 text-right text-[10px]">Withdraw ($)</th>
              <th className="px-3 py-2.5 text-right text-[10px]">Starting ($)</th>
              <th className="px-3 py-2.5 text-right text-[10px]">Target ($)</th>
              <th className="px-3 py-2.5 text-right w-28 text-[10px]">Actual ($)</th>
              <th className="px-3 py-2.5 text-right text-[10px]">Closing ($)</th>
              <th className="px-3 py-2.5 text-right text-[10px]">P/L ($)</th>
              <th className="px-3 py-2.5 text-right text-[10px]">P/L (KES)</th>
              <th className="px-3 py-2.5 text-right text-[10px]">% P/L</th>
              <th className="px-3 py-2.5 text-center text-[10px]">Status</th>
              <th className="px-3 py-2.5 text-center text-[10px]">✓</th>
            </tr>
          </thead>
          <tbody>
            {monthEntries.map((e, i) => {
              const key = dateKey(e.date);
              const isToday = e.date.toDateString() === today;
              const pnlColor = e.dailyProfitLoss > 0 ? "text-profit" : e.dailyProfitLoss < 0 ? "text-loss" : "text-muted-foreground";
              const pctColor = e.percentChange > 0 ? "text-profit" : e.percentChange < 0 ? "text-loss" : "text-muted-foreground";

              const statusLabel = e.isProjected
                ? "⏳ Pending"
                : e.verified
                ? "✅ Verified"
                : "⚠️ Unverified";

              return (
                <motion.tr
                  key={key}
                  className={`border-t border-border/30 transition-colors duration-150 hover:bg-primary/[0.03] ${e.isProjected ? "opacity-40" : ""} ${isToday ? "bg-primary/[0.06] ring-1 ring-inset ring-primary/20" : ""}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: e.isProjected ? 0.4 : 1 }}
                  transition={{ delay: i * 0.01 }}
                >
                  <td className={`px-3 py-1.5 font-mono ${isToday ? "font-bold text-primary" : ""}`}>{format(e.date, "dd MMM yyyy")}</td>
                  <td className="px-3 py-1.5 text-right">
                    <Input type="number" step={0.01} placeholder="—" defaultValue={e.deposit || ""}
                      onBlur={(ev) => handleDeposit(key, ev.target.value, e.deposit)} disabled={readOnly}
                      className="h-6 w-24 text-xs font-mono bg-muted/30 border-border/30 text-right ml-auto disabled:opacity-40 focus:border-primary/40" />
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <Input type="number" step={0.01} placeholder="—" defaultValue={e.withdrawal || ""}
                      onBlur={(ev) => handleWithdrawal(key, ev.target.value, e.withdrawal)} disabled={readOnly}
                      className="h-6 w-24 text-xs font-mono bg-muted/30 border-border/30 text-right ml-auto disabled:opacity-40 focus:border-primary/40" />
                  </td>
                  <td className="px-3 py-1.5 font-mono text-right">{fmt(e.startingCapital)}</td>
                  <td className="px-3 py-1.5 font-mono text-right text-muted-foreground">{fmt(e.targetCapital)}</td>
                  <td className="px-3 py-1.5 text-right">
                    <Input type="number" step={0.01} placeholder="—" defaultValue={e.actualResult ?? ""}
                      onBlur={(ev) => handleActual(key, ev.target.value, e.actualResult)} disabled={readOnly}
                      className="h-6 w-28 text-xs font-mono bg-muted/30 border-border/30 text-right ml-auto disabled:opacity-40 focus:border-primary/40" />
                  </td>
                  <td className="px-3 py-1.5 font-mono text-right">{fmt(e.closingCapital)}</td>
                  <td className={`px-3 py-1.5 font-mono text-right ${pnlColor}`}>
                    {e.dailyProfitLoss >= 0 ? "+" : ""}{fmt(e.dailyProfitLoss)}
                  </td>
                  <td className={`px-3 py-1.5 font-mono text-right ${pnlColor}`}>
                    {toKES(e.dailyProfitLoss) >= 0 ? "+" : ""}{toKES(e.dailyProfitLoss).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className={`px-3 py-1.5 font-mono text-right ${pctColor}`}>
                    {e.percentChange >= 0 ? "+" : ""}{e.percentChange.toFixed(2)}%
                  </td>
                  <td className="px-3 py-1.5 text-center text-xs whitespace-nowrap">{statusLabel}</td>
                  <td className="px-3 py-1.5 text-center">
                    <Checkbox checked={e.verified} onCheckedChange={() => handleVerified(key, e.verified)}
                      disabled={readOnly}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary disabled:opacity-40" />
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DayEntry } from "./useTradingEngine";

export { type DayEntry } from "./useTradingEngine";

const KES_RATE = 129;
export const toKES = (usd: number) => usd * KES_RATE;

function getDateRange(startDate: string, endDate: string): Date[] {
  const days: Date[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

function dateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

interface TradeEntryRow {
  entry_date: string;
  actual_result: number | null;
  deposit: number;
  withdrawal: number;
  verified: boolean;
}

export function useCloudTradingEngine(sessionId: string | null) {
  const [startingCapital, setStartingCapitalLocal] = useState(1000);
  const [dailyTargetPercent, setDailyTargetPercentLocal] = useState(4.0);
  const [tradingStartDate, setTradingStartDateLocal] = useState(`${new Date().getFullYear()}-01-01`);
  const [tradingEndDate, setTradingEndDateLocal] = useState(`${new Date().getFullYear()}-12-31`);
  const [accountabilityPartner, setAccountabilityPartnerLocal] = useState("");
  const [tradeEntries, setTradeEntries] = useState<Record<string, TradeEntryRow>>({});
  const [loading, setLoading] = useState(true);
  const [hasPinSet, setHasPinSet] = useState(false);
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Load session data
  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }

    const loadSession = async () => {
      setLoading(true);
      // Load session config (use view to hide pin_hash)
      const { data: session } = await supabase
        .from("trading_sessions_public" as any)
        .select("*")
        .eq("id", sessionId)
        .single();

      if (session) {
        const s = session as any;
        setStartingCapitalLocal(Number(s.starting_capital));
        setDailyTargetPercentLocal(Number(s.daily_target_percent));
        setTradingStartDateLocal(s.trading_start_date);
        setTradingEndDateLocal(s.trading_end_date);
        setAccountabilityPartnerLocal(s.accountability_partner || "");
        setHasPinSet(!!s.has_pin);
      }

      // Load trade entries
      const { data: entries } = await supabase
        .from("trade_entries")
        .select("entry_date, actual_result, deposit, withdrawal, verified")
        .eq("session_id", sessionId);

      if (entries) {
        const map: Record<string, TradeEntryRow> = {};
        for (const e of entries as any[]) {
          map[e.entry_date] = {
            entry_date: e.entry_date,
            actual_result: e.actual_result != null ? Number(e.actual_result) : null,
            deposit: Number(e.deposit),
            withdrawal: Number(e.withdrawal),
            verified: e.verified,
          };
        }
        setTradeEntries(map);
      }
      setLoading(false);
    };

    loadSession();
  }, [sessionId]);

  // Real-time subscriptions
  useEffect(() => {
    if (!sessionId) return;

    const sessionChannel = supabase
      .channel(`session-${sessionId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "trading_sessions",
        filter: `id=eq.${sessionId}`,
      }, (payload: any) => {
        if (payload.new) {
          const s = payload.new;
          setStartingCapitalLocal(Number(s.starting_capital));
          setDailyTargetPercentLocal(Number(s.daily_target_percent));
          setTradingStartDateLocal(s.trading_start_date);
          setTradingEndDateLocal(s.trading_end_date);
          setAccountabilityPartnerLocal(s.accountability_partner || "");
          setHasPinSet(!!s.pin_hash);
        }
      })
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "trade_entries",
        filter: `session_id=eq.${sessionId}`,
      }, (payload: any) => {
        if (payload.eventType === "DELETE") {
          setTradeEntries(prev => {
            const next = { ...prev };
            // Find and remove by matching
            for (const [k, v] of Object.entries(next)) {
              if (v.entry_date === payload.old?.entry_date) {
                delete next[k];
                break;
              }
            }
            return next;
          });
        } else if (payload.new) {
          const e = payload.new;
          setTradeEntries(prev => ({
            ...prev,
            [e.entry_date]: {
              entry_date: e.entry_date,
              actual_result: e.actual_result != null ? Number(e.actual_result) : null,
              deposit: Number(e.deposit),
              withdrawal: Number(e.withdrawal),
              verified: e.verified,
            },
          }));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(sessionChannel); };
  }, [sessionId]);

  // Upsert a trade entry with debounce
  const upsertTradeEntry = useCallback(
    (key: string, updates: Partial<TradeEntryRow>) => {
      if (!sessionId) return;

      // Optimistic local update
      setTradeEntries(prev => ({
        ...prev,
        [key]: {
          entry_date: key,
          actual_result: null,
          deposit: 0,
          withdrawal: 0,
          verified: false,
          ...prev[key],
          ...updates,
        },
      }));

      // Debounce DB write
      const timerKey = `entry-${key}`;
      if (debounceTimers.current[timerKey]) clearTimeout(debounceTimers.current[timerKey]);
      debounceTimers.current[timerKey] = setTimeout(async () => {
        const current = { ...tradeEntries[key], ...updates };
        await supabase.from("trade_entries").upsert({
          session_id: sessionId,
          entry_date: key,
          actual_result: current.actual_result ?? updates.actual_result ?? null,
          deposit: current.deposit ?? updates.deposit ?? 0,
          withdrawal: current.withdrawal ?? updates.withdrawal ?? 0,
          verified: current.verified ?? updates.verified ?? false,
        }, { onConflict: "session_id,entry_date" });
      }, 300);
    },
    [sessionId, tradeEntries]
  );

  // Update session config with debounce
  const updateSession = useCallback(
    (field: string, value: any) => {
      if (!sessionId) return;
      const timerKey = `session-${field}`;
      if (debounceTimers.current[timerKey]) clearTimeout(debounceTimers.current[timerKey]);
      debounceTimers.current[timerKey] = setTimeout(async () => {
        await supabase.from("trading_sessions").update({ [field]: value }).eq("id", sessionId);
      }, 500);
    },
    [sessionId]
  );

  const setStartingCapital = useCallback((v: number) => {
    setStartingCapitalLocal(v);
    updateSession("starting_capital", v);
  }, [updateSession]);

  const setDailyTargetPercent = useCallback((v: number) => {
    setDailyTargetPercentLocal(v);
    updateSession("daily_target_percent", v);
  }, [updateSession]);

  const setTradingStartDate = useCallback((v: string) => {
    setTradingStartDateLocal(v);
    updateSession("trading_start_date", v);
  }, [updateSession]);

  const setTradingEndDate = useCallback((v: string) => {
    setTradingEndDateLocal(v);
    updateSession("trading_end_date", v);
  }, [updateSession]);

  const setAccountabilityPartner = useCallback((v: string) => {
    setAccountabilityPartnerLocal(v);
    updateSession("accountability_partner", v);
  }, [updateSession]);

  // Compute entries (same logic as original)
  const entries = useMemo(() => {
    const days = getDateRange(tradingStartDate, tradingEndDate);
    const result: DayEntry[] = [];
    const rate = dailyTargetPercent / 100;
    let prevClosing = startingCapital;

    for (let i = 0; i < days.length; i++) {
      const key = dateKey(days[i]);
      const te = tradeEntries[key];
      const dep = te?.deposit ?? 0;
      const wth = te?.withdrawal ?? 0;
      const adjustedStart = (i === 0 ? startingCapital : prevClosing) + dep - wth;
      const target = adjustedStart * (1 + rate);
      const actual = te?.actual_result ?? null;
      const closing = actual !== null ? actual : target;
      const pnl = closing - adjustedStart;
      const pctChange = adjustedStart !== 0 ? ((closing - adjustedStart) / adjustedStart) * 100 : 0;
      const isProjected = actual === null;

      result.push({
        date: days[i],
        dayIndex: i,
        startingCapital: adjustedStart,
        targetCapital: target,
        actualResult: actual,
        closingCapital: closing,
        dailyProfitLoss: pnl,
        percentChange: pctChange,
        deposit: dep,
        withdrawal: wth,
        verified: te?.verified ?? false,
        isProjected,
        isBeforeStart: false,
      });
      prevClosing = closing;
    }
    return result;
  }, [startingCapital, dailyTargetPercent, tradingStartDate, tradingEndDate, tradeEntries]);

  const setActualResult = useCallback((key: string, value: number | null) => {
    upsertTradeEntry(key, { actual_result: value });
  }, [upsertTradeEntry]);

  const setDeposit = useCallback((key: string, value: number) => {
    upsertTradeEntry(key, { deposit: value });
  }, [upsertTradeEntry]);

  const setWithdrawal = useCallback((key: string, value: number) => {
    upsertTradeEntry(key, { withdrawal: value });
  }, [upsertTradeEntry]);

  const toggleVerified = useCallback((key: string) => {
    const current = tradeEntries[key]?.verified ?? false;
    upsertTradeEntry(key, { verified: !current });
  }, [upsertTradeEntry, tradeEntries]);

  const getProjection = useCallback(
    (targetDate: Date) => {
      const target = targetDate.toDateString();
      const entry = entries.find((e) => e.date.toDateString() === target);
      if (!entry) return null;
      return {
        expectedCapital: entry.closingCapital,
        expectedProfit: entry.closingCapital - startingCapital,
        growthPercent: ((entry.closingCapital - startingCapital) / startingCapital) * 100,
      };
    },
    [entries, startingCapital]
  );

  const summary = useMemo(() => {
    const verifiedEntries = entries.filter((e) => !e.isProjected && e.verified);
    const allFilledEntries = entries.filter((e) => !e.isProjected);
    const lastFilled = allFilledEntries[allFilledEntries.length - 1];
    const currentCapital = lastFilled ? lastFilled.closingCapital : startingCapital;
    const totalDeposits = entries.reduce((s, e) => s + e.deposit, 0);
    const totalWithdrawals = entries.reduce((s, e) => s + e.withdrawal, 0);
    const netCashflow = totalDeposits - totalWithdrawals;
    const tradingProfitOnly = currentCapital - startingCapital - netCashflow;
    const accountGrowthTotal = currentCapital - startingCapital;
    const tradingGrowthPercent = startingCapital !== 0 ? (tradingProfitOnly / startingCapital) * 100 : 0;
    const accountGrowthPercent = startingCapital !== 0 ? (accountGrowthTotal / startingCapital) * 100 : 0;
    const winDays = verifiedEntries.filter((e) => e.dailyProfitLoss > 0).length;
    const lossDays = verifiedEntries.filter((e) => e.dailyProfitLoss < 0).length;
    const startD = new Date(tradingStartDate);
    const endD = lastFilled ? lastFilled.date : new Date(tradingEndDate);
    const yearsElapsed = Math.max((endD.getTime() - startD.getTime()) / (365.25 * 86400000), 1 / 365);
    const cagr = currentCapital > 0 && startingCapital > 0
      ? (Math.pow(currentCapital / startingCapital, 1 / yearsElapsed) - 1) * 100
      : 0;
    const monthMap = new Map<string, number>();
    for (const e of allFilledEntries) {
      const k = `${e.date.getFullYear()}-${e.date.getMonth()}`;
      monthMap.set(k, (monthMap.get(k) ?? 0) + e.dailyProfitLoss);
    }
    let bestMonth = { label: "N/A", pnl: 0 };
    let worstMonth = { label: "N/A", pnl: 0 };
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (const [key, pnl] of monthMap) {
      const [y, m] = key.split("-").map(Number);
      const label = `${monthNames[m]} ${y}`;
      if (pnl > bestMonth.pnl || bestMonth.label === "N/A") bestMonth = { label, pnl };
      if (pnl < worstMonth.pnl || worstMonth.label === "N/A") worstMonth = { label, pnl };
    }
    return {
      currentCapital, tradingProfitOnly, accountGrowthTotal,
      tradingGrowthPercent, accountGrowthPercent,
      winDays, lossDays, tradingDays: verifiedEntries.length,
      totalDeposits, totalWithdrawals, netCashflow,
      cagr, bestMonth, worstMonth,
    };
  }, [entries, startingCapital, tradingStartDate, tradingEndDate]);

  const availableYears = useMemo(() => {
    const startY = new Date(tradingStartDate).getFullYear();
    const endY = new Date(tradingEndDate).getFullYear();
    const years: number[] = [];
    for (let y = startY; y <= endY; y++) years.push(y);
    return years;
  }, [tradingStartDate, tradingEndDate]);

  const resetAllTrades = useCallback(async () => {
    if (!sessionId) return;
    setTradeEntries({});
    await supabase.from("trade_entries").delete().eq("session_id", sessionId);
  }, [sessionId]);

  return {
    startingCapital, setStartingCapital,
    dailyTargetPercent, setDailyTargetPercent,
    tradingStartDate, setTradingStartDate,
    tradingEndDate, setTradingEndDate,
    entries, setActualResult, toggleVerified,
    setDeposit, setWithdrawal,
    getProjection, summary,
    accountabilityPartner, setAccountabilityPartner,
    resetAllTrades, availableYears,
    loading, hasPinSet, sessionId,
  };
}

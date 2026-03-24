import { useState, useCallback, useMemo, useEffect } from "react";

export interface DayEntry {
  date: Date;
  dayOfYear: number;
  startingCapital: number;
  targetCapital: number;
  actualResult: number | null;
  closingCapital: number;
  dailyProfitLoss: number;
  deviation: number;
  verified: boolean;
  isProjected: boolean;
  isBeforeStart: boolean;
}

export interface TradingState {
  startingCapital: number;
  dailyTargetPercent: number;
  year: number;
  entries: DayEntry[];
  accountabilityPartner: string;
  tradingStartDate: string | null;
}

const KES_RATE = 129;
const STORAGE_KEY = "trading-engine-state";

export const toKES = (usd: number) => usd * KES_RATE;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function getDaysInYear(year: number): Date[] {
  const days: Date[] = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

export function useTradingEngine() {
  const [startingCapital, setStartingCapital] = useState(() => loadState()?.startingCapital ?? 1000);
  const [dailyTargetPercent, setDailyTargetPercent] = useState(() => loadState()?.dailyTargetPercent ?? 4.0);
  const [year, setYear] = useState(() => loadState()?.year ?? new Date().getFullYear());
  const [actuals, setActuals] = useState<Record<number, number | null>>(() => loadState()?.actuals ?? {});
  const [verified, setVerified] = useState<Record<number, boolean>>(() => loadState()?.verified ?? {});
  const [accountabilityPartner, setAccountabilityPartner] = useState(() => loadState()?.accountabilityPartner ?? "");
  const [tradingStartDate, setTradingStartDate] = useState<string | null>(() => loadState()?.tradingStartDate ?? null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      startingCapital, dailyTargetPercent, year, actuals, verified, accountabilityPartner, tradingStartDate,
    }));
  }, [startingCapital, dailyTargetPercent, year, actuals, verified, accountabilityPartner, tradingStartDate]);

  const startDayIndex = useMemo(() => {
    if (!tradingStartDate) return 0;
    const days = getDaysInYear(year);
    const target = new Date(tradingStartDate).toDateString();
    const idx = days.findIndex((d) => d.toDateString() === target);
    return idx === -1 ? 0 : idx;
  }, [tradingStartDate, year]);

  const entries = useMemo(() => {
    const days = getDaysInYear(year);
    const result: DayEntry[] = [];
    const rate = dailyTargetPercent / 100;

    let prevClosing = startingCapital;

    for (let i = 0; i < days.length; i++) {
      const isBeforeStart = i < startDayIndex;

      if (isBeforeStart) {
        result.push({
          date: days[i],
          dayOfYear: i,
          startingCapital: 0,
          targetCapital: 0,
          actualResult: null,
          closingCapital: 0,
          dailyProfitLoss: 0,
          deviation: 0,
          verified: false,
          isProjected: true,
          isBeforeStart: true,
        });
        continue;
      }

      const start = i === startDayIndex ? startingCapital : prevClosing;
      const target = start * (1 + rate);
      const actual = actuals[i] ?? null;
      const closing = actual !== null ? actual : target;
      const pnl = closing - start;
      const dev = target - closing;
      const isProjected = actual === null;

      result.push({
        date: days[i],
        dayOfYear: i,
        startingCapital: start,
        targetCapital: target,
        actualResult: actual,
        closingCapital: closing,
        dailyProfitLoss: pnl,
        deviation: dev,
        verified: verified[i] ?? false,
        isProjected,
        isBeforeStart: false,
      });

      prevClosing = closing;
    }
    return result;
  }, [startingCapital, dailyTargetPercent, year, actuals, verified, startDayIndex]);

  const setActualResult = useCallback((dayIndex: number, value: number | null) => {
    setActuals((prev) => ({ ...prev, [dayIndex]: value }));
  }, []);

  const toggleVerified = useCallback((dayIndex: number) => {
    setVerified((prev) => ({ ...prev, [dayIndex]: !prev[dayIndex] }));
  }, []);

  const getProjection = useCallback(
    (targetDate: Date) => {
      const dayIndex = entries.findIndex(
        (e) => e.date.toDateString() === targetDate.toDateString()
      );
      if (dayIndex === -1) return null;
      const entry = entries[dayIndex];
      if (entry.isBeforeStart) return null;
      return {
        expectedCapital: entry.closingCapital,
        expectedProfit: entry.closingCapital - startingCapital,
        growthPercent: ((entry.closingCapital - startingCapital) / startingCapital) * 100,
      };
    },
    [entries, startingCapital]
  );

  // Only count verified days in summary
  const summary = useMemo(() => {
    const verifiedEntries = entries.filter((e) => !e.isProjected && !e.isBeforeStart && e.verified);
    const allFilledEntries = entries.filter((e) => !e.isProjected && !e.isBeforeStart);
    const lastFilled = allFilledEntries[allFilledEntries.length - 1];
    const currentCapital = lastFilled ? lastFilled.closingCapital : startingCapital;
    const totalPnl = currentCapital - startingCapital;
    const growthPercent = (totalPnl / startingCapital) * 100;
    const winDays = verifiedEntries.filter((e) => e.dailyProfitLoss > 0).length;
    const lossDays = verifiedEntries.filter((e) => e.dailyProfitLoss < 0).length;
    return { currentCapital, totalPnl, growthPercent, winDays, lossDays, tradingDays: verifiedEntries.length };
  }, [entries, startingCapital]);

  const resetYear = useCallback((newYear: number) => {
    setYear(newYear);
    setActuals({});
    setVerified({});
  }, []);

  const resetAllTrades = useCallback(() => {
    setActuals({});
    setVerified({});
  }, []);

  return {
    startingCapital, setStartingCapital,
    dailyTargetPercent, setDailyTargetPercent,
    year, resetYear,
    entries, setActualResult, toggleVerified,
    getProjection, summary,
    accountabilityPartner, setAccountabilityPartner,
    tradingStartDate, setTradingStartDate,
    resetAllTrades,
  };
}

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
}

export interface TradingState {
  startingCapital: number;
  dailyTargetPercent: number;
  year: number;
  entries: DayEntry[];
  accountabilityPartner: string;
}

const KES_RATE = 129;

export const toKES = (usd: number) => usd * KES_RATE;

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
  const [startingCapital, setStartingCapital] = useState(1000);
  const [dailyTargetPercent, setDailyTargetPercent] = useState(4.0);
  const [year, setYear] = useState(new Date().getFullYear());
  const [actuals, setActuals] = useState<Record<number, number | null>>({});
  const [verified, setVerified] = useState<Record<number, boolean>>({});
  const [accountabilityPartner, setAccountabilityPartner] = useState("");

  const entries = useMemo(() => {
    const days = getDaysInYear(year);
    const result: DayEntry[] = [];
    const rate = dailyTargetPercent / 100;

    let prevClosing = startingCapital;

    for (let i = 0; i < days.length; i++) {
      const start = i === 0 ? startingCapital : prevClosing;
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
      });

      prevClosing = closing;
    }
    return result;
  }, [startingCapital, dailyTargetPercent, year, actuals, verified]);

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
      return {
        expectedCapital: entry.closingCapital,
        expectedProfit: entry.closingCapital - startingCapital,
        growthPercent: ((entry.closingCapital - startingCapital) / startingCapital) * 100,
      };
    },
    [entries, startingCapital]
  );

  const summary = useMemo(() => {
    const filledEntries = entries.filter((e) => !e.isProjected);
    const lastFilled = filledEntries[filledEntries.length - 1];
    const currentCapital = lastFilled ? lastFilled.closingCapital : startingCapital;
    const totalPnl = currentCapital - startingCapital;
    const growthPercent = (totalPnl / startingCapital) * 100;
    const winDays = filledEntries.filter((e) => e.dailyProfitLoss > 0).length;
    const lossDays = filledEntries.filter((e) => e.dailyProfitLoss < 0).length;
    return { currentCapital, totalPnl, growthPercent, winDays, lossDays, tradingDays: filledEntries.length };
  }, [entries, startingCapital]);

  const resetYear = useCallback((newYear: number) => {
    setYear(newYear);
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
  };
}

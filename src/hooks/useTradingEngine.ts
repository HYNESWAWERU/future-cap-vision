import { useState, useCallback, useMemo, useEffect } from "react";

export interface DayEntry {
  date: Date;
  dayIndex: number;
  startingCapital: number;
  targetCapital: number;
  actualResult: number | null;
  closingCapital: number;
  dailyProfitLoss: number;
  percentChange: number;
  deposit: number;
  withdrawal: number;
  verified: boolean;
  isProjected: boolean;
  isBeforeStart: boolean;
}

export interface TradingState {
  startingCapital: number;
  dailyTargetPercent: number;
  tradingStartDate: string;
  tradingEndDate: string;
  accountabilityPartner: string;
}

export interface MonthlySummary {
  month: string;
  year: number;
  monthIndex: number;
  totalPnl: number;
  totalDeposits: number;
  totalWithdrawals: number;
  netCashflow: number;
  tradingDays: number;
  winDays: number;
  lossDays: number;
}

const KES_RATE = 129;
const STORAGE_KEY = "trading-engine-state-v2";

export const toKES = (usd: number) => usd * KES_RATE;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

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

export function useTradingEngine() {
  const currentYear = new Date().getFullYear();
  const [startingCapital, setStartingCapital] = useState(() => loadState()?.startingCapital ?? 1000);
  const [dailyTargetPercent, setDailyTargetPercent] = useState(() => loadState()?.dailyTargetPercent ?? 4.0);
  const [tradingStartDate, setTradingStartDate] = useState<string>(() => loadState()?.tradingStartDate ?? `${currentYear}-01-01`);
  const [tradingEndDate, setTradingEndDate] = useState<string>(() => loadState()?.tradingEndDate ?? `${currentYear}-12-31`);
  const [actuals, setActuals] = useState<Record<string, number | null>>(() => loadState()?.actuals ?? {});
  const [verified, setVerified] = useState<Record<string, boolean>>(() => loadState()?.verified ?? {});
  const [deposits, setDeposits] = useState<Record<string, number>>(() => loadState()?.deposits ?? {});
  const [withdrawals, setWithdrawals] = useState<Record<string, number>>(() => loadState()?.withdrawals ?? {});
  const [accountabilityPartner, setAccountabilityPartner] = useState(() => loadState()?.accountabilityPartner ?? "");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      startingCapital, dailyTargetPercent, tradingStartDate, tradingEndDate,
      actuals, verified, deposits, withdrawals, accountabilityPartner,
    }));
  }, [startingCapital, dailyTargetPercent, tradingStartDate, tradingEndDate, actuals, verified, deposits, withdrawals, accountabilityPartner]);

  const entries = useMemo(() => {
    const days = getDateRange(tradingStartDate, tradingEndDate);
    const result: DayEntry[] = [];
    const rate = dailyTargetPercent / 100;

    let prevClosing = startingCapital;

    for (let i = 0; i < days.length; i++) {
      const key = dateKey(days[i]);
      const dep = deposits[key] ?? 0;
      const wth = withdrawals[key] ?? 0;

      // Step 1: Adjust capital with cashflow
      const adjustedStart = (i === 0 ? startingCapital : prevClosing) + dep - wth;

      // Step 2: Calculate target
      const target = adjustedStart * (1 + rate);

      // Step 3: Actual result
      const actual = actuals[key] ?? null;
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
        verified: verified[key] ?? false,
        isProjected,
        isBeforeStart: false,
      });

      prevClosing = closing;
    }
    return result;
  }, [startingCapital, dailyTargetPercent, tradingStartDate, tradingEndDate, actuals, verified, deposits, withdrawals]);

  const setActualResult = useCallback((key: string, value: number | null) => {
    setActuals((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setDeposit = useCallback((key: string, value: number) => {
    setDeposits((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setWithdrawal = useCallback((key: string, value: number) => {
    setWithdrawals((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleVerified = useCallback((key: string) => {
    setVerified((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

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

  // Summary: only verified days count for win/loss
  const summary = useMemo(() => {
    const verifiedEntries = entries.filter((e) => !e.isProjected && e.verified);
    const allFilledEntries = entries.filter((e) => !e.isProjected);
    const lastFilled = allFilledEntries[allFilledEntries.length - 1];
    const currentCapital = lastFilled ? lastFilled.closingCapital : startingCapital;

    const totalDeposits = entries.reduce((s, e) => s + e.deposit, 0);
    const totalWithdrawals = entries.reduce((s, e) => s + e.withdrawal, 0);
    const netCashflow = totalDeposits - totalWithdrawals;

    // Trading profit only = current capital - starting capital - net cashflow
    const tradingProfitOnly = currentCapital - startingCapital - netCashflow;
    const accountGrowthTotal = currentCapital - startingCapital;

    const tradingGrowthPercent = startingCapital !== 0 ? (tradingProfitOnly / startingCapital) * 100 : 0;
    const accountGrowthPercent = startingCapital !== 0 ? (accountGrowthTotal / startingCapital) * 100 : 0;

    const winDays = verifiedEntries.filter((e) => e.dailyProfitLoss > 0).length;
    const lossDays = verifiedEntries.filter((e) => e.dailyProfitLoss < 0).length;

    // CAGR calculation
    const startD = new Date(tradingStartDate);
    const endD = lastFilled ? lastFilled.date : new Date(tradingEndDate);
    const yearsElapsed = Math.max((endD.getTime() - startD.getTime()) / (365.25 * 86400000), 1 / 365);
    const cagr = currentCapital > 0 && startingCapital > 0
      ? (Math.pow(currentCapital / startingCapital, 1 / yearsElapsed) - 1) * 100
      : 0;

    // Best/worst month
    const monthMap = new Map<string, number>();
    for (const e of allFilledEntries) {
      const key = `${e.date.getFullYear()}-${e.date.getMonth()}`;
      monthMap.set(key, (monthMap.get(key) ?? 0) + e.dailyProfitLoss);
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

  // Monthly summaries
  const monthlySummaries = useMemo(() => {
    const map = new Map<string, MonthlySummary>();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    for (const e of entries) {
      if (e.isProjected) continue;
      const key = `${e.date.getFullYear()}-${e.date.getMonth()}`;
      if (!map.has(key)) {
        map.set(key, {
          month: monthNames[e.date.getMonth()],
          year: e.date.getFullYear(),
          monthIndex: e.date.getMonth(),
          totalPnl: 0, totalDeposits: 0, totalWithdrawals: 0,
          netCashflow: 0, tradingDays: 0, winDays: 0, lossDays: 0,
        });
      }
      const s = map.get(key)!;
      s.totalPnl += e.dailyProfitLoss;
      s.totalDeposits += e.deposit;
      s.totalWithdrawals += e.withdrawal;
      s.netCashflow += e.deposit - e.withdrawal;
      if (e.verified) {
        s.tradingDays++;
        if (e.dailyProfitLoss > 0) s.winDays++;
        if (e.dailyProfitLoss < 0) s.lossDays++;
      }
    }
    return Array.from(map.values()).sort((a, b) => a.year - b.year || a.monthIndex - b.monthIndex);
  }, [entries]);

  // Available years for navigation
  const availableYears = useMemo(() => {
    const startY = new Date(tradingStartDate).getFullYear();
    const endY = new Date(tradingEndDate).getFullYear();
    const years: number[] = [];
    for (let y = startY; y <= endY; y++) years.push(y);
    return years;
  }, [tradingStartDate, tradingEndDate]);

  const resetAllTrades = useCallback(() => {
    setActuals({});
    setVerified({});
    setDeposits({});
    setWithdrawals({});
  }, []);

  return {
    startingCapital, setStartingCapital,
    dailyTargetPercent, setDailyTargetPercent,
    tradingStartDate, setTradingStartDate,
    tradingEndDate, setTradingEndDate,
    entries, setActualResult, toggleVerified,
    setDeposit, setWithdrawal,
    getProjection, summary, monthlySummaries,
    accountabilityPartner, setAccountabilityPartner,
    resetAllTrades, availableYears,
  };
}

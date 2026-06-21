// Shared compounding math used by the competition leaderboard.
// Mirrors the logic in useCloudTradingEngine but takes raw rows.

export interface SessionRow {
  id: string;
  starting_capital: number;
  daily_target_percent: number;
  trading_start_date: string;
  trading_end_date: string;
}

export interface TradeRow {
  entry_date: string;
  actual_result: number | null;
  deposit: number;
  withdrawal: number;
  verified: boolean;
}

export interface ComputedStats {
  startingCapital: number;
  currentCapital: number;
  tradingProfit: number;
  growthPercent: number;
  lastDayChangePercent: number;
  tradingDays: number;
}

function getDateRange(startDate: string, endDate: string): Date[] {
  const days: Date[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  const cap = end < today ? end : today;
  for (let d = new Date(start); d <= cap; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

const dateKey = (d: Date) => d.toISOString().split("T")[0];

export function computeSessionStats(session: SessionRow, trades: TradeRow[]): ComputedStats {
  const tradeMap: Record<string, TradeRow> = {};
  for (const t of trades) tradeMap[t.entry_date] = t;

  const startingCapital = Number(session.starting_capital);
  const rate = Number(session.daily_target_percent) / 100;
  const days = getDateRange(session.trading_start_date, session.trading_end_date);

  let prevClosing = startingCapital;
  let lastFilledClosing = startingCapital;
  let lastFilledStart = startingCapital;
  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let filledCount = 0;

  for (let i = 0; i < days.length; i++) {
    const key = dateKey(days[i]);
    const te = tradeMap[key];
    const dep = te?.deposit ?? 0;
    const wth = te?.withdrawal ?? 0;
    totalDeposits += dep;
    totalWithdrawals += wth;
    const adjustedStart = (i === 0 ? startingCapital : prevClosing) + dep - wth;
    const target = adjustedStart * (1 + rate);
    const actual = te?.actual_result ?? null;
    const closing = actual !== null ? actual : target;
    if (actual !== null) {
      lastFilledClosing = closing;
      lastFilledStart = adjustedStart;
      filledCount += 1;
    }
    prevClosing = closing;
  }

  const currentCapital = filledCount > 0 ? lastFilledClosing : startingCapital;
  const netCashflow = totalDeposits - totalWithdrawals;
  const tradingProfit = currentCapital - startingCapital - netCashflow;
  const growthPercent = startingCapital !== 0 ? (tradingProfit / startingCapital) * 100 : 0;
  const lastDayChangePercent = lastFilledStart !== 0
    ? ((lastFilledClosing - lastFilledStart) / lastFilledStart) * 100
    : 0;

  return {
    startingCapital,
    currentCapital,
    tradingProfit,
    growthPercent,
    lastDayChangePercent,
    tradingDays: filledCount,
  };
}

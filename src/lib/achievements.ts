import type { DayEntry } from "@/hooks/useTradingEngine";

export type Rarity = "bronze" | "silver" | "gold" | "platinum" | "legendary";

export interface Level {
  level: number;
  title: string;
  emoji: string;
  rarity: Rarity;
  color: string; // HSL color string for accents
  gradient: string; // tailwind-friendly gradient classes
  tagline: string;
}

export const LEVELS: Level[] = [
  { level: 1, title: "Seed Trader",      emoji: "🌱", rarity: "bronze",    color: "140 60% 50%", gradient: "from-emerald-500 to-green-700",    tagline: "Every titan starts with a seed" },
  { level: 2, title: "Market Scout",     emoji: "🧭", rarity: "bronze",    color: "200 70% 55%", gradient: "from-sky-500 to-blue-700",         tagline: "Mapping the terrain" },
  { level: 3, title: "Risk Runner",      emoji: "⚡", rarity: "silver",    color: "50 95% 55%",  gradient: "from-yellow-400 to-amber-600",     tagline: "Speed with discipline" },
  { level: 4, title: "Momentum Rider",   emoji: "🌊", rarity: "silver",    color: "190 80% 55%", gradient: "from-cyan-500 to-blue-600",        tagline: "Riding the wave" },
  { level: 5, title: "Profit Hunter",    emoji: "🎯", rarity: "silver",    color: "10 85% 55%",  gradient: "from-orange-500 to-red-600",       tagline: "Locked on target" },
  { level: 6, title: "Chart Master",     emoji: "📈", rarity: "gold",      color: "45 95% 55%",  gradient: "from-amber-400 to-yellow-600",     tagline: "Reading the signals" },
  { level: 7, title: "Strategy King",    emoji: "♟️", rarity: "gold",      color: "270 70% 60%", gradient: "from-purple-500 to-violet-700",    tagline: "Three moves ahead" },
  { level: 8, title: "Bull Commander",   emoji: "🐂", rarity: "gold",      color: "20 90% 55%",  gradient: "from-orange-600 to-red-700",       tagline: "Leading the charge" },
  { level: 9, title: "Alpha Trader",     emoji: "👑", rarity: "platinum",  color: "45 100% 60%", gradient: "from-yellow-300 to-amber-500",     tagline: "Top of the pack" },
  { level: 10, title: "Market Titan",    emoji: "🛡️", rarity: "platinum",  color: "210 80% 60%", gradient: "from-blue-400 to-indigo-700",      tagline: "Unshakable presence" },
  { level: 11, title: "Financial Phantom", emoji: "🌌", rarity: "legendary", color: "280 80% 65%", gradient: "from-fuchsia-500 to-purple-800", tagline: "Moves through the markets unseen" },
  { level: 12, title: "Trading Legend",  emoji: "🔥", rarity: "legendary", color: "0 90% 60%",   gradient: "from-red-500 via-orange-500 to-yellow-500", tagline: "Etched into history" },
];

export const RARITY_STYLES: Record<Rarity, { label: string; ring: string; text: string }> = {
  bronze:    { label: "Bronze",    ring: "ring-amber-700/50",   text: "text-amber-600" },
  silver:    { label: "Silver",    ring: "ring-slate-300/50",   text: "text-slate-300" },
  gold:      { label: "Gold",      ring: "ring-yellow-400/60",  text: "text-yellow-400" },
  platinum:  { label: "Platinum",  ring: "ring-cyan-300/60",    text: "text-cyan-300" },
  legendary: { label: "Legendary", ring: "ring-fuchsia-400/70", text: "text-fuchsia-400" },
};

export const STREAK_BADGES = [
  { days: 7,   title: "On Fire",          emoji: "🔥", color: "30 95% 55%" },
  { days: 30,  title: "Unbreakable",      emoji: "⚔️", color: "20 95% 55%" },
  { days: 90,  title: "Market Machine",   emoji: "🤖", color: "200 80% 55%" },
  { days: 180, title: "Elite Discipline", emoji: "💎", color: "190 85% 60%" },
  { days: 365, title: "Legendary Trader", emoji: "👑", color: "45 100% 55%" },
];

export interface MonthStat {
  key: string;          // YYYY-M
  label: string;        // "Jan 2026"
  monthIndex: number;   // 0-based across the trading window
  achieved: boolean;
  actualPnl: number;
  targetPnl: number;
  progressPct: number;  // 0-100+
}

/**
 * Compute monthly achievement stats from entries.
 * A month is "achieved" the moment cumulative actual P&L from verified days
 * meets or exceeds the cumulative target P&L for completed days in that month.
 */
export function computeMonthStats(entries: DayEntry[]): MonthStat[] {
  const monthMap = new Map<string, { label: string; actual: number; target: number; first: Date }>();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Target = full month target (includes projected days). Actual = realized P&L only.
  for (const e of entries) {
    const k = `${e.date.getFullYear()}-${e.date.getMonth()}`;
    const label = `${monthNames[e.date.getMonth()]} ${e.date.getFullYear()}`;
    const dailyTarget = e.targetCapital - e.startingCapital;
    const cur = monthMap.get(k) ?? { label, actual: 0, target: 0, first: e.date };
    cur.target += dailyTarget;
    if (!e.isProjected) cur.actual += e.dailyProfitLoss;
    if (e.date < cur.first) cur.first = e.date;
    monthMap.set(k, cur);
  }

  const sorted = [...monthMap.entries()].sort((a, b) => a[1].first.getTime() - b[1].first.getTime());
  return sorted.map(([key, v], i) => ({
    key,
    label: v.label,
    monthIndex: i,
    achieved: v.target > 0 && v.actual >= v.target,
    actualPnl: v.actual,
    targetPnl: v.target,
    progressPct: v.target > 0 ? Math.max(0, (v.actual / v.target) * 100) : 0,
  }));
}

export function computeUnlockedLevel(months: MonthStat[]): { unlocked: number; current?: MonthStat } {
  let unlocked = 0;
  for (const m of months) {
    if (m.achieved && unlocked < 12) unlocked++;
  }
  // Current month being worked toward = first non-achieved month, else last
  const current = months.find((m) => !m.achieved) ?? months[months.length - 1];
  return { unlocked, current };
}

export function getMotivationalMessage(level: number, streak: number): string {
  if (level === 0 && streak === 0) return "Your trading legacy starts now. Take the first step.";
  if (level === 0) return "Build the streak. The first level is one verified month away.";
  if (level >= 12) return "You've ascended. You are a Trading Legend.";
  if (level >= 9) return "Few reach this air. Stay sharp.";
  if (streak >= 30) return "30+ day streak. Discipline is your edge.";
  if (streak >= 7) return "On fire — keep stacking verified days.";
  if (level >= 6) return "Halfway to legend. The hard part is behind you.";
  if (level >= 3) return "Momentum building. Stay consistent.";
  return "Every verified day compounds. Keep going.";
}

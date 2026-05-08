import { motion } from "framer-motion";
import { Flame, Trophy, Percent } from "lucide-react";
import { useMemo } from "react";
import type { DayEntry } from "@/hooks/useTradingEngine";
import { STREAK_BADGES } from "@/lib/achievements";

interface Props {
  entries: DayEntry[];
}

export function computeStreaks(entries: DayEntry[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayMs = 86400000;

  const tradedDates = entries
    .filter((e) => e.verified && !e.isProjected)
    .map((e) => {
      const d = new Date(e.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
    .filter((t) => t <= today.getTime())
    .sort((a, b) => a - b);

  if (tradedDates.length === 0) {
    return { current: 0, longest: 0, consistency: 0 };
  }

  // Longest run
  let longest = 1;
  let run = 1;
  for (let i = 1; i < tradedDates.length; i++) {
    const diff = Math.round((tradedDates[i] - tradedDates[i - 1]) / dayMs);
    if (diff === 1) { run++; longest = Math.max(longest, run); }
    else run = 1;
  }

  // Current streak ending at today/yesterday
  const last = tradedDates[tradedDates.length - 1];
  const fromToday = Math.round((today.getTime() - last) / dayMs);
  let current = 0;
  if (fromToday <= 1) {
    current = 1;
    for (let i = tradedDates.length - 2; i >= 0; i--) {
      const diff = Math.round((tradedDates[i + 1] - tradedDates[i]) / dayMs);
      if (diff === 1) current++;
      else break;
    }
  }

  // Consistency for current calendar month: verified days / elapsed days in month
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
  const elapsed = Math.round((today.getTime() - monthStart) / dayMs) + 1;
  const verifiedThisMonth = tradedDates.filter((t) => t >= monthStart).length;
  const consistency = elapsed > 0 ? Math.min(100, (verifiedThisMonth / elapsed) * 100) : 0;

  return { current, longest, consistency };
}

export default function StreakBadges({ entries }: Props) {
  const { current, longest, consistency } = useMemo(() => computeStreaks(entries), [entries]);

  // Active streak badge = highest threshold reached by current streak
  const activeIdx = [...STREAK_BADGES].reverse().findIndex((b) => current >= b.days);
  const activeBadge = activeIdx === -1 ? null : STREAK_BADGES[STREAK_BADGES.length - 1 - activeIdx];
  const nextBadge = STREAK_BADGES.find((b) => current < b.days);

  const intensity = Math.min(current / 30, 1);
  const flameSize = 22 + intensity * 18;
  const flameColor =
    current === 0 ? "hsl(var(--muted-foreground))"
    : current < 7 ? "hsl(30, 90%, 55%)"
    : current < 30 ? "hsl(20, 95%, 55%)"
    : current < 90 ? "hsl(350, 90%, 60%)"
    : "hsl(280, 90%, 65%)";

  return (
    <motion.div
      className="glass-card-hover rounded-xl p-3 md:p-4"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Stats trio */}
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center gap-2">
            <motion.div
              animate={current > 0 ? { scale: [1, 1.12, 1] } : {}}
              transition={{ duration: 1.4, repeat: Infinity }}
              style={{ filter: current > 0 ? `drop-shadow(0 0 ${6 + intensity * 14}px ${flameColor})` : undefined }}
            >
              <Flame size={flameSize} color={flameColor} fill={current >= 7 ? flameColor : "none"} strokeWidth={1.8} />
            </motion.div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Current</p>
              <p className="font-mono text-lg font-bold leading-none" style={{ color: flameColor }}>
                {current}<span className="text-xs text-muted-foreground ml-1">d</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Longest</p>
              <p className="font-mono text-lg font-bold leading-none text-yellow-400">
                {longest}<span className="text-xs text-muted-foreground ml-1">d</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Consistency</p>
              <p className="font-mono text-lg font-bold leading-none text-primary">
                {consistency.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        {/* Streak badge ladder */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {STREAK_BADGES.map((b) => {
            const earned = current >= b.days;
            const isActive = activeBadge?.days === b.days;
            return (
              <motion.div
                key={b.days}
                whileHover={{ scale: 1.08, y: -2 }}
                animate={isActive ? { scale: [1, 1.06, 1] } : {}}
                transition={isActive ? { duration: 1.6, repeat: Infinity } : {}}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                  earned
                    ? "border-2 text-foreground"
                    : "border border-border/40 text-muted-foreground opacity-50"
                }`}
                style={earned ? {
                  borderColor: `hsl(${b.color})`,
                  background: `hsl(${b.color} / 0.12)`,
                  boxShadow: isActive ? `0 0 14px hsl(${b.color} / 0.5)` : undefined,
                } : undefined}
                title={`${b.title} — ${b.days} day streak`}
              >
                <span className="text-base leading-none">{b.emoji}</span>
                <span className="hidden sm:inline">{b.title}</span>
                <span className="font-mono text-[10px] opacity-70">{b.days}d</span>
              </motion.div>
            );
          })}
          {nextBadge && (
            <span className="text-[10px] text-muted-foreground font-mono ml-1">
              Next: {nextBadge.days - current}d → {nextBadge.emoji}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

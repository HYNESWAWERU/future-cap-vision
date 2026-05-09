import { motion, AnimatePresence } from "framer-motion";
import { Award } from "lucide-react";
import { useMemo, useRef, useEffect, useState } from "react";
import confetti from "canvas-confetti";
import type { DayEntry } from "@/hooks/useTradingEngine";
import LiveFlame from "./LiveFlame";

interface Props {
  entries: DayEntry[];
}

const MILESTONES = [
  { days: 7, label: "Week Warrior", emoji: "🔥" },
  { days: 30, label: "Monthly Master", emoji: "⚡" },
  { days: 60, label: "Discipline Pro", emoji: "💎" },
  { days: 100, label: "Centurion", emoji: "🏆" },
  { days: 365, label: "Year Legend", emoji: "👑" },
];

function computeStreak(entries: DayEntry[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Sort verified non-projected entries by date desc, only past/today
  const traded = entries
    .filter((e) => e.verified && !e.isProjected)
    .map((e) => {
      const d = new Date(e.date);
      d.setHours(0, 0, 0, 0);
      return d;
    })
    .filter((d) => d.getTime() <= today.getTime())
    .sort((a, b) => b.getTime() - a.getTime());

  if (traded.length === 0) return { streak: 0, lastDate: null as Date | null };

  // Allow streak to start from today or yesterday
  const dayMs = 86400000;
  const mostRecent = traded[0];
  const diffFromToday = Math.round((today.getTime() - mostRecent.getTime()) / dayMs);
  if (diffFromToday > 1) return { streak: 0, lastDate: mostRecent };

  let streak = 1;
  for (let i = 1; i < traded.length; i++) {
    const diff = Math.round((traded[i - 1].getTime() - traded[i].getTime()) / dayMs);
    if (diff === 1) streak++;
    else break;
  }
  return { streak, lastDate: mostRecent };
}

export default function TradingStreak({ entries }: Props) {
  const { streak } = useMemo(() => computeStreak(entries), [entries]);

  // Visual scaling — bigger flame, more intense glow as streak grows
  const intensity = Math.min(streak / 30, 1);
  const flameSize = 28 + intensity * 24; // 28-52
  const flameColor =
    streak === 0
      ? "hsl(var(--muted-foreground))"
      : streak < 7
      ? "hsl(30, 90%, 55%)"
      : streak < 30
      ? "hsl(20, 95%, 55%)"
      : streak < 100
      ? "hsl(350, 90%, 60%)"
      : "hsl(280, 90%, 65%)";

  const earned = MILESTONES.filter((m) => streak >= m.days);
  const next = MILESTONES.find((m) => streak < m.days);
  const [justUnlocked, setJustUnlocked] = useState<typeof MILESTONES[number] | null>(null);
  const prevEarnedCount = useRef(earned.length);

  useEffect(() => {
    if (earned.length > prevEarnedCount.current) {
      const newest = earned[earned.length - 1];
      setJustUnlocked(newest);
      // cinematic burst
      confetti({
        particleCount: 120,
        spread: 90,
        startVelocity: 45,
        origin: { y: 0.6 },
        colors: ["#ff6a1a", "#ffd24a", "#ff1e6b", "#1e6bff", "#ffffff"],
        ticks: 120,
        zIndex: 9999,
      });
      setTimeout(() => confetti({ particleCount: 80, spread: 360, startVelocity: 25, origin: { y: 0.5 }, ticks: 100, zIndex: 9999 }), 200);
      if ("vibrate" in navigator) navigator.vibrate?.([40, 60, 80]);
      const t = setTimeout(() => setJustUnlocked(null), 3500);
      return () => clearTimeout(t);
    }
    prevEarnedCount.current = earned.length;
  }, [earned.length]);

  return (
    <motion.div
      className="glass-card-hover rounded-xl p-4 space-y-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
          Trading Streak
        </span>
        {next && (
          <span className="text-[10px] text-muted-foreground font-mono">
            Next: {next.days}d {next.emoji}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center" style={{ minWidth: 90 }}>
          <LiveFlame
            streak={streak}
            onTap={() => {
              if (streak > 0) {
                // small celebration
                confetti({
                  particleCount: 18,
                  spread: 60,
                  startVelocity: 25,
                  origin: { y: 0.7 },
                  colors: ["#ff6a1a", "#ffd24a", "#ff1e6b"],
                  ticks: 50,
                  zIndex: 9999,
                });
              }
            }}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-baseline gap-1.5">
            <AnimatePresence mode="wait">
              <motion.span
                key={streak}
                initial={{ opacity: 0, y: -8, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8 }}
                className="text-3xl font-bold font-mono"
                style={{ color: flameColor }}
              >
                {streak}
              </motion.span>
            </AnimatePresence>
            <span className="text-xs text-muted-foreground">
              {streak === 1 ? "day" : "days"} in a row
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {streak === 0
              ? "Trade & verify a day to start your streak"
              : streak < 7
              ? "Keep the fire burning"
              : streak < 30
              ? "You're on a roll!"
              : streak < 100
              ? "Elite consistency"
              : "Unstoppable"}
          </p>
        </div>
      </div>

      {/* Milestone badges */}
      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/40">
        {MILESTONES.map((m) => {
          const got = streak >= m.days;
          return (
            <motion.div
              key={m.days}
              whileHover={{ scale: 1.08 }}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border transition-all ${
                got
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "bg-muted/20 border-border/40 text-muted-foreground opacity-60"
              }`}
              title={m.label}
            >
              <span>{m.emoji}</span>
              <span className="font-mono">{m.days}d</span>
              {got && <Award className="h-2.5 w-2.5" />}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

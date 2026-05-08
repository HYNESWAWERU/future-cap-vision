import { motion } from "framer-motion";
import { Target, TrendingUp, Calendar } from "lucide-react";
import { useMemo } from "react";
import type { DayEntry } from "@/hooks/useTradingEngine";

interface Props {
  entries: DayEntry[];
  startingCapital: number;
  currentCapital: number;
}

function getMessage(pct: number) {
  if (pct < 10) return { text: "You're just getting started", emoji: "🚀" };
  if (pct < 25) return { text: "Building momentum", emoji: "⚡" };
  if (pct < 50) return { text: "Consistency is paying off", emoji: "🔥" };
  if (pct < 75) return { text: "Strong progress — stay disciplined", emoji: "💪" };
  if (pct < 100) return { text: "Almost there — keep pushing", emoji: "🎯" };
  return { text: "Goal smashed — legendary work", emoji: "🏆" };
}

function getColor(pct: number) {
  // red -> yellow -> green via HSL hue 0 -> 140
  const clamped = Math.max(0, Math.min(100, pct));
  const hue = (clamped / 100) * 140;
  return {
    bar: `hsl(${hue}, 85%, 55%)`,
    glow: `hsl(${hue}, 85%, 55%, 0.5)`,
  };
}

export default function GoalTracker({ entries, startingCapital, currentCapital }: Props) {
  const { goal, pct, daysRemaining, daysToGoal } = useMemo(() => {
    const finalEntry = entries[entries.length - 1];
    const goal = finalEntry ? finalEntry.closingCapital : startingCapital;
    const totalGain = goal - startingCapital;
    const currentGain = currentCapital - startingCapital;
    const pct = totalGain > 0 ? Math.max(0, (currentGain / totalGain) * 100) : 0;

    // estimated days remaining based on avg daily growth from verified entries
    const verified = entries.filter((e) => !e.isProjected && e.verified);
    const avgDaily = verified.length > 0
      ? verified.reduce((s, e) => s + e.dailyProfitLoss, 0) / verified.length
      : 0;
    const remaining = goal - currentCapital;
    const daysToGoal = avgDaily > 0 ? Math.ceil(remaining / avgDaily) : null;

    // calendar days remaining in plan
    const today = new Date();
    const lastDate = finalEntry ? finalEntry.date : today;
    const daysRemaining = Math.max(0, Math.ceil((lastDate.getTime() - today.getTime()) / 86400000));

    return { goal, pct, daysRemaining, daysToGoal };
  }, [entries, startingCapital, currentCapital]);

  const color = getColor(pct);
  const msg = getMessage(pct);

  return (
    <motion.div
      className="glass-card-hover rounded-xl p-4 space-y-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
            Goal Progress
          </span>
        </div>
        <motion.span
          key={msg.text}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xs font-medium text-foreground"
        >
          {msg.text} <span className="text-base">{msg.emoji}</span>
        </motion.span>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-muted/30 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: `linear-gradient(90deg, hsl(0, 85%, 55%), hsl(50, 90%, 55%), ${color.bar})`,
            boxShadow: `0 0 12px ${color.glow}`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <motion.div
          className="absolute inset-y-0 w-8 bg-white/20 blur-sm"
          animate={{ left: ["-10%", "110%"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          style={{ display: pct > 1 && pct < 100 ? "block" : "none" }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Progress</p>
          <p className="font-mono font-bold" style={{ color: color.bar }}>{pct.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-muted-foreground text-[10px] uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> ETA Goal
          </p>
          <p className="font-mono font-bold text-foreground">
            {daysToGoal !== null ? `${daysToGoal}d` : "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-[10px] uppercase tracking-wider flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Plan Left
          </p>
          <p className="font-mono font-bold text-foreground">{daysRemaining}d</p>
        </div>
      </div>

      <div className="flex justify-between text-[10px] text-muted-foreground font-mono pt-1 border-t border-border/40">
        <span>${startingCapital.toLocaleString()}</span>
        <span className="text-primary">${currentCapital.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        <span>${goal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
      </div>
    </motion.div>
  );
}

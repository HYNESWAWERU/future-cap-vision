import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import { Target, Calendar, Sparkles, TrendingUp, TrendingDown } from "lucide-react";
import { useMemo, useEffect, useState, useRef } from "react";
import type { DayEntry } from "@/hooks/useTradingEngine";

interface Props {
  entries: DayEntry[];
  startingCapital: number;
  currentCapital: number;
  dailyTargetPercent?: number;
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
  // red -> orange -> yellow -> green via HSL hue 0 -> 140
  const clamped = Math.max(0, Math.min(100, pct));
  const hue = (clamped / 100) * 140;
  return {
    bar: `hsl(${hue}, 90%, 55%)`,
    glow: `hsl(${hue}, 90%, 55%, 0.6)`,
    soft: `hsl(${hue}, 90%, 55%, 0.25)`,
  };
}

const MILESTONES = [25, 50, 75, 100];

export default function GoalTracker({ entries, startingCapital, currentCapital, dailyTargetPercent = 4 }: Props) {
  const { goal, pct, daysRemaining, daysTraded, totalDays, daysAhead, filledDays } = useMemo(() => {
    const finalEntry = entries[entries.length - 1];
    const goal = finalEntry ? finalEntry.closingCapital : startingCapital;
    const totalDays = entries.length;
    const daysTraded = entries.filter(
      (e) => e.verified || (e.actualResult !== null && !e.isProjected)
    ).length;
    // Filled = any day with an actual result logged (verified or not). Pacing uses this
    // so a logged loss immediately shows "behind" even before verification.
    const filledDays = entries.filter(
      (e) => !e.isProjected && e.actualResult !== null
    ).length;

    // Progress % = capital growth vs total goal growth (true pacing, not days entered)
    const totalGrowth = goal - startingCapital;
    const actualGrowth = currentCapital - startingCapital;
    const pct = totalGrowth > 0 ? Math.max(0, (actualGrowth / totalGrowth) * 100) : 0;

    // Days ahead/behind: where does current capital land on the compounding schedule?
    // Schedule: cap(n) = start * (1+r)^n  →  n = log(current/start)/log(1+r)
    // Use filledDays so losses register instantly. Allow currentCapital < starting (loss → log negative).
    let daysAhead = 0;
    const r = dailyTargetPercent / 100;
    if (startingCapital > 0 && currentCapital > 0 && r > 0 && filledDays > 0) {
      const paceDay = Math.log(currentCapital / startingCapital) / Math.log(1 + r);
      daysAhead = Math.round(paceDay - filledDays);
    }

    const daysRemaining = Math.max(0, totalDays - daysTraded);
    return { goal, pct, daysRemaining, daysTraded, totalDays, daysAhead, filledDays };
  }, [entries, startingCapital, currentCapital, dailyTargetPercent]);

  const color = getColor(pct);
  const msg = getMessage(pct);

  // Smoothly counting percentage
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => `${v.toFixed(1)}%`);
  useEffect(() => {
    const controls = animate(count, Math.min(pct, 100), { duration: 1.4, ease: "easeOut" });
    return () => controls.stop();
  }, [pct, count]);

  // Milestone level-up detection
  const prevMilestoneRef = useRef<number>(-1);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  useEffect(() => {
    const reached = MILESTONES.filter((m) => pct >= m).pop() ?? -1;
    if (prevMilestoneRef.current !== -1 && reached > prevMilestoneRef.current) {
      setLevelUp(reached);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { navigator.vibrate?.([30, 40, 80]); } catch {}
      }
      const t = setTimeout(() => setLevelUp(null), 2200);
      return () => clearTimeout(t);
    }
    prevMilestoneRef.current = reached;
  }, [pct]);

  // Tap interaction effects
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; dx: number; dy: number }[]>([]);
  const [flash, setFlash] = useState(false);
  const idRef = useRef(0);

  const handleTap = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const target = e.currentTarget.getBoundingClientRect();
    let cx = target.width / 2;
    let cy = target.height / 2;
    if ("clientX" in e) {
      cx = e.clientX - target.left;
      cy = e.clientY - target.top;
    } else if ("touches" in e && e.touches[0]) {
      cx = e.touches[0].clientX - target.left;
      cy = e.touches[0].clientY - target.top;
    }
    const baseId = idRef.current++;
    setRipples((r) => [...r, { id: baseId, x: cx, y: cy }]);
    setFlash(true);
    setTimeout(() => setFlash(false), 350);

    const newParticles = Array.from({ length: 10 }).map((_, i) => ({
      id: baseId * 100 + i,
      x: cx,
      y: cy,
      dx: (Math.random() - 0.5) * 120,
      dy: (Math.random() - 0.5) * 120 - 20,
    }));
    setParticles((p) => [...p, ...newParticles]);

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate?.(15); } catch {}
    }

    setTimeout(() => {
      setRipples((r) => r.filter((x) => x.id !== baseId));
      setParticles((p) => p.filter((x) => Math.floor(x.id / 100) !== baseId));
    }, 900);
  };

  const fillPct = Math.min(pct, 100);

  return (
    <motion.div
      onClick={handleTap}
      className="relative glass-card-hover rounded-xl p-4 space-y-4 overflow-hidden cursor-pointer select-none"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.4 }}
      style={{ boxShadow: `0 0 0 1px ${color.soft} inset` }}
    >
      {/* Neon flash overlay */}
      <AnimatePresence>
        {flash && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ background: `radial-gradient(circle at center, ${color.glow}, transparent 70%)` }}
          />
        )}
      </AnimatePresence>

      {/* Ripples */}
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            className="pointer-events-none absolute rounded-full"
            style={{
              left: r.x,
              top: r.y,
              translateX: "-50%",
              translateY: "-50%",
              background: `radial-gradient(circle, ${color.glow}, transparent 70%)`,
            }}
            initial={{ width: 0, height: 0, opacity: 0.7 }}
            animate={{ width: 320, height: 320, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>

      {/* Floating particles */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            className="pointer-events-none absolute h-1.5 w-1.5 rounded-full"
            style={{ left: p.x, top: p.y, background: color.bar, boxShadow: `0 0 8px ${color.glow}` }}
            initial={{ opacity: 1, scale: 1 }}
            animate={{ x: p.dx, y: p.dy, opacity: 0, scale: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <motion.div animate={{ rotate: [0, -6, 6, 0] }} transition={{ duration: 4, repeat: Infinity }}>
            <Target className="h-4 w-4 text-primary" />
          </motion.div>
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
            Goal Progress
          </span>
        </div>
        <motion.span
          key={msg.text}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-[11px] font-medium text-foreground text-right"
        >
          {msg.text} <span className="text-base">{msg.emoji}</span>
        </motion.span>
      </div>

      {/* Big progress bar */}
      <div className="relative z-10">
        <div
          className="relative h-12 rounded-2xl overflow-hidden border border-border/40 bg-muted/20"
          style={{ boxShadow: `inset 0 0 18px hsl(var(--background) / 0.6)` }}
        >
          {/* Fill */}
          <motion.div
            className="absolute inset-y-0 left-0 rounded-2xl"
            style={{
              background: `linear-gradient(90deg, hsl(0,90%,55%), hsl(30,95%,55%), hsl(55,95%,55%), ${color.bar})`,
              boxShadow: `0 0 22px ${color.glow}, 0 0 40px ${color.soft}`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${fillPct}%` }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          />

          {/* Shimmer sweep */}
          <motion.div
            className="absolute inset-y-0 w-24 pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.35), transparent)",
              filter: "blur(4px)",
              display: fillPct > 1 ? "block" : "none",
            }}
            animate={{ left: ["-15%", "115%"] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
          />

          {/* Milestone ticks */}
          {MILESTONES.slice(0, -1).map((m) => (
            <div
              key={m}
              className="absolute top-0 bottom-0 w-px bg-foreground/15"
              style={{ left: `${m}%` }}
            />
          ))}

          {/* Percentage label centered inside bar */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className="font-mono font-bold text-base md:text-lg tracking-tight"
              style={{
                color: "hsl(0 0% 100%)",
                textShadow: `0 1px 2px hsl(0 0% 0% / 0.6), 0 0 12px ${color.glow}`,
              }}
            >
              {rounded}
            </motion.span>
          </div>

          {/* Level-up burst */}
          <AnimatePresence>
            {levelUp !== null && (
              <motion.div
                key={levelUp}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                transition={{ duration: 0.5 }}
              >
                <div
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                  style={{
                    background: `linear-gradient(90deg, ${color.bar}, hsl(140,90%,55%))`,
                    color: "hsl(0 0% 8%)",
                    boxShadow: `0 0 20px ${color.glow}`,
                  }}
                >
                  <Sparkles className="h-3 w-3" /> {levelUp}% milestone!
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Pacing pill: days ahead/behind schedule */}
      {filledDays > 0 && (
        <motion.div
          key={daysAhead}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex items-center justify-center"
        >
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold border"
            style={
              daysAhead > 0
                ? { background: "hsl(140 70% 45% / 0.15)", borderColor: "hsl(140 70% 45% / 0.4)", color: "hsl(140 80% 65%)" }
                : daysAhead < 0
                ? { background: "hsl(0 80% 55% / 0.15)", borderColor: "hsl(0 80% 55% / 0.4)", color: "hsl(0 85% 70%)" }
                : { background: "hsl(var(--muted) / 0.4)", borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
            }
          >
            {daysAhead > 0 ? (
              <>
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="uppercase tracking-wider">
                  {daysAhead} day{daysAhead === 1 ? "" : "s"} ahead of schedule
                </span>
              </>
            ) : daysAhead < 0 ? (
              <>
                <TrendingDown className="h-3.5 w-3.5" />
                <span className="uppercase tracking-wider">
                  {Math.abs(daysAhead)} day{Math.abs(daysAhead) === 1 ? "" : "s"} behind schedule
                </span>
              </>
            ) : (
              <span className="uppercase tracking-wider">Exactly on pace</span>
            )}
          </div>
        </motion.div>
      )}

      {/* Footer stats */}
      <div className="relative z-10 flex items-center justify-between text-[11px] font-mono">
        <span className="text-muted-foreground">
          <span className="text-foreground font-bold">{daysTraded}</span>
          <span className="opacity-70">/{totalDays}d traded</span>
        </span>
        <div className="flex items-center gap-1.5 text-foreground">
          <Calendar className="h-3 w-3 text-primary" />
          <span className="font-bold">{daysRemaining}d</span>
          <span className="text-muted-foreground">remaining</span>
        </div>
        <span className="text-primary font-bold">
          ${goal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
      </div>
    </motion.div>
  );
}

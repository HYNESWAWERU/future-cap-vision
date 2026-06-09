import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import type { DayEntry } from "@/hooks/useTradingEngine";
import {
  LEVELS,
  computeMonthStats,
  computeUnlockedLevel,
  type MonthStat,
} from "@/lib/achievements";

interface UseAchievements {
  monthStats: MonthStat[];
  unlocked: number;
  currentLevel: typeof LEVELS[number] | null;
  nextLevel: typeof LEVELS[number] | null;
  progressToNext: number; // 0-100
  newlyUnlockedLevel: number | null;
  dismissCelebration: () => void;
}

const STORAGE_PREFIX = "comptra_achievements_";

function playUnlockSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.0001, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.18, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.4);
    });
    if ("vibrate" in navigator) navigator.vibrate?.([20, 40, 20, 40, 80]);
  } catch {/* no-op */}
}

function fireConfetti() {
  const defaults = { startVelocity: 35, spread: 360, ticks: 80, zIndex: 9999, colors: ["#fbbf24", "#3b82f6", "#a855f7", "#10b981", "#ef4444"] };
  confetti({ ...defaults, particleCount: 80, origin: { x: 0.2, y: 0.4 } });
  confetti({ ...defaults, particleCount: 80, origin: { x: 0.8, y: 0.4 } });
  setTimeout(() => confetti({ ...defaults, particleCount: 120, origin: { x: 0.5, y: 0.3 } }), 250);
}

export function useAchievements(sessionId: string | null, entries: DayEntry[]): UseAchievements {
  const monthStats = useMemo(() => computeMonthStats(entries), [entries]);
  const { unlocked, current } = useMemo(() => computeUnlockedLevel(monthStats), [monthStats]);

  const currentLevel = unlocked > 0 ? LEVELS[unlocked - 1] : null;
  const nextLevel = unlocked < 12 ? LEVELS[unlocked] : null;
  const progressToNext = current && !current.achieved
    ? Math.min(current.progressPct, 100)
    : nextLevel
    ? 0
    : 100;

  const [newlyUnlockedLevel, setNewlyUnlockedLevel] = useState<number | null>(null);

  // Detect new unlocks vs persisted state. Allow decreases (revoke) without celebration.
  useEffect(() => {
    if (!sessionId) return;
    const key = STORAGE_PREFIX + sessionId;
    const stored = parseInt(localStorage.getItem(key) ?? "-1", 10);
    if (stored === -1) {
      // First time seeing this session — store silently, no celebration.
      localStorage.setItem(key, String(unlocked));
      return;
    }
    if (unlocked > stored) {
      localStorage.setItem(key, String(unlocked));
      setNewlyUnlockedLevel(unlocked);
      fireConfetti();
      playUnlockSound();
    } else if (unlocked < stored) {
      // Revoked — pace dropped below threshold. Update silently.
      localStorage.setItem(key, String(unlocked));
    }
  }, [unlocked, sessionId]);

  return {
    monthStats,
    unlocked,
    currentLevel,
    nextLevel,
    progressToNext,
    newlyUnlockedLevel,
    dismissCelebration: () => setNewlyUnlockedLevel(null),
  };
}

import { motion, AnimatePresence } from "framer-motion";
import { Lock, Sparkles, ChevronRight } from "lucide-react";
import { useState } from "react";
import {
  LEVELS,
  RARITY_STYLES,
  getMotivationalMessage,
  type MonthStat,
  type Level,
} from "@/lib/achievements";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Props {
  monthStats: MonthStat[];
  unlocked: number;
  currentLevel: Level | null;
  nextLevel: Level | null;
  progressToNext: number;
  newlyUnlocked: number | null;
  onDismissCelebration: () => void;
  currentStreak: number;
}

function BadgeArt({ level, size = 64, locked = false }: { level: Level; size?: number; locked?: boolean }) {
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-br ${level.gradient} ${
          locked ? "opacity-25 grayscale" : ""
        }`}
        style={{
          boxShadow: locked ? "none" : `0 0 24px hsl(${level.color} / 0.55), inset 0 0 12px hsl(${level.color} / 0.4)`,
        }}
      />
      <div className="absolute inset-1.5 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center">
        <span style={{ fontSize: size * 0.45, filter: locked ? "grayscale(1)" : undefined }}>{level.emoji}</span>
      </div>
      {locked && (
        <div className="absolute inset-0 rounded-full flex items-center justify-center bg-background/40">
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

export default function AchievementsPanel(props: Props) {
  const { monthStats, unlocked, currentLevel, nextLevel, progressToNext, newlyUnlocked, onDismissCelebration, currentStreak } = props;
  const [selected, setSelected] = useState<Level | null>(null);

  const message = getMotivationalMessage(unlocked, currentStreak);
  const newLevel = newlyUnlocked ? LEVELS[newlyUnlocked - 1] : null;

  return (
    <>
      <motion.div
        className="glass-card-hover rounded-xl p-4 space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header: Current level + progress to next */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            {currentLevel ? (
              <BadgeArt level={currentLevel} size={56} />
            ) : (
              <div className="h-14 w-14 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Current Level</p>
              <p className="text-base font-bold text-foreground">
                {currentLevel ? `Lv ${currentLevel.level} · ${currentLevel.title}` : "Unranked"}
              </p>
              <p className="text-[11px] text-muted-foreground italic">{message}</p>
            </div>
          </div>
          {nextLevel && (
            <div className="flex items-center gap-2 text-right">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Next</p>
                <p className="text-sm font-bold text-foreground">
                  {nextLevel.emoji} {nextLevel.title}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <BadgeArt level={nextLevel} size={44} locked />
            </div>
          )}
        </div>

        {/* Progress bar to next level */}
        {nextLevel && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>Progress to Lv {nextLevel.level}</span>
              <span>{progressToNext.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${nextLevel.gradient}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressToNext, 100)}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                style={{ boxShadow: `0 0 10px hsl(${nextLevel.color} / 0.6)` }}
              />
            </div>
          </div>
        )}

        {/* 12 Level Timeline */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Achievement Timeline</p>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
            {LEVELS.map((lvl, i) => {
              const isUnlocked = i < unlocked;
              const isCurrent = i === unlocked;
              const month = monthStats[i];
              return (
                <motion.button
                  key={lvl.level}
                  onClick={() => setSelected(lvl)}
                  whileHover={{ scale: 1.1, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${
                    isCurrent ? "ring-2 ring-primary/60 ring-offset-2 ring-offset-background" : ""
                  }`}
                  title={`Lv ${lvl.level} · ${lvl.title}${month ? ` · ${month.label}` : ""}`}
                >
                  <BadgeArt level={lvl} size={40} locked={!isUnlocked} />
                  <span className={`text-[9px] font-mono leading-none ${isUnlocked ? "text-foreground" : "text-muted-foreground"}`}>
                    {lvl.level}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-sm">
          {selected && (() => {
            const isUnlocked = selected.level <= unlocked;
            const r = RARITY_STYLES[selected.rarity];
            const month = monthStats[selected.level - 1];
            return (
              <div className="space-y-3 text-center">
                <div className="flex justify-center">
                  <BadgeArt level={selected} size={120} locked={!isUnlocked} />
                </div>
                <div>
                  <p className={`text-xs uppercase tracking-widest font-bold ${r.text}`}>{r.label}</p>
                  <h3 className="text-2xl font-bold">
                    {selected.emoji} {selected.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">Level {selected.level}</p>
                </div>
                <p className="text-sm italic text-muted-foreground">"{selected.tagline}"</p>
                {month && (
                  <div className="text-xs text-muted-foreground border-t border-border/40 pt-2 space-y-1">
                    <p>Stage: <span className="text-foreground font-mono">{month.label}</span></p>
                    <p>Progress: <span className="text-foreground font-mono">{month.progressPct.toFixed(1)}%</span></p>
                    <p className={isUnlocked ? "text-profit font-semibold" : ""}>
                      {isUnlocked ? "✓ Unlocked" : "🔒 Locked — hit this stage's monthly target to unlock"}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Celebration overlay */}
      <AnimatePresence>
        {newLevel && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismissCelebration}
          >
            <motion.div
              className="text-center space-y-4 px-6"
              initial={{ scale: 0.6, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 14, stiffness: 200 }}
            >
              <motion.p
                className="text-xs tracking-[0.4em] uppercase text-primary"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              >
                Level Unlocked
              </motion.p>
              <motion.div
                animate={{ rotate: [0, -5, 5, -5, 0] }}
                transition={{ duration: 0.8, repeat: 2 }}
              >
                <BadgeArt level={newLevel} size={180} />
              </motion.div>
              <h2 className={`text-4xl font-extrabold bg-gradient-to-r ${newLevel.gradient} bg-clip-text text-transparent`}>
                {newLevel.title}
              </h2>
              <p className="text-base text-muted-foreground italic">"{newLevel.tagline}"</p>
              <p className={`text-xs font-bold uppercase tracking-widest ${RARITY_STYLES[newLevel.rarity].text}`}>
                {RARITY_STYLES[newLevel.rarity].label} · Level {newLevel.level} of 12
              </p>
              <p className="text-xs text-muted-foreground pt-2">Tap anywhere to continue</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

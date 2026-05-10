import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ShieldAlert, X } from "lucide-react";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import type { DayEntry } from "@/hooks/useTradingEngine";

interface Props {
  sessionId: string | null;
  entries: DayEntry[];
  startingCapital: number;
  dailyTargetPercent: number;
}

type AlertType = "profit_target" | "loss_limit";

const todayKey = () => new Date().toISOString().slice(0, 10);
const STORAGE = (sid: string, t: AlertType) => `comptra_alert_${sid}_${t}_${todayKey()}`;

export default function AlertPopups({ sessionId, entries, startingCapital, dailyTargetPercent }: Props) {
  const [active, setActive] = useState<AlertType | null>(null);
  const [pct, setPct] = useState(0);
  const [pnl, setPnl] = useState(0);
  const dispatched = useRef<Set<AlertType>>(new Set());

  // Compute today's % return
  useEffect(() => {
    if (!sessionId) return;
    const todayStr = todayKey();
    const todayEntry = entries.find(
      (e) => !e.isProjected && e.date.toISOString().slice(0, 10) === todayStr && e.actualResult !== null
    );
    if (!todayEntry) return;

    const opening = todayEntry.openingCapital || startingCapital;
    const dailyPnl = todayEntry.dailyProfitLoss;
    const dailyPct = opening !== 0 ? (dailyPnl / opening) * 100 : 0;
    setPct(dailyPct);
    setPnl(dailyPnl);

    const target = Math.abs(dailyTargetPercent);
    const profitKey = STORAGE(sessionId, "profit_target");
    const lossKey = STORAGE(sessionId, "loss_limit");

    if (dailyPct >= target && !localStorage.getItem(profitKey) && !dispatched.current.has("profit_target")) {
      dispatched.current.add("profit_target");
      localStorage.setItem(profitKey, "1");
      setActive("profit_target");
      celebrate();
      logAndNotify(sessionId, "profit_target", dailyPct, dailyPnl);
    } else if (dailyPct <= -target && !localStorage.getItem(lossKey) && !dispatched.current.has("loss_limit")) {
      dispatched.current.add("loss_limit");
      localStorage.setItem(lossKey, "1");
      setActive("loss_limit");
      try { navigator.vibrate?.([100, 50, 100, 50, 200]); } catch {}
      logAndNotify(sessionId, "loss_limit", dailyPct, dailyPnl);
    }
  }, [entries, sessionId, startingCapital, dailyTargetPercent]);

  if (!active) return null;
  const isProfit = active === "profit_target";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={() => setActive(null)}
      >
        <motion.div
          initial={{ scale: 0.85, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 18 }}
          onClick={(e) => e.stopPropagation()}
          className={`relative max-w-md w-full rounded-3xl p-7 text-center border-2 ${
            isProfit
              ? "bg-gradient-to-br from-emerald-950/95 to-emerald-900/90 border-emerald-400/50 shadow-[0_0_60px_rgba(16,185,129,0.4)]"
              : "bg-gradient-to-br from-red-950/95 to-rose-900/90 border-red-400/60 shadow-[0_0_60px_rgba(239,68,68,0.5)]"
          }`}
        >
          <button
            onClick={() => setActive(null)}
            className="absolute top-3 right-3 h-7 w-7 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white/70"
          >
            <X className="h-4 w-4" />
          </button>

          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12, delay: 0.1 }}
            className={`mx-auto h-20 w-20 rounded-2xl flex items-center justify-center mb-4 ${
              isProfit ? "bg-emerald-500/30 border border-emerald-400/50" : "bg-red-500/30 border border-red-400/60"
            }`}
          >
            {isProfit ? (
              <Trophy className="h-10 w-10 text-emerald-300" />
            ) : (
              <ShieldAlert className="h-10 w-10 text-red-300" />
            )}
          </motion.div>

          <h2 className={`text-2xl font-black tracking-tight mb-2 ${isProfit ? "text-emerald-200" : "text-red-200"}`}>
            {isProfit ? "Daily target achieved 🎯" : "STOP TRADING ⚠️"}
          </h2>
          <p className={`text-sm mb-4 ${isProfit ? "text-emerald-100/80" : "text-red-100/80"}`}>
            {isProfit
              ? "Time to protect profits. Walk away with the win."
              : "Daily loss limit exceeded. Step away — protect your capital."}
          </p>

          <div className={`rounded-xl p-3 mb-5 font-mono text-2xl font-bold ${
            isProfit ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
          }`}>
            {pct >= 0 ? "+" : ""}{pct.toFixed(2)}% · {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
          </div>

          {!isProfit && (
            <p className="text-[11px] text-red-200/60 mb-4 italic">
              Cooldown engaged. Reflect, journal, hydrate. Tomorrow is a new opportunity.
            </p>
          )}

          <button
            onClick={() => setActive(null)}
            className={`w-full py-3 rounded-xl font-bold tracking-wide transition ${
              isProfit
                ? "bg-emerald-500 hover:bg-emerald-400 text-emerald-950"
                : "bg-red-500 hover:bg-red-400 text-red-950"
            }`}
          >
            {isProfit ? "Secure Profits" : "I'll Stop Trading"}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function celebrate() {
  const colors = ["#10b981", "#34d399", "#fbbf24", "#3b82f6"];
  confetti({ particleCount: 120, spread: 90, origin: { y: 0.4 }, colors });
  setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0, y: 0.5 }, colors }), 200);
  setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1, y: 0.5 }, colors }), 200);
  try { navigator.vibrate?.([30, 60, 30, 60, 100]); } catch {}
}

async function logAndNotify(sessionId: string, type: AlertType, pct: number, pnl: number) {
  // Fetch eligible partners
  const { data: partners } = await supabase
    .from("accountability_partners")
    .select("id, verified, notify_profit, notify_loss")
    .eq("session_id", sessionId);

  if (!partners) return;
  const today = todayKey();

  for (const p of partners as any[]) {
    if (!p.verified) continue;
    if (type === "profit_target" && !p.notify_profit) continue;
    if (type === "loss_limit" && !p.notify_loss) continue;
    // Insert log row (UNIQUE constraint dedupes per day)
    await supabase.from("partner_alerts_log").insert({
      session_id: sessionId,
      partner_id: p.id,
      alert_type: type,
      alert_date: today,
      pct,
      pnl,
    });
  }
}

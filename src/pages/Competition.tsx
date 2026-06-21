import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Crown, ArrowLeft, Copy, Check, Share2, Users, TrendingUp, TrendingDown, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useCompetitionByCode, useLeaderboard, joinCompetition, type LeaderboardRow } from "@/hooks/useCompetition";

const fmtUSD = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

function rankStyle(rank: number) {
  if (rank === 1)
    return {
      ring: "ring-2 ring-yellow-400/60 shadow-[0_0_30px_hsl(45_95%_60%/0.35)]",
      badge: "bg-gradient-to-br from-yellow-300 to-amber-500 text-amber-950",
      icon: <Crown className="h-4 w-4" />,
      text: "text-yellow-300",
    };
  if (rank === 2)
    return {
      ring: "ring-2 ring-slate-300/40 shadow-[0_0_20px_hsl(220_15%_70%/0.25)]",
      badge: "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900",
      icon: <Medal className="h-4 w-4" />,
      text: "text-slate-200",
    };
  if (rank === 3)
    return {
      ring: "ring-2 ring-orange-400/40 shadow-[0_0_20px_hsl(25_90%_55%/0.25)]",
      badge: "bg-gradient-to-br from-amber-600 to-orange-700 text-amber-50",
      icon: <Medal className="h-4 w-4" />,
      text: "text-orange-300",
    };
  return {
    ring: "ring-1 ring-border/40",
    badge: "bg-card/60 text-muted-foreground",
    icon: <span className="font-mono text-xs">{rank}</span>,
    text: "text-foreground",
  };
}

export default function Competition() {
  const { code: routeCode } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const code = routeCode?.toUpperCase() ?? null;

  const { competition, entries, loading } = useCompetitionByCode(code);
  const leaderboard = useLeaderboard(entries);
  const [copied, setCopied] = useState(false);

  // Join modal
  const [showJoin, setShowJoin] = useState(false);
  const [joinSessionId, setJoinSessionId] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joining, setJoining] = useState(false);

  const shareLink = `${window.location.origin}/#/competition/${code}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success("Competition link copied!");
    setTimeout(() => setCopied(false), 1800);
  };

  const handleJoin = async () => {
    if (!competition) return;
    const uuid = joinSessionId.trim().match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0];
    if (!uuid) { toast.error("Enter a valid session ID or link"); return; }
    if (!joinName.trim()) { toast.error("Choose a display name"); return; }
    setJoining(true);
    try {
      await joinCompetition(competition.code, uuid, joinName.trim());
      toast.success(`Joined as ${joinName.trim()}`);
      setShowJoin(false);
      setJoinSessionId("");
      setJoinName("");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to join");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <AnimatedBackground />
        <Loader2 className="h-8 w-8 animate-spin text-primary z-10" />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <AnimatedBackground />
        <div className="glass-card p-8 rounded-2xl text-center z-10 max-w-md">
          <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-lg font-bold mb-1">Competition not found</h2>
          <p className="text-sm text-muted-foreground mb-4">No competition exists with code <span className="font-mono">{code}</span>.</p>
          <Button onClick={() => navigate("/")} variant="outline" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back home
          </Button>
        </div>
      </div>
    );
  }

  const leader = leaderboard[0];

  return (
    <>
      <AnimatedBackground />
      <div className="relative z-10 min-h-screen bg-transparent p-4 md:p-6 space-y-5 max-w-[1100px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between flex-wrap gap-3"
        >
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-[0_0_24px_hsl(45_95%_55%/0.45)]">
              <Trophy className="h-5 w-5 text-amber-950" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gradient-gold">{competition.name}</h1>
              <p className="text-xs text-muted-foreground">
                Competition code <span className="font-mono text-primary">{competition.code}</span> · {leaderboard.length} trader{leaderboard.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleCopyLink}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Share"}
            </Button>
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => setShowJoin(true)}>
              <Plus className="h-3.5 w-3.5" /> Join
            </Button>
          </div>
        </motion.div>

        {/* Champion banner */}
        {leader && leader.tradingDays > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-2xl p-5 border border-yellow-400/30 bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent shadow-[0_0_30px_hsl(45_95%_55%/0.2)]"
          >
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-yellow-400/10 blur-3xl" />
            <div className="flex items-center gap-4 relative">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center shadow-lg">
                <Crown className="h-7 w-7 text-amber-950" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-yellow-300/80">Current Leader</p>
                <p className="text-xl font-bold text-yellow-100 truncate">{leader.display_name}</p>
                <p className="text-xs text-muted-foreground">
                  {fmtUSD(leader.startingCapital)} → {fmtUSD(leader.currentCapital)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-emerald-400">+{leader.growthPercent.toFixed(2)}%</p>
                <p className="text-xs text-muted-foreground">{fmtUSD(leader.tradingProfit)} profit</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Leaderboard */}
        <div className="glass-card rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between px-2 pb-2 border-b border-border/40">
            <h2 className="text-sm font-bold tracking-wide flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Leaderboard
            </h2>
            <p className="text-[10px] text-muted-foreground">Ranked by trading growth %</p>
          </div>

          {leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No traders yet. Share the code to invite competitors.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((row) => <LeaderRow key={row.id} row={row} />)}
            </div>
          )}
        </div>
      </div>

      {/* Join Modal */}
      <AnimatePresence>
        {showJoin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowJoin(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card rounded-2xl p-6 max-w-md w-full space-y-4 border border-primary/20"
            >
              <div>
                <h3 className="text-base font-bold">Join {competition.name}</h3>
                <p className="text-xs text-muted-foreground">Enter your trading session ID and pick a display name.</p>
              </div>
              <Input
                placeholder="Your session ID or shared link"
                value={joinSessionId}
                onChange={(e) => setJoinSessionId(e.target.value)}
                className="text-sm"
              />
              <Input
                placeholder="Display name (e.g. Joshua)"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                className="text-sm"
                maxLength={32}
              />
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={() => setShowJoin(false)}>Cancel</Button>
                <Button size="sm" onClick={handleJoin} disabled={joining}>
                  {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join Competition"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function LeaderRow({ row }: { row: LeaderboardRow }) {
  const s = rankStyle(row.rank);
  const isGain = row.growthPercent >= 0;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-3 bg-card/50 backdrop-blur ${s.ring} hover:bg-card/70 transition`}
    >
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold ${s.badge}`}>
          {s.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-bold truncate ${s.text}`}>{row.display_name}</span>
            {row.tradingDays === 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">No trades yet</span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {fmtUSD(row.startingCapital)} → <span className="font-medium text-foreground">{fmtUSD(row.currentCapital)}</span>
            {row.tradingDays > 0 && <span className="ml-1.5 opacity-70">· {row.tradingDays}d</span>}
          </p>
        </div>
        <div className="text-right">
          <div className={`flex items-center justify-end gap-1 text-lg font-bold ${isGain ? "text-emerald-400" : "text-red-400"}`}>
            {isGain ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {isGain ? "+" : ""}{row.growthPercent.toFixed(2)}%
          </div>
          <p className={`text-[11px] ${isGain ? "text-emerald-400/80" : "text-red-400/80"}`}>
            {isGain ? "+" : ""}{fmtUSD(row.tradingProfit)}
          </p>
          {row.tradingDays > 0 && (
            <p className={`text-[10px] mt-0.5 ${row.lastDayChangePercent >= 0 ? "text-emerald-400/70" : "text-red-400/70"}`}>
              Today {row.lastDayChangePercent >= 0 ? "+" : ""}{row.lastDayChangePercent.toFixed(2)}%
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

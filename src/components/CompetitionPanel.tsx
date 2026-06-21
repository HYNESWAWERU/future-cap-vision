import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Plus, LogIn, ArrowRight, Copy, Check, Loader2, Crown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createCompetition, joinCompetition, leaveCompetition, useSessionCompetitions } from "@/hooks/useCompetition";

interface Props {
  sessionId: string | null;
  readOnly?: boolean;
}

export default function CompetitionPanel({ sessionId, readOnly }: Props) {
  const { items } = useSessionCompetitions(sessionId);
  const [mode, setMode] = useState<"idle" | "create" | "join">("idle");
  const [busy, setBusy] = useState(false);

  // create
  const [compName, setCompName] = useState("");
  const [createDisplayName, setCreateDisplayName] = useState("");
  // join
  const [joinCode, setJoinCode] = useState("");
  const [joinDisplayName, setJoinDisplayName] = useState("");

  const [copied, setCopied] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!sessionId) return;
    if (!createDisplayName.trim()) { toast.error("Pick a display name"); return; }
    setBusy(true);
    try {
      const comp = await createCompetition(compName.trim() || "Competition", sessionId);
      await joinCompetition(comp.code, sessionId, createDisplayName.trim());
      toast.success(`Competition created · code ${comp.code}`);
      setMode("idle"); setCompName(""); setCreateDisplayName("");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create");
    } finally { setBusy(false); }
  };

  const handleJoin = async () => {
    if (!sessionId) return;
    if (!joinCode.trim()) { toast.error("Enter the competition code"); return; }
    if (!joinDisplayName.trim()) { toast.error("Pick a display name"); return; }
    setBusy(true);
    try {
      await joinCompetition(joinCode.trim().toUpperCase(), sessionId, joinDisplayName.trim());
      toast.success("Joined competition");
      setMode("idle"); setJoinCode(""); setJoinDisplayName("");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to join");
    } finally { setBusy(false); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    toast.success(`Code ${code} copied`);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div className="glass-card-hover rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-yellow-400/30 to-amber-600/30 flex items-center justify-center border border-yellow-400/30">
            <Trophy className="h-4 w-4 text-yellow-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide">Competitions</h3>
            <p className="text-[11px] text-muted-foreground">
              Race other traders. Ranked by % growth — fair across account sizes.
            </p>
          </div>
        </div>
        {!readOnly && mode === "idle" && (
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setMode("join")}>
              <LogIn className="h-3.5 w-3.5" /> Join
            </Button>
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => setMode("create")}>
              <Plus className="h-3.5 w-3.5" /> Create
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {mode !== "idle" && !readOnly && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-primary">
                  {mode === "create" ? "Create new competition" : "Join with competition code"}
                </p>
                <button onClick={() => setMode("idle")} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {mode === "create" ? (
                <>
                  <Input
                    placeholder="Competition name (e.g. June Sprint)"
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    maxLength={48}
                    className="h-9 text-sm"
                  />
                  <Input
                    placeholder="Your display name in this competition"
                    value={createDisplayName}
                    onChange={(e) => setCreateDisplayName(e.target.value)}
                    maxLength={32}
                    className="h-9 text-sm"
                  />
                  <Button size="sm" onClick={handleCreate} disabled={busy} className="w-full gap-1.5">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Create & Join
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    placeholder="Competition code (e.g. AB3CD9)"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={12}
                    className="h-9 text-sm font-mono tracking-widest"
                  />
                  <Input
                    placeholder="Your display name (e.g. Joshua)"
                    value={joinDisplayName}
                    onChange={(e) => setJoinDisplayName(e.target.value)}
                    maxLength={32}
                    className="h-9 text-sm"
                  />
                  <Button size="sm" onClick={handleJoin} disabled={busy} className="w-full gap-1.5">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                    Join Competition
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/50 p-6 text-center">
          <Crown className="h-6 w-6 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-xs text-muted-foreground">
            Not in any competition yet. Create one or join with a code.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <motion.div
              key={it.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border/50 bg-card/40 p-3 flex items-center gap-3"
            >
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-yellow-400/20 to-amber-600/20 border border-yellow-400/20 flex items-center justify-center">
                <Trophy className="h-4 w-4 text-yellow-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{it.competition.name}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span>as <span className="text-foreground font-medium">{it.display_name}</span></span>
                  <span>·</span>
                  <button
                    onClick={() => copyCode(it.competition.code)}
                    className="font-mono text-primary hover:text-primary/80 inline-flex items-center gap-1"
                  >
                    {it.competition.code}
                    {copied === it.competition.code ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3 opacity-60" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!readOnly && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    title="Leave competition"
                    onClick={async () => { await leaveCompetition(it.id); toast.success("Left competition"); }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Link to={`/competition/${it.competition.code}`}>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                    Leaderboard <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

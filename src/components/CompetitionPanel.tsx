import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Plus, LogIn, ArrowRight, Copy, Check, Loader2, Crown, X, UserPlus, Share2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createCompetition, joinCompetition, leaveCompetition, useSessionCompetitions } from "@/hooks/useCompetition";

interface Props {
  sessionId: string | null;
  readOnly?: boolean;
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

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
  const [managingId, setManagingId] = useState<string | null>(null);

  // add player inline
  const [playerSessionId, setPlayerSessionId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [addingPlayer, setAddingPlayer] = useState(false);

  const handleCreate = async () => {
    if (!sessionId) return;
    if (!createDisplayName.trim()) { toast.error("Pick a display name"); return; }
    setBusy(true);
    try {
      const comp = await createCompetition(compName.trim() || "Competition", sessionId);
      await joinCompetition(comp.code, sessionId, createDisplayName.trim());
      toast.success(`Competition "${comp.name}" created · code ${comp.code}`);
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

  const copyText = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(null), 1800);
  };

  const inviteLink = (code: string) => `${window.location.origin}/#/competition/${code}`;

  const handleAddPlayer = async (code: string) => {
    const uuid = playerSessionId.trim().match(UUID_RE)?.[0];
    if (!uuid) { toast.error("Paste a valid player session ID or link"); return; }
    if (!playerName.trim()) { toast.error("Enter the player's display name"); return; }
    setAddingPlayer(true);
    try {
      await joinCompetition(code, uuid, playerName.trim());
      toast.success(`${playerName.trim()} added to competition`);
      setPlayerSessionId(""); setPlayerName("");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add player");
    } finally { setAddingPlayer(false); }
  };

  return (
    <div className="glass-card-hover rounded-2xl p-5 space-y-4 relative">
      <div className="flex items-center justify-between flex-wrap gap-2">
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
                  {mode === "create" ? "Name your competition" : "Join with competition code"}
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
                    Create competition
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center">
                    After creating you can add players or share an invite link.
                  </p>
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
          {items.map((it) => {
            const isManaging = managingId === it.id;
            const link = inviteLink(it.competition.code);
            return (
              <motion.div
                key={it.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border/50 bg-card/40 p-3 space-y-2"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-yellow-400/20 to-amber-600/20 border border-yellow-400/20 flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-yellow-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{it.competition.name}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span>as <span className="text-foreground font-medium">{it.display_name}</span></span>
                      <span>·</span>
                      <button
                        onClick={() => copyText(it.competition.code, "Code", `code-${it.id}`)}
                        className="font-mono text-primary hover:text-primary/80 inline-flex items-center gap-1"
                      >
                        {it.competition.code}
                        {copied === `code-${it.id}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3 opacity-60" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!readOnly && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        title={isManaging ? "Close manage" : "Manage / invite players"}
                        onClick={() => { setManagingId(isManaging ? null : it.id); setPlayerSessionId(""); setPlayerName(""); }}
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
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
                </div>

                <AnimatePresence>
                  {isManaging && !readOnly && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-3 mt-1">
                        {/* Invite link */}
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-semibold text-primary flex items-center gap-1.5">
                            <Share2 className="h-3 w-3" /> Invite link
                          </p>
                          <div className="flex gap-1.5">
                            <Input value={link} readOnly className="h-8 text-xs font-mono" />
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1 text-xs shrink-0"
                              onClick={() => copyText(link, "Invite link", `link-${it.id}`)}
                            >
                              {copied === `link-${it.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              Copy
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Share this link. Players open it, paste their session ID, and join — their balances will auto-update the leaderboard.
                          </p>
                        </div>

                        {/* Add player */}
                        <div className="space-y-1.5 pt-1 border-t border-border/30">
                          <p className="text-[11px] font-semibold text-primary flex items-center gap-1.5">
                            <UserPlus className="h-3 w-3" /> Add a player by session ID
                          </p>
                          <Input
                            placeholder="Player session ID or shared link"
                            value={playerSessionId}
                            onChange={(e) => setPlayerSessionId(e.target.value)}
                            className="h-8 text-xs"
                          />
                          <Input
                            placeholder="Player display name"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            maxLength={32}
                            className="h-8 text-xs"
                          />
                          <Button
                            size="sm"
                            className="w-full h-8 gap-1.5 text-xs"
                            onClick={() => handleAddPlayer(it.competition.code)}
                            disabled={addingPlayer}
                          >
                            {addingPlayer ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                            Add player
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

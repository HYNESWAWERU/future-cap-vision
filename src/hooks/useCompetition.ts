import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { computeSessionStats, type ComputedStats, type SessionRow, type TradeRow } from "@/lib/competitionMath";

export interface Competition {
  id: string;
  code: string;
  name: string;
  creator_session_id: string | null;
  created_at: string;
}

export interface CompetitionEntry {
  id: string;
  competition_id: string;
  session_id: string;
  display_name: string;
  joined_at: string;
}

export interface LeaderboardRow extends CompetitionEntry, ComputedStats {
  rank: number;
}

// Random 6-char human-friendly code (no ambiguous chars)
function genCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function createCompetition(name: string, creatorSessionId?: string | null): Promise<Competition> {
  // Try up to 5 times for unique code
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = genCode();
    const { data, error } = await supabase
      .from("competitions" as any)
      .insert({ code, name: name || "Competition", creator_session_id: creatorSessionId ?? null })
      .select("*")
      .single();
    if (!error && data) return data as unknown as Competition;
    if (error && !String(error.message).toLowerCase().includes("duplicate")) {
      throw error;
    }
  }
  throw new Error("Could not generate unique competition code");
}

export async function joinCompetition(
  code: string,
  sessionId: string,
  displayName: string,
): Promise<{ competition: Competition; entry: CompetitionEntry }> {
  const normalized = code.trim().toUpperCase();
  const { data: comp, error: compErr } = await supabase
    .from("competitions" as any)
    .select("*")
    .eq("code", normalized)
    .maybeSingle();
  if (compErr) throw compErr;
  if (!comp) throw new Error("Competition not found");

  const competition = comp as unknown as Competition;
  const { data: entry, error: entryErr } = await supabase
    .from("competition_entries" as any)
    .upsert(
      {
        competition_id: competition.id,
        session_id: sessionId,
        display_name: displayName.trim() || "Trader",
      },
      { onConflict: "competition_id,session_id" },
    )
    .select("*")
    .single();
  if (entryErr) throw entryErr;
  return { competition, entry: entry as unknown as CompetitionEntry };
}

export function useCompetitionByCode(code: string | null) {
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [entries, setEntries] = useState<CompetitionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) { setLoading(false); return; }
    const normalized = code.trim().toUpperCase();
    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data: comp } = await supabase
        .from("competitions" as any)
        .select("*")
        .eq("code", normalized)
        .maybeSingle();
      if (cancelled) return;
      if (!comp) { setCompetition(null); setLoading(false); return; }
      const c = comp as unknown as Competition;
      setCompetition(c);
      const { data: ents } = await supabase
        .from("competition_entries" as any)
        .select("*")
        .eq("competition_id", c.id);
      if (cancelled) return;
      setEntries((ents ?? []) as unknown as CompetitionEntry[]);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [code]);

  // Realtime
  useEffect(() => {
    if (!competition) return;
    const channel = supabase
      .channel(`competition-${competition.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "competition_entries", filter: `competition_id=eq.${competition.id}` },
        (payload: any) => {
          if (payload.eventType === "DELETE") {
            setEntries((prev) => prev.filter((e) => e.id !== payload.old?.id));
          } else if (payload.new) {
            setEntries((prev) => {
              const without = prev.filter((e) => e.id !== payload.new.id);
              return [...without, payload.new];
            });
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [competition?.id]);

  return { competition, entries, loading, setEntries };
}

export function useLeaderboard(entries: CompetitionEntry[]) {
  const [sessions, setSessions] = useState<Record<string, SessionRow>>({});
  const [trades, setTrades] = useState<Record<string, TradeRow[]>>({});
  const [version, setVersion] = useState(0);

  const sessionIds = useMemo(() => entries.map((e) => e.session_id), [entries]);
  const idsKey = sessionIds.join(",");

  // Fetch sessions + trades whenever entry list changes
  useEffect(() => {
    if (sessionIds.length === 0) { setSessions({}); setTrades({}); return; }
    let cancelled = false;
    (async () => {
      const [{ data: sess }, { data: tr }] = await Promise.all([
        supabase
          .from("trading_sessions_public" as any)
          .select("id, starting_capital, daily_target_percent, trading_start_date, trading_end_date")
          .in("id", sessionIds),
        supabase
          .from("trade_entries")
          .select("session_id, entry_date, actual_result, deposit, withdrawal, verified")
          .in("session_id", sessionIds),
      ]);
      if (cancelled) return;
      const sessMap: Record<string, SessionRow> = {};
      for (const s of (sess ?? []) as any[]) {
        sessMap[s.id] = {
          id: s.id,
          starting_capital: Number(s.starting_capital),
          daily_target_percent: Number(s.daily_target_percent),
          trading_start_date: s.trading_start_date,
          trading_end_date: s.trading_end_date,
        };
      }
      const trMap: Record<string, TradeRow[]> = {};
      for (const t of (tr ?? []) as any[]) {
        const row: TradeRow = {
          entry_date: t.entry_date,
          actual_result: t.actual_result != null ? Number(t.actual_result) : null,
          deposit: Number(t.deposit ?? 0),
          withdrawal: Number(t.withdrawal ?? 0),
          verified: !!t.verified,
        };
        (trMap[t.session_id] ||= []).push(row);
      }
      setSessions(sessMap);
      setTrades(trMap);
    })();
    return () => { cancelled = true; };
  }, [idsKey, version]);

  // Realtime: refresh on any trade_entries / trading_sessions change for these sessions
  useEffect(() => {
    if (sessionIds.length === 0) return;
    const channel = supabase
      .channel(`leaderboard-${idsKey}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "trade_entries" }, (payload: any) => {
        const sid = payload.new?.session_id || payload.old?.session_id;
        if (sid && sessionIds.includes(sid)) setVersion((v) => v + 1);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "trading_sessions" }, (payload: any) => {
        const sid = payload.new?.id || payload.old?.id;
        if (sid && sessionIds.includes(sid)) setVersion((v) => v + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [idsKey]);

  const rows: LeaderboardRow[] = useMemo(() => {
    const computed = entries.map((entry) => {
      const session = sessions[entry.session_id];
      const stats: ComputedStats = session
        ? computeSessionStats(session, trades[entry.session_id] ?? [])
        : { startingCapital: 0, currentCapital: 0, tradingProfit: 0, growthPercent: 0, lastDayChangePercent: 0, tradingDays: 0 };
      return { ...entry, ...stats, rank: 0 };
    });
    computed.sort((a, b) => b.growthPercent - a.growthPercent);
    computed.forEach((r, i) => { r.rank = i + 1; });
    return computed;
  }, [entries, sessions, trades]);

  return rows;
}

export function useSessionCompetitions(sessionId: string | null) {
  const [items, setItems] = useState<Array<CompetitionEntry & { competition: Competition }>>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!sessionId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("competition_entries" as any)
      .select("*, competition:competitions(*)")
      .eq("session_id", sessionId);
    setItems(((data ?? []) as unknown) as Array<CompetitionEntry & { competition: Competition }>);
    setLoading(false);
  }, [sessionId]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`session-comps-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "competition_entries", filter: `session_id=eq.${sessionId}` },
        () => refresh(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId, refresh]);

  return { items, loading, refresh };
}

export async function leaveCompetition(entryId: string) {
  await supabase.from("competition_entries" as any).delete().eq("id", entryId);
}

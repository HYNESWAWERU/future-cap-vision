import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "trader" | "partner";

export interface EditLogEntry {
  timestamp: number;
  field: string;
  dayIndex?: number;
  oldValue: string;
  newValue: string;
}

const INACTIVITY_TIMEOUT = 60_000;

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + "trading-salt-2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function useCloudAccessControl(sessionId: string | null, hasPinFromSession: boolean) {
  const [activeRole, setActiveRole] = useState<UserRole>("trader");
  const [editLog, setEditLog] = useState<EditLogEntry[]>([]);
  const [isPinSet, setIsPinSet] = useState(hasPinFromSession);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isEditable = activeRole === "partner";

  // Sync hasPinFromSession
  useEffect(() => {
    setIsPinSet(hasPinFromSession);
  }, [hasPinFromSession]);

  // Load edit log from cloud
  useEffect(() => {
    if (!sessionId) return;
    const loadLog = async () => {
      const { data } = await supabase
        .from("edit_log")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (data) {
        setEditLog((data as any[]).map(e => ({
          timestamp: new Date(e.created_at).getTime(),
          field: e.field,
          dayIndex: e.day_index ?? undefined,
          oldValue: e.old_value,
          newValue: e.new_value,
        })));
      }
    };
    loadLog();

    // Real-time edit log
    const channel = supabase
      .channel(`editlog-${sessionId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "edit_log",
        filter: `session_id=eq.${sessionId}`,
      }, (payload: any) => {
        if (payload.new) {
          const e = payload.new;
          setEditLog(prev => [{
            timestamp: new Date(e.created_at).getTime(),
            field: e.field,
            dayIndex: e.day_index ?? undefined,
            oldValue: e.old_value,
            newValue: e.new_value,
          }, ...prev].slice(0, 200));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  const setPin = useCallback(async (pin: string) => {
    if (!sessionId) return;
    const hash = await hashPin(pin);
    await supabase.from("trading_sessions").update({ pin_hash: hash }).eq("id", sessionId);
    setIsPinSet(true);
  }, [sessionId]);

  const resetInactivityTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setActiveRole("trader");
    }, INACTIVITY_TIMEOUT);
  }, []);

  const unlockPartner = useCallback(
    async (pin: string): Promise<boolean> => {
      if (!sessionId) return false;
      const hash = await hashPin(pin);
      const { data } = await supabase.rpc("verify_session_pin", {
        session_uuid: sessionId,
        provided_hash: hash,
      });
      if (data) {
        setActiveRole("partner");
        resetInactivityTimer();
        return true;
      }
      return false;
    },
    [sessionId, resetInactivityTimer]
  );

  const lockToTrader = useCallback(() => {
    setActiveRole("trader");
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const logEdit = useCallback(
    (field: string, oldValue: string, newValue: string, dayIndex?: number) => {
      if (activeRole !== "partner" || !sessionId) return;
      resetInactivityTimer();
      // Insert into cloud
      supabase.from("edit_log").insert({
        session_id: sessionId,
        field,
        old_value: oldValue,
        new_value: newValue,
        day_index: dayIndex ?? null,
      }).then();
    },
    [activeRole, sessionId, resetInactivityTimer]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    activeRole,
    isPinSet,
    isEditable,
    setPin,
    unlockPartner,
    lockToTrader,
    editLog,
    logEdit,
    resetInactivityTimer,
  };
}

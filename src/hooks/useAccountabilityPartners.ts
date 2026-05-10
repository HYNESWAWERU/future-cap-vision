import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Partner {
  id: string;
  session_id: string;
  name: string;
  email: string;
  label: string;
  verified: boolean;
  verification_token: string;
  notify_profit: boolean;
  notify_loss: boolean;
  notify_weekly: boolean;
  notify_milestones: boolean;
  created_at: string;
  verified_at: string | null;
}

export const PARTNER_LABELS = ["Mentor", "Accountability Partner", "Friend", "Personal Email"] as const;

export function useAccountabilityPartners(sessionId: string | null) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPartners = useCallback(async () => {
    if (!sessionId) return;
    const { data } = await supabase
      .from("accountability_partners")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    setPartners((data as Partner[]) ?? []);
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    fetchPartners();
    if (!sessionId) return;
    const channel = supabase
      .channel(`partners_${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "accountability_partners", filter: `session_id=eq.${sessionId}` },
        () => fetchPartners()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, fetchPartners]);

  const addPartner = useCallback(
    async (input: { name: string; email: string; label: string }) => {
      if (!sessionId) return { error: "No session" };
      if (partners.length >= 2) return { error: "Maximum 2 accountability partners reached" };
      const email = input.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Invalid email address" };
      if (partners.some((p) => p.email.toLowerCase() === email)) return { error: "This email is already added" };
      const { error } = await supabase.from("accountability_partners").insert({
        session_id: sessionId,
        name: input.name.trim().slice(0, 80),
        email,
        label: input.label,
      });
      if (error) return { error: error.message };
      await fetchPartners();
      return { error: null };
    },
    [sessionId, partners, fetchPartners]
  );

  const removePartner = useCallback(async (id: string) => {
    await supabase.from("accountability_partners").delete().eq("id", id);
    await fetchPartners();
  }, [fetchPartners]);

  const updatePartner = useCallback(async (id: string, patch: Partial<Partner>) => {
    await supabase.from("accountability_partners").update(patch).eq("id", id);
    await fetchPartners();
  }, [fetchPartners]);

  const verifyByToken = useCallback(async (token: string) => {
    const { data, error } = await supabase
      .from("accountability_partners")
      .update({ verified: true, verified_at: new Date().toISOString() })
      .eq("verification_token", token)
      .select()
      .maybeSingle();
    return { data, error };
  }, []);

  return { partners, loading, addPartner, removePartner, updatePartner, verifyByToken, refresh: fetchPartners };
}

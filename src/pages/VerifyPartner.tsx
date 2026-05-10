import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function VerifyPartner() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<"loading" | "success" | "already" | "error">("loading");
  const [email, setEmail] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!token) { setState("error"); return; }
      const { data: existing } = await supabase
        .from("accountability_partners")
        .select("id, email, verified, session_id")
        .eq("verification_token", token)
        .maybeSingle();

      if (!existing) { setState("error"); return; }
      setEmail((existing as any).email);
      setSessionId((existing as any).session_id);

      if ((existing as any).verified) { setState("already"); return; }

      const { error } = await supabase
        .from("accountability_partners")
        .update({ verified: true, verified_at: new Date().toISOString() })
        .eq("verification_token", token);
      setState(error ? "error" : "success");
    })();
  }, [token]);

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="glass-card-hover rounded-3xl p-8 max-w-md w-full text-center"
        >
          {state === "loading" && (
            <>
              <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Verifying...</p>
            </>
          )}
          {state === "success" && (
            <>
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }}
                className="h-20 w-20 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mx-auto mb-4"
              >
                <ShieldCheck className="h-10 w-10 text-emerald-400" />
              </motion.div>
              <h1 className="text-2xl font-black text-emerald-300 mb-2">You're verified ✅</h1>
              <p className="text-sm text-muted-foreground mb-6">
                <span className="font-mono text-foreground">{email}</span> will now receive trading accountability alerts.
              </p>
            </>
          )}
          {state === "already" && (
            <>
              <ShieldCheck className="h-16 w-16 mx-auto text-emerald-400 mb-4" />
              <h1 className="text-xl font-bold mb-2">Already verified</h1>
              <p className="text-sm text-muted-foreground mb-6">
                <span className="font-mono">{email}</span> is already an active accountability partner.
              </p>
            </>
          )}
          {state === "error" && (
            <>
              <AlertCircle className="h-16 w-16 mx-auto text-red-400 mb-4" />
              <h1 className="text-xl font-bold mb-2">Invalid link</h1>
              <p className="text-sm text-muted-foreground mb-6">
                This verification link is invalid or has expired.
              </p>
            </>
          )}
          {sessionId && (
            <Link
              to={`/session/${sessionId}`}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              View session <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </motion.div>
      </div>
    </>
  );
}

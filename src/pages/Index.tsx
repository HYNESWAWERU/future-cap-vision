import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Plus, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LaunchScreen from "@/components/LaunchScreen";

export default function Index() {
  const navigate = useNavigate();
  const [showLaunch, setShowLaunch] = useState(true);
  const [launched, setLaunched] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joinId, setJoinId] = useState("");

  const handleLaunchComplete = () => {
    setShowLaunch(false);
    setLaunched(true);
  };

  const handleCreateSession = async () => {
    setCreating(true);
    try {
      const currentYear = new Date().getFullYear();
      const { data, error } = await supabase.from("trading_sessions").insert({
        starting_capital: 1000,
        daily_target_percent: 4.0,
        trading_start_date: `${currentYear}-01-01`,
        trading_end_date: `${currentYear}-12-31`,
      }).select("id").single();

      if (error) throw error;
      if (data) navigate(`/session/${(data as any).id}`);
    } catch (e) {
      console.error("Failed to create session:", e);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinSession = () => {
    const id = joinId.trim();
    if (!id) return;
    // Support both full URLs and plain IDs
    const uuidMatch = id.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (uuidMatch) {
      navigate(`/session/${uuidMatch[0]}`);
    }
  };

  return (
    <>
      <LaunchScreen show={showLaunch} onComplete={handleLaunchComplete} />

      {launched && (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md space-y-8"
          >
            {/* Logo */}
            <div className="flex flex-col items-center gap-3">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-blue">
                <Activity className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gradient-gold">COMPTRA</h1>
              <p className="text-sm text-muted-foreground text-center">
                Compound Growth Trading Tracker<br />
                <span className="text-xs opacity-70">Real-time sync across all your devices</span>
              </p>
            </div>

            {/* Create new */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6 rounded-xl space-y-4"
            >
              <h2 className="text-sm font-semibold text-foreground">Start a new tracker</h2>
              <Button
                onClick={handleCreateSession}
                disabled={creating}
                className="w-full gap-2"
                size="lg"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create New Session
              </Button>
            </motion.div>

            {/* Join existing */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="glass-card p-6 rounded-xl space-y-4"
            >
              <h2 className="text-sm font-semibold text-foreground">Join an existing tracker</h2>
              <p className="text-xs text-muted-foreground">Paste a shared link or session ID</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Paste link or session ID..."
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinSession()}
                  className="flex-1 text-sm"
                />
                <Button onClick={handleJoinSession} size="icon" variant="outline">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </>
  );
}

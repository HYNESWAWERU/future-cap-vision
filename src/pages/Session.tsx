import { useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Copy, Check, Share2, Loader2 } from "lucide-react";
import { useCloudTradingEngine } from "@/hooks/useCloudTradingEngine";
import { useCloudAccessControl } from "@/hooks/useCloudAccessControl";
import SummaryCards from "@/components/SummaryCards";
import InputsPanel from "@/components/InputsPanel";
import ProjectionLookup from "@/components/ProjectionLookup";
import TradingTable from "@/components/TradingTable";
import TradingCharts from "@/components/TradingCharts";
import MarketPanel from "@/components/MarketPanel";
import MarketTicker from "@/components/MarketTicker";
import GoalTracker from "@/components/GoalTracker";
import TradingStreak from "@/components/TradingStreak";
import AnimatedBackground from "@/components/AnimatedBackground";
import RoleBadge from "@/components/RoleBadge";
import { PinSetupDialog, PinEntryDialog } from "@/components/PinDialog";
import EditLogDialog from "@/components/EditLogDialog";
import ResetTradesDialog from "@/components/ResetTradesDialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function Session() {
  const { id } = useParams<{ id: string }>();
  const engine = useCloudTradingEngine(id ?? null);
  const access = useCloudAccessControl(id ?? null, engine.hasPinSet);
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [showEditLog, setShowEditLog] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [copied, setCopied] = useState(false);

  const readOnly = !access.isEditable;

  const startYear = new Date(engine.tradingStartDate).getFullYear();
  const endYear = new Date(engine.tradingEndDate).getFullYear();
  const yearLabel = startYear === endYear ? String(startYear) : `${startYear}–${endYear}`;

  const shareLink = `${window.location.origin}/session/${id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success("Link copied! Share it to sync across devices.");
    setTimeout(() => setCopied(false), 2000);
  };

  if (engine.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <AnimatedBackground />
        <motion.div
          className="flex flex-col items-center gap-4 z-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-blue"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Activity className="h-8 w-8 text-primary-foreground" />
          </motion.div>
          <motion.p
            className="text-muted-foreground font-mono text-sm"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Loading session...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <PinSetupDialog open={!access.isPinSet} onSetPin={access.setPin} />

      <PinEntryDialog
        open={showPinEntry}
        onClose={() => setShowPinEntry(false)}
        onSubmit={async (pin) => {
          const ok = await access.unlockPartner(pin);
          if (ok) setShowPinEntry(false);
          return ok;
        }}
      />

      <EditLogDialog open={showEditLog} onClose={() => setShowEditLog(false)} entries={access.editLog} />

      <ResetTradesDialog
        open={showReset}
        onClose={() => setShowReset(false)}
        onConfirm={async (pin) => {
          const ok = await access.unlockPartner(pin);
          if (ok) {
            engine.resetAllTrades();
            access.logEdit("Reset All Trades", "all data", "cleared");
            access.lockToTrader();
            setShowReset(false);
          }
          return ok;
        }}
      />

      <AnimatedBackground />

      <motion.div
        className="relative z-10 min-h-screen bg-transparent p-4 md:p-6 space-y-5 max-w-[1440px] mx-auto"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <motion.div
              className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-blue"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Activity className="h-5 w-5 text-primary-foreground" />
            </motion.div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-gradient-gold">
                COMPTRA
              </h1>
              <p className="text-xs text-muted-foreground tracking-wide">
                Compound growth engine · <span className="text-primary font-mono">{yearLabel}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleCopyLink}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Share Link"}
            </Button>
            <RoleBadge
              role={access.activeRole}
              onRequestUnlock={() => setShowPinEntry(true)}
              onLock={access.lockToTrader}
              onShowLog={() => setShowEditLog(true)}
              onReset={() => setShowReset(true)}
            />
          </div>
        </motion.div>

        {/* Market Ticker */}
        <motion.div variants={fadeUp}>
          <MarketTicker />
        </motion.div>

        {/* Inputs */}
        <motion.div variants={fadeUp}>
          <InputsPanel
            startingCapital={engine.startingCapital}
            setStartingCapital={engine.setStartingCapital}
            dailyTargetPercent={engine.dailyTargetPercent}
            setDailyTargetPercent={engine.setDailyTargetPercent}
            accountabilityPartner={engine.accountabilityPartner}
            setAccountabilityPartner={engine.setAccountabilityPartner}
            tradingStartDate={engine.tradingStartDate}
            setTradingStartDate={engine.setTradingStartDate}
            tradingEndDate={engine.tradingEndDate}
            setTradingEndDate={engine.setTradingEndDate}
            readOnly={readOnly}
            onEdit={access.logEdit}
          />
        </motion.div>

        {/* Summary Cards */}
        <motion.div variants={fadeUp}>
          <SummaryCards {...engine.summary} />
        </motion.div>

        {/* Charts + Projection + BTC/KES */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <TradingCharts entries={engine.entries} startingCapital={engine.startingCapital} />
          </div>
          <div className="space-y-3">
            <ProjectionLookup
              tradingStartDate={engine.tradingStartDate}
              tradingEndDate={engine.tradingEndDate}
              getProjection={engine.getProjection}
            />
            <MarketPanel />
          </div>
        </motion.div>

        {/* Trading Table */}
        <motion.div variants={fadeUp}>
          <TradingTable
            entries={engine.entries}
            setActualResult={engine.setActualResult}
            toggleVerified={engine.toggleVerified}
            setDeposit={engine.setDeposit}
            setWithdrawal={engine.setWithdrawal}
            availableYears={engine.availableYears}
            readOnly={readOnly}
            onEdit={access.logEdit}
          />
        </motion.div>
      </motion.div>
    </>
  );
}

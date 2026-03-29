import { useState } from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { useTradingEngine } from "@/hooks/useTradingEngine";
import { useAccessControl } from "@/hooks/useAccessControl";
import SummaryCards from "@/components/SummaryCards";
import InputsPanel from "@/components/InputsPanel";
import ProjectionLookup from "@/components/ProjectionLookup";
import TradingTable from "@/components/TradingTable";
import TradingCharts from "@/components/TradingCharts";
import RoleBadge from "@/components/RoleBadge";
import { PinSetupDialog, PinEntryDialog } from "@/components/PinDialog";
import EditLogDialog from "@/components/EditLogDialog";
import ResetTradesDialog from "@/components/ResetTradesDialog";
import LaunchScreen from "@/components/LaunchScreen";

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function Index() {
  const engine = useTradingEngine();
  const access = useAccessControl();
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [showEditLog, setShowEditLog] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showLaunch, setShowLaunch] = useState(true);
  const [launched, setLaunched] = useState(false);

  const readOnly = !access.isEditable;

  const startYear = new Date(engine.tradingStartDate).getFullYear();
  const endYear = new Date(engine.tradingEndDate).getFullYear();
  const yearLabel = startYear === endYear ? String(startYear) : `${startYear}–${endYear}`;

  const handleLaunchComplete = () => {
    setShowLaunch(false);
    setLaunched(true);
  };

  return (
    <>
      <LaunchScreen show={showLaunch} onComplete={handleLaunchComplete} />

      <PinSetupDialog open={!showLaunch && !access.isPinSet} onSetPin={access.setPin} />

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

      {launched && (
        <motion.div
          className="min-h-screen bg-background p-4 md:p-6 space-y-5 max-w-[1440px] mx-auto"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {/* Header */}
          <motion.div variants={fadeUp} className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-warning flex items-center justify-center glow-gold">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-gradient-gold">
                  Trading Performance Tracker
                </h1>
                <p className="text-xs text-muted-foreground tracking-wide">
                  Compound growth engine · <span className="text-primary font-mono">{yearLabel}</span>
                </p>
              </div>
            </div>
            <RoleBadge
              role={access.activeRole}
              onRequestUnlock={() => setShowPinEntry(true)}
              onLock={access.lockToTrader}
              onShowLog={() => setShowEditLog(true)}
              onReset={() => setShowReset(true)}
            />
          </motion.div>

          {/* Ticker line */}
          <motion.div variants={fadeUp} className="ticker-line" />

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

          {/* Charts + Projection */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <TradingCharts entries={engine.entries} startingCapital={engine.startingCapital} />
            </div>
            <ProjectionLookup
              tradingStartDate={engine.tradingStartDate}
              tradingEndDate={engine.tradingEndDate}
              getProjection={engine.getProjection}
            />
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
      )}
    </>
  );
}

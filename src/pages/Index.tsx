import { useState } from "react";
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

export default function Index() {
  const engine = useTradingEngine();
  const access = useAccessControl();
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [showEditLog, setShowEditLog] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const readOnly = !access.isEditable;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto">
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

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Trading Performance Tracker</h1>
            <p className="text-xs text-muted-foreground">Compound growth engine · {engine.year}</p>
          </div>
        </div>
        <RoleBadge
          role={access.activeRole}
          onRequestUnlock={() => setShowPinEntry(true)}
          onLock={access.lockToTrader}
          onShowLog={() => setShowEditLog(true)}
        />
      </div>

      <InputsPanel
        startingCapital={engine.startingCapital}
        setStartingCapital={engine.setStartingCapital}
        dailyTargetPercent={engine.dailyTargetPercent}
        setDailyTargetPercent={engine.setDailyTargetPercent}
        accountabilityPartner={engine.accountabilityPartner}
        setAccountabilityPartner={engine.setAccountabilityPartner}
        year={engine.year}
        resetYear={engine.resetYear}
        tradingStartDate={engine.tradingStartDate}
        setTradingStartDate={engine.setTradingStartDate}
        readOnly={readOnly}
        onEdit={access.logEdit}
      />

      <SummaryCards {...engine.summary} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <TradingCharts entries={engine.entries} />
        </div>
        <ProjectionLookup year={engine.year} getProjection={engine.getProjection} />
      </div>

      <TradingTable
        entries={engine.entries}
        setActualResult={engine.setActualResult}
        toggleVerified={engine.toggleVerified}
        readOnly={readOnly}
        onEdit={access.logEdit}
      />
    </div>
  );
}

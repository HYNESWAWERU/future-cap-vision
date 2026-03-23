import { Activity } from "lucide-react";
import { useTradingEngine } from "@/hooks/useTradingEngine";
import SummaryCards from "@/components/SummaryCards";
import InputsPanel from "@/components/InputsPanel";
import ProjectionLookup from "@/components/ProjectionLookup";
import TradingTable from "@/components/TradingTable";
import TradingCharts from "@/components/TradingCharts";

export default function Index() {
  const engine = useTradingEngine();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Trading Performance Tracker</h1>
          <p className="text-xs text-muted-foreground">Compound growth engine · {engine.year}</p>
        </div>
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
      />
    </div>
  );
}

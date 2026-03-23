import { TrendingUp, TrendingDown, DollarSign, BarChart3, Calendar, Trophy } from "lucide-react";
import { toKES } from "@/hooks/useTradingEngine";

interface Props {
  currentCapital: number;
  totalPnl: number;
  growthPercent: number;
  winDays: number;
  lossDays: number;
  tradingDays: number;
}

function StatCard({ label, value, subValue, icon: Icon, positive }: {
  label: string; value: string; subValue?: string;
  icon: React.ElementType; positive?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className={`text-xl font-mono font-bold ${positive === undefined ? "text-foreground" : positive ? "text-profit" : "text-loss"}`}>
        {value}
      </p>
      {subValue && <p className="text-xs text-muted-foreground font-mono">{subValue}</p>}
    </div>
  );
}

export default function SummaryCards({ currentCapital, totalPnl, growthPercent, winDays, lossDays, tradingDays }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      <StatCard label="Current Capital" value={`$${currentCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        subValue={`KES ${toKES(currentCapital).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={DollarSign} />
      <StatCard label="Total P/L" value={`${totalPnl >= 0 ? "+" : ""}$${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        subValue={`KES ${toKES(totalPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        icon={totalPnl >= 0 ? TrendingUp : TrendingDown} positive={totalPnl >= 0} />
      <StatCard label="Growth" value={`${growthPercent >= 0 ? "+" : ""}${growthPercent.toFixed(2)}%`}
        icon={BarChart3} positive={growthPercent >= 0} />
      <StatCard label="Win Days" value={String(winDays)} icon={Trophy} positive={true} />
      <StatCard label="Loss Days" value={String(lossDays)} icon={TrendingDown} positive={false} />
      <StatCard label="Trading Days" value={String(tradingDays)} icon={Calendar} />
    </div>
  );
}

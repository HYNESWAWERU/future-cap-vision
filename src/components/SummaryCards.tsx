import { TrendingUp, TrendingDown, DollarSign, BarChart3, Calendar, Trophy, ArrowDownCircle, ArrowUpCircle, Minus, Target } from "lucide-react";
import { toKES } from "@/hooks/useTradingEngine";

interface Props {
  currentCapital: number;
  tradingProfitOnly: number;
  accountGrowthTotal: number;
  tradingGrowthPercent: number;
  accountGrowthPercent: number;
  winDays: number;
  lossDays: number;
  tradingDays: number;
  totalDeposits: number;
  totalWithdrawals: number;
  netCashflow: number;
  cagr: number;
  bestMonth: { label: string; pnl: number };
  worstMonth: { label: string; pnl: number };
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

const fmtUsd = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtKes = (n: number) => `KES ${toKES(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const fmtSign = (n: number) => `${n >= 0 ? "+" : ""}`;

export default function SummaryCards(props: Props) {
  const { currentCapital, tradingProfitOnly, accountGrowthTotal, tradingGrowthPercent, accountGrowthPercent,
    winDays, lossDays, tradingDays, totalDeposits, totalWithdrawals, netCashflow, cagr, bestMonth, worstMonth } = props;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Current Capital" value={fmtUsd(currentCapital)} subValue={fmtKes(currentCapital)} icon={DollarSign} />
        <StatCard label="Trading Profit" value={`${fmtSign(tradingProfitOnly)}${fmtUsd(tradingProfitOnly)}`}
          subValue={`Acct: ${fmtSign(accountGrowthTotal)}${fmtUsd(accountGrowthTotal)}`}
          icon={tradingProfitOnly >= 0 ? TrendingUp : TrendingDown} positive={tradingProfitOnly >= 0} />
        <StatCard label="Trading Growth" value={`${fmtSign(tradingGrowthPercent)}${tradingGrowthPercent.toFixed(2)}%`}
          subValue={`CAGR: ${cagr.toFixed(2)}%`}
          icon={BarChart3} positive={tradingGrowthPercent >= 0} />
        <StatCard label="Win Days" value={String(winDays)} icon={Trophy} positive={true} />
        <StatCard label="Loss Days" value={String(lossDays)} icon={TrendingDown} positive={false} />
        <StatCard label="Trading Days" value={String(tradingDays)} icon={Calendar} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard label="Total Deposits" value={fmtUsd(totalDeposits)} subValue={fmtKes(totalDeposits)} icon={ArrowDownCircle} />
        <StatCard label="Total Withdrawals" value={fmtUsd(totalWithdrawals)} subValue={fmtKes(totalWithdrawals)} icon={ArrowUpCircle} />
        <StatCard label="Net Cashflow" value={`${fmtSign(netCashflow)}${fmtUsd(netCashflow)}`} icon={Minus} positive={netCashflow >= 0} />
        <StatCard label="Best Month" value={bestMonth.label} subValue={`${fmtSign(bestMonth.pnl)}${fmtUsd(bestMonth.pnl)}`} icon={Target} positive={true} />
        <StatCard label="Worst Month" value={worstMonth.label} subValue={`${fmtSign(worstMonth.pnl)}${fmtUsd(worstMonth.pnl)}`} icon={Target} positive={false} />
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
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

function StatCard({ label, value, subValue, icon: Icon, positive, delay = 0 }: {
  label: string; value: string; subValue?: string;
  icon: React.ElementType; positive?: boolean; delay?: number;
}) {
  const glowClass = positive === true ? "hover:glow-profit" : positive === false ? "hover:glow-loss" : "hover:glow-gold";

  return (
    <motion.div
      className={`glass-card-hover rounded-xl p-4 space-y-1.5 group cursor-default ${glowClass}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
      </div>
      <p className={`text-xl font-mono font-bold ${positive === undefined ? "text-foreground" : positive ? "text-profit" : "text-loss"}`}>
        {value}
      </p>
      {subValue && <p className="text-[11px] text-muted-foreground font-mono">{subValue}</p>}
    </motion.div>
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
        <StatCard delay={0} label="Current Capital" value={fmtUsd(currentCapital)} subValue={fmtKes(currentCapital)} icon={DollarSign} />
        <StatCard delay={0.05} label="Trading Profit" value={`${fmtSign(tradingProfitOnly)}${fmtUsd(tradingProfitOnly)}`}
          subValue={`Acct: ${fmtSign(accountGrowthTotal)}${fmtUsd(accountGrowthTotal)}`}
          icon={tradingProfitOnly >= 0 ? TrendingUp : TrendingDown} positive={tradingProfitOnly >= 0} />
        <StatCard delay={0.1} label="Trading Growth" value={`${fmtSign(tradingGrowthPercent)}${tradingGrowthPercent.toFixed(2)}%`}
          subValue={`CAGR: ${cagr.toFixed(2)}%`}
          icon={BarChart3} positive={tradingGrowthPercent >= 0} />
        <StatCard delay={0.15} label="Win Days" value={String(winDays)} icon={Trophy} positive={true} />
        <StatCard delay={0.2} label="Loss Days" value={String(lossDays)} icon={TrendingDown} positive={false} />
        <StatCard delay={0.25} label="Trading Days" value={String(tradingDays)} icon={Calendar} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard delay={0.3} label="Total Deposits" value={fmtUsd(totalDeposits)} subValue={fmtKes(totalDeposits)} icon={ArrowDownCircle} />
        <StatCard delay={0.35} label="Total Withdrawals" value={fmtUsd(totalWithdrawals)} subValue={fmtKes(totalWithdrawals)} icon={ArrowUpCircle} />
        <StatCard delay={0.4} label="Net Cashflow" value={`${fmtSign(netCashflow)}${fmtUsd(netCashflow)}`} icon={Minus} positive={netCashflow >= 0} />
        <StatCard delay={0.45} label="Best Month" value={bestMonth.label} subValue={`${fmtSign(bestMonth.pnl)}${fmtUsd(bestMonth.pnl)}`} icon={Target} positive={true} />
        <StatCard delay={0.5} label="Worst Month" value={worstMonth.label} subValue={`${fmtSign(worstMonth.pnl)}${fmtUsd(worstMonth.pnl)}`} icon={Target} positive={false} />
      </div>
    </div>
  );
}

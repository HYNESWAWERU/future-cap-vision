import { useState } from "react";
import { CalendarIcon, Rocket } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toKES } from "@/hooks/useTradingEngine";

interface Props {
  tradingStartDate: string;
  tradingEndDate: string;
  getProjection: (date: Date) => { expectedCapital: number; expectedProfit: number; growthPercent: number } | null;
}

export default function ProjectionLookup({ tradingStartDate, tradingEndDate, getProjection }: Props) {
  const [date, setDate] = useState<Date>();
  const projection = date ? getProjection(date) : null;
  const fromDate = new Date(tradingStartDate);
  const toDate = new Date(tradingEndDate);

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Rocket className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider">Future Projection</h3>
      </div>
      <div className="flex items-end gap-3 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-52 justify-start text-left font-mono", !date && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : "Select a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single" selected={date} onSelect={setDate}
              fromDate={fromDate} toDate={toDate}
              defaultMonth={fromDate}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
      {projection && (
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="space-y-0.5">
            <span className="text-xs text-muted-foreground">Expected Capital</span>
            <p className="font-mono font-bold text-profit">${projection.expectedCapital.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted-foreground font-mono">KES {toKES(projection.expectedCapital).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-xs text-muted-foreground">Expected Profit</span>
            <p className={`font-mono font-bold ${projection.expectedProfit >= 0 ? "text-profit" : "text-loss"}`}>
              {projection.expectedProfit >= 0 ? "+" : ""}${projection.expectedProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground font-mono">KES {toKES(projection.expectedProfit).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-xs text-muted-foreground">Growth from Start</span>
            <p className={`font-mono font-bold ${projection.growthPercent >= 0 ? "text-profit" : "text-loss"}`}>
              {projection.growthPercent >= 0 ? "+" : ""}{projection.growthPercent.toFixed(2)}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

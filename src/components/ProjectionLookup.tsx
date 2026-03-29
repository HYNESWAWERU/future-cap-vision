import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    <motion.div
      className="glass-card-hover rounded-xl p-5 space-y-4"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Rocket className="h-3.5 w-3.5 text-primary" />
        </div>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gradient-gold">Future Projection</h3>
      </div>
      <div className="flex items-end gap-3 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-52 justify-start text-left font-mono text-xs bg-muted/50 border-border/50 hover:border-primary/30", !date && "text-muted-foreground")}>
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
      <AnimatePresence>
        {projection && (
          <motion.div
            className="grid grid-cols-3 gap-3 pt-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Expected Capital</span>
              <p className="font-mono font-bold text-primary text-sm">${projection.expectedCapital.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              <p className="text-[10px] text-muted-foreground font-mono">KES {toKES(projection.expectedCapital).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Expected Profit</span>
              <p className={`font-mono font-bold text-sm ${projection.expectedProfit >= 0 ? "text-profit" : "text-loss"}`}>
                {projection.expectedProfit >= 0 ? "+" : ""}${projection.expectedProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono">KES {toKES(projection.expectedProfit).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Growth</span>
              <p className={`font-mono font-bold text-sm ${projection.growthPercent >= 0 ? "text-profit" : "text-loss"}`}>
                {projection.growthPercent >= 0 ? "+" : ""}{projection.growthPercent.toFixed(2)}%
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

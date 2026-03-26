import { format } from "date-fns";
import { DollarSign, Percent, User, CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Props {
  startingCapital: number;
  setStartingCapital: (v: number) => void;
  dailyTargetPercent: number;
  setDailyTargetPercent: (v: number) => void;
  accountabilityPartner: string;
  setAccountabilityPartner: (v: string) => void;
  tradingStartDate: string;
  setTradingStartDate: (d: string) => void;
  tradingEndDate: string;
  setTradingEndDate: (d: string) => void;
  readOnly?: boolean;
  onEdit?: (field: string, oldValue: string, newValue: string) => void;
}

export default function InputsPanel({
  startingCapital, setStartingCapital,
  dailyTargetPercent, setDailyTargetPercent,
  accountabilityPartner, setAccountabilityPartner,
  tradingStartDate, setTradingStartDate,
  tradingEndDate, setTradingEndDate,
  readOnly = false, onEdit,
}: Props) {
  const startDate = new Date(tradingStartDate);
  const endDate = new Date(tradingEndDate);

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-card p-4">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <DollarSign className="h-3 w-3" /> Starting Capital
        </label>
        <Input
          type="number" min={0} step={100}
          value={startingCapital}
          onChange={(e) => {
            if (readOnly) return;
            const v = Number(e.target.value);
            onEdit?.("Starting Capital", String(startingCapital), String(v));
            setStartingCapital(v);
          }}
          disabled={readOnly}
          className="w-40 font-mono bg-secondary border-border disabled:opacity-40"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Percent className="h-3 w-3" /> Daily Target %
        </label>
        <Input
          type="number" min={0} max={100} step={0.01}
          value={dailyTargetPercent}
          onChange={(e) => {
            if (readOnly) return;
            const v = Number(e.target.value);
            onEdit?.("Daily Target %", String(dailyTargetPercent), String(v));
            setDailyTargetPercent(v);
          }}
          disabled={readOnly}
          className="w-32 font-mono bg-secondary border-border disabled:opacity-40"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <CalendarIcon className="h-3 w-3" /> Start Date
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" disabled={readOnly}
              className={cn("w-44 justify-start text-left font-mono text-xs bg-secondary border-border disabled:opacity-40")}>
              <CalendarIcon className="mr-2 h-3 w-3" />
              {format(startDate, "dd MMM yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={startDate}
              onSelect={(d) => {
                if (readOnly || !d) return;
                const newVal = d.toISOString().split("T")[0];
                onEdit?.("Start Date", tradingStartDate, newVal);
                setTradingStartDate(newVal);
              }}
              className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <CalendarIcon className="h-3 w-3" /> End Date
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" disabled={readOnly}
              className={cn("w-44 justify-start text-left font-mono text-xs bg-secondary border-border disabled:opacity-40")}>
              <CalendarIcon className="mr-2 h-3 w-3" />
              {format(endDate, "dd MMM yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={endDate}
              onSelect={(d) => {
                if (readOnly || !d) return;
                const newVal = d.toISOString().split("T")[0];
                onEdit?.("End Date", tradingEndDate, newVal);
                setTradingEndDate(newVal);
              }}
              className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <User className="h-3 w-3" /> Accountability Partner
        </label>
        <Input
          type="text" placeholder="Partner name"
          value={accountabilityPartner}
          onChange={(e) => {
            if (readOnly) return;
            onEdit?.("Accountability Partner", accountabilityPartner, e.target.value);
            setAccountabilityPartner(e.target.value);
          }}
          disabled={readOnly}
          className="w-44 bg-secondary border-border disabled:opacity-40"
        />
      </div>
    </div>
  );
}

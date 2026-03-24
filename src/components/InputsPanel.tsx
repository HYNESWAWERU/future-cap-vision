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
  year: number;
  resetYear: (y: number) => void;
  tradingStartDate: string | null;
  setTradingStartDate: (d: string | null) => void;
  readOnly?: boolean;
  onEdit?: (field: string, oldValue: string, newValue: string) => void;
}

export default function InputsPanel({
  startingCapital, setStartingCapital,
  dailyTargetPercent, setDailyTargetPercent,
  accountabilityPartner, setAccountabilityPartner,
  year, resetYear, tradingStartDate, setTradingStartDate,
  readOnly = false, onEdit,
}: Props) {
  const startDate = tradingStartDate ? new Date(tradingStartDate) : undefined;

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
        <label className="text-xs text-muted-foreground uppercase tracking-wider">Year</label>
        <Input
          type="number" min={2020} max={2030}
          value={year}
          onChange={(e) => {
            if (readOnly) return;
            const v = Number(e.target.value);
            onEdit?.("Year", String(year), String(v));
            resetYear(v);
          }}
          disabled={readOnly}
          className="w-28 font-mono bg-secondary border-border disabled:opacity-40"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <CalendarIcon className="h-3 w-3" /> Trading Start Date
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={readOnly}
              className={cn(
                "w-44 justify-start text-left font-mono text-xs bg-secondary border-border disabled:opacity-40",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-3 w-3" />
              {startDate ? format(startDate, "dd MMM yyyy") : "Jan 1st (default)"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(d) => {
                if (readOnly) return;
                const newVal = d ? d.toISOString() : null;
                onEdit?.("Trading Start Date", tradingStartDate ?? "", newVal ?? "");
                setTradingStartDate(newVal);
              }}
              defaultMonth={new Date(year, 0)}
              fromDate={new Date(year, 0, 1)}
              toDate={new Date(year, 11, 31)}
              className={cn("p-3 pointer-events-auto")}
            />
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

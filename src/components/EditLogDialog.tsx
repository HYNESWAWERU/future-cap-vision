import { format } from "date-fns";
import { History } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { EditLogEntry } from "@/hooks/useAccessControl";

interface Props {
  open: boolean;
  onClose: () => void;
  entries: EditLogEntry[];
}

export default function EditLogDialog({ open, onClose, entries }: Props) {
  const sorted = [...entries].reverse();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <DialogTitle>Edit History Log</DialogTitle>
          </div>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No edits recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {sorted.map((e, i) => (
                <div key={i} className="rounded-md border border-border bg-secondary/50 p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{e.field}</span>
                    <span className="text-muted-foreground font-mono">
                      {format(new Date(e.timestamp), "dd MMM yyyy HH:mm:ss")}
                    </span>
                  </div>
                  {e.dayIndex !== undefined && (
                    <p className="text-muted-foreground">Day #{e.dayIndex + 1}</p>
                  )}
                  <div className="flex gap-3">
                    <span className="text-loss">{e.oldValue || "—"}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-profit">{e.newValue || "—"}</span>
                  </div>
                  <p className="text-muted-foreground italic">By: Accountability Partner</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

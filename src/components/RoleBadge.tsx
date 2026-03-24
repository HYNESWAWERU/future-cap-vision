import { Eye, Edit, Lock, History, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/hooks/useAccessControl";

interface Props {
  role: UserRole;
  onRequestUnlock: () => void;
  onLock: () => void;
  onShowLog: () => void;
  onReset: () => void;
}

export default function RoleBadge({ role, onRequestUnlock, onLock, onShowLog, onReset }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {role === "trader" ? (
        <>
          <Badge variant="secondary" className="gap-1 text-xs font-mono">
            <Eye className="h-3 w-3" /> Trader · Read-Only
          </Badge>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onRequestUnlock}>
            <Lock className="h-3 w-3" /> Switch to Partner
          </Button>
        </>
      ) : (
        <>
          <Badge className="gap-1 text-xs font-mono bg-primary text-primary-foreground">
            <Edit className="h-3 w-3" /> Partner · Edit Mode
          </Badge>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onLock}>
            <Lock className="h-3 w-3" /> Lock
          </Button>
        </>
      )}
      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onShowLog}>
        <History className="h-3 w-3" /> Log
      </Button>
      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive" onClick={onReset}>
        <RotateCcw className="h-3 w-3" /> Reset
      </Button>
    </div>
  );
}

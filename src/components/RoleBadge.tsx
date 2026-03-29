import { motion } from "framer-motion";
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
    <motion.div
      className="flex items-center gap-2 flex-wrap"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      {role === "trader" ? (
        <>
          <Badge variant="secondary" className="gap-1.5 text-xs font-mono px-3 py-1 border-border/50">
            <Eye className="h-3 w-3" /> Trader · Read-Only
          </Badge>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 border-border/50 hover:border-primary/30 hover:text-primary transition-colors" onClick={onRequestUnlock}>
            <Lock className="h-3 w-3" /> Switch to Partner
          </Button>
        </>
      ) : (
        <>
          <Badge className="gap-1.5 text-xs font-mono px-3 py-1 bg-primary text-primary-foreground animate-pulse-ring">
            <Edit className="h-3 w-3" /> Partner · Edit Mode
          </Badge>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 border-border/50 hover:border-primary/30 hover:text-primary transition-colors" onClick={onLock}>
            <Lock className="h-3 w-3" /> Lock
          </Button>
        </>
      )}
      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 hover:text-primary" onClick={onShowLog}>
        <History className="h-3 w-3" /> Log
      </Button>
      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onReset}>
        <RotateCcw className="h-3 w-3" /> Reset
      </Button>
    </motion.div>
  );
}

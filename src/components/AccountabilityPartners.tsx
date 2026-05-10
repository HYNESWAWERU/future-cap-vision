import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Trash2, Check, Copy, Mail, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAccountabilityPartners, PARTNER_LABELS, type Partner } from "@/hooks/useAccountabilityPartners";

interface Props {
  sessionId: string | null;
  readOnly?: boolean;
}

export default function AccountabilityPartners({ sessionId, readOnly }: Props) {
  const { partners, addPartner, removePartner, updatePartner } = useAccountabilityPartners(sessionId);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [label, setLabel] = useState<string>(PARTNER_LABELS[1]);
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    setBusy(true);
    const { error } = await addPartner({ name, email, label });
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Partner added — share their verification link to activate.");
    setName(""); setEmail(""); setAdding(false);
  };

  const copyVerifyLink = (p: Partner) => {
    const url = `${window.location.origin}/#/verify-partner/${p.verification_token}`;
    navigator.clipboard.writeText(url);
    toast.success(`Verification link copied for ${p.email}`);
  };

  return (
    <div className="glass-card-hover rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center border border-primary/30">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide">Accountability Partners</h3>
            <p className="text-[11px] text-muted-foreground">
              Up to 2 trusted contacts get notified at +4% / -4% days
            </p>
          </div>
        </div>
        {!readOnly && partners.length < 2 && !adding && (
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        )}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-sm" />
                <Input placeholder="email@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <Select value={label} onValueChange={setLabel}>
                  <SelectTrigger className="h-9 text-sm flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PARTNER_LABELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleAdd} disabled={busy || !email}>Add Partner</Button>
                <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setEmail(""); setName(""); }}>Cancel</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {partners.length === 0 && !adding && (
        <div className="rounded-xl border border-dashed border-border/50 p-6 text-center">
          <Mail className="h-6 w-6 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-xs text-muted-foreground">No partners yet. Add up to 2 to enable alerts.</p>
        </div>
      )}

      <div className="space-y-2">
        {partners.map((p) => (
          <motion.div
            key={p.id}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border/50 bg-card/40 p-3 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold truncate">{p.name || p.email.split("@")[0]}</span>
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5">{p.label}</Badge>
                  {p.verified ? (
                    <Badge className="text-[10px] h-5 px-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 gap-1">
                      <ShieldCheck className="h-2.5 w-2.5" /> Verified
                    </Badge>
                  ) : (
                    <Badge className="text-[10px] h-5 px-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 gap-1">
                      <AlertCircle className="h-2.5 w-2.5" /> Pending
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground font-mono truncate">{p.email}</p>
              </div>
              {!readOnly && (
                <div className="flex items-center gap-1">
                  {!p.verified && (
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => copyVerifyLink(p)} title="Copy verification link">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => removePartner(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {p.verified && !readOnly && (
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-1 border-t border-border/30">
                <Toggle label="+4% Profit" checked={p.notify_profit} onChange={(v) => updatePartner(p.id, { notify_profit: v })} />
                <Toggle label="-4% Loss" checked={p.notify_loss} onChange={(v) => updatePartner(p.id, { notify_loss: v })} />
                <Toggle label="Weekly summary" checked={p.notify_weekly} onChange={(v) => updatePartner(p.id, { notify_weekly: v })} />
                <Toggle label="Milestones" checked={p.notify_milestones} onChange={(v) => updatePartner(p.id, { notify_milestones: v })} />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground/70 leading-relaxed pt-1 border-t border-border/30">
        <Check className="h-3 w-3 inline mr-1 text-primary" />
        Email sending activates once a sender domain is configured. Verification links can be shared manually for now.
      </p>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 text-[11px] cursor-pointer">
      <span className="text-muted-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} className="scale-75" />
    </label>
  );
}

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => Promise<boolean>;
}

export default function ResetTradesDialog({ open, onClose, onConfirm }: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const ok = await onConfirm(pin);
    setLoading(false);
    if (!ok) {
      setError("Incorrect PIN. Reset denied.");
      setPin("");
    } else {
      setPin("");
      setError("");
    }
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setPin("");
      setError("");
      onClose();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertDialogTitle>Reset All Trades</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            This will permanently clear all actual results and verification checkboxes for the current year. This action cannot be undone. Enter PIN to confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <InputOTP maxLength={4} value={pin} onChange={setPin}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
            </InputOTPGroup>
          </InputOTP>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleSubmit} disabled={pin.length !== 4 || loading}>
            {loading ? "Verifying…" : "Reset All Trades"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

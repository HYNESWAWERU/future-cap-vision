import { useState } from "react";
import { Shield, Lock, Unlock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface PinSetupProps {
  open: boolean;
  onSetPin: (pin: string) => void;
}

export function PinSetupDialog({ open, onSetPin }: PinSetupProps) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [error, setError] = useState("");

  const handleContinue = () => {
    if (pin.length !== 4) return;
    setStep("confirm");
    setError("");
  };

  const handleConfirm = () => {
    if (confirm !== pin) {
      setError("PINs do not match. Try again.");
      setConfirm("");
      return;
    }
    onSetPin(pin);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <DialogTitle>Set Accountability PIN</DialogTitle>
          </div>
          <DialogDescription>
            Create a 4-digit PIN for Accountability Partner access. This PIN controls all edit permissions.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          {step === "enter" ? (
            <>
              <p className="text-sm text-muted-foreground">Enter a 4-digit PIN</p>
              <InputOTP maxLength={4} value={pin} onChange={setPin}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
              <Button onClick={handleContinue} disabled={pin.length !== 4} className="w-full">
                Continue
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Confirm your PIN</p>
              <InputOTP maxLength={4} value={confirm} onChange={setConfirm}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button onClick={handleConfirm} disabled={confirm.length !== 4} className="w-full">
                <Lock className="h-4 w-4 mr-2" /> Set PIN
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PinEntryProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => boolean;
}

export function PinEntryDialog({ open, onClose, onSubmit }: PinEntryProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const ok = onSubmit(pin);
    if (!ok) {
      setError("Incorrect PIN. Access denied.");
      setPin("");
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Unlock className="h-5 w-5 text-primary" />
            <DialogTitle>Enter PIN</DialogTitle>
          </div>
          <DialogDescription>
            Enter your 4-digit PIN to switch to Accountability Partner mode.
          </DialogDescription>
        </DialogHeader>
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
          <Button onClick={handleSubmit} disabled={pin.length !== 4} className="w-full">
            <Unlock className="h-4 w-4 mr-2" /> Unlock
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useCallback, useEffect, useRef } from "react";

export type UserRole = "trader" | "partner";

export interface EditLogEntry {
  timestamp: number;
  field: string;
  dayIndex?: number;
  oldValue: string;
  newValue: string;
}

const PIN_STORAGE_KEY = "trading-pin";
const LOG_STORAGE_KEY = "trading-edit-log";
const INACTIVITY_TIMEOUT = 60_000; // 60 seconds

function loadPin(): string | null {
  try {
    return localStorage.getItem(PIN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function loadLog(): EditLogEntry[] {
  try {
    const raw = localStorage.getItem(LOG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useAccessControl() {
  const [storedPin, setStoredPinState] = useState<string | null>(loadPin);
  const [activeRole, setActiveRole] = useState<UserRole>("trader");
  const [editLog, setEditLog] = useState<EditLogEntry[]>(loadLog);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPinSet = storedPin !== null;
  const isEditable = activeRole === "partner";

  // Persist edit log
  useEffect(() => {
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(editLog.slice(-200)));
  }, [editLog]);

  const setPin = useCallback((pin: string) => {
    localStorage.setItem(PIN_STORAGE_KEY, pin);
    setStoredPinState(pin);
  }, []);

  const verifyPin = useCallback(
    (pin: string): boolean => {
      return pin === storedPin;
    },
    [storedPin]
  );

  const resetInactivityTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setActiveRole("trader");
    }, INACTIVITY_TIMEOUT);
  }, []);

  const unlockPartner = useCallback(
    (pin: string): boolean => {
      if (verifyPin(pin)) {
        setActiveRole("partner");
        resetInactivityTimer();
        return true;
      }
      return false;
    },
    [verifyPin, resetInactivityTimer]
  );

  const lockToTrader = useCallback(() => {
    setActiveRole("trader");
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const logEdit = useCallback(
    (field: string, oldValue: string, newValue: string, dayIndex?: number) => {
      if (activeRole !== "partner") return;
      resetInactivityTimer();
      setEditLog((prev) => [
        ...prev,
        { timestamp: Date.now(), field, dayIndex, oldValue, newValue },
      ]);
    },
    [activeRole, resetInactivityTimer]
  );

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    activeRole,
    isPinSet,
    isEditable,
    setPin,
    verifyPin,
    unlockPartner,
    lockToTrader,
    editLog,
    logEdit,
    resetInactivityTimer,
  };
}

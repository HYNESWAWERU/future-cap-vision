import { useState, useCallback, useEffect, useRef } from "react";

export type UserRole = "trader" | "partner";

export interface EditLogEntry {
  timestamp: number;
  field: string;
  dayIndex?: number;
  oldValue: string;
  newValue: string;
}

const PIN_STORAGE_KEY = "trading-pin-hash";
const LOG_STORAGE_KEY = "trading-edit-log";
const INACTIVITY_TIMEOUT = 60_000;

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + "trading-salt-2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function loadPinHash(): string | null {
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
  const [storedHash, setStoredHash] = useState<string | null>(loadPinHash);
  const [activeRole, setActiveRole] = useState<UserRole>("trader");
  const [editLog, setEditLog] = useState<EditLogEntry[]>(loadLog);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPinSet = storedHash !== null;
  const isEditable = activeRole === "partner";

  useEffect(() => {
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(editLog.slice(-200)));
  }, [editLog]);

  const setPin = useCallback(async (pin: string) => {
    const hash = await hashPin(pin);
    localStorage.setItem(PIN_STORAGE_KEY, hash);
    setStoredHash(hash);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setActiveRole("trader");
    }, INACTIVITY_TIMEOUT);
  }, []);

  const unlockPartner = useCallback(
    async (pin: string): Promise<boolean> => {
      const hash = await hashPin(pin);
      if (hash === storedHash) {
        setActiveRole("partner");
        resetInactivityTimer();
        return true;
      }
      return false;
    },
    [storedHash, resetInactivityTimer]
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
    unlockPartner,
    lockToTrader,
    editLog,
    logEdit,
    resetInactivityTimer,
  };
}

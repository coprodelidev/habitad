// hooks/useCountdown.ts
"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hook de countdown. Devuelve:
 * - label: "Hh mm:ss" o "00h 00:00" si expiró
 * - expired: boolean si ya venció
 * - ms: milisegundos restantes
 *
 * Uso: const { label, expired } = useCountdown(reserva?.expires_at);
 */
export function useCountdown(expiresAt?: string | null, tickMs = 1000) {
  const [ms, setMs] = useState<number>(() =>
    Math.max(0, (expiresAt ? new Date(expiresAt).getTime() : 0) - Date.now())
  );
  const expiresRef = useRef(expiresAt ?? null);

  useEffect(() => {
    expiresRef.current = expiresAt ?? null;
    setMs(Math.max(0, (expiresAt ? new Date(expiresAt).getTime() : 0) - Date.now()));
  }, [expiresAt]);

  useEffect(() => {
    if (!expiresRef.current) return;
    const id = setInterval(() => {
      const left = Math.max(0, new Date(expiresRef.current as string).getTime() - Date.now());
      setMs(left);
    }, tickMs);
    return () => clearInterval(id);
  }, [tickMs]);

  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  const label = `${String(h)}h ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return { ms, label, expired: ms <= 0 };
}

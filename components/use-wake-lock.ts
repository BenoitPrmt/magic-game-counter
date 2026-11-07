"use client";
import { useEffect, useState } from "react";
export function useWakeLock(enabled: boolean) {
  const [status, setStatus] = useState<"pending" | "active" | "unavailable">(
    "pending",
  );
  useEffect(() => {
    let disposed = false;
    let lock: WakeLockSentinel | null = null;
    async function acquire() {
      if (!enabled || document.visibilityState !== "visible") return;
      if (!("wakeLock" in navigator)) {
        setStatus("unavailable");
        return;
      }
      try {
        const acquired = await navigator.wakeLock.request("screen");
        if (disposed) {
          await acquired.release();
          return;
        }
        lock = acquired;
        setStatus("active");
        acquired.addEventListener("release", () => {
          if (!disposed) setStatus("unavailable");
        });
      } catch {
        if (!disposed) setStatus("unavailable");
      }
    }
    const visibility = () => {
      if (document.visibilityState === "visible" && (!lock || lock.released))
        void acquire();
    };
    void acquire();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", visibility);
      void lock?.release();
    };
  }, [enabled]);
  return status;
}

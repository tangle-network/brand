"use client";
import { useCallback, useRef, useSyncExternalStore } from "react";

type Subscriber = { period: number; next: number; notify: () => void };
const subscribers = new Set<Subscriber>();
let now = Date.now(), timer: ReturnType<typeof setTimeout> | undefined;
function schedule() {
  clearTimeout(timer);
  if (!subscribers.size) return;
  timer = setTimeout(() => {
    now = Date.now();
    for (const subscriber of subscribers) if (now >= subscriber.next) {
      subscriber.next = now + subscriber.period;
      subscriber.notify();
    }
    schedule();
  }, Math.max(0, Math.min(...[...subscribers].map(subscriber => subscriber.next)) - Date.now()));
}
function useClock(period: number, fixed: number | undefined, server: number) {
  const subscribe = useCallback((notify: () => void) => {
    if (fixed !== undefined) return () => {};
    if (!subscribers.size) now = Date.now();
    const subscriber = { period, next: Math.floor(now / period + 1) * period, notify };
    subscribers.add(subscriber); schedule();
    return () => { subscribers.delete(subscriber); schedule(); };
  }, [period, fixed]);
  return useSyncExternalStore(subscribe, () => fixed ?? now, () => fixed ?? server);
}
/** One run clock; retained playback observes only its supplied timestamp. */
export const useRunNow = (fixed?: number): number => useClock(1000, fixed, 0);
/** Existing cadence API shares the same clock and scheduler, including its 100ms floor. */
export function useLiveTime(intervalMs = 1000): number {
  const initial = useRef(Date.now()).current;
  return useClock(Number.isFinite(intervalMs) && intervalMs > 0 ? Math.max(intervalMs, 100) : 1000, undefined, initial);
}

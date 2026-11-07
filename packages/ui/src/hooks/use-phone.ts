"use client";
import { useSyncExternalStore } from "react";

/** Below the tablet breakpoint a workspace shows one region at a time and an agent opens as a full-screen sheet. */
export const PHONE_MEDIA = "(max-width: 767px)";

/** Whether the page is phone-width. The server renders the desktop shape; the client corrects it on hydration. */
export function usePhone(media: string = PHONE_MEDIA): boolean {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia(media);
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => window.matchMedia(media).matches,
    () => false,
  );
}

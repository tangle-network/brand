import { useEffect, useState } from "react";
import { cn } from "../lib/utils";

export interface ThinkingIndicatorProps {
  className?: string;
}

export function ThinkingIndicator({ className }: ThinkingIndicatorProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => setElapsed((current) => current + 1), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div
      role="status"
      aria-label="Agent is thinking"
      className={cn("flex items-center gap-2 px-3 py-1.5", className)}
    >
      <div className="flex gap-1">
        {[0, 200, 400].map((delay) => <span key={delay} className="h-[var(--indicator-dot-size)] w-[var(--indicator-dot-size)] animate-[tangle-breathe_var(--motion-ambient)_infinite] rounded-full bg-[var(--brand-glow)] motion-reduce:animate-none" style={{ animationDelay: `${delay}ms` }} />)}
      </div>
      {elapsed > 3 && (
        <span className="text-[length:var(--font-size-xs)] tabular-nums text-muted-foreground">
          {elapsed}s
        </span>
      )}
    </div>
  );
}

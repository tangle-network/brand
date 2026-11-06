import { useLiveTime } from "../hooks/use-live-time";
import { formatDuration } from "../utils/format";

export function LiveDuration({ startTime }: { startTime: number }) {
  const elapsed = useLiveTime(100) - startTime;

  return (
    <span className="text-xs font-mono text-muted-foreground tabular-nums">
      {formatDuration(elapsed)}
    </span>
  );
}

import React from "react";
import { cn } from "@/lib/utils";

interface StatusPillProps {
  status: string;
  className?: string;
  showDot?: boolean;
}

export function StatusPill({
  status,
  className,
  showDot = true,
}: StatusPillProps) {
  const normalized = (status || "").toLowerCase();

  let label = status;
  let symbol = "●";

  if (normalized === "completed") {
    label = "Completed";
    symbol = "✓";
  } else if (normalized === "running" || normalized === "active") {
    label = normalized === "active" ? "Active" : "Running";
    symbol = "●";
  } else if (normalized === "failed" || normalized === "error") {
    label = "Failed";
    symbol = "×";
  } else if (normalized === "waiting" || normalized === "queued") {
    label = "Waiting";
    symbol = "○";
  } else if (normalized === "cancelled") {
    label = "Cancelled";
    symbol = "—";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium border select-none",
        normalized === "completed"
          ? "bg-neutral-100 text-neutral-900 border-neutral-300"
          : normalized === "running" || normalized === "active"
          ? "bg-neutral-900 text-white border-neutral-900"
          : normalized === "failed"
          ? "bg-neutral-200 text-neutral-900 border-neutral-400"
          : "bg-neutral-50 text-neutral-500 border-neutral-200",
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            "text-[9px] font-bold leading-none",
            (normalized === "running" || normalized === "active") && "animate-pulse"
          )}
        >
          {symbol}
        </span>
      )}
      <span className="capitalize">{label}</span>
    </span>
  );
}

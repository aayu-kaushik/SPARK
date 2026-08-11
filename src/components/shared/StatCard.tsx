import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type StatTone = "primary" | "success" | "warning" | "highrisk" | "critical";

const toneMap: Record<StatTone, { icon: string; accent: string }> = {
  primary: { icon: "bg-primary-soft text-primary", accent: "from-primary/70" },
  success: { icon: "bg-success-soft text-success", accent: "from-success/70" },
  warning: { icon: "bg-warning-soft text-warning-foreground", accent: "from-warning/70" },
  highrisk: { icon: "bg-highrisk-soft text-highrisk", accent: "from-highrisk/70" },
  critical: { icon: "bg-critical-soft text-critical", accent: "from-critical/70" },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  change,
  changeLabel,
  tone = "primary",
  invertChange = false,
  className,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  tone?: StatTone;
  /** For metrics where a decrease is good (e.g. at-risk students). */
  invertChange?: boolean;
  className?: string;
}) {
  const up = (change ?? 0) >= 0;
  const good = invertChange ? !up : up;

  return (
    <div className={cn("surface surface-hover relative overflow-hidden p-5", className)}>
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r to-transparent",
          toneMap[tone].accent,
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums text-foreground">{value}</p>
        </div>
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", toneMap[tone].icon)}>
          <Icon className="size-5" />
        </span>
      </div>
      {change !== undefined && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold",
              good ? "bg-success-soft text-success" : "bg-critical-soft text-critical",
            )}
          >
            {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(change)}%
          </span>
          <span className="text-muted-foreground">{changeLabel ?? "from last month"}</span>
        </div>
      )}
    </div>
  );
}

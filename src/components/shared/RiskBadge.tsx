import type { RiskLevel } from "@/data/mockData";
import { riskStyles } from "@/lib/risk";
import { cn } from "@/lib/utils";

export function RiskBadge({
  level,
  className,
  size = "md",
}: {
  level: RiskLevel;
  className?: string;
  size?: "sm" | "md";
}) {
  const style = riskStyles[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-wide",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
        style.badge,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", style.bar)} />
      {level} Risk
    </span>
  );
}

export function RiskBar({ score, className }: { score: number; className?: string }) {
  const level: RiskLevel = score >= 85 ? "Critical" : score >= 70 ? "High" : score >= 45 ? "Medium" : "Low";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-700", riskStyles[level].bar)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn("text-xs font-semibold tabular-nums", riskStyles[level].text)}>{score}%</span>
    </div>
  );
}

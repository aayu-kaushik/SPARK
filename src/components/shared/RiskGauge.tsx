import type { RiskLevel } from "@/data/mockData";
import { riskStyles } from "@/lib/risk";
import { cn } from "@/lib/utils";

export function RiskGauge({
  score,
  level,
  size = 180,
  label = "Dropout Risk",
  className,
}: {
  score: number;
  level: RiskLevel;
  size?: number;
  label?: string;
  className?: string;
}) {
  const stroke = size >= 160 ? 14 : 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = riskStyles[level].ring;

  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p
            className="font-display font-bold tabular-nums"
            style={{ fontSize: size >= 160 ? 38 : 26, color }}
          >
            {score}%
          </p>
          <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

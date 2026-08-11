import type { RiskLevel } from "@/data/mockData";

export const riskStyles: Record<
  RiskLevel,
  { badge: string; text: string; bar: string; ring: string; chart: string }
> = {
  Low: {
    badge: "bg-success-soft text-success border-success/25",
    text: "text-success",
    bar: "bg-success",
    ring: "var(--success)",
    chart: "var(--success)",
  },
  Medium: {
    badge: "bg-warning-soft text-warning-foreground border-warning/35",
    text: "text-warning-foreground",
    bar: "bg-warning",
    ring: "var(--warning)",
    chart: "var(--warning)",
  },
  High: {
    badge: "bg-highrisk-soft text-highrisk border-highrisk/25",
    text: "text-highrisk",
    bar: "bg-highrisk",
    ring: "var(--highrisk)",
    chart: "var(--highrisk)",
  },
  Critical: {
    badge: "bg-critical-soft text-critical border-critical/25",
    text: "text-critical",
    bar: "bg-critical",
    ring: "var(--critical)",
    chart: "var(--critical)",
  },
};

export function levelFromScore(score: number): RiskLevel {
  if (score >= 85) return "Critical";
  if (score >= 70) return "High";
  if (score >= 45) return "Medium";
  return "Low";
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { RiskDonut, RiskTrendChart, SimpleBarChart } from "@/charts/Charts";
import { AIInsight, PageHeader, SectionCard } from "@/components/shared/Layout";
import { Progress } from "@/components/ui/progress";
import {
  departmentAnalytics,
  departmentHeatmap,
  riskDistribution,
  riskTrend,
  type TrendRange,
} from "@/data/mockData";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Risk Analytics — SPARK" },
      {
        name: "description",
        content:
          "Department-level dropout risk analytics: comparative risk rates, attendance, CGPA and a risk-factor heatmap across faculties.",
      },
      { property: "og:title", content: "Risk Analytics — SPARK" },
      { property: "og:description", content: "Compare dropout risk, attendance and CGPA across every department." },
    ],
  }),
  component: AdminAnalytics,
});

const RANGES: TrendRange[] = ["Weekly", "Monthly", "Semester"];
const HEAT_KEYS = ["attendance", "academics", "assignments", "engagement", "finance"] as const;
const HEAT_LABELS: Record<(typeof HEAT_KEYS)[number], string> = {
  attendance: "Attendance",
  academics: "Academics",
  assignments: "Assignments",
  engagement: "Engagement",
  finance: "Finance",
};

function heatTone(value: number) {
  if (value >= 30) return "bg-critical/85 text-critical-foreground";
  if (value >= 22) return "bg-highrisk/80 text-highrisk-foreground";
  if (value >= 14) return "bg-warning/75 text-warning-foreground";
  return "bg-success/70 text-success-foreground";
}

function AdminAnalytics() {
  const [range, setRange] = useState<TrendRange>("Semester");

  return (
    <>
      <PageHeader
        title="Risk Analytics"
        subtitle="Compare dropout risk drivers across departments to target interventions where they matter most."
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
        <SectionCard title="Institutional Risk Split" description="Share of students in each predicted risk band">
          <RiskDonut data={riskDistribution} height={300} />
        </SectionCard>
        <SectionCard
          title="Risk Trend"
          description="Movement of each risk band over the selected period"
          actions={
            <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                    range === r ? "bg-card text-primary shadow-card" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          }
        >
          <RiskTrendChart data={riskTrend[range]} height={300} />
        </SectionCard>
      </div>

      <SectionCard title="Department Comparison" description="Dropout risk rate vs average attendance by department">
        <SimpleBarChart
          data={departmentAnalytics}
          xKey="short"
          bars={[
            { key: "risk", name: "Dropout risk %", color: "var(--highrisk)" },
            { key: "attendance", name: "Avg attendance %", color: "var(--primary)" },
          ]}
          height={300}
        />
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <SectionCard title="Department Breakdown" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Department</th>
                  <th className="px-4 py-3 font-semibold">Students</th>
                  <th className="px-4 py-3 font-semibold">At risk</th>
                  <th className="px-4 py-3 font-semibold">Risk rate</th>
                  <th className="px-4 py-3 font-semibold">Avg CGPA</th>
                  <th className="px-5 py-3 font-semibold">Interventions</th>
                </tr>
              </thead>
              <tbody>
                {departmentAnalytics.map((d) => (
                  <tr key={d.department} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3 font-medium">{d.department}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{d.students}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{d.atRisk}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={d.risk * 6} className="h-1.5 w-16" />
                        <span className="tabular-nums font-semibold">{d.risk}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{d.avgCgpa}</td>
                    <td className="px-5 py-3 tabular-nums text-muted-foreground">{d.interventions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Risk Factor Heatmap" description="Percentage of students affected by each factor">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-separate border-spacing-1 text-xs">
              <thead>
                <tr>
                  <th className="text-left font-semibold text-muted-foreground">Dept</th>
                  {HEAT_KEYS.map((k) => (
                    <th key={k} className="px-1 font-semibold text-muted-foreground">
                      {HEAT_LABELS[k]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {departmentHeatmap.map((row) => (
                  <tr key={row.department}>
                    <td className="pr-2 font-semibold">{row.department}</td>
                    {HEAT_KEYS.map((k) => (
                      <td key={k}>
                        <div
                          className={cn(
                            "grid h-9 place-items-center rounded-lg font-display font-bold tabular-nums",
                            heatTone(row[k]),
                          )}
                        >
                          {row[k]}%
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AIInsight className="mt-5">
            Mechanical and Electronics show the highest concentration of financial-stress and academic risk factors.
            Targeted scholarship outreach in these two departments could reduce institutional dropout risk by an
            estimated <strong className="text-foreground">2.4%</strong> next semester.
          </AIInsight>
        </SectionCard>
      </div>
    </>
  );
}

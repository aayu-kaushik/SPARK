import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BrainCircuit,
  CalendarCheck,
  GaugeCircle,
  LifeBuoy,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";

import { FactorBarChart, RiskDonut, RiskTrendChart, RISK_COLORS } from "@/charts/Charts";
import { AIInsight, PageHeader, SectionCard } from "@/components/shared/Layout";
import { StatCard } from "@/components/shared/StatCard";
import { StudentTable } from "@/components/shared/StudentTable";
import { Button } from "@/components/ui/button";
import {
  institutionStats,
  predictionFactors,
  riskDistribution,
  riskTrend,
  type TrendRange,
} from "@/data/mockData";
import { useAuth } from "@/lib/auth";
import { greeting } from "@/lib/risk";
import { fetchStudents } from "@/services/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — SPARK" },
      {
        name: "description",
        content:
          "Institution-wide dropout risk overview: AI risk distribution, prediction accuracy, risk trends and students requiring attention.",
      },
      { property: "og:title", content: "Admin Dashboard — SPARK" },
      { property: "og:description", content: "Institution-wide AI dropout risk analytics and intervention queue." },
    ],
  }),
  component: AdminDashboard,
});

const RANGES: TrendRange[] = ["Weekly", "Monthly", "Semester"];

function AdminDashboard() {
  const { user } = useAuth();
  const [range, setRange] = useState<TrendRange>("Monthly");
  const { data: students = [], isLoading } = useQuery({ queryKey: ["students"], queryFn: fetchStudents });

  const attention = [...students].sort((a, b) => b.riskScore - a.riskScore);

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${user?.name.split(" ").slice(-1)[0] ?? "Admin"}`}
        subtitle="Here's an overview of student success and dropout risk across the institution."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/admin/reports">Generate report</Link>
            </Button>
            <Button asChild>
              <Link to="/admin/predictions">
                <Sparkles className="size-4" /> AI predictions
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Students" value={institutionStats.totalStudents.toLocaleString()} icon={Users} change={3.2} tone="primary" />
        <StatCard label="Students At Risk" value={institutionStats.atRisk} icon={ShieldAlert} change={-8.4} tone="highrisk" invertChange />
        <StatCard label="High Risk Students" value={institutionStats.highRisk} icon={GaugeCircle} change={-4.1} tone="critical" invertChange />
        <StatCard label="Average Attendance" value={`${institutionStats.avgAttendance}%`} icon={CalendarCheck} change={1.9} tone="success" />
        <StatCard label="Requiring Intervention" value={institutionStats.needIntervention} icon={LifeBuoy} change={6.3} tone="warning" invertChange />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_1fr]">
        <SectionCard
          title="AI Dropout Risk Overview"
          description="Live distribution of predicted dropout risk across all enrolled students"
        >
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_200px] sm:items-center">
            <RiskDonut data={riskDistribution} />
            <ul className="space-y-2.5">
              {riskDistribution.map((slice, i) => (
                <li key={slice.name} className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: RISK_COLORS[i] }} />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground">{slice.name}</span>
                  <span className="shrink-0 font-display text-sm font-bold tabular-nums">
                    {slice.value.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              ["AI Prediction Accuracy", `${institutionStats.predictionAccuracy}%`],
              ["Predictions Generated", institutionStats.predictionsGenerated.toLocaleString()],
              ["Model Confidence", `${institutionStats.modelConfidence}%`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-border bg-muted/40 p-3.5">
                <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <BrainCircuit className="size-3.5 text-primary" /> {label}
                </p>
                <p className="mt-1.5 font-display text-xl font-bold tabular-nums text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Student Dropout Risk Trend"
          description="Number of students in each risk band over time"
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
          <RiskTrendChart data={riskTrend[range]} height={330} />
        </SectionCard>
      </div>

      <SectionCard
        title="Top Factors Influencing Dropout Risk"
        description="Feature importance reported by the current prediction model"
      >
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <FactorBarChart data={predictionFactors} height={300} />
          <div className="space-y-4">
            <AIInsight>
              Attendance and academic performance are currently the strongest predictors of dropout risk. Students
              below 70% attendance are <strong className="text-foreground">4.6×</strong> more likely to be flagged as
              high risk within a semester.
            </AIInsight>
            <div className="grid grid-cols-2 gap-3">
              {predictionFactors.slice(0, 4).map((f) => (
                <div key={f.factor} className="rounded-xl border border-border p-3">
                  <p className="truncate text-xs text-muted-foreground">{f.factor}</p>
                  <p className="mt-1 font-display text-lg font-bold tabular-nums">{f.impact}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Students Requiring Attention"
        description="Ranked by AI dropout risk score"
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/students">
              View all <ArrowRight className="size-4" />
            </Link>
          </Button>
        }
      >
        <StudentTable data={attention} loading={isLoading} basePath="/admin/students" pageSize={6} />
      </SectionCard>
    </>
  );
}

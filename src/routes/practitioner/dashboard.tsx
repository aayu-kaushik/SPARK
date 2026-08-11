import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, LifeBuoy, ShieldAlert, Users } from "lucide-react";

import { RiskDonut, RiskTrendChart } from "@/charts/Charts";
import { AIInsight, PageHeader, SectionCard } from "@/components/shared/Layout";
import { StatCard } from "@/components/shared/StatCard";
import { StudentTable } from "@/components/shared/StudentTable";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { interventionQueue, riskDistribution, riskTrend } from "@/data/mockData";
import { useAuth } from "@/lib/auth";
import { greeting, levelFromScore } from "@/lib/risk";
import { fetchStudents } from "@/services/api";

export const Route = createFileRoute("/practitioner/dashboard")({
  head: () => ({
    meta: [
      { title: "Practitioner Dashboard — EduPredict AI" },
      {
        name: "description",
        content:
          "Mentor view of assigned students: at-risk caseload, AI intervention queue and cohort risk trends in one place.",
      },
      { property: "og:title", content: "Practitioner Dashboard — EduPredict AI" },
      { property: "og:description", content: "Mentor caseload, AI intervention queue and cohort risk trends." },
    ],
  }),
  component: PractitionerDashboard,
});

function PractitionerDashboard() {
  const { user } = useAuth();
  const { data: students = [], isLoading } = useQuery({ queryKey: ["students"], queryFn: fetchStudents });
  const cohort = students.slice(0, 14);
  const atRisk = cohort.filter((s) => s.riskScore >= 45);

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${user?.name ?? "Practitioner"} 👋`}
        subtitle="Your mentoring cohort, ranked by AI dropout risk."
        actions={
          <Button asChild>
            <Link to="/practitioner/at-risk">Review at-risk students</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Assigned students" value={cohort.length} icon={Users} tone="primary" />
        <StatCard label="At-risk students" value={atRisk.length} icon={ShieldAlert} tone="highrisk" />
        <StatCard
          label="Cohort attendance"
          value={`${Math.round(cohort.reduce((s, c) => s + c.attendance, 0) / (cohort.length || 1))}%`}
          icon={CalendarCheck}
          tone="success"
        />
        <StatCard label="Interventions this month" value={12} icon={LifeBuoy} tone="warning" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1.3fr]">
        <SectionCard title="Cohort Risk Split" description="Predicted risk bands across your students">
          <RiskDonut data={riskDistribution} height={280} />
          <AIInsight className="mt-4">
            {atRisk.length} students in your cohort need attention this week. Prioritise the critical cases — early
            mentor contact reduces dropout probability by up to 18%.
          </AIInsight>
        </SectionCard>
        <SectionCard title="Risk Trend" description="How your cohort has moved this semester">
          <RiskTrendChart data={riskTrend.Semester} height={330} />
        </SectionCard>
      </div>

      <SectionCard title="AI Intervention Queue" description="Recommended next actions, highest priority first">
        <ul className="divide-y divide-border">
          {interventionQueue.map((iv) => (
            <li key={iv.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 py-3.5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold">{iv.student}</p>
                  <RiskBadge level={levelFromScore(iv.risk)} />
                  <span className="text-xs text-muted-foreground">Risk {iv.risk}%</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{iv.recommendation}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Main factor: {iv.mainRisk} · Last interaction {iv.lastInteraction}
                </p>
              </div>
              <Button size="sm" variant="outline" asChild className="shrink-0">
                <Link to="/admin/students/$studentId" params={{ studentId: iv.studentId }}>
                  Open profile
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="My Students" description="Full mentoring cohort with live risk scores">
        <StudentTable data={cohort} loading={isLoading} basePath="/admin/students" pageSize={7} />
      </SectionCard>
    </>
  );
}

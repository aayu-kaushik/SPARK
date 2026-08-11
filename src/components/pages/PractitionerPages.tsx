import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Download, Mail, Phone, ShieldAlert, Users } from "lucide-react";
import { toast } from "sonner";

import { SimpleBarChart } from "@/charts/Charts";
import { AIInsight, PageHeader, SectionCard } from "@/components/shared/Layout";
import { PredictionSimulator } from "@/components/shared/PredictionSimulator";
import { StudentTable } from "@/components/shared/StudentTable";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { practitioners, reportTemplates } from "@/data/mockData";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/risk";
import { fetchStudents } from "@/services/api";

export type PractitionerPageKind = "table" | "atrisk" | "sim" | "perf" | "reports" | "profile";

export function PractitionerPage({
  kind,
  title,
  subtitle,
}: {
  kind: PractitionerPageKind;
  title: string;
  subtitle: string;
}) {
  const { user } = useAuth();
  const { data: students = [], isLoading } = useQuery({ queryKey: ["students"], queryFn: fetchStudents });
  const cohort = students.slice(0, 14);
  const atRisk = cohort.filter((s) => s.riskScore >= 45).sort((a, b) => b.riskScore - a.riskScore);
  const me = practitioners[0]!;

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />

      {(kind === "table" || kind === "atrisk") && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              ["Cohort size", cohort.length],
              ["At risk", atRisk.length],
              ["Below 75% attendance", cohort.filter((s) => s.attendance < 75).length],
              ["Failed subjects", cohort.filter((s) => s.failedSubjects > 0).length],
            ].map(([label, value]) => (
              <div key={label as string} className="surface p-4">
                <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                  {kind === "atrisk" ? <ShieldAlert className="size-3.5" /> : <Users className="size-3.5" />} {label}
                </p>
                <p className="mt-1.5 font-display text-2xl font-bold tabular-nums">{value}</p>
              </div>
            ))}
          </div>
          <SectionCard
            title={kind === "atrisk" ? "At-risk students" : "My students"}
            description="Sorted by AI dropout risk score"
          >
            <StudentTable
              data={kind === "atrisk" ? atRisk : cohort}
              loading={isLoading}
              basePath="/admin/students"
              pageSize={8}
            />
          </SectionCard>
        </>
      )}

      {kind === "sim" && <PredictionSimulator />}

      {kind === "perf" && (
        <>
          <SectionCard title="Cohort performance" description="Attendance vs assignment completion by student">
            <SimpleBarChart
              data={cohort.slice(0, 10).map((s) => ({
                name: s.name.split(" ")[0] ?? s.name,
                attendance: s.attendance,
                assignments: s.assignmentCompletion,
              }))}
              xKey="name"
              bars={[
                { key: "attendance", name: "Attendance %", color: "var(--primary)" },
                { key: "assignments", name: "Assignments %", color: "var(--success)" },
              ]}
              height={320}
            />
          </SectionCard>
          <SectionCard title="Weakest subjects across cohort" description="Average attendance per subject">
            <div className="space-y-3">
              {["Data Structures", "Mathematics III", "Computer Networks", "Operating Systems", "DBMS"].map((s, i) => {
                const value = 82 - i * 4;
                return (
                  <div key={s}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate text-muted-foreground">{s}</span>
                      <span className="font-semibold tabular-nums">{value}%</span>
                    </div>
                    <Progress value={value} className="mt-1.5 h-1.5" />
                  </div>
                );
              })}
            </div>
            <AIInsight className="mt-5">
              Mathematics III has the weakest attendance in your cohort. A remedial session before the next internal
              assessment is the highest-impact action available to you this week.
            </AIInsight>
          </SectionCard>
        </>
      )}

      {kind === "reports" && (
        <div className="grid gap-5 md:grid-cols-2">
          {reportTemplates.slice(0, 4).map((r) => (
            <SectionCard key={r.id} title={r.title} description={`Updated ${r.updated}`}>
              <p className="text-sm text-muted-foreground">{r.description}</p>
              <Button
                size="sm"
                className="mt-4"
                onClick={() => toast.success(`${r.title} exported`, { description: "PDF download starting." })}
              >
                <Download className="size-4" /> Export
              </Button>
            </SectionCard>
          ))}
        </div>
      )}

      {kind === "profile" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <SectionCard title="Practitioner details">
            <div className="flex items-center gap-4">
              <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary/12 font-display text-lg font-bold text-primary">
                {initials(user?.name ?? me.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-bold">{user?.name ?? me.name}</p>
                <p className="truncate text-sm text-muted-foreground">{me.designation} · {me.department}</p>
              </div>
            </div>
            <dl className="mt-5 space-y-2 text-sm">
              {[
                ["Faculty ID", me.id],
                ["Email", user?.email ?? me.email],
                ["Department", me.department],
                ["Status", me.status],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 border-b border-border/70 py-1.5">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="truncate font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/practitioner/messages">
                  <Mail className="size-4" /> Messages
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toast.success("Support request sent")}>
                <Phone className="size-4" /> Contact support
              </Button>
            </div>
          </SectionCard>
          <SectionCard title="Mentoring caseload" description="Your impact this academic year">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                ["Assigned", me.studentsAssigned],
                ["At risk", me.atRisk],
                ["Interventions", me.interventions],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-xl bg-muted/50 p-4">
                  <p className="font-display text-2xl font-bold tabular-nums">{value}</p>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
            <AIInsight className="mt-5">
              Students you contacted within 3 days of being flagged improved attendance by an average of{" "}
              <strong className="text-foreground">7.8%</strong> in the following month.
            </AIInsight>
          </SectionCard>
        </div>
      )}
    </>
  );
}

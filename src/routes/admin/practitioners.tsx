import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoy, Mail, Search, ShieldAlert, UserCheck, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader, SectionCard } from "@/components/shared/Layout";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { initials } from "@/lib/risk";
import { fetchPractitioners } from "@/services/api";

export const Route = createFileRoute("/admin/practitioners")({
  head: () => ({
    meta: [
      { title: "Practitioners — EduPredict AI" },
      {
        name: "description",
        content:
          "Manage mentors and faculty practitioners, their assigned students, at-risk caseload and logged interventions.",
      },
      { property: "og:title", content: "Practitioner Management — EduPredict AI" },
      { property: "og:description", content: "Mentor caseloads, at-risk counts and intervention activity." },
    ],
  }),
  component: AdminPractitioners,
});

function AdminPractitioners() {
  const { data: practitioners = [], isLoading } = useQuery({
    queryKey: ["practitioners"],
    queryFn: fetchPractitioners,
  });
  const [query, setQuery] = useState("");

  const filtered = practitioners.filter((p) =>
    `${p.name} ${p.department} ${p.designation}`.toLowerCase().includes(query.toLowerCase()),
  );

  const totalStudents = practitioners.reduce((s, p) => s + p.studentsAssigned, 0);
  const totalAtRisk = practitioners.reduce((s, p) => s + p.atRisk, 0);
  const totalInterventions = practitioners.reduce((s, p) => s + p.interventions, 0);

  return (
    <>
      <PageHeader
        title="Practitioners"
        subtitle="Faculty mentors responsible for monitoring and supporting at-risk students."
        actions={
          <Button onClick={() => toast.success("Invitation sent", { description: "Practitioner onboarding email queued." })}>
            <UserPlus className="size-4" /> Invite practitioner
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Practitioners" value={practitioners.length} icon={UserCheck} tone="primary" />
        <StatCard label="Students mentored" value={totalStudents.toLocaleString()} icon={Users} tone="success" />
        <StatCard label="At-risk caseload" value={totalAtRisk} icon={ShieldAlert} tone="highrisk" />
        <StatCard label="Interventions logged" value={totalInterventions} icon={LifeBuoy} tone="warning" />
      </div>

      <SectionCard
        title="All practitioners"
        description={`${filtered.length} of ${practitioners.length} shown`}
        actions={
          <div className="relative w-48 sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search practitioners"
              className="pl-9"
            />
          </div>
        }
        bodyClassName="p-4"
      >
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p) => (
              <article key={p.id} className="rounded-xl border border-border p-4 transition-shadow hover:shadow-card">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/12 font-display text-sm font-bold text-primary">
                      {initials(p.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.designation}</p>
                    </div>
                  </div>
                  <Badge variant={p.status === "Active" ? "secondary" : "outline"} className="shrink-0">
                    {p.status}
                  </Badge>
                </div>

                <p className="mt-3 truncate text-xs text-muted-foreground">
                  {p.department} · {p.id}
                </p>
                <p className="mt-1 inline-flex max-w-full items-center gap-1.5 truncate text-xs text-muted-foreground">
                  <Mail className="size-3.5 shrink-0" /> {p.email}
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[
                    ["Assigned", p.studentsAssigned],
                    ["At risk", p.atRisk],
                    ["Actions", p.interventions],
                  ].map(([label, value]) => (
                    <div key={label as string} className="rounded-lg bg-muted/50 py-2">
                      <p className="font-display text-base font-bold tabular-nums">{value}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Cohort attendance</span>
                    <span className="font-semibold tabular-nums">{p.avgAttendance}%</span>
                  </div>
                  <Progress value={p.avgAttendance} className="mt-1.5 h-1.5" />
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}

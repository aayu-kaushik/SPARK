import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  ClipboardCheck,
  GraduationCap,
  Library,
  Mail,
  MessageSquare,
  MonitorSmartphone,
  Phone,
  Sparkles,
  TrendingDown,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

import { FactorBarChart, TrendLineChart } from "@/charts/Charts";
import { AIInsight, SectionCard } from "@/components/shared/Layout";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { RiskGauge } from "@/components/shared/RiskGauge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Student } from "@/data/mockData";
import { initials, riskStyles } from "@/lib/risk";
import { cn } from "@/lib/utils";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/70 py-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="max-w-[60%] truncate text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export function StudentProfileView({ student, backTo }: { student: Student; backTo: "/admin/students" }) {
  const behaviour = [
    { label: "LMS Activity", value: student.lmsActivity, icon: MonitorSmartphone },
    { label: "Class Participation", value: student.participation, icon: UserCheck },
    { label: "Assignment Submissions", value: student.assignmentCompletion, icon: ClipboardCheck },
    { label: "Library Usage", value: student.libraryUsage, icon: Library },
  ];

  const interventions = [
    "Schedule mentor meeting",
    "Academic counseling",
    "Attendance improvement plan",
    "Monitor next assessment",
  ];

  const declined = Math.max(4, Math.round((100 - student.attendance) / 2));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            to={backTo}
            className="grid size-9 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-muted"
            aria-label="Back to students"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/12 font-display text-lg font-bold text-primary">
            {initials(student.name)}
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-bold">{student.name}</h1>
            <p className="truncate text-sm text-muted-foreground">
              {student.id} · {student.department} · Semester {student.semester}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <RiskBadge level={student.riskLevel} />
          <Button
            variant="outline"
            onClick={() => toast.success(`Message drafted to ${student.name}`, { description: "Continue in Messages." })}
          >
            <MessageSquare className="size-4" /> Message
          </Button>
          <Button
            onClick={() =>
              toast.success("Intervention logged", {
                description: `Mentor meeting requested with ${student.mentor}.`,
              })
            }
          >
            <Sparkles className="size-4" /> Mark intervention
          </Button>
        </div>
      </div>

      {/* AI prediction hero */}
      <section className="surface overflow-hidden">
        <div className="grid gap-6 p-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-center">
          <div className="flex flex-col items-center gap-3">
            <RiskGauge score={student.riskScore} level={student.riskLevel} label="Dropout Risk" />
            <p className={cn("font-display text-sm font-bold uppercase tracking-wider", riskStyles[student.riskLevel].text)}>
              {student.riskLevel} Risk
            </p>
            <p className="text-xs text-muted-foreground">Prediction confidence {student.confidence}%</p>
          </div>
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-base font-semibold">Why is this student at risk?</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Attendance has declined by {declined}% over the last semester. The student has failed{" "}
                {student.failedSubjects} subject{student.failedSubjects === 1 ? "" : "s"} and assignment completion is
                at {student.assignmentCompletion}%. Combined with{" "}
                {student.lmsActivity < 70 ? "reduced" : "steady"} LMS engagement, these factors
                {student.riskLevel === "Low" ? " keep the predicted dropout probability low." : " significantly increase the predicted dropout probability."}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Contributing factors
                </p>
                <div className="mt-3 space-y-2.5">
                  {student.riskFactors.slice(0, 5).map((f) => (
                    <div key={f.factor}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="truncate text-muted-foreground">{f.factor}</span>
                        <span className="font-semibold tabular-nums">{f.weight}%</span>
                      </div>
                      <Progress value={f.weight} className="mt-1 h-1.5" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recommended intervention
                </p>
                <ol className="mt-3 space-y-2 text-sm">
                  {interventions.map((step, i) => (
                    <li key={step} className="flex gap-2.5">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/12 text-[10px] font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard title="Student Information" bodyClassName="pt-2">
          <Row label="Name" value={student.name} />
          <Row label="Student ID" value={student.id} />
          <Row label="Course" value={student.course} />
          <Row label="Semester" value={`Semester ${student.semester}`} />
          <Row
            label="Email"
            value={
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-3.5 text-muted-foreground" /> {student.email}
              </span>
            }
          />
          <Row
            label="Phone"
            value={
              <span className="inline-flex items-center gap-1.5">
                <Phone className="size-3.5 text-muted-foreground" /> {student.phone}
              </span>
            }
          />
          <Row label="Mentor" value={student.mentor} />
        </SectionCard>

        <SectionCard title="Academic Information" bodyClassName="pt-2">
          <Row label="CGPA" value={student.cgpa.toFixed(1)} />
          <Row label="Previous semester GPA" value={student.previousGpa.toFixed(1)} />
          <Row label="Failed subjects" value={student.failedSubjects} />
          <Row label="Assignment completion" value={`${student.assignmentCompletion}%`} />
          <Row label="Internal marks average" value={`${student.internalMarks}/100`} />
          <Row
            label="GPA movement"
            value={
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  student.cgpa >= student.previousGpa ? "text-success" : "text-highrisk",
                )}
              >
                <TrendingDown className={cn("size-3.5", student.cgpa >= student.previousGpa && "rotate-180")} />
                {Math.abs(student.cgpa - student.previousGpa).toFixed(1)} pts
              </span>
            }
          />
        </SectionCard>

        <SectionCard title="Behavioral Indicators" bodyClassName="pt-4">
          <div className="space-y-4">
            {behaviour.map((b) => (
              <div key={b.label}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="inline-flex min-w-0 items-center gap-2 text-muted-foreground">
                    <b.icon className="size-4 shrink-0" />
                    <span className="truncate">{b.label}</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">{b.value}%</span>
                </div>
                <Progress value={b.value} className="mt-1.5 h-1.5" />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard
          title="Attendance"
          description={`Overall attendance ${student.attendance}%`}
          bodyClassName="pt-4"
        >
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-muted/50 p-3.5">
            <CalendarCheck className="size-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Overall attendance</p>
              <p className="text-xs text-muted-foreground">
                {student.attendance < 75 ? "Below the 75% eligibility threshold" : "Above the 75% eligibility threshold"}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 font-display text-xl font-bold",
                student.attendance < 75 ? "text-highrisk" : "text-success",
              )}
            >
              {student.attendance}%
            </span>
          </div>
          <div className="space-y-3">
            {student.subjects.map((s) => (
              <div key={s.subject}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="inline-flex min-w-0 items-center gap-2 text-muted-foreground">
                    <BookOpen className="size-3.5 shrink-0" />
                    <span className="truncate">{s.subject}</span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold tabular-nums">
                    {s.attendance}% · {s.marks} marks
                  </span>
                </div>
                <Progress value={s.attendance} className="mt-1.5 h-1.5" />
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="space-y-5">
          <SectionCard title="GPA Trend" description="Semester-wise academic performance">
            <TrendLineChart
              data={student.gpaHistory}
              xKey="term"
              domain={[4, 10]}
              series={[{ key: "gpa", name: "GPA", color: "var(--primary)" }]}
              height={210}
            />
          </SectionCard>
          <SectionCard title="Risk Factor Weighting" description="Model attribution for this student">
            <FactorBarChart data={student.riskFactors} dataKey="weight" labelKey="factor" height={220} color="var(--highrisk)" />
            <AIInsight className="mt-4" title="Mentor guidance">
              Assigned mentor <strong className="text-foreground">{student.mentor}</strong> should confirm a check-in
              within {student.riskLevel === "Low" ? "this month" : "3 days"} and log the outcome so the model can learn
              from the intervention.
            </AIInsight>
          </SectionCard>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <GraduationCap className="size-5 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          Predictions are generated nightly by model v3.2.1 and are advisory only — always pair them with a
          conversation with the student.
        </p>
      </div>
    </div>
  );
}

import { CalendarCheck, ClipboardCheck, GraduationCap, Mail, Phone, Sparkles, Target } from "lucide-react";

import { SimpleBarChart, TrendLineChart } from "@/charts/Charts";
import { AIInsight, PageHeader, SectionCard } from "@/components/shared/Layout";
import { RiskGauge } from "@/components/shared/RiskGauge";
import { StatCard } from "@/components/shared/StatCard";
import { Progress } from "@/components/ui/progress";
import { studentSelf } from "@/data/mockData";
import { riskStyles } from "@/lib/risk";
import { cn } from "@/lib/utils";

export type StudentPageKind =
  | "dashboard"
  | "performance"
  | "risk"
  | "attendance"
  | "progress"
  | "recommendations"
  | "profile";

const s = studentSelf;

function RiskCard() {
  return (
    <SectionCard title="My AI Risk Score" description="Updated nightly from attendance, marks and engagement">
      <div className="flex flex-col items-center gap-3">
        <RiskGauge score={s.riskScore} level={s.riskLevel} label="Dropout risk" />
        <p className={cn("font-display text-sm font-bold uppercase tracking-wider", riskStyles[s.riskLevel].text)}>
          {s.riskLevel} Risk · {s.confidence}% confidence
        </p>
      </div>
      <AIInsight className="mt-5" title="What this means">
        Your risk is low and stable. Keep attendance above 75% and clear pending assignments to stay on track — your
        Mathematics III attendance ({s.subjects[4]?.attendance}%) is the one area to watch.
      </AIInsight>
    </SectionCard>
  );
}

function SubjectList() {
  return (
    <div className="space-y-3">
      {s.subjects.map((sub) => (
        <div key={sub.subject}>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate text-muted-foreground">{sub.subject}</span>
            <span className="shrink-0 text-xs font-semibold tabular-nums">
              {sub.attendance}% attendance · {sub.marks} marks
            </span>
          </div>
          <Progress value={sub.attendance} className="mt-1.5 h-1.5" />
        </div>
      ))}
    </div>
  );
}

export function StudentPage({
  kind,
  title,
  subtitle,
}: {
  kind: StudentPageKind;
  title: string;
  subtitle: string;
}) {
  return (
    <>
      <PageHeader
        title={kind === "dashboard" ? `Hello, ${s.firstName} 👋` : title}
        subtitle={kind === "dashboard" ? "Here's how your semester is going and what to focus on next." : subtitle}
      />

      {kind === "dashboard" && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Current CGPA" value={s.cgpa.toFixed(1)} icon={GraduationCap} change={4.3} tone="primary" />
            <StatCard label="Attendance" value={`${s.attendance}%`} icon={CalendarCheck} change={2.1} tone="success" />
            <StatCard label="Assignments completed" value={`${s.assignments}%`} icon={ClipboardCheck} change={5.2} tone="warning" />
            <StatCard label="Risk score" value={`${s.riskScore}%`} icon={Target} change={-6.4} tone="success" invertChange />
          </div>
          <div className="grid gap-5 xl:grid-cols-[1fr_1.3fr]">
            <RiskCard />
            <SectionCard title="My Progress" description="GPA, attendance and assignment trend by semester">
              <TrendLineChart
                data={s.gpaTrend}
                xKey="term"
                series={[
                  { key: "gpa", name: "GPA", color: "var(--primary)" },
                  { key: "attendance", name: "Attendance %", color: "var(--success)" },
                ]}
                height={330}
              />
            </SectionCard>
          </div>
          <SectionCard title="Subject Overview" description="Attendance and marks per subject">
            <SubjectList />
          </SectionCard>
        </>
      )}

      {kind === "risk" && (
        <div className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
          <RiskCard />
          <SectionCard title="How to improve your score" description="Steps ranked by predicted impact">
            <ol className="space-y-3">
              {s.improvements.map((step, i) => (
                <li key={step} className="flex gap-3 rounded-xl border border-border p-3.5">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/12 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-sm text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </SectionCard>
        </div>
      )}

      {kind === "performance" && (
        <>
          <SectionCard title="GPA & assignment trend" description="Semester-wise performance">
            <TrendLineChart
              data={s.gpaTrend}
              xKey="term"
              series={[
                { key: "gpa", name: "GPA", color: "var(--primary)" },
                { key: "assignments", name: "Assignments %", color: "var(--warning)" },
              ]}
              height={320}
            />
          </SectionCard>
          <SectionCard title="Marks by subject" description="Latest internal assessment scores">
            <SimpleBarChart
              data={s.subjects.map((x) => ({ subject: x.subject, marks: x.marks, target: x.target }))}
              xKey="subject"
              bars={[
                { key: "marks", name: "Marks", color: "var(--primary)" },
                { key: "target", name: "Target", color: "var(--muted-foreground)" },
              ]}
              height={300}
            />
          </SectionCard>
        </>
      )}

      {kind === "attendance" && (
        <>
          <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
            <SectionCard title="Monthly attendance" description="Rolling attendance percentage">
              <TrendLineChart
                data={s.monthlyAttendance}
                xKey="month"
                domain={[60, 100]}
                series={[{ key: "attendance", name: "Attendance %", color: "var(--primary)" }]}
                height={300}
              />
            </SectionCard>
            <SectionCard title="Subject-wise attendance" description="75% is required for exam eligibility">
              <SubjectList />
            </SectionCard>
          </div>
          <AIInsight title="Eligibility check">
            Your overall attendance is {s.attendance}%. Mathematics III is below the 75% threshold — attending the next
            three sessions restores eligibility.
          </AIInsight>
        </>
      )}

      {kind === "progress" && (
        <>
          <SectionCard title="Semester progress" description="GPA growth across your course">
            <TrendLineChart
              data={s.gpaTrend}
              xKey="term"
              domain={[5, 10]}
              series={[{ key: "gpa", name: "GPA", color: "var(--primary)" }]}
              height={300}
            />
          </SectionCard>
          <SectionCard title="Current semester subjects" description="Attendance and marks">
            <SubjectList />
          </SectionCard>
        </>
      )}

      {kind === "recommendations" && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {s.recommendations.map((r) => (
              <article key={r.category} className="surface p-5">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-base">{r.icon}</span>
                  <p className="font-display text-sm font-semibold">{r.category}</p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.text}</p>
              </article>
            ))}
          </div>
          <SectionCard title="Your action plan" description="Generated by EduPredict AI for this month">
            <ol className="space-y-3">
              {s.improvements.map((step, i) => (
                <li key={step} className="flex gap-3 rounded-xl border border-border p-3.5 text-sm">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/12 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
            <AIInsight className="mt-5">
              Following this plan is predicted to lower your dropout risk from {s.riskScore}% to around{" "}
              <strong className="text-foreground">{Math.max(4, s.riskScore - 9)}%</strong> by the end of the semester.
            </AIInsight>
          </SectionCard>
        </>
      )}

      {kind === "profile" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <SectionCard title="My details">
            <dl className="space-y-2 text-sm">
              {[
                ["Name", s.name],
                ["Student ID", s.id],
                ["Course", s.course],
                ["Semester", `Semester ${s.semester}`],
                ["Department", s.department],
                ["Mentor", s.mentor],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 border-b border-border/70 py-1.5">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="truncate font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </SectionCard>
          <SectionCard title="Contact & support">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-muted-foreground" /> {s.email}
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-muted-foreground" /> {s.phone}
              </li>
              <li className="flex items-center gap-2.5">
                <Sparkles className="size-4 shrink-0 text-primary" /> Mentor {s.mentor} · available Wed 3–5 PM
              </li>
            </ul>
            <AIInsight className="mt-5" title="Wellbeing">
              Support services are confidential. Reach out to the Academic Support Cell any time through Messages.
            </AIInsight>
          </SectionCard>
        </div>
      )}
    </>
  );
}

import {
  CalendarCheck,
  ClipboardCheck,
  GraduationCap,
  Mail,
  Phone,
  Sparkles,
  Target,
} from "lucide-react";
import { useEffect, useState } from "react";

import { SimpleBarChart, TrendLineChart } from "@/charts/Charts";
import {
  AIInsight,
  PageHeader,
  SectionCard,
} from "@/components/shared/Layout";
import { RiskGauge } from "@/components/shared/RiskGauge";
import { StatCard } from "@/components/shared/StatCard";
import { Progress } from "@/components/ui/progress";
import {
  getCurrentStudentData,
  type StudentData,
} from "@/firebase/students";
import { useAuth } from "@/lib/auth";
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

function LoadingState() {
  return (
    <div className="flex min-h-75 items-center justify-center">
      <div className="text-center">
        <div className="mx-auto size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />

        <p className="mt-4 text-sm text-muted-foreground">
          Loading your student data...
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <p className="font-semibold text-destructive">
        Unable to load dashboard
      </p>

      <p className="mt-2 text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

function RiskCard({ student }: { student: StudentData }) {
  return (
    <SectionCard
      title="My AI Risk Score"
      description="Updated from attendance, marks and engagement"
    >
      <div className="flex flex-col items-center gap-3">
        <RiskGauge
          score={student.riskScore}
          level={student.riskLevel}
          label="Dropout risk"
        />

        <p
          className={cn(
            "font-display text-sm font-bold uppercase tracking-wider",
            riskStyles[student.riskLevel].text,
          )}
        >
          {student.riskLevel} Risk · {student.confidence}% confidence
        </p>
      </div>

      <AIInsight className="mt-5" title="What this means">
        Your current dropout probability is {student.riskScore}%.
        Continue monitoring attendance, academic performance and
        assignments to keep your academic risk under control.
      </AIInsight>
    </SectionCard>
  );
}

function SubjectList({ student }: { student: StudentData }) {
  return (
    <div className="space-y-3">
      {student.subjects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No subject data available yet.
        </p>
      ) : (
        student.subjects.map((sub) => (
          <div key={sub.subject}>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate text-muted-foreground">
                {sub.subject}
              </span>

              <span className="shrink-0 text-xs font-semibold tabular-nums">
                {sub.attendance}% attendance · {sub.marks} marks
              </span>
            </div>

            <Progress
              value={sub.attendance}
              className="mt-1.5 h-1.5"
            />
          </div>
        ))
      )}
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
  const { user, ready } = useAuth();

  const [student, setStudent] =
    useState<StudentData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!user) {
      setStudent(null);
      setError("You must be signed in to view this page.");
      setLoading(false);
      return;
    }

    if (user.role !== "student") {
      setStudent(null);
      setError(
        "This page is only available to student accounts.",
      );
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadStudent() {
      try {
        setLoading(true);
        setError("");

        /*
         * SECURITY:
         *
         * We do NOT take a student UID/student ID from:
         * - URL
         * - query parameters
         * - form input
         * - local storage
         *
         * getCurrentStudentData() gets the currently
         * authenticated Firebase user's UID and loads:
         *
         * students/{currentUser.uid}
         *
         * Firestore Security Rules provide the second
         * security layer.
         */
        const data = await getCurrentStudentData();

        if (cancelled) {
          return;
        }

        if (!data) {
          setStudent(null);

          setError(
            "No academic record has been created for your account yet.",
          );

          return;
        }

        setStudent(data);
      } catch (err) {
        console.error(
          "Student data loading failed:",
          err,
        );

        if (!cancelled) {
          setStudent(null);

          setError(
            "Your academic information could not be loaded.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadStudent();

    return () => {
      cancelled = true;
    };
  }, [ready, user?.uid, user?.role]);

  if (!ready || loading) {
    return <LoadingState />;
  }

  if (error || !user || !student) {
    return (
      <ErrorState
        message={
          error ||
          "Your student information is unavailable."
        }
      />
    );
  }

  const displayName =
    user.name?.trim() || "Student";

  const firstName =
    displayName.split(/\s+/)[0] || "Student";

  const email = user.email;

  const s = student;

  return (
    <>
      <PageHeader
        title={
          kind === "dashboard"
            ? `Hello, ${firstName} 👋`
            : title
        }
        subtitle={
          kind === "dashboard"
            ? "Here's how your semester is going and what to focus on next."
            : subtitle
        }
      />

      {/* ================= DASHBOARD ================= */}

      {kind === "dashboard" && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Current CGPA"
              value={s.cgpa.toFixed(1)}
              icon={GraduationCap}
              tone="primary"
            />

            <StatCard
              label="Attendance"
              value={`${s.attendance}%`}
              icon={CalendarCheck}
              tone="success"
            />

            <StatCard
              label="Assignments completed"
              value={`${s.assignments}%`}
              icon={ClipboardCheck}
              tone="warning"
            />

            <StatCard
              label="Risk score"
              value={`${s.riskScore}%`}
              icon={Target}
              tone="success"
              invertChange
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_1.3fr]">
            <RiskCard student={s} />

            <SectionCard
              title="My Progress"
              description="GPA, attendance and assignment trend by semester"
            >
              <TrendLineChart
                data={s.gpaTrend}
                xKey="term"
                series={[
                  {
                    key: "gpa",
                    name: "GPA",
                    color: "var(--primary)",
                  },
                  {
                    key: "attendance",
                    name: "Attendance %",
                    color: "var(--success)",
                  },
                ]}
                height={330}
              />
            </SectionCard>
          </div>

          <SectionCard
            title="Subject Overview"
            description="Attendance and marks per subject"
          >
            <SubjectList student={s} />
          </SectionCard>
        </>
      )}

      {/* ================= RISK ================= */}

      {kind === "risk" && (
        <div className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
          <RiskCard student={s} />

          <SectionCard
            title="How to improve your score"
            description="Steps ranked by predicted impact"
          >
            {s.improvements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No improvement recommendations available yet.
              </p>
            ) : (
              <ol className="space-y-3">
                {s.improvements.map((step, i) => (
                  <li
                    key={`${step}-${i}`}
                    className="flex gap-3 rounded-xl border border-border p-3.5"
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/12 text-xs font-bold text-primary">
                      {i + 1}
                    </span>

                    <span className="text-sm text-muted-foreground">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>
        </div>
      )}

      {/* ================= PERFORMANCE ================= */}

      {kind === "performance" && (
        <>
          <SectionCard
            title="GPA & assignment trend"
            description="Semester-wise performance"
          >
            <TrendLineChart
              data={s.gpaTrend}
              xKey="term"
              series={[
                {
                  key: "gpa",
                  name: "GPA",
                  color: "var(--primary)",
                },
                {
                  key: "assignments",
                  name: "Assignments %",
                  color: "var(--warning)",
                },
              ]}
              height={320}
            />
          </SectionCard>

          <SectionCard
            title="Marks by subject"
            description="Latest internal assessment scores"
          >
            <SimpleBarChart
              data={s.subjects.map((subject) => ({
                subject: subject.subject,
                marks: subject.marks,
                target: subject.target,
              }))}
              xKey="subject"
              bars={[
                {
                  key: "marks",
                  name: "Marks",
                  color: "var(--primary)",
                },
                {
                  key: "target",
                  name: "Target",
                  color: "var(--muted-foreground)",
                },
              ]}
              height={300}
            />
          </SectionCard>
        </>
      )}

      {/* ================= ATTENDANCE ================= */}

      {kind === "attendance" && (
        <>
          <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
            <SectionCard
              title="Monthly attendance"
              description="Rolling attendance percentage"
            >
              <TrendLineChart
                data={s.monthlyAttendance}
                xKey="month"
                domain={[60, 100]}
                series={[
                  {
                    key: "attendance",
                    name: "Attendance %",
                    color: "var(--primary)",
                  },
                ]}
                height={300}
              />
            </SectionCard>

            <SectionCard
              title="Subject-wise attendance"
              description="75% is required for exam eligibility"
            >
              <SubjectList student={s} />
            </SectionCard>
          </div>

          <AIInsight title="Eligibility check">
            Your overall attendance is {s.attendance}%.
            Subjects below 75% attendance require immediate
            attention.
          </AIInsight>
        </>
      )}

      {/* ================= ACADEMIC PROGRESS ================= */}

      {kind === "progress" && (
        <>
          <SectionCard
            title="Semester progress"
            description="GPA growth across your course"
          >
            <TrendLineChart
              data={s.gpaTrend}
              xKey="term"
              domain={[5, 10]}
              series={[
                {
                  key: "gpa",
                  name: "GPA",
                  color: "var(--primary)",
                },
              ]}
              height={300}
            />
          </SectionCard>

          <SectionCard
            title="Current semester subjects"
            description="Attendance and marks"
          >
            <SubjectList student={s} />
          </SectionCard>
        </>
      )}

      {/* ================= RECOMMENDATIONS ================= */}

      {kind === "recommendations" && (
        <>
          {s.recommendations.length === 0 ? (
            <SectionCard
              title="Recommendations"
              description="Personalised academic recommendations"
            >
              <p className="text-sm text-muted-foreground">
                No recommendations are available yet.
              </p>
            </SectionCard>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {s.recommendations.map(
                (recommendation, index) => (
                  <article
                    key={`${recommendation.category}-${index}`}
                    className="surface p-5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-base">
                        {recommendation.icon}
                      </span>

                      <p className="font-display text-sm font-semibold">
                        {recommendation.category}
                      </p>
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {recommendation.text}
                    </p>
                  </article>
                ),
              )}
            </div>
          )}

          <SectionCard
            title="Your action plan"
            description="Generated by SPARK for this month"
          >
            {s.improvements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No action plan has been generated yet.
              </p>
            ) : (
              <ol className="space-y-3">
                {s.improvements.map((step, i) => (
                  <li
                    key={`${step}-${i}`}
                    className="flex gap-3 rounded-xl border border-border p-3.5 text-sm"
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/12 text-xs font-bold text-primary">
                      {i + 1}
                    </span>

                    <span className="text-muted-foreground">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            )}

            <AIInsight className="mt-5">
              Following this plan is predicted to lower your
              dropout risk from {s.riskScore}% to around{" "}
              <strong className="text-foreground">
                {Math.max(4, s.riskScore - 9)}%
              </strong>{" "}
              by the end of the semester.
            </AIInsight>
          </SectionCard>
        </>
      )}

      {/* ================= PROFILE ================= */}

      {kind === "profile" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <SectionCard title="My details">
            <dl className="space-y-2 text-sm">
              {[
                ["Name", displayName],
                ["Student ID", s.studentId],
                ["Course", s.course],
                ["Semester", `Semester ${s.semester}`],
                ["Department", s.department],
                ["Mentor", s.mentor],
              ].map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 border-b border-border/70 py-1.5"
                >
                  <dt className="text-xs text-muted-foreground">
                    {key}
                  </dt>

                  <dd className="truncate font-medium">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </SectionCard>

          <SectionCard title="Contact & support">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-muted-foreground" />
                {email}
              </li>

              <li className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-muted-foreground" />
                {s.phone}
              </li>

              <li className="flex items-center gap-2.5">
                <Sparkles className="size-4 shrink-0 text-primary" />
                Mentor {s.mentor}
              </li>
            </ul>

            <AIInsight
              className="mt-5"
              title="Wellbeing"
            >
              Support services are confidential. Reach out to
              the Academic Support Cell any time through
              Messages.
            </AIInsight>
          </SectionCard>
        </div>
      )}
    </>
  );
}
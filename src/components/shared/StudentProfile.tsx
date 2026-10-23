
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

import {
  FactorBarChart,
  TrendLineChart,
} from "@/charts/Charts";
import {
  AIInsight,
  SectionCard,
} from "@/components/shared/Layout";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { RiskGauge } from "@/components/shared/RiskGauge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Student } from "@/data/mockData";
import type { StudentData } from "@/firebase/students";
import { initials, riskStyles } from "@/lib/risk";
import { cn } from "@/lib/utils";

// ============================================================
// TYPES
// ============================================================

type ProfileStudent = Student | StudentData;

interface StudentProfileProps {
  student: ProfileStudent;
  backTo: "/admin/students";
}

// ============================================================
// HELPERS
// ============================================================

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/70 py-2 last:border-0">
      <span className="text-xs text-muted-foreground">
        {label}
      </span>

      <span className="max-w-[60%] truncate text-right text-sm font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

function getAcademicStudentId(
  student: ProfileStudent,
): string {
  return "studentId" in student
    ? student.studentId
    : student.id;
}

function getGpaTrend(student: ProfileStudent) {
  if ("gpaTrend" in student) {
    return student.gpaTrend.map((entry) => ({
      term: entry.term,
      gpa: entry.gpa,
    }));
  }

  return student.gpaHistory.map((entry) => ({
    term: entry.term,
    gpa: entry.gpa,
  }));
}

// ============================================================
// STUDENT PROFILE
// ============================================================

export function StudentProfileView({
  student,
  backTo,
}: StudentProfileProps) {
  const academicStudentId =
    getAcademicStudentId(student);

  const gpaTrend = getGpaTrend(student);

  const factorChartData = student.riskFactors.map(
    (factor) => ({
      factor: factor.factor,
      weight: factor.weight,
    }),
  );

  const behaviour = [
    {
      label: "LMS Activity",
      value: student.lmsActivity,
      icon: MonitorSmartphone,
    },
    {
      label: "Class Participation",
      value: student.participation,
      icon: UserCheck,
    },
    {
      label: "Assignment Submissions",
      value: student.assignmentCompletion,
      icon: ClipboardCheck,
    },
    {
      label: "Library Usage",
      value: student.libraryUsage,
      icon: Library,
    },
  ];

  const suggestedInterventions = [
    "Schedule mentor meeting",
    "Academic counseling",
    "Attendance improvement plan",
    "Monitor next assessment",
  ];

  const hasPrediction =
    student.confidence > 0 ||
    student.riskFactors.length > 0;

  function handleMessage() {
    toast.info("Open Messages to contact this student", {
      description:
        "Direct messaging from the student profile is not connected yet.",
    });
  }

  function handleIntervention() {
    toast.info("Intervention logging is coming next", {
      description:
        "No intervention has been recorded. This action will be connected to Firestore in the intervention phase.",
    });
  }

  return (
    <div className="space-y-6">
      {/* =====================================================
          PROFILE HEADER
      ====================================================== */}

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
            <h1 className="truncate font-display text-2xl font-bold">
              {student.name}
            </h1>

            <p className="truncate text-sm text-muted-foreground">
              {academicStudentId} ·{" "}
              {student.department} · Semester{" "}
              {student.semester}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <RiskBadge level={student.riskLevel} />

          <Button
            variant="outline"
            onClick={handleMessage}
          >
            <MessageSquare className="size-4" />
            Message
          </Button>

          <Button onClick={handleIntervention}>
            <Sparkles className="size-4" />
            Mark intervention
          </Button>
        </div>
      </div>

      {/* =====================================================
          RISK PREDICTION HERO
      ====================================================== */}

      <section className="surface overflow-hidden">
        <div className="grid gap-6 p-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-center">
          <div className="flex flex-col items-center gap-3">
            <RiskGauge
              score={student.riskScore}
              level={student.riskLevel}
              label="Dropout Risk"
            />

            <p
              className={cn(
                "font-display text-sm font-bold uppercase tracking-wider",
                riskStyles[student.riskLevel].text,
              )}
            >
              {student.riskLevel} Risk
            </p>

            <p className="text-xs text-muted-foreground">
              {hasPrediction
                ? `Prediction confidence ${student.confidence}%`
                : "No model prediction available yet"}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="font-display text-base font-semibold">
                Academic risk overview
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Current attendance is{" "}
                <strong className="text-foreground">
                  {student.attendance}%
                </strong>
                , with{" "}
                <strong className="text-foreground">
                  {student.failedSubjects}
                </strong>{" "}
                failed subject
                {student.failedSubjects === 1
                  ? ""
                  : "s"}{" "}
                and{" "}
                <strong className="text-foreground">
                  {student.assignmentCompletion}%
                </strong>{" "}
                assignment completion. LMS engagement
                is currently{" "}
                <strong className="text-foreground">
                  {student.lmsActivity}%
                </strong>
                .
              </p>

              {!hasPrediction && (
                <p className="mt-2 text-xs text-muted-foreground">
                  These are recorded academic indicators,
                  not a completed AI prediction.
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Contributing factors */}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Contributing factors
                </p>

                {student.riskFactors.length > 0 ? (
                  <div className="mt-3 space-y-2.5">
                    {student.riskFactors
                      .slice(0, 5)
                      .map((factor) => (
                        <div key={factor.factor}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="truncate text-muted-foreground">
                              {factor.factor}
                            </span>

                            <span className="font-semibold tabular-nums">
                              {factor.weight}%
                            </span>
                          </div>

                          <Progress
                            value={factor.weight}
                            className="mt-1 h-1.5"
                          />
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Risk factors will appear when
                    prediction results are available.
                  </p>
                )}
              </div>

              {/* Suggested interventions */}

              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Suggested interventions
                </p>

                <ol className="mt-3 space-y-2 text-sm">
                  {suggestedInterventions.map(
                    (step, index) => (
                      <li
                        key={step}
                        className="flex gap-2.5"
                      >
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/12 text-[10px] font-bold text-primary">
                          {index + 1}
                        </span>

                        <span className="text-muted-foreground">
                          {step}
                        </span>
                      </li>
                    ),
                  )}
                </ol>

                <p className="mt-3 text-xs text-muted-foreground">
                  General suggestions; not yet
                  recorded as interventions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          STUDENT INFORMATION CARDS
      ====================================================== */}

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard
          title="Student Information"
          bodyClassName="pt-2"
        >
          <Row label="Name" value={student.name} />

          <Row
            label="Student ID"
            value={academicStudentId}
          />

          <Row
            label="Course"
            value={student.course}
          />

          <Row
            label="Semester"
            value={`Semester ${student.semester}`}
          />

          <Row
            label="Email"
            value={
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-3.5 text-muted-foreground" />
                {student.email}
              </span>
            }
          />

          <Row
            label="Phone"
            value={
              <span className="inline-flex items-center gap-1.5">
                <Phone className="size-3.5 text-muted-foreground" />
                {student.phone || "Not provided"}
              </span>
            }
          />

          <Row
            label="Mentor"
            value={student.mentor || "Not assigned"}
          />
        </SectionCard>

        {/* Academic information */}

        <SectionCard
          title="Academic Information"
          bodyClassName="pt-2"
        >
          <Row
            label="CGPA"
            value={student.cgpa.toFixed(1)}
          />

          <Row
            label="Previous semester GPA"
            value={student.previousGpa.toFixed(1)}
          />

          <Row
            label="Failed subjects"
            value={student.failedSubjects}
          />

          <Row
            label="Assignment completion"
            value={`${student.assignmentCompletion}%`}
          />

          <Row
            label="Internal marks average"
            value={`${student.internalMarks}/100`}
          />

          <Row
            label="GPA movement"
            value={
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  student.cgpa >= student.previousGpa
                    ? "text-success"
                    : "text-highrisk",
                )}
              >
                <TrendingDown
                  className={cn(
                    "size-3.5",
                    student.cgpa >=
                      student.previousGpa &&
                      "rotate-180",
                  )}
                />

                {Math.abs(
                  student.cgpa -
                    student.previousGpa,
                ).toFixed(1)}{" "}
                pts
              </span>
            }
          />
        </SectionCard>

        {/* Behavioral indicators */}

        <SectionCard
          title="Behavioral Indicators"
          bodyClassName="pt-4"
        >
          <div className="space-y-4">
            {behaviour.map((indicator) => (
              <div key={indicator.label}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="inline-flex min-w-0 items-center gap-2 text-muted-foreground">
                    <indicator.icon className="size-4 shrink-0" />

                    <span className="truncate">
                      {indicator.label}
                    </span>
                  </span>

                  <span className="shrink-0 font-semibold tabular-nums">
                    {indicator.value}%
                  </span>
                </div>

                <Progress
                  value={indicator.value}
                  className="mt-1.5 h-1.5"
                />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* =====================================================
          ATTENDANCE AND PERFORMANCE CHARTS
      ====================================================== */}

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard
          title="Attendance"
          description={`Overall attendance ${student.attendance}%`}
          bodyClassName="pt-4"
        >
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-muted/50 p-3.5">
            <CalendarCheck className="size-5 shrink-0 text-primary" />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                Overall attendance
              </p>

              <p className="text-xs text-muted-foreground">
                {student.attendance < 75
                  ? "Below the 75% eligibility threshold"
                  : "Above the 75% eligibility threshold"}
              </p>
            </div>

            <span
              className={cn(
                "shrink-0 font-display text-xl font-bold",
                student.attendance < 75
                  ? "text-highrisk"
                  : "text-success",
              )}
            >
              {student.attendance}%
            </span>
          </div>

          {student.subjects.length > 0 ? (
            <div className="space-y-3">
              {student.subjects.map((subject) => (
                <div key={subject.subject}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="inline-flex min-w-0 items-center gap-2 text-muted-foreground">
                      <BookOpen className="size-3.5 shrink-0" />

                      <span className="truncate">
                        {subject.subject}
                      </span>
                    </span>

                    <span className="shrink-0 text-xs font-semibold tabular-nums">
                      {subject.attendance}% ·{" "}
                      {subject.marks} marks
                    </span>
                  </div>

                  <Progress
                    value={subject.attendance}
                    className="mt-1.5 h-1.5"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Subject-wise attendance has not been
              recorded yet.
            </p>
          )}
        </SectionCard>

        <div className="space-y-5">
          {/* GPA trend */}

          <SectionCard
            title="GPA Trend"
            description="Semester-wise academic performance"
          >
            {gpaTrend.length > 0 ? (
              <TrendLineChart
                data={gpaTrend}
                xKey="term"
                domain={[0, 10]}
                series={[
                  {
                    key: "gpa",
                    name: "GPA",
                    color: "var(--primary)",
                  },
                ]}
                height={210}
              />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                GPA history is not available yet.
              </p>
            )}
          </SectionCard>

          {/* Risk factors */}

          <SectionCard
            title="Risk Factor Weighting"
            description="Recorded model attribution for this student"
          >
            {factorChartData.length > 0 ? (
              <FactorBarChart
                data={factorChartData}
                dataKey="weight"
                labelKey="factor"
                height={220}
                color="var(--highrisk)"
              />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No model attribution data is
                available yet.
              </p>
            )}

            <AIInsight
              className="mt-4"
              title="Mentor guidance"
            >
              Assigned mentor{" "}
              <strong className="text-foreground">
                {student.mentor || "Not assigned"}
              </strong>{" "}
              should review the student's academic
              indicators and determine whether a
              follow-up meeting is needed.
            </AIInsight>
          </SectionCard>
        </div>
      </div>

      {/* =====================================================
          ADVISORY NOTE
      ====================================================== */}

      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <GraduationCap className="size-5 shrink-0 text-primary" />

        <p className="text-sm text-muted-foreground">
          Academic indicators and risk predictions
          are advisory only. Model-generated
          predictions will be displayed when
          available and should always be reviewed
          alongside direct communication with
          the student.
        </p>
      </div>
    </div>
  );
}

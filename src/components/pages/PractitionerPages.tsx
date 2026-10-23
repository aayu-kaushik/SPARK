
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Download,
  Mail,
  Phone,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

import { SimpleBarChart } from "@/charts/Charts";
import {
  AIInsight,
  PageHeader,
  SectionCard,
} from "@/components/shared/Layout";
import { PredictionSimulator } from "@/components/shared/PredictionSimulator";
import { StudentTable } from "@/components/shared/StudentTable";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  listStudentsForPractitioner,
  type StudentData,
} from "@/firebase/students";
import { getUserProfile } from "@/firebase/users";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/risk";

// ============================================================
// TYPES
// ============================================================

export type PractitionerPageKind =
  | "table"
  | "atrisk"
  | "sim"
  | "perf"
  | "reports"
  | "profile";

interface PractitionerPageProps {
  kind: PractitionerPageKind;
  title: string;
  subtitle: string;
}

interface SubjectAttendance {
  subject: string;
  average: number;
  studentCount: number;
}

// ============================================================
// HELPERS
// ============================================================

function calculateWeakestSubjects(
  students: StudentData[],
): SubjectAttendance[] {
  const totals = new Map<
    string,
    { total: number; count: number }
  >();

  students.forEach((student) => {
    student.subjects.forEach((subject) => {
      const current = totals.get(subject.subject) ?? {
        total: 0,
        count: 0,
      };

      totals.set(subject.subject, {
        total: current.total + subject.attendance,
        count: current.count + 1,
      });
    });
  });

  return Array.from(totals.entries())
    .map(([subject, values]) => ({
      subject,
      average:
        values.count > 0
          ? Math.round(values.total / values.count)
          : 0,
      studentCount: values.count,
    }))
    .sort((a, b) => a.average - b.average)
    .slice(0, 5);
}

function exportCohortCsv(
  students: StudentData[],
): void {
  const headers = [
    "Student ID",
    "Name",
    "Email",
    "Department",
    "Semester",
    "CGPA",
    "Attendance",
    "Assignment Completion",
    "Failed Subjects",
    "Risk Score",
    "Risk Level",
  ];

  const rows = students.map((student) => [
    student.studentId,
    student.name,
    student.email,
    student.department,
    student.semester,
    student.cgpa,
    student.attendance,
    student.assignmentCompletion,
    student.failedSubjects,
    student.riskScore,
    student.riskLevel,
  ]);

  function csvCell(value: unknown): string {
    const raw = String(value ?? "");

    const safe = /^[\s]*[=+\-@]/.test(raw)
      ? `'${raw}`
      : raw;

    return `"${safe.replace(/"/g, '""')}"`;
  }

  const csv = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ].join("\r\n");

  const blob = new Blob(
    ["\uFEFF", csv],
    {
      type: "text/csv;charset=utf-8;",
    },
  );

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "spark-my-students.csv";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

// ============================================================
// PRACTITIONER PAGE
// ============================================================

export function PractitionerPage({
  kind,
  title,
  subtitle,
}: PractitionerPageProps) {
  const { user } = useAuth();

  const practitionerUid =
    user?.role === "practitioner"
      ? user.uid
      : "";

  // ----------------------------------------------------------
  // FIRESTORE QUERIES
  // ----------------------------------------------------------

  const studentsQuery = useQuery({
    queryKey: [
      "practitioner",
      "students",
      practitionerUid,
    ],

    queryFn: () =>
      listStudentsForPractitioner(
        practitionerUid,
      ),

    enabled: Boolean(practitionerUid),
  });

  const profileQuery = useQuery({
    queryKey: [
      "practitioner",
      "profile",
      practitionerUid,
    ],

    queryFn: () =>
      getUserProfile(practitionerUid),

    enabled: Boolean(practitionerUid),
  });

  const cohort = studentsQuery.data ?? [];
  const profile = profileQuery.data;

  // ----------------------------------------------------------
  // COHORT METRICS
  // ----------------------------------------------------------

  const atRisk = useMemo(
    () =>
      cohort
        .filter(
          (student) =>
            student.riskLevel === "Medium" ||
            student.riskLevel === "High" ||
            student.riskLevel === "Critical",
        )
        .sort(
          (a, b) =>
            b.riskScore - a.riskScore,
        ),
    [cohort],
  );

  const belowAttendance =
    cohort.filter(
      (student) =>
        student.attendance < 75,
    ).length;

  const withFailedSubjects =
    cohort.filter(
      (student) =>
        student.failedSubjects > 0,
    ).length;

  const averageAttendance =
    cohort.length > 0
      ? Math.round(
          cohort.reduce(
            (sum, student) =>
              sum + student.attendance,
            0,
          ) / cohort.length,
        )
      : 0;

  const weakestSubjects = useMemo(
    () => calculateWeakestSubjects(cohort),
    [cohort],
  );

  const isLoading =
    studentsQuery.isLoading;

  // ----------------------------------------------------------
  // REPORT ACTION
  // ----------------------------------------------------------

  function handleExport() {
    if (cohort.length === 0) {
      toast.info("No student records to export");
      return;
    }

    exportCohortCsv(cohort);

    toast.success("Cohort data exported", {
      description:
        "Your assigned student records have been downloaded as CSV.",
    });
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
      />

      {/* =====================================================
          DATA LOADING ERROR
      ====================================================== */}

      {studentsQuery.isError && (
        <div className="mb-5 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          Unable to load assigned students:{" "}
          {studentsQuery.error instanceof Error
            ? studentsQuery.error.message
            : "Please check Firestore permissions."}
        </div>
      )}

      {/* =====================================================
          STUDENT TABLE / AT-RISK TABLE
      ====================================================== */}

      {(kind === "table" ||
        kind === "atrisk") && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              [
                "Cohort size",
                cohort.length,
              ],
              [
                "At risk",
                atRisk.length,
              ],
              [
                "Below 75% attendance",
                belowAttendance,
              ],
              [
                "Failed subjects",
                withFailedSubjects,
              ],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="surface p-4"
              >
                <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                  {kind === "atrisk" ? (
                    <ShieldAlert className="size-3.5" />
                  ) : (
                    <Users className="size-3.5" />
                  )}

                  {label}
                </p>

                <p className="mt-1.5 font-display text-2xl font-bold tabular-nums">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <SectionCard
            title={
              kind === "atrisk"
                ? "At-risk students"
                : "My students"
            }
            description="Assigned students sorted by dropout risk score"
          >
            <StudentTable
              data={
                kind === "atrisk"
                  ? atRisk.map(toTableStudent)
                  : cohort.map(toTableStudent)
              }
              loading={isLoading}
              basePath="/admin/students"
              pageSize={8}
            />
          </SectionCard>
        </>
      )}

      {/* =====================================================
          PREDICTION SIMULATOR
      ====================================================== */}

      {kind === "sim" && (
        <PredictionSimulator />
      )}

      {/* =====================================================
          COHORT PERFORMANCE
      ====================================================== */}

      {kind === "perf" && (
        <>
          <SectionCard
            title="Cohort performance"
            description="Attendance vs assignment completion by student"
          >
            {cohort.length > 0 ? (
              <SimpleBarChart
                data={cohort
                  .slice(0, 10)
                  .map((student) => ({
                    name:
                      student.name.split(" ")[0] ??
                      student.name,
                    attendance:
                      student.attendance,
                    assignments:
                      student.assignmentCompletion,
                  }))}
                xKey="name"
                bars={[
                  {
                    key: "attendance",
                    name: "Attendance %",
                    color: "var(--primary)",
                  },
                  {
                    key: "assignments",
                    name: "Assignments %",
                    color: "var(--success)",
                  },
                ]}
                height={320}
              />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No assigned student performance
                data is available yet.
              </p>
            )}
          </SectionCard>

          <SectionCard
            title="Weakest subjects across cohort"
            description="Average subject attendance from real student records"
          >
            {weakestSubjects.length > 0 ? (
              <div className="space-y-3">
                {weakestSubjects.map(
                  (subject) => (
                    <div
                      key={subject.subject}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate text-muted-foreground">
                          {subject.subject}
                        </span>

                        <span className="font-semibold tabular-nums">
                          {subject.average}%
                        </span>
                      </div>

                      <Progress
                        value={
                          subject.average
                        }
                        className="mt-1.5 h-1.5"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Subject-wise attendance data
                  has not been recorded yet.
                </p>
              )}

              <AIInsight className="mt-5">
                {weakestSubjects.length > 0
                  ? `${weakestSubjects[0]?.subject} currently has the lowest recorded average attendance in your assigned cohort. Review the underlying student records before planning an intervention.`
                  : "Record subject-wise attendance to identify academic areas that may need additional support."}
              </AIInsight>
          </SectionCard>
        </>
      )}

      {/* =====================================================
          REPORTS
      ====================================================== */}

      {kind === "reports" && (
        <div className="grid gap-5 md:grid-cols-2">
          <SectionCard
            title="Assigned Students Report"
            description="Current student records from Firestore"
          >
            <p className="text-sm text-muted-foreground">
              Export your assigned students,
              academic performance, attendance,
              and recorded risk levels.
            </p>

            <Button
              size="sm"
              className="mt-4"
              onClick={handleExport}
              disabled={
                isLoading ||
                cohort.length === 0
              }
            >
              <Download className="size-4" />
              Export CSV
            </Button>
          </SectionCard>

          <SectionCard
            title="Intervention Report"
            description="Planned for the intervention phase"
          >
            <p className="text-sm text-muted-foreground">
              Intervention history and outcome
              reports will become available
              when intervention tracking is
              implemented.
            </p>

            <Button
              size="sm"
              variant="outline"
              className="mt-4"
              disabled
            >
              <Download className="size-4" />
              Not available yet
            </Button>
          </SectionCard>
        </div>
      )}

      {/* =====================================================
          PRACTITIONER PROFILE
      ====================================================== */}

      {kind === "profile" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <SectionCard title="Practitioner details">
            {profileQuery.isLoading ? (
              <Skeleton className="h-48 rounded-xl" />
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary/12 font-display text-lg font-bold text-primary">
                    {initials(
                      profile?.name ??
                        user?.name ??
                        "Practitioner",
                    )}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-bold">
                      {profile?.name ??
                        user?.name ??
                        "Practitioner"}
                    </p>

                    <p className="truncate text-sm text-muted-foreground">
                      {profile?.title ||
                        "Practitioner"}{" "}
                      ·{" "}
                      {profile?.department ||
                        "Department not assigned"}
                    </p>
                  </div>
                </div>

                <dl className="mt-5 space-y-2 text-sm">
                  {[
                    [
                      "Faculty ID",
                      practitionerUid.slice(
                        0,
                        8,
                      ),
                    ],
                    [
                      "Email",
                      profile?.email ??
                        user?.email ??
                        "",
                    ],
                    [
                      "Department",
                      profile?.department ??
                        "Not assigned",
                    ],
                    [
                      "Role",
                      "Practitioner",
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-3 border-b border-border/70 py-1.5"
                    >
                      <dt className="text-xs text-muted-foreground">
                        {label}
                      </dt>

                      <dd className="truncate font-medium">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link to="/practitioner/messages">
                      <Mail className="size-4" />
                      Messages
                    </Link>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      toast.info(
                        "Support contact is not configured yet.",
                      )
                    }
                  >
                    <Phone className="size-4" />
                    Contact support
                  </Button>
                </div>
              </>
            )}
          </SectionCard>

          <SectionCard
            title="Mentoring caseload"
            description="Your currently assigned students"
          >
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                [
                  "Assigned",
                  cohort.length,
                ],
                [
                  "At risk",
                  atRisk.length,
                ],
                [
                  "Avg. attendance",
                  `${averageAttendance}%`,
                ],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-xl bg-muted/50 p-4"
                >
                  <p className="font-display text-2xl font-bold tabular-nums">
                    {value}
                  </p>

                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <AIInsight className="mt-5">
              Caseload metrics are calculated from
              students currently assigned to your
              practitioner account. Intervention
              outcomes will be displayed when
              sufficient tracking data is available.
            </AIInsight>
          </SectionCard>
        </div>
      )}
    </>
  );
}

// ============================================================
// STUDENT TABLE ADAPTER
// ============================================================

function toTableStudent(student: StudentData) {
  return {
    id: student.studentId,
    name: student.name,
    email: student.email,
    department: student.department,
    semester: student.semester,
    attendance: student.attendance,
    cgpa: student.cgpa,
    riskScore: student.riskScore,
    riskLevel: student.riskLevel,
    failedSubjects: student.failedSubjects,
    lastActivity: student.lastActivity,
  } as import("@/data/mockData").Student;
}

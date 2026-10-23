
import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";
import {
  CalendarCheck,
  LifeBuoy,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useMemo } from "react";

import { RiskDonut } from "@/charts/Charts";
import {
  AIInsight,
  PageHeader,
  SectionCard,
} from "@/components/shared/Layout";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { StatCard } from "@/components/shared/StatCard";
import { StudentTable } from "@/components/shared/StudentTable";
import { Button } from "@/components/ui/button";
import {
  listStudentsForPractitioner,
  type StudentData,
} from "@/firebase/students";
import { useAuth } from "@/lib/auth";
import { greeting } from "@/lib/risk";
import type { Student } from "@/data/mockData";

export const Route = createFileRoute(
  "/practitioner/dashboard",
)({
  head: () => ({
    meta: [
      {
        title: "Practitioner Dashboard — SPARK",
      },
      {
        name: "description",
        content:
          "Monitor assigned students, academic risk and mentoring priorities.",
      },
      {
        property: "og:title",
        content:
          "Practitioner Dashboard — SPARK",
      },
    ],
  }),
  component: PractitionerDashboard,
});

// ============================================================
// HELPERS
// ============================================================

function toTableStudent(
  student: StudentData,
): Student {
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
  } as Student;
}

function getRiskDistribution(
  students: StudentData[],
) {
  return [
    {
      name: "Low",
      value: students.filter(
        (student) =>
          student.riskLevel === "Low",
      ).length,
      color: "var(--success)",
    },
    {
      name: "Medium",
      value: students.filter(
        (student) =>
          student.riskLevel === "Medium",
      ).length,
      color: "var(--warning)",
    },
    {
      name: "High",
      value: students.filter(
        (student) =>
          student.riskLevel === "High",
      ).length,
      color: "var(--highrisk)",
    },
    {
      name: "Critical",
      value: students.filter(
        (student) =>
          student.riskLevel === "Critical",
      ).length,
      color: "var(--destructive)",
    },
  ];
}

function getPriorityRecommendation(
  student: StudentData,
): string {
  if (student.recommendations.length > 0) {
    return student.recommendations[0]?.text ??
      "Review academic progress.";
  }

  if (student.attendance < 75) {
    return "Review attendance and schedule a mentoring discussion.";
  }

  if (student.failedSubjects > 0) {
    return "Review failed subjects and consider academic support.";
  }

  if (student.assignmentCompletion < 60) {
    return "Review assignment completion and discuss study planning.";
  }

  return "Review the student's academic indicators.";
}

// ============================================================
// PRACTITIONER DASHBOARD
// ============================================================

function PractitionerDashboard() {
  const { user } = useAuth();

  const practitionerUid =
    user?.role === "practitioner"
      ? user.uid
      : "";

  // ----------------------------------------------------------
  // FIRESTORE STUDENTS
  // ----------------------------------------------------------

  const {
    data: cohort = [],
    isLoading,
    isError,
    error,
  } = useQuery({
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

  const riskDistribution = useMemo(
    () => getRiskDistribution(cohort),
    [cohort],
  );

  const priorityQueue =
    atRisk.slice(0, 6);

  const tableStudents = useMemo(
    () => cohort.map(toTableStudent),
    [cohort],
  );

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${
          user?.name ?? "Practitioner"
        }`}
        subtitle="Your assigned mentoring cohort and academic risk indicators."
        actions={
          <Button asChild>
            <Link to="/practitioner/at-risk">
              Review at-risk students
            </Link>
          </Button>
        }
      />

      {/* =====================================================
          DATA ERROR
      ====================================================== */}

      {isError && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          Unable to load your assigned students:{" "}
          {error instanceof Error
            ? error.message
            : "Please check Firestore permissions."}
        </div>
      )}

      {/* =====================================================
          STATISTICS
      ====================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Assigned students"
          value={cohort.length}
          icon={Users}
          tone="primary"
        />

        <StatCard
          label="At-risk students"
          value={atRisk.length}
          icon={ShieldAlert}
          tone="highrisk"
        />

        <StatCard
          label="Cohort attendance"
          value={`${averageAttendance}%`}
          icon={CalendarCheck}
          tone="success"
        />

        <StatCard
          label="Interventions"
          value="Not tracked"
          icon={LifeBuoy}
          tone="warning"
        />
      </div>

      {/* =====================================================
          RISK DISTRIBUTION
      ====================================================== */}

      <div className="grid gap-5 xl:grid-cols-[1fr_1.3fr]">
        <SectionCard
          title="Cohort Risk Split"
          description="Recorded risk levels across assigned students"
        >
          {cohort.length > 0 ? (
            <RiskDonut
              data={riskDistribution}
              height={280}
            />
          ) : (
            <div className="grid h-[280px] place-items-center text-center text-sm text-muted-foreground">
              No assigned students available.
            </div>
          )}

          <AIInsight className="mt-4">
            {atRisk.length > 0
              ? `${atRisk.length} assigned students currently have medium, high or critical recorded risk levels. Review the highest-risk cases first.`
              : "No medium, high or critical risk records are currently present in your assigned cohort."}
          </AIInsight>
        </SectionCard>

        {/* Risk trend */}

        <SectionCard
          title="Risk Trend"
          description="Historical risk changes across the cohort"
        >
          <div className="grid h-[330px] place-items-center rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
            <div>
              <p className="font-semibold">
                Historical trend not available yet
              </p>

              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                This chart will display real
                prediction history once sufficient
                timestamped risk records are
                available in Firestore.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* =====================================================
          PRIORITY REVIEW QUEUE
      ====================================================== */}

      <SectionCard
        title="Academic Review Queue"
        description="Students with recorded risk indicators, highest priority first"
      >
        {priorityQueue.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No students currently require
            risk-based review.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {priorityQueue.map(
              (student) => (
                <li
                  key={student.uid}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 py-3.5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold">
                        {student.name}
                      </p>

                      <RiskBadge
                        level={
                          student.riskLevel
                        }
                      />

                      <span className="text-xs text-muted-foreground">
                        Risk {student.riskScore}%
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {getPriorityRecommendation(
                        student,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Main factor:{" "}
                      {student.riskFactors[0]?.factor ??
                        "Not recorded"}{" "}
                      · Last activity:{" "}
                      {student.lastActivity}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    asChild
                  >
                    <Link to="/practitioner/students">
                      View students
                    </Link>
                  </Button>
                </li>
              ),
            )}
          </ul>
        )}
      </SectionCard>

      {/* =====================================================
          STUDENT TABLE
      ====================================================== */}

      <SectionCard
        title="My Students"
        description="Assigned student records and recorded risk scores"
      >
        <StudentTable
          data={tableStudents}
          loading={isLoading}
          basePath="/admin/students"
          pageSize={7}
        />
      </SectionCard>
    </>
  );
}

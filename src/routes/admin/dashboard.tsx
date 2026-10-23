
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
import { useMemo } from "react";

import { RiskDonut, RISK_COLORS } from "@/charts/Charts";
import { PageHeader, SectionCard } from "@/components/shared/Layout";
import { StatCard } from "@/components/shared/StatCard";
import { StudentTable } from "@/components/shared/StudentTable";
import { Button } from "@/components/ui/button";
import type { Student } from "@/data/mockData";
import { useAuth } from "@/lib/auth";
import { greeting } from "@/lib/risk";
import { fetchStudents } from "@/services/api";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — SPARK" },
      {
        name: "description",
        content:
          "Institution-wide student performance and dropout risk overview.",
      },
      {
        property: "og:title",
        content: "Admin Dashboard — SPARK",
      },
    ],
  }),
  component: AdminDashboard,
});

const RISK_LEVELS = [
  "Low",
  "Medium",
  "High",
  "Critical",
] as const;

function validNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function calculateDashboardStats(students: Student[]) {
  const totalStudents = students.length;

  const lowRisk = students.filter(
    (student) => student.riskLevel === "Low",
  ).length;

  const mediumRisk = students.filter(
    (student) => student.riskLevel === "Medium",
  ).length;

  const highRisk = students.filter(
    (student) => student.riskLevel === "High",
  ).length;

  const criticalRisk = students.filter(
    (student) => student.riskLevel === "Critical",
  ).length;

  const atRisk = highRisk + criticalRisk;

  const attendanceValues = students
    .map((student) => student.attendance)
    .filter(validNumber);

  const avgAttendance = attendanceValues.length
    ? attendanceValues.reduce((sum, value) => sum + value, 0) /
      attendanceValues.length
    : null;

  const cgpaValues = students
    .map((student) => student.cgpa)
    .filter(validNumber);

  const avgCgpa = cgpaValues.length
    ? cgpaValues.reduce((sum, value) => sum + value, 0) /
      cgpaValues.length
    : null;

  const requiringAttention = students.filter(
    (student) =>
      student.riskLevel === "High" ||
      student.riskLevel === "Critical" ||
      (validNumber(student.attendance) &&
        student.attendance < 75),
  ).length;

  const riskDistribution = [
    { name: "Low", value: lowRisk },
    { name: "Medium", value: mediumRisk },
    { name: "High", value: highRisk },
    { name: "Critical", value: criticalRisk },
  ];

  return {
    totalStudents,
    lowRisk,
    mediumRisk,
    highRisk,
    criticalRisk,
    atRisk,
    avgAttendance,
    avgCgpa,
    requiringAttention,
    riskDistribution,
  };
}

function calculateRiskFactors(students: Student[]) {
  const factorCounts = new Map<string, number>();

  for (const student of students) {
    const uniqueFactors = new Set(
      student.riskFactors
        .map((factor) => factor.factor?.trim())
        .filter((factor): factor is string => Boolean(factor)),
    );

    for (const factor of uniqueFactors) {
      factorCounts.set(
        factor,
        (factorCounts.get(factor) ?? 0) + 1,
      );
    }
  }

  return [...factorCounts.entries()]
    .map(([factor, count]) => ({ factor, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function AdminDashboard() {
  const { user } = useAuth();

  const {
    data: students = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin", "students", user?.uid],
    queryFn: fetchStudents,
    enabled: user?.role === "admin",
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const stats = useMemo(
    () => calculateDashboardStats(students),
    [students],
  );

  const riskFactors = useMemo(
    () => calculateRiskFactors(students),
    [students],
  );

  const attention = useMemo(
    () =>
      [...students].sort(
        (a, b) => b.riskScore - a.riskScore,
      ),
    [students],
  );

  const isReady = !isLoading && !isError;

  if (user?.role !== "admin") {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="font-semibold text-destructive">
          Access denied
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This dashboard is only available to administrators.
        </p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${
          user.name.split(" ").slice(-1)[0] || "Admin"
        }`}
        subtitle="Institution-wide student performance and dropout risk overview."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? "Refreshing..." : "Refresh data"}
            </Button>

            <Button variant="outline" asChild>
              <Link to="/admin/reports">
                Generate report
              </Link>
            </Button>

            <Button asChild>
              <Link to="/admin/predictions">
                <Sparkles className="size-4" />
                AI predictions
              </Link>
            </Button>
          </>
        }
      />

      {isError && (
        <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <h3 className="font-semibold text-destructive">
            Unable to load student records
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "Please check your Firebase connection and permissions."}
          </p>

          <Button
            className="mt-3"
            variant="outline"
            onClick={() => refetch()}
          >
            Try again
          </Button>
        </div>
      )}

      {/* =====================================================
          REAL FIRESTORE STATISTICS
      ====================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total Students"
          value={
            isReady
              ? stats.totalStudents.toLocaleString()
              : "—"
          }
          icon={Users}
          tone="primary"
        />

        <StatCard
          label="Students At Risk"
          value={
            isReady
              ? stats.atRisk.toLocaleString()
              : "—"
          }
          icon={ShieldAlert}
          tone="highrisk"
        />

        <StatCard
          label="High & Critical Risk"
          value={
            isReady
              ? `${stats.highRisk} / ${stats.criticalRisk}`
              : "—"
          }
          icon={GaugeCircle}
          tone="critical"
        />

        <StatCard
          label="Average Attendance"
          value={
            isReady
              ? stats.avgAttendance === null
                ? "N/A"
                : `${stats.avgAttendance.toFixed(1)}%`
              : "—"
          }
          icon={CalendarCheck}
          tone="success"
        />

        <StatCard
          label="Requiring Attention"
          value={
            isReady
              ? stats.requiringAttention.toLocaleString()
              : "—"
          }
          icon={LifeBuoy}
          tone="warning"
        />
      </div>

      {/* =====================================================
          RISK DISTRIBUTION AND ACADEMIC OVERVIEW
      ====================================================== */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_1fr]">
        <SectionCard
          title="Student Dropout Risk Overview"
          description="Current risk distribution from Firestore student records"
        >
          {isReady && stats.totalStudents > 0 ? (
            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_200px] sm:items-center">
              <RiskDonut data={stats.riskDistribution} />

              <ul className="space-y-2.5">
                {stats.riskDistribution.map((slice, i) => (
                  <li
                    key={slice.name}
                    className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2"
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{
                        background:
                          RISK_COLORS[i % RISK_COLORS.length],
                      }}
                    />

                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground">
                      {slice.name}
                    </span>

                    <span className="shrink-0 font-display text-sm font-bold tabular-nums">
                      {slice.value.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {isLoading
                ? "Loading risk distribution..."
                : isError
                  ? "Risk distribution is unavailable."
                  : "No student records available yet."}
            </p>
          )}

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              [
                "Students Assessed",
                isReady
                  ? stats.totalStudents.toLocaleString()
                  : "—",
              ],
              [
                "Average CGPA",
                isReady
                  ? stats.avgCgpa === null
                    ? "N/A"
                    : stats.avgCgpa.toFixed(2)
                  : "—",
              ],
              [
                "At-Risk Percentage",
                isReady && stats.totalStudents > 0
                  ? `${(
                      (stats.atRisk / stats.totalStudents) *
                      100
                    ).toFixed(1)}%`
                  : "—",
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-muted/40 p-3.5"
              >
                <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <BrainCircuit className="size-3.5 text-primary" />
                  {label}
                </p>

                <p className="mt-1.5 font-display text-xl font-bold tabular-nums text-foreground">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* =================================================
            CURRENT RISK SUMMARY
        ================================================== */}

        <SectionCard
          title="Risk Summary"
          description="Current student risk classification"
        >
          <div className="space-y-4">
            {RISK_LEVELS.map((level, index) => {
              const count =
                stats.riskDistribution[index]?.value ?? 0;

              const percentage =
                stats.totalStudents > 0
                  ? (count / stats.totalStudents) * 100
                  : 0;

              return (
                <div key={level}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {level} Risk
                    </span>

                    <span className="text-muted-foreground">
                      {isReady
                        ? `${count} students (${percentage.toFixed(1)}%)`
                        : "—"}
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${
                          isReady ? percentage : 0
                        }%`,
                        backgroundColor:
                          RISK_COLORS[index],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-sm font-semibold">
              About this overview
            </p>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              These figures represent the current student
              records stored in Firestore. Historical risk
              trends will become available once prediction
              history is integrated.
            </p>
          </div>
        </SectionCard>
      </div>

      {/* =====================================================
          OBSERVED RISK FACTORS
      ====================================================== */}

      <SectionCard
        title="Risk Factors in Student Records"
        description="Most frequently recorded factors across students"
      >
        {isReady && riskFactors.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {riskFactors.map(({ factor, count }) => (
              <div
                key={factor}
                className="rounded-xl border border-border bg-muted/30 p-4"
              >
                <p className="text-sm font-medium">
                  {factor}
                </p>

                <p className="mt-2 font-display text-2xl font-bold text-primary">
                  {count}
                </p>

                <p className="text-xs text-muted-foreground">
                  Student{count !== 1 ? "s" : ""} with this
                  recorded factor
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-sm text-muted-foreground">
            {isLoading
              ? "Loading recorded risk factors..."
              : isError
                ? "Risk factor data is unavailable."
                : "No risk factors have been recorded yet."}
          </p>
        )}
      </SectionCard>

      {/* =====================================================
          STUDENTS REQUIRING ATTENTION
      ====================================================== */}

      <SectionCard
        title="Students Requiring Attention"
        description="Students ranked by their current dropout risk score"
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/students">
              View all
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        }
      >
        <StudentTable
          data={isError ? [] : attention}
          loading={isLoading}
          basePath="/admin/students"
          pageSize={6}
        />
      </SectionCard>
    </>
  );
}

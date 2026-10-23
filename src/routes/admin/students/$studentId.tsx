
import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";
import { AlertCircle, RefreshCw } from "lucide-react";

import { StudentProfileView } from "@/components/shared/StudentProfile";
import { Button } from "@/components/ui/button";
import { type Student } from "@/data/mockData";
import {
  getStudentByStudentId,
  type StudentData,
} from "@/firebase/students";

export const Route = createFileRoute(
  "/admin/students/$studentId",
)({
  head: () => ({
    meta: [
      {
        title: "Student Risk Profile — SPARK",
      },
      {
        name: "description",
        content:
          "Detailed student academic profile, dropout risk, attendance, GPA trends and recommendations.",
      },
      {
        property: "og:title",
        content: "Student Risk Profile — SPARK",
      },
      {
        property: "og:description",
        content:
          "Student academic performance and risk analysis.",
      },
    ],
  }),

  notFoundComponent: StudentNotFound,
  component: AdminStudentDetail,
});

// ============================================================
// MAP FIRESTORE STUDENT TO EXISTING PROFILE VIEW
// ============================================================

function toProfileStudent(
  student: StudentData,
): Student {
  return {
    id: student.studentId,
    name: student.name,
    email: student.email,
    department: student.department,
    semester: student.semester,
    course: student.course,
    mentor: student.mentor,
    phone: student.phone,

    cgpa: student.cgpa,
    previousGpa: student.previousGpa,
    attendance: student.attendance,
    assignments: student.assignments,
    assignmentCompletion: student.assignmentCompletion,
    failedSubjects: student.failedSubjects,
    internalMarks: student.internalMarks,
    lmsActivity: student.lmsActivity,
    participation: student.participation,
    libraryUsage: student.libraryUsage,
    financialStress: student.financialStress,

    riskScore: student.riskScore,
    riskLevel: student.riskLevel,
    confidence: student.confidence,
    riskFactors: student.riskFactors,

    subjects: student.subjects,
    gpaTrend: student.gpaTrend,
    monthlyAttendance: student.monthlyAttendance,
    improvements: student.improvements,
    recommendations: student.recommendations,
    lastActivity: student.lastActivity,
  } as Student;
}

// ============================================================
// STUDENT NOT FOUND
// ============================================================

function StudentNotFound() {
  return (
    <div className="surface grid place-items-center p-12 text-center">
      <h1 className="font-display text-xl font-bold">
        Student not found
      </h1>

      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        We couldn't find a student record with that ID.
      </p>

      <Button className="mt-5" asChild>
        <Link to="/admin/students">
          Back to students
        </Link>
      </Button>
    </div>
  );
}

// ============================================================
// ERROR STATE
// ============================================================

function StudentLoadError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="surface grid place-items-center p-12 text-center">
      <AlertCircle className="mb-4 size-9 text-destructive" />

      <h1 className="font-display text-xl font-bold">
        Unable to load student
      </h1>

      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {message}
      </p>

      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button
          variant="outline"
          onClick={onRetry}
        >
          <RefreshCw className="size-4" />
          Try again
        </Button>

        <Button asChild>
          <Link to="/admin/students">
            Back to students
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// LOADING STATE
// ============================================================

function StudentLoading() {
  return (
    <div className="space-y-4">
      <div className="h-20 animate-pulse rounded-2xl bg-muted" />
      <div className="h-72 animate-pulse rounded-2xl bg-muted" />
      <div className="h-72 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}

// ============================================================
// ADMIN STUDENT DETAIL
// ============================================================

function AdminStudentDetail() {
  const { studentId } = Route.useParams();

  const {
    data: student,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "admin",
      "student-detail",
      studentId,
    ],

    queryFn: () =>
      getStudentByStudentId(studentId),

    enabled: Boolean(studentId),
  });

  if (isLoading) {
    return <StudentLoading />;
  }

  if (isError) {
    return (
      <StudentLoadError
        message={
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while loading the student."
        }
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  if (!student) {
    return <StudentNotFound />;
  }

  return (
    <StudentProfileView
      student={toProfileStudent(student)}
      backTo="/admin/students"
    />
  );
}

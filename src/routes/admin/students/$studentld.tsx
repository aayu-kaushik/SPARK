import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { StudentProfileView } from "@/components/shared/StudentProfile";
import { Button } from "@/components/ui/button";
import { fetchStudent } from "@/services/api";

export const Route = createFileRoute("/admin/students/$studentld")({
  head: () => ({
    meta: [
      { title: "Student Risk Profile — SPARK" },
      {
        name: "description",
        content:
          "Detailed AI dropout prediction for a single student: risk score, contributing factors, attendance, GPA trend and recommended interventions.",
      },
      { property: "og:title", content: "Student Risk Profile — SPARK" },
      { property: "og:description", content: "AI dropout prediction breakdown and intervention plan for one student." },
    ],
  }),
  notFoundComponent: StudentNotFound,
  component: AdminStudentDetail,
});

function StudentNotFound() {
  return (
    <div className="surface grid place-items-center p-12 text-center">
      <h1 className="font-display text-xl font-bold">Student not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        We couldn't find a student with that ID in the demo dataset.
      </p>
      <Button className="mt-5" asChild>
        <Link to="/admin/students">Back to students</Link>
      </Button>
    </div>
  );
}

function AdminStudentDetail() {
  const { studentId } = Route.useParams();
  const { data: student, isLoading } = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => fetchStudent(studentId),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-20 animate-pulse rounded-2xl bg-muted" />
        <div className="h-72 animate-pulse rounded-2xl bg-muted" />
        <div className="h-72 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!student) return <StudentNotFound />;

  return <StudentProfileView student={student} backTo="/admin/students" />;
}


import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";
import { AlertCircle, RefreshCw } from "lucide-react";

import { StudentProfileView } from "@/components/shared/StudentProfile";
import { Button } from "@/components/ui/button";
import { getStudentForPractitioner } from "@/firebase/students";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute(
  "/practitioner/students/$studentId",
)({
  head: () => ({
    meta: [
      {
        title: "Student Profile — SPARK",
      },
      {
        name: "description",
        content:
          "Academic profile and risk assessment for an assigned student.",
      },
    ],
  }),
  component: PractitionerStudentDetail,
});

function PractitionerStudentDetail() {
  const { studentId } = Route.useParams();
  const { user } = useAuth();

  const practitionerUid =
    user?.role === "practitioner"
      ? user.uid
      : "";

  const {
    data: student,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "practitioner",
      "student-detail",
      practitionerUid,
      studentId,
    ],
    queryFn: () =>
      getStudentForPractitioner(
        studentId,
        practitionerUid,
      ),
    enabled: Boolean(
      practitionerUid && studentId,
    ),
  });

  if (!practitionerUid) {
    return (
      <div className="surface p-8 text-center">
        <h1 className="font-display text-xl font-bold">
          Access unavailable
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          A practitioner account is required
          to view this page.
        </p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="space-y-4">
        <div className="h-20 animate-pulse rounded-2xl bg-muted" />
        <div className="h-72 animate-pulse rounded-2xl bg-muted" />
        <div className="h-72 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="surface p-8 text-center">
        <AlertCircle className="mx-auto mb-3 size-8 text-destructive" />

        <h1 className="font-display text-xl font-bold">
          Unable to load student
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error
            ? error.message
            : "An unexpected error occurred."}
        </p>

        <Button
          variant="outline"
          className="mt-5"
          onClick={() => void refetch()}
        >
          <RefreshCw className="size-4" />
          Try again
        </Button>
      </div>
    );
  }

  if (
    !student ||
    student.mentorId !== practitionerUid
  ) {
    return (
      <div className="surface p-8 text-center">
        <h1 className="font-display text-xl font-bold">
          Student unavailable
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          This student was not found or is
          not assigned to you.
        </p>

        <Button className="mt-5" asChild>
          <Link to="/practitioner/students">
            Back to my students
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <StudentProfileView
      student={student}
      backTo="/practitioner/students"
    />
  );
}

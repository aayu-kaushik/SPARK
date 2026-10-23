
import { createFileRoute } from "@tanstack/react-router";

import { PractitionerPage } from "@/components/pages/PractitionerPages";

export const Route = createFileRoute("/practitioner/students")({
  head: () => ({
    meta: [
      {
        title: "My Students — SPARK",
      },
      {
        name: "description",
        content:
          "View assigned students, academic performance, attendance, and available dropout risk assessments.",
      },
      {
        property: "og:title",
        content: "My Students — SPARK",
      },
      {
        property: "og:description",
        content:
          "Academic records and risk assessments for students assigned to the current practitioner.",
      },
    ],
  }),

  component: PractitionerStudents,
});

function PractitionerStudents() {
  return (
    <PractitionerPage
      kind="table"
      title="My Students"
      subtitle="Monitor academic performance and risk assessments for your assigned students."
    />
  );
}

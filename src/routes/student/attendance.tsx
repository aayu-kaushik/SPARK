import { createFileRoute } from "@tanstack/react-router";

import { StudentPage } from "@/components/pages/StudentPages";

export const Route = createFileRoute("/student/attendance")({
  head: () => ({
    meta: [
      { title: "My Attendance — SPARK" },
      { name: "description", content: "Subject-wise and monthly attendance with eligibility warnings." },
      { property: "og:title", content: "My Attendance — SPARK" },
      { property: "og:description", content: "Subject-wise and monthly attendance with eligibility warnings." },
    ],
  }),
  component: () => <StudentPage kind="attendance" title="My Attendance" subtitle="Subject-wise and monthly attendance with eligibility warnings." />,
});

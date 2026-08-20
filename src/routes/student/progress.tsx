import { createFileRoute } from "@tanstack/react-router";

import { StudentPage } from "@/components/pages/StudentPages";

export const Route = createFileRoute("/student/progress")({
  head: () => ({
    meta: [
      { title: "Academic Progress — SPARK" },
      { name: "description", content: "Semester-by-semester academic progress and subject marks." },
      { property: "og:title", content: "Academic Progress — SPARK" },
      { property: "og:description", content: "Semester-by-semester academic progress and subject marks." },
    ],
  }),
  component: () => <StudentPage kind="progress" title="Academic Progress" subtitle="Semester-by-semester academic progress and subject marks." />,
});

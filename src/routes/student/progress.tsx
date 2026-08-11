import { createFileRoute } from "@tanstack/react-router";

import { StudentPage } from "@/components/pages/StudentPages";

export const Route = createFileRoute("/student/progress")({
  head: () => ({
    meta: [
      { title: "Academic Progress — EduPredict AI" },
      { name: "description", content: "Semester-by-semester academic progress and subject marks." },
      { property: "og:title", content: "Academic Progress — EduPredict AI" },
      { property: "og:description", content: "Semester-by-semester academic progress and subject marks." },
    ],
  }),
  component: () => <StudentPage kind="progress" title="Academic Progress" subtitle="Semester-by-semester academic progress and subject marks." />,
});

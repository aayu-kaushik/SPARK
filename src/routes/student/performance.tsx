import { createFileRoute } from "@tanstack/react-router";

import { StudentPage } from "@/components/pages/StudentPages";

export const Route = createFileRoute("/student/performance")({
  head: () => ({
    meta: [
      { title: "My Performance — SPARK" },
      { name: "description", content: "GPA, marks and assignment performance over time." },
      { property: "og:title", content: "My Performance — SPARK" },
      { property: "og:description", content: "GPA, marks and assignment performance over time." },
    ],
  }),
  component: () => <StudentPage kind="performance" title="My Performance" subtitle="GPA, marks and assignment performance over time." />,
});

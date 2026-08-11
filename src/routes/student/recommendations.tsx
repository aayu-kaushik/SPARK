import { createFileRoute } from "@tanstack/react-router";

import { StudentPage } from "@/components/pages/StudentPages";

export const Route = createFileRoute("/student/recommendations")({
  head: () => ({
    meta: [
      { title: "Recommendations — EduPredict AI" },
      { name: "description", content: "Personalised AI suggestions to improve your academic outcome." },
      { property: "og:title", content: "Recommendations — EduPredict AI" },
      { property: "og:description", content: "Personalised AI suggestions to improve your academic outcome." },
    ],
  }),
  component: () => <StudentPage kind="recommendations" title="Recommendations" subtitle="Personalised AI suggestions to improve your academic outcome." />,
});

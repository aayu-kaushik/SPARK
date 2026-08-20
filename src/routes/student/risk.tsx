import { createFileRoute } from "@tanstack/react-router";

import { StudentPage } from "@/components/pages/StudentPages";

export const Route = createFileRoute("/student/risk")({
  head: () => ({
    meta: [
      { title: "My Risk Score — SPARK" },
      { name: "description", content: "Your AI dropout risk score explained, with steps to improve it." },
      { property: "og:title", content: "My Risk Score — SPARK" },
      { property: "og:description", content: "Your AI dropout risk score explained, with steps to improve it." },
    ],
  }),
  component: () => <StudentPage kind="risk" title="My Risk Score" subtitle="Your AI dropout risk score explained, with steps to improve it." />,
});

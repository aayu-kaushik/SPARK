import { createFileRoute } from "@tanstack/react-router";

import { StudentPage } from "@/components/pages/StudentPages";

export const Route = createFileRoute("/student/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard — SPARK" },
      { name: "description", content: "Your academic snapshot, risk score and personalised AI recommendations." },
      { property: "og:title", content: "My Dashboard — SPARK" },
      { property: "og:description", content: "Your academic snapshot, risk score and personalised AI recommendations." },
    ],
  }),
  component: () => <StudentPage kind="dashboard" title="My Dashboard" subtitle="Your academic snapshot, risk score and personalised AI recommendations." />,
});

import { createFileRoute } from "@tanstack/react-router";

import { PractitionerPage } from "@/components/pages/PractitionerPages";

export const Route = createFileRoute("/practitioner/predictions")({
  head: () => ({
    meta: [
      { title: "AI Predictions — SPARK" },
      { name: "description", content: "Simulate dropout risk for any student profile." },
      { property: "og:title", content: "AI Predictions — SPARK" },
      { property: "og:description", content: "Simulate dropout risk for any student profile." },
    ],
  }),
  component: () => <PractitionerPage kind="sim" title="AI Predictions" subtitle="Simulate dropout risk for any student profile." />,
});

import { createFileRoute } from "@tanstack/react-router";

import { PractitionerPage } from "@/components/pages/PractitionerPages";

export const Route = createFileRoute("/practitioner/students")({
  head: () => ({
    meta: [
      { title: "My Students — SPARK" },
      { name: "description", content: "Every student assigned to you with live AI risk scores." },
      { property: "og:title", content: "My Students — SPARK" },
      { property: "og:description", content: "Every student assigned to you with live AI risk scores." },
    ],
  }),
  component: () => <PractitionerPage kind="table" title="My Students" subtitle="Every student assigned to you with live AI risk scores." />,
});

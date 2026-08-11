import { createFileRoute } from "@tanstack/react-router";

import { PractitionerPage } from "@/components/pages/PractitionerPages";

export const Route = createFileRoute("/practitioner/reports")({
  head: () => ({
    meta: [
      { title: "Reports — EduPredict AI" },
      { name: "description", content: "Export cohort risk and intervention summaries." },
      { property: "og:title", content: "Reports — EduPredict AI" },
      { property: "og:description", content: "Export cohort risk and intervention summaries." },
    ],
  }),
  component: () => <PractitionerPage kind="reports" title="Reports" subtitle="Export cohort risk and intervention summaries." />,
});

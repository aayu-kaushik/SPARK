import { createFileRoute } from "@tanstack/react-router";

import { PractitionerPage } from "@/components/pages/PractitionerPages";

export const Route = createFileRoute("/practitioner/performance")({
  head: () => ({
    meta: [
      { title: "Student Performance — SPARK" },
      { name: "description", content: "Cohort attendance and academic performance trends." },
      { property: "og:title", content: "Student Performance — SPARK" },
      { property: "og:description", content: "Cohort attendance and academic performance trends." },
    ],
  }),
  component: () => <PractitionerPage kind="perf" title="Student Performance" subtitle="Cohort attendance and academic performance trends." />,
});

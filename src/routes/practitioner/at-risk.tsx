import { createFileRoute } from "@tanstack/react-router";

import { PractitionerPage } from "@/components/pages/PractitionerPages";

export const Route = createFileRoute("/practitioner/at-risk")({
  head: () => ({
    meta: [
      { title: "At-Risk Students — SPARK" },
      { name: "description", content: "Students predicted Medium risk or above, ranked by dropout probability." },
      { property: "og:title", content: "At-Risk Students — SPARK" },
      { property: "og:description", content: "Students predicted Medium risk or above, ranked by dropout probability." },
    ],
  }),
  component: () => <PractitionerPage kind="atrisk" title="At-Risk Students" subtitle="Students predicted Medium risk or above, ranked by dropout probability." />,
});

import { createFileRoute } from "@tanstack/react-router";

import { PractitionerPage } from "@/components/pages/PractitionerPages";

export const Route = createFileRoute("/practitioner/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — SPARK" },
      { name: "description", content: "Your practitioner account and mentoring caseload." },
      { property: "og:title", content: "My Profile — SPARK" },
      { property: "og:description", content: "Your practitioner account and mentoring caseload." },
    ],
  }),
  component: () => <PractitionerPage kind="profile" title="My Profile" subtitle="Your practitioner account and mentoring caseload." />,
});

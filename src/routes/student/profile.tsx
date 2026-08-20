import { createFileRoute } from "@tanstack/react-router";

import { StudentPage } from "@/components/pages/StudentPages";

export const Route = createFileRoute("/student/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — SPARK" },
      { name: "description", content: "Your student profile, course details and assigned mentor." },
      { property: "og:title", content: "My Profile — SPARK" },
      { property: "og:description", content: "Your student profile, course details and assigned mentor." },
    ],
  }),
  component: () => <StudentPage kind="profile" title="My Profile" subtitle="Your student profile, course details and assigned mentor." />,
});

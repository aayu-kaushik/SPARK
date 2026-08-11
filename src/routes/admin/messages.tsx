import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/shared/Layout";
import { MessagePanel } from "@/components/shared/MessagePanel";

export const Route = createFileRoute("/admin/messages")({
  head: () => ({
    meta: [
      { title: "Messages — EduPredict AI" },
      {
        name: "description",
        content: "Coordinate with practitioners and students about interventions from one institutional inbox.",
      },
      { property: "og:title", content: "Messages — EduPredict AI" },
      { property: "og:description", content: "Institutional messaging between admins, mentors and students." },
    ],
  }),
  component: () => (
    <>
      <PageHeader title="Messages" subtitle="Coordinate interventions with practitioners and students." />
      <MessagePanel role="admin" />
    </>
  ),
});

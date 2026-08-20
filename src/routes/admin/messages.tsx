import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/shared/Layout";
import { MessagePanel } from "@/components/shared/MessagePanel";

export const Route = createFileRoute("/admin/messages")({
  head: () => ({
    meta: [
      { title: "Messages — SPARK" },
      {
        name: "description",
        content: "Coordinate with practitioners and students about interventions from one institutional inbox.",
      },
      { property: "og:title", content: "Messages — SPARK" },
      { property: "og:description", content: "Institutional messaging between admins, mentors and students." },
    ],
  }),
  component: () => (
    <>
      <PageHeader title="Messages" subtitle="Coordinate interventions with practitioners and students." />
      <MessagePanel />
    </>
  ),
});

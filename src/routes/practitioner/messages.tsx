import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/shared/Layout";
import { MessagePanel } from "@/components/shared/MessagePanel";

export const Route = createFileRoute("/practitioner/messages")({
  head: () => ({
    meta: [
      { title: "Messages — SPARK" },
      { name: "description", content: "Secure messaging between mentors and students about academic support." },
      { property: "og:title", content: "Messages — SPARK" },
      { property: "og:description", content: "Secure mentor and student messaging." },
    ],
  }),
  component: () => (
    <>
      <PageHeader title="Messages" subtitle="Stay in touch about academic support and interventions." />
      <MessagePanel />
    </>
  ),
});

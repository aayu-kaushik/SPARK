import { createFileRoute, Navigate } from "@tanstack/react-router";

import { ROLE_HOME, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SPARK — Student Performance and Risk Knowledgebase" },
      {
        name: "description",
        content:
          "Sign in to SPARK to monitor dropout risk, review AI predictions and support at-risk students early.",
      },
      { property: "og:title", content: "SPARK — Student Performance and Risk Knowledgebase" },
      {
        property: "og:description",
        content: "Institutional dashboards for administrators, practitioners and students.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, ready } = useAuth();

  if (!ready) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user ? ROLE_HOME[user.role] : "/login"} replace />;
}

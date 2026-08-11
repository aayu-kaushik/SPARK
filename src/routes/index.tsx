import { createFileRoute, Navigate } from "@tanstack/react-router";

import { ROLE_HOME, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EduPredict AI — AI-Powered Student Success & Dropout Prediction" },
      {
        name: "description",
        content:
          "Sign in to EduPredict AI to monitor dropout risk, review AI predictions and support at-risk students early.",
      },
      { property: "og:title", content: "EduPredict AI — AI-Powered Student Success" },
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
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <Navigate to={user ? ROLE_HOME[user.role] : "/login"} replace />;
}

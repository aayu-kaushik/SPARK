import { createFileRoute, Outlet } from "@tanstack/react-router";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export const Route = createFileRoute("/student")({
  component: () => (
    <DashboardLayout role="student">
      <Outlet />
    </DashboardLayout>
  ),
});

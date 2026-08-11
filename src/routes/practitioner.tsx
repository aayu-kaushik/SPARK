import { createFileRoute, Outlet } from "@tanstack/react-router";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export const Route = createFileRoute("/practitioner")({
  component: () => (
    <DashboardLayout role="practitioner">
      <Outlet />
    </DashboardLayout>
  ),
});

import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useRouterState } from "@tanstack/react-router";

import { Sidebar, NAV_BY_ROLE } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { ROLE_HOME, useAuth, type Role } from "@/lib/auth";
export function DashboardLayout({ role, children }: { role: Role; children: ReactNode }) {
  const { user, ready } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading your workspace…
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={ROLE_HOME[user.role]} replace />;

  const nav = NAV_BY_ROLE[role];
  const current =
    [...nav].sort((a, b) => b.to.length - a.to.length).find((i) => pathname.startsWith(i.to))?.label ?? "Dashboard";

  return (
    <div className="min-h-screen bg-background">
      <Sidebar role={role} open={open} onClose={() => setOpen(false)} />
      <div className="flex min-h-screen flex-col lg:pl-[272px]">
        <Topbar title={current} onMenu={() => setOpen(true)} />
        <main className="flex-1 space-y-6 p-4 sm:p-6">{children}</main>
        <footer className="border-t border-border px-6 py-4 text-xs text-muted-foreground">
          EduPredict AI · Predictive Student Success Platform · Model v3.2.1 · Frontend demo with simulated
          predictions
        </footer>
      </div>
    </div>
  );
}

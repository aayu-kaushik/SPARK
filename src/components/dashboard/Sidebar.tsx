import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpenCheck,
  Brain,
  CalendarCheck,
  FileBarChart,
  GaugeCircle,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  LogOut,
  MessageSquare,
  Settings,
  ShieldAlert,
  Sparkles,
  UserCircle,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ROLE_LABEL, useAuth, type Role } from "@/lib/auth";
import { initials } from "@/lib/risk";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  admin: [
    { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Students", to: "/admin/students", icon: Users },
    { label: "Dropout Predictions", to: "/admin/predictions", icon: Brain },
    { label: "Risk Analytics", to: "/admin/analytics", icon: BarChart3 },
    { label: "Practitioners", to: "/admin/practitioners", icon: UsersRound },
    { label: "Messages", to: "/admin/messages", icon: MessageSquare },
    { label: "Reports", to: "/admin/reports", icon: FileBarChart },
    { label: "Settings", to: "/admin/settings", icon: Settings },
  ],
  practitioner: [
    { label: "Dashboard", to: "/practitioner/dashboard", icon: LayoutDashboard },
    { label: "My Students", to: "/practitioner/students", icon: Users },
    { label: "At-Risk Students", to: "/practitioner/at-risk", icon: ShieldAlert },
    { label: "AI Predictions", to: "/practitioner/predictions", icon: Brain },
    { label: "Messages", to: "/practitioner/messages", icon: MessageSquare },
    { label: "Student Performance", to: "/practitioner/performance", icon: LineChart },
    { label: "Reports", to: "/practitioner/reports", icon: FileBarChart },
    { label: "Profile", to: "/practitioner/profile", icon: UserCircle },
  ],
  student: [
    { label: "Dashboard", to: "/student/dashboard", icon: LayoutDashboard },
    { label: "My Performance", to: "/student/performance", icon: LineChart },
    { label: "My Risk Score", to: "/student/risk", icon: GaugeCircle },
    { label: "Attendance", to: "/student/attendance", icon: CalendarCheck },
    { label: "Academic Progress", to: "/student/progress", icon: BookOpenCheck },
    { label: "Messages", to: "/student/messages", icon: MessageSquare },
    { label: "Recommendations", to: "/student/recommendations", icon: Sparkles },
    { label: "Profile", to: "/student/profile", icon: UserCircle },
  ],
};

export function Sidebar({
  role,
  open,
  onClose,
}: {
  role: Role;
  open: boolean;
  onClose: () => void;
}) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = NAV_BY_ROLE[role];

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-sidebar-border px-5">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-card">
              <GraduationCap className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-[15px] font-bold leading-tight text-sidebar-foreground">
                EduPredict AI
              </span>
              <span className="block truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                Student Success
              </span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-sidebar-accent lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="scrollbar-slim flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {ROLE_LABEL[role]} workspace
          </p>
          {items.map((item) => {
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--sidebar-primary)]"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon
                  className={cn(
                    "size-[18px] shrink-0 transition-transform group-hover:scale-110",
                    active ? "text-sidebar-primary" : "text-muted-foreground",
                  )}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-xl bg-muted/60 px-3 py-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              {initials(user?.name ?? "EP")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">{user?.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{ROLE_LABEL[role]}</p>
            </div>
          </div>
          <button
            onClick={() => {
              void signOut().then(() => navigate({ to: "/login", replace: true }));
            }}
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-critical-soft hover:text-critical"
          >
            <LogOut className="size-[18px]" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

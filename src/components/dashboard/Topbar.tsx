import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  BellRing,
  CalendarClock,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
  TriangleAlert,
  UserCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { notifications, students } from "@/data/mockData";
import { ROLE_LABEL, useAuth } from "@/lib/auth";
import { initials } from "@/lib/risk";
import { cn } from "@/lib/utils";

const typeIcon = {
  ai: Sparkles,
  message: MessageSquare,
  alert: TriangleAlert,
  deadline: CalendarClock,
} as const;

export function Topbar({ title, onMenu }: { title: string; onMenu: () => void }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [read, setRead] = useState<string[]>([]);

  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    const q = query.toLowerCase();
    return students
      .filter((s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
      .slice(0, 5);
  }, [query]);

  const unread = notifications.filter((n) => n.unread && !read.includes(n.id)).length;
  const isStudent = user?.role === "student";
  const messagesPath = user?.role === "admin" ? "/admin/messages" : isStudent ? "/student/messages" : "/practitioner/messages";
  const profilePath = user?.role === "admin" ? "/admin/settings" : isStudent ? "/student/profile" : "/practitioner/profile";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          onClick={onMenu}
          className="grid size-9 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-4.5" />
        </button>

        <h2 className="min-w-0 flex-1 truncate font-display text-lg font-semibold text-foreground">{title}</h2>

        {!isStudent && (
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students…"
              className="w-56 rounded-xl bg-muted/60 pl-9 lg:w-72"
            />
            {results.length > 0 && (
              <div className="surface absolute right-0 top-12 z-40 w-80 overflow-hidden p-1.5">
                {results.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setQuery("");
                      navigate({
                        to: user?.role === "admin" ? "/admin/students/$id" : "/practitioner/students",
                        params: { id: s.id },
                      });
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-muted"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/12 text-[11px] font-bold text-primary">
                      {initials(s.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{s.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {s.id} · {s.department}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-muted-foreground">{s.riskScore}%</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <Popover>
          <PopoverTrigger asChild>
            <button
              className="relative grid size-9 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Notifications"
            >
              {unread > 0 ? <BellRing className="size-4.5" /> : <Bell className="size-4.5" />}
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 grid size-4.5 place-items-center rounded-full bg-critical text-[10px] font-bold text-critical-foreground">
                  {unread}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[340px] p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="font-display text-sm font-semibold">Notifications</p>
              <button
                onClick={() => setRead(notifications.map((n) => n.id))}
                className="text-xs font-medium text-primary hover:underline"
              >
                Mark all read
              </button>
            </div>
            <div className="scrollbar-slim max-h-80 overflow-y-auto">
              {notifications.map((n) => {
                const Icon = typeIcon[n.type];
                const isUnread = n.unread && !read.includes(n.id);
                return (
                  <button
                    key={n.id}
                    onClick={() => setRead((r) => [...r, n.id])}
                    className={cn(
                      "flex w-full gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-muted/60",
                      isUnread && "bg-primary-soft/40",
                    )}
                  >
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">{n.title}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{n.body}</span>
                      <span className="mt-1 block text-[11px] text-muted-foreground">{n.time}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        <Link
          to={messagesPath}
          className="relative grid size-9 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Messages"
        >
          <MessageSquare className="size-4.5" />
          <span className="absolute -right-1 -top-1 grid size-4.5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            3
          </span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex shrink-0 items-center gap-2.5 rounded-xl border border-border px-2 py-1.5 transition-colors hover:bg-muted">
              <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {initials(user?.name ?? "EP")}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block max-w-[140px] truncate text-sm font-semibold leading-tight">{user?.name}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {user ? ROLE_LABEL[user.role] : ""}
                </span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-xs font-normal text-muted-foreground">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: profilePath })}>
              <UserCircle className="size-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                user?.role === "admin"
                  ? navigate({ to: "/admin/settings" })
                  : toast.info("Preferences", { description: "Settings are managed by your administrator." })
              }
            >
              <Settings className="size-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                signOut();
                toast.success("Signed out", { description: "You have been logged out securely." });
              }}
              className="text-critical focus:text-critical"
            >
              <LogOut className="size-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export function TopbarActions() {
  return <Button variant="outline" size="sm">Action</Button>;
}

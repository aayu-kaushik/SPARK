import { Link } from "@tanstack/react-router";
import { ArrowUpDown, ChevronLeft, ChevronRight, Eye, MessageSquare, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { RiskBadge, RiskBar } from "@/components/shared/RiskBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DEPARTMENTS, type Student } from "@/data/mockData";
import { initials } from "@/lib/risk";
import { cn } from "@/lib/utils";

type SortKey = "risk" | "attendance" | "cgpa" | "name";

export function StudentTable({
  data,
  loading,
  basePath,
  pageSize = 8,
  showFilters = true,
  extraAction,
}: {
  data: Student[];
  loading?: boolean;
  /** Route used for the detail link, e.g. "/admin/students". */
  basePath: "/admin/students";
  pageSize?: number;
  showFilters?: boolean;
  extraAction?: (student: Student) => React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("all");
  const [semester, setSemester] = useState("all");
  const [risk, setRisk] = useState("all");
  const [sort, setSort] = useState<SortKey>("risk");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = data.filter((s) => {
      const matchQ = !q || s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
      const matchD = dept === "all" || s.department === dept;
      const matchS = semester === "all" || String(s.semester) === semester;
      const matchR = risk === "all" || s.riskLevel === risk;
      return matchQ && matchD && matchS && matchR;
    });
    return rows.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "attendance") return a.attendance - b.attendance;
      if (sort === "cgpa") return a.cgpa - b.cgpa;
      return b.riskScore - a.riskScore;
    });
  }, [data, query, dept, semester, risk, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize);

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, ID or email…"
              className="rounded-xl bg-muted/50 pl-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Select value={dept} onValueChange={(v) => { setDept(v); setPage(1); }}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={semester} onValueChange={(v) => { setSemester(v); setPage(1); }}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Semester" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All semesters</SelectItem>
                {[3, 4, 5, 6].map((s) => (
                  <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={risk} onValueChange={(v) => { setRisk(v); setPage(1); }}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Risk" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All risk levels</SelectItem>
                {["Low", "Medium", "High", "Critical"].map((r) => (
                  <SelectItem key={r} value={r}>{r} risk</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="rounded-xl">
                <ArrowUpDown className="size-3.5 text-muted-foreground" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="risk">Highest risk</SelectItem>
                <SelectItem value="attendance">Lowest attendance</SelectItem>
                <SelectItem value="cgpa">Lowest CGPA</SelectItem>
                <SelectItem value="name">Name (A–Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="scrollbar-slim -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[940px] border-separate border-spacing-y-1.5 text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 pb-2 font-semibold">Student</th>
              <th className="px-3 pb-2 font-semibold">Student ID</th>
              <th className="px-3 pb-2 font-semibold">Department</th>
              <th className="px-3 pb-2 font-semibold">Attendance</th>
              <th className="px-3 pb-2 font-semibold">CGPA</th>
              <th className="px-3 pb-2 font-semibold">Risk Score</th>
              <th className="px-3 pb-2 font-semibold">Risk Level</th>
              <th className="px-3 pb-2 font-semibold">Last Activity</th>
              <th className="px-3 pb-2 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={9} className="px-3 py-2">
                    <Skeleton className="h-12 w-full rounded-xl" />
                  </td>
                </tr>
              ))}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={9} className="rounded-xl bg-muted/40 px-3 py-10 text-center text-muted-foreground">
                  No students match the current filters.
                </td>
              </tr>
            )}

            {!loading &&
              rows.map((s) => (
                <tr key={s.id} className="group bg-card transition-colors hover:bg-muted/50">
                  <td className="rounded-l-xl border-y border-l border-border px-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/12 text-[11px] font-bold text-primary">
                        {initials(s.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{s.name}</p>
                        <p className="truncate text-xs text-muted-foreground">Semester {s.semester}</p>
                      </div>
                    </div>
                  </td>
                  <td className="border-y border-border px-3 py-3 font-mono text-xs text-muted-foreground">{s.id}</td>
                  <td className="border-y border-border px-3 py-3 text-muted-foreground">{s.department}</td>
                  <td className="border-y border-border px-3 py-3">
                    <span className={cn("font-semibold tabular-nums", s.attendance < 75 ? "text-highrisk" : "text-success")}>
                      {s.attendance}%
                    </span>
                  </td>
                  <td className="border-y border-border px-3 py-3 font-semibold tabular-nums">{s.cgpa.toFixed(1)}</td>
                  <td className="border-y border-border px-3 py-3"><RiskBar score={s.riskScore} /></td>
                  <td className="border-y border-border px-3 py-3"><RiskBadge level={s.riskLevel} size="sm" /></td>
                  <td className="border-y border-border px-3 py-3 text-xs text-muted-foreground">{s.lastActivity}</td>
                  <td className="rounded-r-xl border-y border-r border-border px-3 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            to={`${basePath}/$id`}
                            params={{ id: s.id }}
                            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-primary-soft hover:text-primary"
                          >
                            <Eye className="size-4" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>View student</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => toast.success(`Message drafted to ${s.name}`, { description: "Open Messages to continue the conversation." })}
                            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-primary-soft hover:text-primary"
                          >
                            <MessageSquare className="size-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Message</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            to={`${basePath}/$id`}
                            params={{ id: s.id }}
                            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-primary-soft hover:text-primary"
                          >
                            <Sparkles className="size-4" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>View AI prediction</TooltipContent>
                      </Tooltip>
                      {extraAction?.(s)}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Showing {rows.length} of {filtered.length} students
        </p>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" disabled={current === 1} onClick={() => setPage(current - 1)}>
            <ChevronLeft className="size-4" /> Prev
          </Button>
          {Array.from({ length: pages }).slice(0, 5).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={cn(
                "size-8 rounded-lg text-xs font-semibold transition-colors",
                current === i + 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {i + 1}
            </button>
          ))}
          <Button variant="outline" size="sm" disabled={current === pages} onClick={() => setPage(current + 1)}>
            Next <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

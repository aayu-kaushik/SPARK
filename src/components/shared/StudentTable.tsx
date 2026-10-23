
import { Link } from "@tanstack/react-router";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageSquare,
  Search,
  Sparkles,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import {
  RiskBadge,
  RiskBar,
} from "@/components/shared/RiskBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DEPARTMENTS,
  type Student,
} from "@/data/mockData";
import { initials } from "@/lib/risk";
import { cn } from "@/lib/utils";

type SortKey =
  | "risk"
  | "attendance"
  | "cgpa"
  | "name";

type StudentTableProps = {
  data: Student[];
  loading?: boolean;
  basePath: "/admin/students";
  pageSize?: number;
  showFilters?: boolean;
  extraAction?: (student: Student) => ReactNode;
};

export function StudentTable({
  data,
  loading = false,
  basePath,
  pageSize = 8,
  showFilters = true,
  extraAction,
}: StudentTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [semester, setSemester] = useState("all");
  const [risk, setRisk] = useState("all");
  const [sort, setSort] = useState<SortKey>("risk");
  const [page, setPage] = useState(1);

  // =========================================================
  // FILTER OPTIONS
  // =========================================================

  const departments = useMemo(() => {
    const values = new Set<string>(DEPARTMENTS);

    data.forEach((student) => {
      if (student.department) {
        values.add(student.department);
      }
    });

    return Array.from(values).sort();
  }, [data]);

  const semesters = useMemo(() => {
    const values = new Set<number>();

    for (let value = 1; value <= 12; value++) {
      values.add(value);
    }

    data.forEach((student) => {
      if (student.semester > 0) {
        values.add(student.semester);
      }
    });

    return Array.from(values).sort((a, b) => a - b);
  }, [data]);

  // =========================================================
  // FILTERING AND SORTING
  // =========================================================

  const filtered = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    const matchingStudents = data.filter((student) => {
      const matchesSearch =
        !search ||
        student.name.toLowerCase().includes(search) ||
        student.id.toLowerCase().includes(search) ||
        student.email.toLowerCase().includes(search);

      const matchesDepartment =
        department === "all" ||
        student.department === department;

      const matchesSemester =
        semester === "all" ||
        String(student.semester) === semester;

      const matchesRisk =
        risk === "all" ||
        student.riskLevel === risk;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesSemester &&
        matchesRisk
      );
    });

    return matchingStudents.sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name);

        case "attendance":
          return a.attendance - b.attendance;

        case "cgpa":
          return a.cgpa - b.cgpa;

        case "risk":
        default:
          return b.riskScore - a.riskScore;
      }
    });
  }, [
    data,
    searchQuery,
    department,
    semester,
    risk,
    sort,
  ]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const safePageSize = Math.max(
    1,
    Math.floor(pageSize) || 1,
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / safePageSize),
  );

  const currentPage = Math.min(
    Math.max(1, page),
    totalPages,
  );

  const startIndex =
    (currentPage - 1) * safePageSize;

  const rows = filtered.slice(
    startIndex,
    startIndex + safePageSize,
  );

  const visiblePages = useMemo(() => {
    const maxVisible = 5;

    const start = Math.max(
      1,
      Math.min(
        currentPage - 2,
        totalPages - maxVisible + 1,
      ),
    );

    const end = Math.min(
      totalPages,
      start + maxVisible - 1,
    );

    return Array.from(
      { length: end - start + 1 },
      (_, index) => start + index,
    );
  }, [currentPage, totalPages]);

  // =========================================================
  // NAVIGATION
  // =========================================================

  const studentDetailPath =
    `${basePath}/$studentId` as const;

  // =========================================================
  // MESSAGE ACTION
  // =========================================================

  function handleMessage(student: Student) {
    toast.info("Open Messages to contact this student", {
      description:
        `No message has been sent to ${student.name}.`,
    });
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-4">
      {/* =====================================================
          SEARCH AND FILTERS
      ====================================================== */}

      {showFilters && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Search */}

          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search by name, ID or email…"
              className="rounded-xl bg-muted/50 pl-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {/* Department */}

            <Select
              value={department}
              onValueChange={(value) => {
                setDepartment(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Department" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  All departments
                </SelectItem>

                {departments.map((item) => (
                  <SelectItem
                    key={item}
                    value={item}
                  >
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Semester */}

            <Select
              value={semester}
              onValueChange={(value) => {
                setSemester(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  All semesters
                </SelectItem>

                {semesters.map((value) => (
                  <SelectItem
                    key={value}
                    value={String(value)}
                  >
                    Semester {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Risk level */}

            <Select
              value={risk}
              onValueChange={(value) => {
                setRisk(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Risk" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  All risk levels
                </SelectItem>

                {[
                  "Low",
                  "Medium",
                  "High",
                  "Critical",
                ].map((level) => (
                  <SelectItem
                    key={level}
                    value={level}
                  >
                    {level} risk
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sorting */}

            <Select
              value={sort}
              onValueChange={(value) => {
                setSort(value as SortKey);
                setPage(1);
              }}
            >
              <SelectTrigger className="rounded-xl">
                <ArrowUpDown className="size-3.5 text-muted-foreground" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="risk">
                  Highest risk
                </SelectItem>

                <SelectItem value="attendance">
                  Lowest attendance
                </SelectItem>

                <SelectItem value="cgpa">
                  Lowest CGPA
                </SelectItem>

                <SelectItem value="name">
                  Name (A–Z)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* =====================================================
          STUDENT TABLE
      ====================================================== */}

      <div className="scrollbar-slim -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[940px] border-separate border-spacing-y-1.5 text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 pb-2 font-semibold">
                Student
              </th>

              <th className="px-3 pb-2 font-semibold">
                Student ID
              </th>

              <th className="px-3 pb-2 font-semibold">
                Department
              </th>

              <th className="px-3 pb-2 font-semibold">
                Attendance
              </th>

              <th className="px-3 pb-2 font-semibold">
                CGPA
              </th>

              <th className="px-3 pb-2 font-semibold">
                Risk Score
              </th>

              <th className="px-3 pb-2 font-semibold">
                Risk Level
              </th>

              <th className="px-3 pb-2 font-semibold">
                Last Activity
              </th>

              <th className="px-3 pb-2 text-right font-semibold">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {/* Loading skeleton */}

            {loading &&
              Array.from({ length: 5 }).map(
                (_, index) => (
                  <tr key={index}>
                    <td
                      colSpan={9}
                      className="px-3 py-2"
                    >
                      <Skeleton className="h-12 w-full rounded-xl" />
                    </td>
                  </tr>
                ),
              )}

            {/* Empty state */}

            {!loading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="rounded-xl bg-muted/40 px-3 py-10 text-center text-muted-foreground"
                >
                  {data.length === 0
                    ? "No student records available."
                    : "No students match the current filters."}
                </td>
              </tr>
            )}

            {/* Student rows */}

            {!loading &&
              rows.map((student) => (
                <tr
                  key={student.id}
                  className="group bg-card transition-colors hover:bg-muted/50"
                >
                  {/* Student */}

                  <td className="rounded-l-xl border-y border-l border-border px-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/12 text-[11px] font-bold text-primary">
                        {initials(student.name)}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {student.name}
                        </p>

                        <p className="truncate text-xs text-muted-foreground">
                          Semester {student.semester}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Student ID */}

                  <td className="border-y border-border px-3 py-3 font-mono text-xs text-muted-foreground">
                    {student.id}
                  </td>

                  {/* Department */}

                  <td className="border-y border-border px-3 py-3 text-muted-foreground">
                    {student.department}
                  </td>

                  {/* Attendance */}

                  <td className="border-y border-border px-3 py-3">
                    <span
                      className={cn(
                        "font-semibold tabular-nums",
                        student.attendance < 75
                          ? "text-highrisk"
                          : "text-success",
                      )}
                    >
                      {student.attendance}%
                    </span>
                  </td>

                  {/* CGPA */}

                  <td className="border-y border-border px-3 py-3 font-semibold tabular-nums">
                    {student.cgpa.toFixed(1)}
                  </td>

                  {/* Risk score */}

                  <td className="border-y border-border px-3 py-3">
                    <RiskBar
                      score={student.riskScore}
                    />
                  </td>

                  {/* Risk level */}

                  <td className="border-y border-border px-3 py-3">
                    <RiskBadge
                      level={student.riskLevel}
                      size="sm"
                    />
                  </td>

                  {/* Last activity */}

                  <td className="border-y border-border px-3 py-3 text-xs text-muted-foreground">
                    {student.lastActivity}
                  </td>

                  {/* Actions */}

                  <td className="rounded-r-xl border-y border-r border-border px-3 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* View student */}

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            to={studentDetailPath}
                            params={{
                              studentId: student.id,
                            }}
                            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-primary-soft hover:text-primary"
                            aria-label={`View ${student.name}`}
                          >
                            <Eye className="size-4" />
                          </Link>
                        </TooltipTrigger>

                        <TooltipContent>
                          View student
                        </TooltipContent>
                      </Tooltip>

                      {/* Message student */}

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() =>
                              handleMessage(student)
                            }
                            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-primary-soft hover:text-primary"
                            aria-label={`Message ${student.name}`}
                          >
                            <MessageSquare className="size-4" />
                          </button>
                        </TooltipTrigger>

                        <TooltipContent>
                          Message student
                        </TooltipContent>
                      </Tooltip>

                      {/* View AI prediction */}

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            to={studentDetailPath}
                            params={{
                              studentId: student.id,
                            }}
                            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-primary-soft hover:text-primary"
                            aria-label={`View risk profile for ${student.name}`}
                          >
                            <Sparkles className="size-4" />
                          </Link>
                        </TooltipTrigger>

                        <TooltipContent>
                          View risk profile
                        </TooltipContent>
                      </Tooltip>

                      {/* Admin edit action */}

                      {extraAction?.(student)}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* =====================================================
          PAGINATION
      ====================================================== */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {filtered.length === 0
            ? "Showing 0 students"
            : `Showing ${
                startIndex + 1
              }–${
                startIndex + rows.length
              } of ${filtered.length} students`}
        </p>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() =>
              setPage(currentPage - 1)
            }
          >
            <ChevronLeft className="size-4" />
            Prev
          </Button>

          {visiblePages.map((pageNumber) => (
            <button
              type="button"
              key={pageNumber}
              onClick={() =>
                setPage(pageNumber)
              }
              className={cn(
                "size-8 rounded-lg text-xs font-semibold transition-colors",
                currentPage === pageNumber
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
              aria-label={`Go to page ${pageNumber}`}
              aria-current={
                currentPage === pageNumber
                  ? "page"
                  : undefined
              }
            >
              {pageNumber}
            </button>
          ))}

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() =>
              setPage(currentPage + 1)
            }
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

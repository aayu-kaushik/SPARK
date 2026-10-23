
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Eye,
  LifeBuoy,
  Mail,
  Search,
  ShieldAlert,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  PageHeader,
  SectionCard,
} from "@/components/shared/Layout";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  listStudents,
  type StudentData,
} from "@/firebase/students";
import {
  listPractitionerAccounts,
  type PractitionerAccountOption,
} from "@/firebase/users";
import { getDb } from "@/firebase/config";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { initials } from "@/lib/risk";

export const Route = createFileRoute(
  "/admin/practitioners",
)({
  head: () => ({
    meta: [
      {
        title: "Practitioners — SPARK",
      },
      {
        name: "description",
        content:
          "Manage faculty practitioners, assigned students, at-risk caseloads and intervention activity.",
      },
      {
        property: "og:title",
        content: "Practitioner Management — SPARK",
      },
    ],
  }),
  component: AdminPractitioners,
});

// ============================================================
// TYPES
// ============================================================

interface PractitionerStats {
  uid: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  studentsAssigned: number;
  atRisk: number;
  interventions: number;
  avgAttendance: number;
}

interface InterventionRecord {
  studentUid?: string;
  assignedTo?: string;
}

// ============================================================
// FIRESTORE INTERVENTION COUNTS
// ============================================================

async function fetchInterventions():
  Promise<InterventionRecord[]> {
  const snapshot = await getDocs(
    collection(
      getDb(),
      "interventions",
    ),
  );

  return snapshot.docs.map(
    (entry) =>
      entry.data() as InterventionRecord,
  );
}

// ============================================================
// BUILD PRACTITIONER STATISTICS
// ============================================================

function buildPractitionerStats(
  practitioners: PractitionerAccountOption[],
  students: StudentData[],
  interventions: InterventionRecord[],
): PractitionerStats[] {
  return practitioners.map((practitioner) => {
    const assignedStudents = students.filter(
      (student) =>
        student.mentorId === practitioner.uid,
    );

    const assignedStudentIds = new Set(
      assignedStudents.map(
        (student) => student.uid,
      ),
    );

    const atRisk = assignedStudents.filter(
      (student) =>
        student.riskLevel === "High" ||
        student.riskLevel === "Critical",
    ).length;

    const attendanceTotal =
      assignedStudents.reduce(
        (sum, student) =>
          sum + student.attendance,
        0,
      );

    const avgAttendance =
      assignedStudents.length > 0
        ? Math.round(
            attendanceTotal /
              assignedStudents.length,
          )
        : 0;

    const interventionCount =
      interventions.filter(
        (intervention) =>
          intervention.assignedTo ===
            practitioner.uid ||
          (
            !intervention.assignedTo &&
            !!intervention.studentUid &&
            assignedStudentIds.has(
              intervention.studentUid,
            )
          ),
      ).length;

    return {
      uid: practitioner.uid,
      name: practitioner.name,
      email: practitioner.email,
      department: practitioner.department,
      designation:
        practitioner.title ||
        "Practitioner",
      studentsAssigned:
        assignedStudents.length,
      atRisk,
      interventions:
        interventionCount,
      avgAttendance,
    };
  });
}

// ============================================================
// PRACTITIONER MANAGEMENT PAGE
// ============================================================

function AdminPractitioners() {
  const [searchQuery, setSearchQuery] =
    useState("");

  const [
    selectedPractitioner,
    setSelectedPractitioner,
  ] = useState<PractitionerStats | null>(null);

  const [accountDialogOpen, setAccountDialogOpen] =
    useState(false);

  const [accountSearch, setAccountSearch] =
    useState("");

  // ----------------------------------------------------------
  // FIRESTORE QUERIES
  // ----------------------------------------------------------

  const practitionersQuery = useQuery({
    queryKey: [
      "admin",
      "practitioner-accounts",
    ],
    queryFn: listPractitionerAccounts,
  });

  const studentsQuery = useQuery({
    queryKey: [
      "admin",
      "managed-students",
    ],
    queryFn: listStudents,
  });

  const interventionsQuery = useQuery({
    queryKey: [
      "admin",
      "interventions",
    ],
    queryFn: fetchInterventions,
    retry: false,
  });

  const practitioners =
    practitionersQuery.data ?? [];

  const students =
    studentsQuery.data ?? [];

  const interventions =
    interventionsQuery.data ?? [];

  const practitionerStats = useMemo(
    () =>
      buildPractitionerStats(
        practitioners,
        students,
        interventions,
      ),
    [
      practitioners,
      students,
      interventions,
    ],
  );

  const filtered = useMemo(() => {
    const search =
      searchQuery.trim().toLowerCase();

    if (!search) {
      return practitionerStats;
    }

    return practitionerStats.filter(
      (practitioner) =>
        [
          practitioner.name,
          practitioner.email,
          practitioner.department,
          practitioner.designation,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search),
    );
  }, [
    practitionerStats,
    searchQuery,
  ]);

  const totalStudents =
    practitionerStats.reduce(
      (sum, practitioner) =>
        sum + practitioner.studentsAssigned,
      0,
    );

  const totalAtRisk =
    practitionerStats.reduce(
      (sum, practitioner) =>
        sum + practitioner.atRisk,
      0,
    );

  const totalInterventions =
    practitionerStats.reduce(
      (sum, practitioner) =>
        sum + practitioner.interventions,
      0,
    );

  const isLoading =
    practitionersQuery.isLoading ||
    studentsQuery.isLoading;

  const hasError =
    practitionersQuery.isError ||
    studentsQuery.isError;

  const selectedStudents =
    selectedPractitioner
      ? students.filter(
          (student) =>
            student.mentorId ===
            selectedPractitioner.uid,
        )
      : [];

  const matchingAccounts =
    practitionerStats.filter(
      (practitioner) =>
        [
          practitioner.name,
          practitioner.email,
        ]
          .join(" ")
          .toLowerCase()
          .includes(
            accountSearch
              .trim()
              .toLowerCase(),
          ),
    );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      <PageHeader
        title="Practitioners"
        subtitle="Faculty mentors responsible for monitoring and supporting at-risk students."
        actions={
          <Button
            onClick={() => {
              setAccountSearch("");
              setAccountDialogOpen(true);
            }}
          >
            <UserPlus className="size-4" />
            Find practitioner
          </Button>
        }
      />

      {/* =====================================================
          STATISTICS
      ====================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Practitioners"
          value={practitionerStats.length}
          icon={UserCheck}
          tone="primary"
        />

        <StatCard
          label="Students mentored"
          value={totalStudents.toLocaleString()}
          icon={Users}
          tone="success"
        />

        <StatCard
          label="At-risk caseload"
          value={totalAtRisk}
          icon={ShieldAlert}
          tone="highrisk"
        />

        <StatCard
          label="Interventions logged"
          value={totalInterventions}
          icon={LifeBuoy}
          tone="warning"
        />
      </div>

      {/* =====================================================
          ERROR MESSAGES
      ====================================================== */}

      {hasError && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          Unable to load practitioner information.
          Check your Firebase connection and
          Firestore permissions.
        </div>
      )}

      {interventionsQuery.isError && (
        <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          Intervention counts are unavailable.
          Practitioner and student records can
          still be viewed.
        </div>
      )}

      {/* =====================================================
          PRACTITIONER CARDS
      ====================================================== */}

      <SectionCard
        title="All practitioners"
        description={`${filtered.length} of ${practitionerStats.length} shown`}
        actions={
          <div className="relative w-48 sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value,
                )
              }
              placeholder="Search practitioners"
              className="pl-9"
            />
          </div>
        }
        bodyClassName="p-4"
      >
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({
              length: 6,
            }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-40 rounded-xl"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="mx-auto mb-3 size-8 text-muted-foreground" />

            <p className="font-semibold">
              No practitioners found
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery
                ? "Try a different search."
                : "No practitioner profiles are available in Firestore."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((practitioner) => (
              <article
                key={practitioner.uid}
                className="rounded-xl border border-border p-4 transition-shadow hover:shadow-card"
              >
                {/* Practitioner header */}

                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/12 font-display text-sm font-bold text-primary">
                      {initials(
                        practitioner.name,
                      )}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {practitioner.name}
                      </p>

                      <p className="truncate text-xs text-muted-foreground">
                        {practitioner.designation}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="secondary"
                    className="shrink-0"
                  >
                    Registered
                  </Badge>
                </div>

                {/* Practitioner details */}

                <p className="mt-3 truncate text-xs text-muted-foreground">
                  {practitioner.department} ·{" "}
                  {practitioner.uid.slice(0, 8)}
                </p>

                <p className="mt-1 inline-flex max-w-full items-center gap-1.5 truncate text-xs text-muted-foreground">
                  <Mail className="size-3.5 shrink-0" />
                  {practitioner.email}
                </p>

                {/* Practitioner metrics */}

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[
                    [
                      "Assigned",
                      practitioner.studentsAssigned,
                    ],
                    [
                      "At risk",
                      practitioner.atRisk,
                    ],
                    [
                      "Actions",
                      practitioner.interventions,
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="rounded-lg bg-muted/50 py-2"
                    >
                      <p className="font-display text-base font-bold tabular-nums">
                        {value}
                      </p>

                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Cohort attendance */}

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Cohort attendance
                    </span>

                    <span className="font-semibold tabular-nums">
                      {practitioner.avgAttendance}%
                    </span>
                  </div>

                  <Progress
                    value={
                      practitioner.avgAttendance
                    }
                    className="mt-1.5 h-1.5"
                  />
                </div>

                {/* View assigned students */}

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() =>
                    setSelectedPractitioner(
                      practitioner,
                    )
                  }
                >
                  <Eye className="size-4" />
                  View assigned students
                </Button>
              </article>
            ))}
          </div>
        )}
      </SectionCard>

      {/* =====================================================
          ASSIGNED STUDENTS DIALOG
      ====================================================== */}

      <Dialog
        open={Boolean(
          selectedPractitioner,
        )}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPractitioner(null);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPractitioner?.name ??
                "Practitioner"}
            </DialogTitle>

            <DialogDescription>
              Students currently assigned to
              this practitioner.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {selectedStudents.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No students assigned yet.
              </p>
            ) : (
              selectedStudents.map(
                (student) => (
                  <div
                    key={student.uid}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {student.name}
                      </p>

                      <p className="truncate text-xs text-muted-foreground">
                        {student.studentId} ·{" "}
                        {student.department}
                      </p>
                    </div>

                    <Badge
                      variant={
                        student.riskLevel ===
                          "High" ||
                        student.riskLevel ===
                          "Critical"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {student.riskLevel}
                    </Badge>
                  </div>
                ),
              )
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setSelectedPractitioner(null)
              }
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =====================================================
          EXISTING PRACTITIONER LOOKUP
      ====================================================== */}

      <Dialog
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Find practitioner
            </DialogTitle>

            <DialogDescription>
              Search existing practitioner accounts
              registered in SPARK. Creating new
              login accounts requires an
              administrator provisioning workflow.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              value={accountSearch}
              onChange={(event) =>
                setAccountSearch(
                  event.target.value,
                )
              }
              placeholder="Search by name or email"
            />

            <div className="max-h-72 space-y-2 overflow-y-auto">
              {matchingAccounts.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No matching practitioner accounts.
                </p>
              ) : (
                matchingAccounts.map(
                  (practitioner) => (
                    <button
                      key={practitioner.uid}
                      type="button"
                      onClick={() => {
                        setAccountDialogOpen(false);
                        setSelectedPractitioner(
                          practitioner,
                        );
                      }}
                      className="flex w-full items-center justify-between rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {practitioner.name}
                        </p>

                        <p className="truncate text-xs text-muted-foreground">
                          {practitioner.email}
                        </p>
                      </div>

                      <Eye className="size-4 text-muted-foreground" />
                    </button>
                  ),
                )
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setAccountDialogOpen(false)
              }
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Download,
  Loader2,
  Pencil,
  Plus,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader, SectionCard } from "@/components/shared/Layout";
import { StudentTable } from "@/components/shared/StudentTable";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEPARTMENTS, type Student } from "@/data/mockData";
import {
  assignStudentPractitioner,
  createManagedStudent,
  listStudents,
  updateManagedStudent,
  type StudentData,
  type StudentManagementInput,
} from "@/firebase/students";
import {
  listPractitionerAccounts,
  listStudentAccounts,
} from "@/firebase/users";

export const Route = createFileRoute("/admin/students/")({
  head: () => ({
    meta: [
      { title: "Students — SPARK" },
      {
        name: "description",
        content:
          "Manage student academic records, attendance, CGPA, risk scores and practitioner assignments.",
      },
      {
        property: "og:title",
        content: "Student Management — SPARK",
      },
    ],
  }),
  component: AdminStudents,
});

// ============================================================
// FORM TYPES AND HELPERS
// ============================================================

type FormMode = "add" | "edit";

interface StudentFormValues {
  uid: string;
  studentId: string;
  name: string;
  email: string;
  course: string;
  department: string;
  semester: string;
  phone: string;
  cgpa: string;
  previousGpa: string;
  attendance: string;
  assignmentCompletion: string;
  failedSubjects: string;
  internalMarks: string;
  mentorId: string;
}

const EMPTY_FORM: StudentFormValues = {
  uid: "",
  studentId: "",
  name: "",
  email: "",
  course: "",
  department: "",
  semester: "1",
  phone: "",
  cgpa: "0",
  previousGpa: "0",
  attendance: "0",
  assignmentCompletion: "0",
  failedSubjects: "0",
  internalMarks: "0",
  mentorId: "",
};

function formFromStudent(student: StudentData): StudentFormValues {
  return {
    uid: student.uid,
    studentId: student.studentId,
    name: student.name,
    email: student.email,
    course: student.course,
    department: student.department,
    semester: String(student.semester),
    phone: student.phone,
    cgpa: String(student.cgpa),
    previousGpa: String(student.previousGpa),
    attendance: String(student.attendance),
    assignmentCompletion: String(student.assignmentCompletion),
    failedSubjects: String(student.failedSubjects),
    internalMarks: String(student.internalMarks),
    mentorId: student.mentorId,
  };
}

function parseNumber(
  value: string,
  label: string,
): number {
  if (!value.trim()) {
    throw new Error(`${label} is required.`);
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} must be a valid number.`);
  }

  return parsed;
}

function buildStudentInput(
  form: StudentFormValues,
): StudentManagementInput {
  return {
    studentId: form.studentId.trim(),
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    course: form.course.trim(),
    department: form.department.trim(),
    semester: parseNumber(form.semester, "Semester"),
    phone: form.phone.trim(),
    cgpa: parseNumber(form.cgpa, "CGPA"),
    previousGpa: parseNumber(form.previousGpa, "Previous GPA"),
    attendance: parseNumber(form.attendance, "Attendance"),
    assignmentCompletion: parseNumber(
      form.assignmentCompletion,
      "Assignment completion",
    ),
    failedSubjects: parseNumber(
      form.failedSubjects,
      "Failed subjects",
    ),
    internalMarks: parseNumber(
      form.internalMarks,
      "Internal marks",
    ),
  };
}

function csvEscape(value: unknown): string {
  const text = String(value ?? "");

  // Prevent spreadsheet software from interpreting
  // imported text as a formula.
  const safeText = /^[\s]*[=+\-@]/.test(text)
    ? `'${text}`
    : text;

  return `"${safeText.replace(/"/g, '""')}"`;
}

function exportStudentsCsv(students: StudentData[]): void {
  const headers = [
    "Student ID",
    "Name",
    "Email",
    "Department",
    "Course",
    "Semester",
    "Attendance",
    "CGPA",
    "Assignments",
    "Failed Subjects",
    "Risk Score",
    "Risk Level",
    "Practitioner",
  ];

  const rows = students.map((student) => [
    student.studentId,
    student.name,
    student.email,
    student.department,
    student.course,
    student.semester,
    student.attendance,
    student.cgpa,
    student.assignmentCompletion,
    student.failedSubjects,
    student.riskScore,
    student.riskLevel,
    student.mentor,
  ]);

  const csv = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ].join("\r\n");

  const blob = new Blob(
    ["\uFEFF", csv],
    { type: "text/csv;charset=utf-8;" },
  );

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "spark-students.csv";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

// ============================================================
// ADAPT FIRESTORE RECORDS TO EXISTING STUDENT TABLE
// ============================================================

function toTableStudent(student: StudentData): Student {
  return {
    id: student.studentId,
    name: student.name,
    email: student.email,
    department: student.department,
    semester: student.semester,
    attendance: student.attendance,
    cgpa: student.cgpa,
    riskScore: student.riskScore,
    riskLevel: student.riskLevel,
    failedSubjects: student.failedSubjects,
    lastActivity: student.lastActivity,
  } as Student;
}

// ============================================================
// FORM FIELD COMPONENT
// ============================================================

function FormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}

// ============================================================
// ADMIN STUDENT MANAGEMENT PAGE
// ============================================================

function AdminStudents() {
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("add");
  const [form, setForm] = useState<StudentFormValues>(EMPTY_FORM);

  // ----------------------------------------------------------
  // FIRESTORE QUERIES
  // ----------------------------------------------------------

  const studentsQuery = useQuery({
    queryKey: ["admin", "managed-students"],
    queryFn: listStudents,
  });

  const accountsQuery = useQuery({
    queryKey: ["admin", "student-accounts"],
    queryFn: listStudentAccounts,
  });

  const practitionersQuery = useQuery({
    queryKey: ["admin", "practitioner-accounts"],
    queryFn: listPractitionerAccounts,
  });

  const students = studentsQuery.data ?? [];
  const accounts = accountsQuery.data ?? [];
  const practitioners = practitionersQuery.data ?? [];

  const studentsByUid = useMemo(
    () => new Map(students.map((student) => [student.uid, student])),
    [students],
  );

  const availableAccounts = useMemo(
    () => accounts.filter((account) => !studentsByUid.has(account.uid)),
    [accounts, studentsByUid],
  );

  const tableStudents = useMemo(
    () => students.map(toTableStudent),
    [students],
  );

  // ----------------------------------------------------------
  // FORM STATE
  // ----------------------------------------------------------

  function setField(
    field: keyof StudentFormValues,
    value: string,
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function openAddDialog() {
    setFormMode("add");
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  }

  function openEditDialog(student: StudentData) {
    setFormMode("edit");
    setForm(formFromStudent(student));
    setDialogOpen(true);
  }

  function selectStudentAccount(uid: string) {
    const account = accounts.find((item) => item.uid === uid);

    if (!account) return;

    setForm((previous) => ({
      ...previous,
      uid: account.uid,
      name: account.name,
      email: account.email,
      studentId: account.uid.slice(0, 8).toUpperCase(),
      department: account.department || "",
    }));
  }

  // ----------------------------------------------------------
  // CREATE / UPDATE MUTATION
  // ----------------------------------------------------------

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.uid) {
        throw new Error("Select a student account.");
      }

      const input = buildStudentInput(form);

      if (formMode === "add") {
        await createManagedStudent(form.uid, input);
      } else {
        await updateManagedStudent(form.uid, input);
      }

      // Keep practitioner assignment separate from academic
      // fields because it requires account-role validation.
      await assignStudentPractitioner(
        form.uid,
        form.mentorId || null,
      );
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["students"],
      });

      toast.success(
        formMode === "add"
          ? "Student record created"
          : "Student record updated",
      );

      setDialogOpen(false);
      setForm({ ...EMPTY_FORM });
    },

    onError: (error: Error) => {
      toast.error("Unable to save student", {
        description: error.message,
      });
    },
  });

  // ----------------------------------------------------------
  // LOAD ERROR NOTIFICATIONS
  // ----------------------------------------------------------

  useEffect(() => {
    if (studentsQuery.error) {
      toast.error("Unable to load student records", {
        description: studentsQuery.error.message,
      });
    }
  }, [studentsQuery.error]);

  // ----------------------------------------------------------
  // DASHBOARD METRICS
  // ----------------------------------------------------------

  const metrics = [
    {
      label: "Total records",
      value: students.length,
    },
    {
      label: "High & critical",
      value: students.filter(
        (student) =>
          student.riskLevel === "High" ||
          student.riskLevel === "Critical",
      ).length,
    },
    {
      label: "Below 75% attendance",
      value: students.filter(
        (student) => student.attendance < 75,
      ).length,
    },
    {
      label: "With failed subjects",
      value: students.filter(
        (student) => student.failedSubjects > 0,
      ).length,
    },
  ];

  const isLoading = studentsQuery.isLoading;
  const isSaving = saveMutation.isPending;

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <>
      <PageHeader
        title="Student Management"
        subtitle={`${students.length} student records · manage academic data and practitioner assignments.`}
        actions={
          <>
            <Button
              variant="outline"
              disabled={students.length === 0 || isLoading}
              onClick={() => {
                exportStudentsCsv(students);

                toast.success("CSV exported", {
                  description:
                    "Your student records have been downloaded.",
                });
              }}
            >
              <Download className="size-4" />
              Export CSV
            </Button>

            <Button onClick={openAddDialog}>
              <Plus className="size-4" />
              Add student
            </Button>
          </>
        }
      />

      {/* =====================================================
          METRIC CARDS
      ====================================================== */}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="surface p-4"
          >
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
              <Users className="size-3.5" />
              {metric.label}
            </p>

            <p className="mt-1.5 font-display text-2xl font-bold tabular-nums">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {/* =====================================================
          STUDENT TABLE
      ====================================================== */}

      <SectionCard
        title="All students"
        description="Search by name, ID or email · filter by department, semester and risk"
      >
        {studentsQuery.isError && (
          <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            Unable to load students:{" "}
            {studentsQuery.error.message}
          </div>
        )}

        <StudentTable
          data={tableStudents}
          loading={isLoading}
          basePath="/admin/students"
          pageSize={10}
          extraAction={(tableStudent) => {
            const student = students.find(
              (item) => item.studentId === tableStudent.id,
            );

            if (!student) return null;

            return (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEditDialog(student)}
                title={`Edit ${student.name}`}
              >
                <Pencil className="size-4" />
              </Button>
            );
          }}
        />
      </SectionCard>

      {/* =====================================================
          ADD / EDIT STUDENT DIALOG
      ====================================================== */}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!isSaving) {
            setDialogOpen(open);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {formMode === "add"
                ? "Add student record"
                : "Edit student record"}
            </DialogTitle>

            <DialogDescription>
              {formMode === "add"
                ? "Select an existing student account and create its academic record."
                : "Update academic details and practitioner assignment."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Account selection */}

            {formMode === "add" && (
              <div className="space-y-2">
                <Label>Student account</Label>

                <Select
                  value={form.uid}
                  onValueChange={selectStudentAccount}
                  disabled={accountsQuery.isLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        accountsQuery.isLoading
                          ? "Loading accounts..."
                          : "Select student account"
                      }
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {availableAccounts.map((account) => (
                      <SelectItem
                        key={account.uid}
                        value={account.uid}
                      >
                        {account.name} — {account.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {availableAccounts.length === 0 &&
                  !accountsQuery.isLoading && (
                    <p className="text-xs text-muted-foreground">
                      No unlinked student accounts found.
                      Students must register before an academic
                      record can be created.
                    </p>
                  )}
              </div>
            )}

            {/* Basic information */}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Student ID"
                value={form.studentId}
                onChange={(value) =>
                  setField("studentId", value)
                }
              />

              <FormField
                label="Full name"
                value={form.name}
                onChange={(value) =>
                  setField("name", value)
                }
              />

              <FormField
                label="Email"
                value={form.email}
                onChange={(value) =>
                  setField("email", value)
                }
                disabled
              />

              <FormField
                label="Phone"
                value={form.phone}
                onChange={(value) =>
                  setField("phone", value)
                }
              />

              <FormField
                label="Course"
                value={form.course}
                onChange={(value) =>
                  setField("course", value)
                }
              />

              <div className="space-y-2">
                <Label>Department</Label>

                <Select
                  value={form.department}
                  onValueChange={(value) =>
                    setField("department", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>

                  <SelectContent>
                    {DEPARTMENTS.map((department) => (
                      <SelectItem
                        key={department}
                        value={department}
                      >
                        {department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <FormField
                label="Semester"
                value={form.semester}
                onChange={(value) =>
                  setField("semester", value)
                }
                type="number"
              />

              <FormField
                label="CGPA"
                value={form.cgpa}
                onChange={(value) =>
                  setField("cgpa", value)
                }
                type="number"
              />

              <FormField
                label="Previous GPA"
                value={form.previousGpa}
                onChange={(value) =>
                  setField("previousGpa", value)
                }
                type="number"
              />

              <FormField
                label="Attendance (%)"
                value={form.attendance}
                onChange={(value) =>
                  setField("attendance", value)
                }
                type="number"
              />

              <FormField
                label="Assignment completion (%)"
                value={form.assignmentCompletion}
                onChange={(value) =>
                  setField("assignmentCompletion", value)
                }
                type="number"
              />

              <FormField
                label="Failed subjects"
                value={form.failedSubjects}
                onChange={(value) =>
                  setField("failedSubjects", value)
                }
                type="number"
              />

              <FormField
                label="Internal marks (%)"
                value={form.internalMarks}
                onChange={(value) =>
                  setField("internalMarks", value)
                }
                type="number"
              />
            </div>

            {/* Practitioner assignment */}

            <div className="space-y-2">
              <Label>Assigned practitioner</Label>

              <Select
                value={form.mentorId || "unassigned"}
                onValueChange={(value) =>
                  setField(
                    "mentorId",
                    value === "unassigned" ? "" : value,
                  )
                }
                disabled={practitionersQuery.isLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder="Select practitioner"
                  />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="unassigned">
                    Not assigned
                  </SelectItem>

                  {practitioners.map((practitioner) => (
                    <SelectItem
                      key={practitioner.uid}
                      value={practitioner.uid}
                    >
                      {practitioner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <UserRoundCheck className="size-3.5" />
                Assigned practitioners can access their
                allocated students according to Firestore rules.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={isSaving}
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>

            <Button
              disabled={isSaving || !form.uid}
              onClick={() => saveMutation.mutate()}
            >
              {isSaving && (
                <Loader2 className="size-4 animate-spin" />
              )}

              {formMode === "add"
                ? "Save student"
                : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

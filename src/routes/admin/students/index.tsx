import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Plus, Users } from "lucide-react";
import { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEPARTMENTS } from "@/data/mockData";
import { fetchStudents } from "@/services/api";

export const Route = createFileRoute("/admin/students/")({
  head: () => ({
    meta: [
      { title: "Students — EduPredict AI" },
      {
        name: "description",
        content:
          "Search, filter and manage every enrolled student with attendance, CGPA and AI dropout risk scores in one data table.",
      },
      { property: "og:title", content: "Student Management — EduPredict AI" },
      { property: "og:description", content: "Institution-wide student records with AI risk scoring." },
    ],
  }),
  component: AdminStudents,
});

function AdminStudents() {
  const { data: students = [], isLoading } = useQuery({ queryKey: ["students"], queryFn: fetchStudents });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [dept, setDept] = useState(DEPARTMENTS[0]!);

  return (
    <>
      <PageHeader
        title="Student Management"
        subtitle={`${students.length} student records in this demo dataset · filter, sort and drill into any profile.`}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => toast.success("Export started", { description: "students.csv will download shortly." })}
            >
              <Download className="size-4" /> Export CSV
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" /> Add student
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add student</DialogTitle>
                  <DialogDescription>
                    New records are scored by the AI model on the next nightly run.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sname">Full name</Label>
                    <Input id="sname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nisha Patel" />
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select value={dept} onValueChange={setDept}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => {
                      setOpen(false);
                      toast.success("Student added", {
                        description: `${name || "New student"} enrolled in ${dept}. Awaiting first risk prediction.`,
                      });
                      setName("");
                    }}
                  >
                    Save student
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ["Total records", students.length],
          ["High & critical", students.filter((s) => s.riskScore >= 70).length],
          ["Below 75% attendance", students.filter((s) => s.attendance < 75).length],
          ["With failed subjects", students.filter((s) => s.failedSubjects > 0).length],
        ].map(([label, value]) => (
          <div key={label as string} className="surface p-4">
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
              <Users className="size-3.5" /> {label}
            </p>
            <p className="mt-1.5 font-display text-2xl font-bold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <SectionCard title="All students" description="Search by name, ID or email · filter by department, semester and risk">
        <StudentTable data={students} loading={isLoading} basePath="/admin/students" pageSize={10} />
      </SectionCard>
    </>
  );
}

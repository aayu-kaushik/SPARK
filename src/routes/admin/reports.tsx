import { createFileRoute } from "@tanstack/react-router";
import { Download, FileBarChart, FileSpreadsheet, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader, SectionCard } from "@/components/shared/Layout";
import { Button } from "@/components/ui/button";
import { reportTemplates } from "@/data/mockData";
import { generateReport } from "@/services/api";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports — EduPredict AI" },
      {
        name: "description",
        content:
          "Generate student risk, department, attendance, academic performance and intervention reports as PDF or CSV exports.",
      },
      { property: "og:title", content: "Reports — EduPredict AI" },
      { property: "og:description", content: "Export institutional dropout risk and intervention reports." },
    ],
  }),
  component: AdminReports,
});

function AdminReports() {
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (id: string, title: string, format: "PDF" | "CSV") => {
    setBusy(`${id}-${format}`);
    const res = await generateReport(title);
    setBusy(null);
    toast.success(`${title} ready`, { description: `${format} generated at ${res.generatedAt}.` });
  };

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Institution-ready exports built from the latest AI predictions and academic records."
      />

      <div className="grid gap-5 md:grid-cols-2">
        {reportTemplates.map((r) => (
          <SectionCard key={r.id} title={r.title} description={`${r.records.toLocaleString()} records · updated ${r.updated}`}>
            <p className="text-sm leading-relaxed text-muted-foreground">{r.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => run(r.id, r.title, "PDF")} disabled={busy === `${r.id}-PDF`}>
                {busy === `${r.id}-PDF` ? <Loader2 className="size-4 animate-spin" /> : <FileBarChart className="size-4" />}
                Export PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => run(r.id, r.title, "CSV")} disabled={busy === `${r.id}-CSV`}>
                {busy === `${r.id}-CSV` ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
                Export CSV
              </Button>
            </div>
          </SectionCard>
        ))}
      </div>

      <SectionCard title="Scheduled exports" description="Automated delivery to the academic council">
        <ul className="divide-y divide-border text-sm">
          {[
            ["Weekly risk digest", "Every Monday, 07:00 AM · 12 recipients"],
            ["Monthly department report", "1st of each month, 08:00 AM · 6 recipients"],
            ["Semester intervention audit", "End of semester · 4 recipients"],
          ].map(([title, meta]) => (
            <li key={title} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{title}</p>
                <p className="truncate text-xs text-muted-foreground">{meta}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toast.success("Sent now", { description: `${title} delivered to recipients.` })}
              >
                <Download className="size-4" /> Send now
              </Button>
            </li>
          ))}
        </ul>
      </SectionCard>
    </>
  );
}

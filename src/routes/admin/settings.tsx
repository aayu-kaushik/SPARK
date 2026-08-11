import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader, SectionCard } from "@/components/shared/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { modelMetrics } from "@/data/mockData";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — EduPredict AI" },
      {
        name: "description",
        content: "Configure institution details, AI risk thresholds, alerting rules and model retraining preferences.",
      },
      { property: "og:title", content: "Settings — EduPredict AI" },
      { property: "og:description", content: "Institution, risk threshold and alerting configuration." },
    ],
  }),
  component: AdminSettings,
});

function AdminSettings() {
  const [thresholds, setThresholds] = useState({ medium: 45, high: 70, critical: 85 });
  const [alerts, setAlerts] = useState({ email: true, digest: true, critical: true, mentor: false });

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Institution configuration, AI thresholds and notification rules."
        actions={<Button onClick={() => toast.success("Settings saved")}>Save changes</Button>}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Institution" description="Displayed across dashboards and exported reports">
          <div className="space-y-4">
            {[
              ["Institution name", "Northline Institute of Technology"],
              ["Academic year", "2025 – 2026"],
              ["Primary contact", "registrar@edupredict.ai"],
            ].map(([label, value]) => (
              <div key={label} className="space-y-2">
                <Label>{label}</Label>
                <Input defaultValue={value} />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="AI Risk Thresholds" description="Score boundaries used to assign risk bands">
          <div className="space-y-6">
            {(["medium", "high", "critical"] as const).map((k) => (
              <div key={k} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="capitalize">{k} risk starts at</Label>
                  <span className="rounded-md bg-muted px-2 py-0.5 font-display text-xs font-bold tabular-nums">
                    {thresholds[k]}
                  </span>
                </div>
                <Slider
                  value={[thresholds[k]]}
                  min={20}
                  max={99}
                  step={1}
                  onValueChange={(v) => setThresholds((p) => ({ ...p, [k]: v[0] ?? p[k] }))}
                />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Model {modelMetrics.version} re-scores all students nightly using these thresholds.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Alerts & Notifications" description="Who gets told when risk changes">
          <ul className="divide-y divide-border">
            {([
              ["email", "Email alerts", "Send email when a student moves to a higher risk band."],
              ["digest", "Weekly digest", "Monday summary of institutional risk movement."],
              ["critical", "Critical escalation", "Notify the dean immediately for critical predictions."],
              ["mentor", "Mentor auto-assign", "Automatically assign a mentor to newly flagged students."],
            ] as const).map(([key, title, desc]) => (
              <li key={key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Switch
                  checked={alerts[key]}
                  onCheckedChange={(v) => setAlerts((p) => ({ ...p, [key]: v }))}
                />
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Model Management" description="Retraining and data governance">
          <dl className="space-y-2 text-sm">
            {[
              ["Active model", `${modelMetrics.name} ${modelMetrics.version}`],
              ["Algorithm", modelMetrics.algorithm],
              ["Training records", modelMetrics.trainingRecords],
              ["Last retrained", modelMetrics.lastUpdated],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 border-b border-border/70 py-1.5">
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="truncate font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => toast.success("Retraining queued", { description: "Estimated completion in 40 minutes." })}>
              Retrain model
            </Button>
            <Button variant="ghost" onClick={() => toast.success("Audit log exported")}>
              Export audit log
            </Button>
          </div>
        </SectionCard>
      </div>
    </>
  );
}

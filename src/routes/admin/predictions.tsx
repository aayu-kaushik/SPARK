import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, BadgeCheck, Cpu, Database, Target } from "lucide-react";

import { SimpleBarChart, TrendLineChart } from "@/charts/Charts";
import { PageHeader, SectionCard } from "@/components/shared/Layout";
import { PredictionSimulator } from "@/components/shared/PredictionSimulator";
import { StudentTable } from "@/components/shared/StudentTable";
import { Badge } from "@/components/ui/badge";
import { modelAccuracyHistory, modelMetrics, predictionFactors } from "@/data/mockData";
import { fetchStudents } from "@/services/api";

export const Route = createFileRoute("/admin/predictions")({
  head: () => ({
    meta: [
      { title: "Dropout Predictions — SPARK" },
      {
        name: "description",
        content:
          "Model performance metrics and an interactive AI dropout prediction simulator for testing student risk scenarios.",
      },
      { property: "og:title", content: "AI Dropout Predictions — SPARK" },
      { property: "og:description", content: "Model accuracy, feature importance and an interactive prediction simulator." },
    ],
  }),
  component: AdminPredictions,
});

function AdminPredictions() {
  const { data: students = [], isLoading } = useQuery({ queryKey: ["students"], queryFn: fetchStudents });
  const flagged = students.filter((s) => s.riskScore >= 70).sort((a, b) => b.riskScore - a.riskScore);

  const metrics = [
    { label: "Accuracy", value: `${modelMetrics.accuracy}%`, icon: Target },
    { label: "Precision", value: `${modelMetrics.precision}%`, icon: BadgeCheck },
    { label: "Recall", value: `${modelMetrics.recall}%`, icon: Activity },
    { label: "F1 Score", value: `${modelMetrics.f1}%`, icon: Cpu },
  ];

  return (
    <>
      <PageHeader
        title="AI Dropout Predictions"
        subtitle="Inspect model health, feature importance and simulate risk for any student profile."
        actions={<Badge variant="secondary">{modelMetrics.version} · {modelMetrics.status}</Badge>}
      />

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <SectionCard title="Model Overview" description={modelMetrics.name}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-xl border border-border bg-muted/40 p-3.5">
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <m.icon className="size-3.5 text-primary" /> {m.label}
                </p>
                <p className="mt-1.5 font-display text-xl font-bold tabular-nums">{m.value}</p>
              </div>
            ))}
          </div>
          <dl className="mt-5 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {[
              ["Algorithm", modelMetrics.algorithm],
              ["Features used", `${modelMetrics.features} features`],
              ["Training records", modelMetrics.trainingRecords],
              ["Last updated", modelMetrics.lastUpdated],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 border-b border-border/70 py-1.5">
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Database className="size-3.5" /> {k}
                </dt>
                <dd className="truncate font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>

        <SectionCard title="Accuracy by Model Version" description="Validation accuracy across recent releases">
          <TrendLineChart
            data={modelAccuracyHistory}
            xKey="version"
            domain={[80, 95]}
            series={[{ key: "accuracy", name: "Accuracy %", color: "var(--primary)" }]}
            height={250}
          />
        </SectionCard>
      </div>

      <PredictionSimulator />

      <SectionCard title="Feature Importance" description="How strongly each signal drives the model output">
        <SimpleBarChart
          data={predictionFactors}
          xKey="factor"
          bars={[{ key: "impact", name: "Impact", color: "var(--primary)" }]}
          unit="%"
          height={280}
        />
      </SectionCard>

      <SectionCard
        title="Students Flagged By The Model"
        description={`${flagged.length} students currently predicted High or Critical risk`}
      >
        <StudentTable data={flagged} loading={isLoading} basePath="/admin/students" pageSize={8} />
      </SectionCard>
    </>
  );
}


import { BrainCircuit, RotateCcw, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { FactorBarChart } from "@/charts/Charts";
import { AIInsight, SectionCard } from "@/components/shared/Layout";
import { RiskGauge } from "@/components/shared/RiskGauge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { riskStyles } from "@/lib/risk";
import { cn } from "@/lib/utils";
import {
  runPrediction,
  type PredictionInput,
  type PredictionResult,
} from "@/services/api";

const DEFAULTS: PredictionInput = {
  attendance: 72,
  cgpa: 6.8,
  failedSubjects: 1,
  assignmentCompletion: 74,
  previousGpa: 7.4,
  lmsActivity: 62,
  participation: 58,
  financialStress: 45,
  previousSemesterPerformance: 70,
};

const FIELDS: {
  key: keyof PredictionInput;
  label: string;
  min: number;
  max: number;
  step: number;
  suffix?: string;
}[] = [
  {
    key: "attendance",
    label: "Attendance",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
  },
  {
    key: "cgpa",
    label: "Current CGPA",
    min: 0,
    max: 10,
    step: 0.1,
  },
  {
    key: "previousGpa",
    label: "Previous semester GPA",
    min: 0,
    max: 10,
    step: 0.1,
  },
  {
    key: "failedSubjects",
    label: "Failed subjects",
    min: 0,
    max: 6,
    step: 1,
  },
  {
    key: "assignmentCompletion",
    label: "Assignment completion",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
  },
  {
    key: "lmsActivity",
    label: "LMS activity",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
  },
  {
    key: "participation",
    label: "Class participation",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
  },
  {
    key: "financialStress",
    label: "Financial stress index",
    min: 0,
    max: 100,
    step: 1,
  },
  {
    key: "previousSemesterPerformance",
    label: "Previous semester performance",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
  },
];

export function PredictionSimulator() {
  const [input, setInput] = useState<PredictionInput>(DEFAULTS);

  const [result, setResult] =
    useState<PredictionResult | null>(null);

  const [running, setRunning] = useState(false);

  // Used to ignore an older prediction result after Reset.
  const requestIdRef = useRef(0);

  const set = (
    key: keyof PredictionInput,
    value: number,
  ) => {
    setInput((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // =========================================================
  // RUN PREDICTION
  // =========================================================

  const run = async () => {
    if (running) return;

    const requestId = ++requestIdRef.current;

    setRunning(true);
    setResult(null);

    try {
      // runPrediction returns Promise<PredictionResult>.
      const prediction = await runPrediction(input);

      // Do not display results from an outdated request.
      if (requestId !== requestIdRef.current) {
        return;
      }

      setResult(prediction);
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      console.error("Prediction failed:", error);

      toast.error("Prediction failed", {
        description:
          error instanceof Error
            ? error.message
            : "Unable to generate the prediction. Please try again.",
      });
    } finally {
      if (requestId === requestIdRef.current) {
        setRunning(false);
      }
    }
  };

  // =========================================================
  // RESET SIMULATOR
  // =========================================================

  const reset = () => {
    // Invalidate any prediction request still running.
    requestIdRef.current += 1;

    setInput({ ...DEFAULTS });
    setResult(null);
    setRunning(false);
  };

  // =========================================================
  // CHART DATA
  // =========================================================

  const factorChartData = result
    ? result.factors.map((factor) => ({
        factor: factor.factor,
        weight: factor.weight,
      }))
    : [];

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      {/* =====================================================
          LEFT PANEL — PREDICTION INPUTS
      ====================================================== */}

      <SectionCard
        title="Prediction Simulator"
        description="Adjust the model inputs to see how dropout probability responds"
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
          >
            <RotateCcw className="size-4" />
            Reset
          </Button>
        }
      >
        <div className="grid gap-5 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <div
              key={field.key}
              className="space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <Label className="min-w-0 truncate text-xs text-muted-foreground">
                  {field.label}
                </Label>

                <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 font-display text-xs font-bold tabular-nums">
                  {input[field.key]}
                  {field.suffix ?? ""}
                </span>
              </div>

              <Slider
                value={[input[field.key]]}
                min={field.min}
                max={field.max}
                step={field.step}
                onValueChange={(value) =>
                  set(field.key, value[0] ?? 0)
                }
              />
            </div>
          ))}
        </div>

        <Button
          className="mt-6 w-full"
          size="lg"
          onClick={() => void run()}
          disabled={running}
        >
          {running ? (
            <>
              <BrainCircuit className="size-4 animate-pulse" />
              Running model…
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Run AI prediction
            </>
          )}
        </Button>
      </SectionCard>

      {/* =====================================================
          RIGHT PANEL — PREDICTION RESULTS
      ====================================================== */}

      <SectionCard
        title="Prediction Result"
        description="Generated by the current SPARK dropout risk prediction service"
      >
        {!result ? (
          <div className="grid min-h-[420px] place-items-center rounded-xl border border-dashed border-border text-center">
            <div className="max-w-xs p-6">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <BrainCircuit className="size-6" />
              </span>

              <p className="mt-4 font-display text-sm font-semibold">
                {running
                  ? "Generating prediction..."
                  : "No prediction yet"}
              </p>

              <p className="mt-1.5 text-xs text-muted-foreground">
                {running
                  ? "Please wait while SPARK evaluates the selected student parameters."
                  : "Set the student parameters on the left and run the model to see dropout probability, contributing factors and recommended interventions."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Risk gauge */}

            <div className="flex flex-col items-center gap-3 rounded-xl bg-muted/40 p-5">
              <RiskGauge
                score={result.probability}
                level={result.level}
                label="Dropout probability"
              />

              <p
                className={cn(
                  "font-display text-sm font-bold uppercase tracking-wider",
                  riskStyles[result.level].text,
                )}
              >
                {result.level} Risk ·{" "}
                {result.confidence}% confidence
              </p>
            </div>

            {/* Model explanation */}

            <AIInsight title="Model explanation">
              {result.explanation}
            </AIInsight>

            {/* Contributing factors */}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Contributing factors
              </p>

              {factorChartData.length > 0 ? (
                <FactorBarChart
                  data={factorChartData}
                  dataKey="weight"
                  labelKey="factor"
                  height={200}
                />
              ) : (
                <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No contributing factors were returned
                  for this prediction.
                </p>
              )}
            </div>

            {/* Recommended interventions */}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Recommended interventions
              </p>

              {result.interventions.length > 0 ? (
                <ul className="space-y-2">
                  {result.interventions.map(
                    (intervention, index) => (
                      <li
                        key={`${intervention}-${index}`}
                        className="flex gap-2.5 rounded-lg border border-border px-3 py-2 text-sm"
                      >
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/12 text-[10px] font-bold text-primary">
                          {index + 1}
                        </span>

                        <span className="text-muted-foreground">
                          {intervention}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              ) : (
                <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No interventions were returned
                  for this prediction.
                </p>
              )}
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

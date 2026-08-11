import {
  students,
  practitioners,
  conversations,
  notifications,
  getStudent,
  type Student,
} from "@/data/mockData";
import { levelFromScore } from "@/lib/risk";

const latency = (ms = 320) => new Promise((r) => setTimeout(r, ms));

export async function fetchStudents(): Promise<Student[]> {
  await latency();
  return students;
}

export async function fetchStudent(id: string) {
  await latency(220);
  return getStudent(id) ?? null;
}

export async function fetchPractitioners() {
  await latency();
  return practitioners;
}

export async function fetchConversations() {
  await latency(180);
  return conversations;
}

export async function fetchNotifications() {
  await latency(150);
  return notifications;
}

export interface PredictionInput {
  attendance: number;
  cgpa: number;
  failedSubjects: number;
  assignmentCompletion: number;
  previousGpa: number;
  lmsActivity: number;
  participation: number;
  financialStress: number;
  previousSemesterPerformance: number;
}

export interface PredictionResult {
  probability: number;
  level: ReturnType<typeof levelFromScore>;
  confidence: number;
  explanation: string;
  factors: { factor: string; weight: number }[];
  interventions: string[];
}

// Frontend simulation of the model's scoring function.
export function runPrediction(input: PredictionInput): PredictionResult {
  const contributions = [
    { factor: "Attendance", weight: (100 - input.attendance) * 0.34 },
    { factor: "Academic Performance", weight: (10 - input.cgpa) * 10 * 0.22 },
    { factor: "Failed Subjects", weight: input.failedSubjects * 11 },
    { factor: "Assignment Completion", weight: (100 - input.assignmentCompletion) * 0.16 },
    { factor: "GPA Decline", weight: Math.max(0, input.previousGpa - input.cgpa) * 12 },
    { factor: "LMS Engagement", weight: (100 - input.lmsActivity) * 0.08 },
    { factor: "Class Participation", weight: (100 - input.participation) * 0.06 },
    { factor: "Financial Stress", weight: input.financialStress * 0.09 },
    { factor: "Previous Semester Performance", weight: (100 - input.previousSemesterPerformance) * 0.1 },
  ];

  const raw = contributions.reduce((sum, c) => sum + c.weight, 0);
  const probability = Math.max(4, Math.min(97, Math.round(raw)));
  const level = levelFromScore(probability);

  const total = contributions.reduce((s, c) => s + Math.max(0, c.weight), 0) || 1;
  const factors = contributions
    .map((c) => ({ factor: c.factor, weight: Math.round((Math.max(0, c.weight) / total) * 100) }))
    .filter((c) => c.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6);

  const top = factors.slice(0, 2).map((f) => f.factor.toLowerCase());
  const confidence = Math.round(86 + Math.min(9, Math.abs(probability - 50) / 6));

  const explanation =
    level === "Low"
      ? `The profile is stable. ${top[0] ?? "Attendance"} is within a healthy band and academic performance is consistent, so the predicted dropout probability stays low.`
      : `${top.join(" and ")} contribute most strongly to this prediction. With attendance at ${input.attendance}%, ${input.failedSubjects} failed subject(s) and assignment completion at ${input.assignmentCompletion}%, the model estimates an elevated dropout probability of ${probability}%.`;

  const interventions =
    level === "Low"
      ? ["Continue routine monitoring", "Share positive progress feedback", "Reassess after next internal assessment"]
      : [
          "Schedule mentor meeting within 3 days",
          "Academic counselling for weak subjects",
          "Attendance improvement plan with weekly review",
          "Monitor next assessment and assignment submissions",
          ...(input.financialStress > 60 ? ["Refer to scholarship / financial aid cell"] : []),
        ];

  return { probability, level, confidence, explanation, factors, interventions };
}

export async function generateReport(title: string) {
  await latency(900);
  return { ok: true, title, generatedAt: new Date().toLocaleString() };
}

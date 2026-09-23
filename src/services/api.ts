import type { Student } from "@/data/mockData";
import { levelFromScore } from "@/lib/risk";
import { getFirebaseAuth } from "@/firebase/auth";
import {
  getCurrentStudentData,
  getStudentData,
  getStudentByStudentId,
  listStudents,
  listStudentsForPractitioner,
  type StudentData,
} from "@/firebase/students";
import { listPractitioners as listFirebasePractitioners } from "@/firebase/practitioners";
import { savePrediction } from "@/firebase/predictions";
import type { RiskFactor } from "@/firebase/students";
import type { InboxConversation } from "@/firebase/messages";

const latency = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

function toStudent(data: StudentData): Student {
  return {
    id: data.studentId || data.uid,
    name: data.name,
    email: data.email,
    phone: data.phone,
    department: data.department,
    course: data.course,
    semester: data.semester,
    attendance: data.attendance,
    cgpa: data.cgpa,
    previousGpa: data.previousGpa,
    failedSubjects: data.failedSubjects,
    assignmentCompletion: data.assignmentCompletion,
    internalMarks: data.internalMarks,
    lmsActivity: data.lmsActivity,
    participation: data.participation,
    libraryUsage: data.libraryUsage,
    financialStress: data.financialStress,
    riskScore: data.riskScore,
    riskLevel: data.riskLevel,
    confidence: data.confidence,
    riskFactors: data.riskFactors,
    mentor: data.mentor,
    mentorId: data.mentorId,
    lastActivity: data.lastActivity,
    subjects: data.subjects.map((subject) => ({
      subject: subject.subject,
      attendance: subject.attendance,
      marks: subject.marks,
    })),
    gpaHistory: data.gpaTrend.map((trend) => ({
      term: trend.term,
      gpa: trend.gpa,
    })),
  };
}

async function currentRole() {
  const user = getFirebaseAuth().currentUser;
  if (!user) return null;
  const { getUserProfile } = await import("@/firebase/users");
  return getUserProfile(user.uid);
}

export async function fetchStudents(): Promise<Student[]> {
  const profile = await currentRole();
  if (!profile) return [];

  const rows = profile.role === "practitioner"
    ? await listStudentsForPractitioner(profile.uid)
    : profile.role === "student"
      ? [await getCurrentStudentData()].filter(Boolean) as StudentData[]
      : await listStudents();

  return rows.map(toStudent);
}

export async function fetchStudent(id: string): Promise<Student | null> {
  await latency();
  const profile = await currentRole();
  if (!profile) return null;

  if (profile.role === "student" && profile.uid !== id) return null;

  const data = (await getStudentData(id)) ?? (await getStudentByStudentId(id));
  if (!data) return null;
  if (profile.role === "practitioner" && data.mentorId !== profile.uid) return null;
  return toStudent(data);
}

export async function fetchPractitioners() {
  await latency();
  return listFirebasePractitioners();
}

export async function fetchConversations() {
  const { subscribeConversations } = await import("@/firebase/messages");
  const user = getFirebaseAuth().currentUser;
  if (!user) return [];

  return new Promise<InboxConversation[]>((resolve) => {
    const unsubscribe = subscribeConversations(user.uid, (items) => {
      unsubscribe();
      resolve(items);
    }, () => resolve([]));
  });
}

export async function fetchNotifications() {
  return [];
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
  factors: RiskFactor[];
  interventions: string[];
  savedPredictionId?: string;
}

// Temporary local fallback until the Python ML API is connected.
// The result is now persisted in Firestore so prediction history can be built.
export async function runPrediction(input: PredictionInput, studentUid?: string): Promise<PredictionResult> {
  const contributions: RiskFactor[] = [
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

  const raw = contributions.reduce((sum, item) => sum + item.weight, 0);
  const probability = Math.max(4, Math.min(97, Math.round(raw)));
  const level = levelFromScore(probability);
  const total = contributions.reduce((sum, item) => sum + Math.max(0, item.weight), 0) || 1;

  const factors = contributions
    .map((item) => ({
      factor: item.factor,
      weight: Math.round((Math.max(0, item.weight) / total) * 100),
    }))
    .filter((item) => item.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6);

  const top = factors.slice(0, 2).map((factor) => factor.factor.toLowerCase());
  const confidence = Math.round(86 + Math.min(9, Math.abs(probability - 50) / 6));
  const explanation = level === "Low"
    ? `The profile is currently stable. ${top[0] ?? "Attendance"} is within a healthy band and academic performance is consistent.`
    : `${top.join(" and ")} contribute most strongly to this prediction. Attendance is ${input.attendance}%, failed subjects are ${input.failedSubjects}, and assignment completion is ${input.assignmentCompletion}%.`;

  const interventions = level === "Low"
    ? ["Continue routine monitoring", "Share positive progress feedback", "Reassess after the next assessment"]
    : ["Schedule mentor meeting within 3 days", "Provide academic support for weak subjects", "Create an attendance improvement plan", "Monitor the next assessment and assignments"];

  let savedPredictionId = "";
  if (studentUid) {
    savedPredictionId = await savePrediction({
      studentUid,
      probability,
      riskLevel: level,
      confidence,
      factors,
      explanation,
      interventions,
      source: "simulation",
    });
  }

  return { probability, level, confidence, explanation, factors, interventions, savedPredictionId };
}

export async function generateReport(title: string) {
  await latency(400);
  return { ok: true, title, generatedAt: new Date().toLocaleString() };
}

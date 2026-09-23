import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import { getFirebaseAuth } from "./auth";
import { getDb } from "./config";

const STUDENTS_COLLECTION = "students";

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export interface StudentSubject {
  subject: string;
  attendance: number;
  marks: number;
  target: number;
}

export interface StudentTrend extends Record<string, string | number> {
  term: string;
  gpa: number;
  attendance: number;
  assignments: number;
}

export interface MonthlyAttendance extends Record<string, string | number> {
  month: string;
  attendance: number;
}

export interface StudentRecommendation {
  category: string;
  icon: string;
  text: string;
}

export interface RiskFactor {
  factor: string;
  weight: number;
}

export interface StudentData {
  uid: string;
  studentId: string;
  name: string;
  email: string;
  course: string;
  semester: number;
  department: string;
  mentor: string;
  mentorId: string;
  phone: string;

  cgpa: number;
  previousGpa: number;
  attendance: number;
  assignments: number;
  assignmentCompletion: number;
  failedSubjects: number;
  internalMarks: number;
  lmsActivity: number;
  participation: number;
  libraryUsage: number;
  financialStress: number;

  riskScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  riskFactors: RiskFactor[];

  subjects: StudentSubject[];
  gpaTrend: StudentTrend[];
  monthlyAttendance: MonthlyAttendance[];
  improvements: string[];
  recommendations: StudentRecommendation[];
  lastActivity: string;

  createdAt?: unknown;
  updatedAt?: unknown;
}

function getStudentDocument(uid: string) {
  return doc(getDb(), STUDENTS_COLLECTION, uid);
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function arrayValue<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeRiskLevel(value: unknown): RiskLevel {
  if (typeof value !== "string") return "Low";
  switch (value.toLowerCase()) {
    case "critical":
      return "Critical";
    case "high":
      return "High";
    case "medium":
      return "Medium";
    default:
      return "Low";
  }
}

function mapStudent(id: string, data: Record<string, unknown>): StudentData {
  const assignmentCompletion = numberValue(
    data["assignmentCompletion"],
    numberValue(data["assignments"], 0),
  );

  return {
    uid: stringValue(data["uid"], id),
    studentId: stringValue(data["studentId"], id),
    name: stringValue(data["name"], "Student"),
    email: stringValue(data["email"]),
    course: stringValue(data["course"]),
    semester: numberValue(data["semester"]),
    department: stringValue(data["department"]),
    mentor: stringValue(data["mentor"]),
    mentorId: stringValue(data["mentorId"]),
    phone: stringValue(data["phone"]),
    cgpa: numberValue(data["cgpa"]),
    previousGpa: numberValue(data["previousGpa"], numberValue(data["cgpa"])),
    attendance: numberValue(data["attendance"]),
    assignments: assignmentCompletion,
    assignmentCompletion,
    failedSubjects: numberValue(data["failedSubjects"]),
    internalMarks: numberValue(data["internalMarks"]),
    lmsActivity: numberValue(data["lmsActivity"]),
    participation: numberValue(data["participation"]),
    libraryUsage: numberValue(data["libraryUsage"]),
    financialStress: numberValue(data["financialStress"]),
    riskScore: numberValue(data["riskScore"]),
    riskLevel: normalizeRiskLevel(data["riskLevel"]),
    confidence: numberValue(data["confidence"]),
    riskFactors: arrayValue<RiskFactor>(data["riskFactors"]),
    subjects: arrayValue<StudentSubject>(data["subjects"]),
    gpaTrend: arrayValue<StudentTrend>(data["gpaTrend"]),
    monthlyAttendance: arrayValue<MonthlyAttendance>(data["monthlyAttendance"]),
    improvements: arrayValue<string>(data["improvements"]),
    recommendations: arrayValue<StudentRecommendation>(data["recommendations"]),
    lastActivity: stringValue(data["lastActivity"], "Not available"),
    createdAt: data["createdAt"],
    updatedAt: data["updatedAt"],
  };
}

export async function getStudentData(uid: string): Promise<StudentData | null> {
  if (!uid) return null;
  const snapshot = await getDoc(getStudentDocument(uid));
  return snapshot.exists()
    ? mapStudent(snapshot.id, snapshot.data() as Record<string, unknown>)
    : null;
}

export async function getStudentByStudentId(studentId: string): Promise<StudentData | null> {
  if (!studentId) return null;

  const studentQuery = query(
    collection(getDb(), STUDENTS_COLLECTION),
    where("studentId", "==", studentId),
  );
  const snapshot = await getDocs(studentQuery);
  const entry = snapshot.docs[0];

  return entry
    ? mapStudent(entry.id, entry.data() as Record<string, unknown>)
    : null;
}

export async function getCurrentStudentData(): Promise<StudentData | null> {
  const firebaseUser = getFirebaseAuth().currentUser;
  if (!firebaseUser) throw new Error("You must be signed in to view student data.");
  return getStudentData(firebaseUser.uid);
}

export async function listStudents(): Promise<StudentData[]> {
  const authUser = getFirebaseAuth().currentUser;
  if (!authUser) throw new Error("You must be signed in to view students.");

  const snapshot = await getDocs(collection(getDb(), STUDENTS_COLLECTION));
  return snapshot.docs.map((entry) =>
    mapStudent(entry.id, entry.data() as Record<string, unknown>),
  );
}

export async function listStudentsForPractitioner(uid: string): Promise<StudentData[]> {
  if (!uid) return [];
  const studentsQuery = query(
    collection(getDb(), STUDENTS_COLLECTION),
    where("mentorId", "==", uid),
  );
  const snapshot = await getDocs(studentsQuery);
  return snapshot.docs.map((entry) =>
    mapStudent(entry.id, entry.data() as Record<string, unknown>),
  );
}

export async function createStudentData(
  uid: string,
  data: Omit<StudentData, "uid" | "createdAt" | "updatedAt">,
): Promise<void> {
  if (!uid) throw new Error("Student UID is required.");
  await setDoc(getStudentDocument(uid), {
    ...data,
    uid,
    studentId: data.studentId || uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateStudentData(
  uid: string,
  data: Partial<Omit<StudentData, "uid" | "createdAt" | "updatedAt">>,
): Promise<void> {
  if (!uid) throw new Error("Student UID is required.");
  await updateDoc(getStudentDocument(uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteStudentData(uid: string): Promise<void> {
  if (!uid) throw new Error("Student UID is required.");
  await deleteDoc(getStudentDocument(uid));
}

export function subscribeStudentData(
  uid: string,
  onChange: (student: StudentData | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    getStudentDocument(uid),
    (snapshot) => {
      onChange(
        snapshot.exists()
          ? mapStudent(snapshot.id, snapshot.data() as Record<string, unknown>)
          : null,
      );
    },
    (error) => onError?.(error),
  );
}

export function subscribeStudents(
  onChange: (students: StudentData[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(getDb(), STUDENTS_COLLECTION),
    (snapshot) => {
      onChange(
        snapshot.docs.map((entry) =>
          mapStudent(entry.id, entry.data() as Record<string, unknown>),
        ),
      );
    },
    (error) => onError?.(error),
  );
}

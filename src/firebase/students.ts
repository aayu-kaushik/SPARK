import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { getFirebaseAuth } from "./auth";
import { getDb } from "./config";

const STUDENTS_COLLECTION = "students";

// ======================================================
// TYPES
// ======================================================

export type RiskLevel = "Low" | "Medium" | "High";

export interface StudentSubject {
  subject: string;
  attendance: number;
  marks: number;
  target: number;
}

export interface StudentTrend
  extends Record<string, string | number> {
  term: string;
  gpa: number;
  attendance: number;
  assignments: number;
}

export interface MonthlyAttendance
  extends Record<string, string | number> {
  month: string;
  attendance: number;
}

export interface StudentRecommendation {
  category: string;
  icon: string;
  text: string;
}

export interface StudentData {
  uid: string;

  // Student information
  studentId: string;
  course: string;
  semester: number;
  department: string;
  mentor: string;
  phone: string;

  // Academic information
  cgpa: number;
  attendance: number;
  assignments: number;

  // Risk prediction
  riskScore: number;
  riskLevel: RiskLevel;
  confidence: number;

  // Detailed academic information
  subjects: StudentSubject[];
  gpaTrend: StudentTrend[];
  monthlyAttendance: MonthlyAttendance[];

  // AI / academic guidance
  improvements: string[];
  recommendations: StudentRecommendation[];

  createdAt?: unknown;
  updatedAt?: unknown;
}

// ======================================================
// STUDENT DOCUMENT REFERENCE
// ======================================================

function getStudentDocument(uid: string) {
  return doc(
    getDb(),
    STUDENTS_COLLECTION,
    uid,
  );
}

// ======================================================
// GET STUDENT DATA BY UID
//
// Admin / Practitioner functionality can use this later.
// Firestore Security Rules still decide whether the
// currently logged-in user is allowed to read the record.
// ======================================================

export async function getStudentData(
  uid: string,
): Promise<StudentData | null> {
  if (!uid) {
    return null;
  }

  const snapshot = await getDoc(
    getStudentDocument(uid),
  );

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    uid: snapshot.id,

    studentId:
      typeof data["studentId"] === "string"
        ? data["studentId"]
        : "",

    course:
      typeof data["course"] === "string"
        ? data["course"]
        : "",

    semester:
      typeof data["semester"] === "number"
        ? data["semester"]
        : 0,

    department:
      typeof data["department"] === "string"
        ? data["department"]
        : "",

    mentor:
      typeof data["mentor"] === "string"
        ? data["mentor"]
        : "",

    phone:
      typeof data["phone"] === "string"
        ? data["phone"]
        : "",

    cgpa:
      typeof data["cgpa"] === "number"
        ? data["cgpa"]
        : 0,

    attendance:
      typeof data["attendance"] === "number"
        ? data["attendance"]
        : 0,

    assignments:
      typeof data["assignments"] === "number"
        ? data["assignments"]
        : 0,

    riskScore:
      typeof data["riskScore"] === "number"
        ? data["riskScore"]
        : 0,

    riskLevel:
      normalizeRiskLevel(data["riskLevel"]),

    confidence:
      typeof data["confidence"] === "number"
        ? data["confidence"]
        : 0,

    subjects:
      Array.isArray(data["subjects"])
        ? (data["subjects"] as StudentSubject[])
        : [],

    gpaTrend:
      Array.isArray(data["gpaTrend"])
        ? (data["gpaTrend"] as StudentTrend[])
        : [],

    monthlyAttendance:
      Array.isArray(data["monthlyAttendance"])
        ? (data["monthlyAttendance"] as MonthlyAttendance[])
        : [],

    improvements:
      Array.isArray(data["improvements"])
        ? (data["improvements"] as string[])
        : [],

    recommendations:
      Array.isArray(data["recommendations"])
        ? (data["recommendations"] as StudentRecommendation[])
        : [],

    createdAt: data["createdAt"],
    updatedAt: data["updatedAt"],
  };
}
// ======================================================
// GET CURRENT LOGGED-IN STUDENT
//
// IMPORTANT:
// Student dashboard should use THIS function.
//
// The UID comes directly from Firebase Authentication,
// so the student dashboard does not choose another UID.
// ======================================================

export async function getCurrentStudentData():
  Promise<StudentData | null> {
  const firebaseUser =
    getFirebaseAuth().currentUser;

  if (!firebaseUser) {
    throw new Error(
      "You must be signed in to view student data.",
    );
  }

  return getStudentData(firebaseUser.uid);
}

// ======================================================
// CREATE STUDENT DATA
//
// Intended for Admin/trusted workflows.
//
// Firestore Security Rules provide the actual
// authorization.
// ======================================================

export async function createStudentData(
  uid: string,
  data: Omit<
    StudentData,
    "uid" | "createdAt" | "updatedAt"
  >,
): Promise<void> {
  if (!uid) {
    throw new Error(
      "Student UID is required.",
    );
  }

  await setDoc(
    getStudentDocument(uid),
    {
      ...data,
      uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  );
}

// ======================================================
// UPDATE STUDENT DATA
//
// Intended for Admin/trusted workflows.
//
// Student accounts are blocked from modifying academic
// data by Firestore Security Rules.
// ======================================================

export async function updateStudentData(
  uid: string,
  data: Partial<
    Omit<
      StudentData,
      "uid" | "createdAt" | "updatedAt"
    >
  >,
): Promise<void> {
  if (!uid) {
    throw new Error(
      "Student UID is required.",
    );
  }

  await updateDoc(
    getStudentDocument(uid),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
  );
}

// ======================================================
// RISK LEVEL NORMALIZATION
//
// Firestore may currently contain:
// "low", "medium", "high"
//
// Components use:
// "Low", "Medium", "High"
//
// This prevents TypeScript/UI problems while we migrate
// the existing Firestore data.
// ======================================================

function normalizeRiskLevel(
  value: unknown,
): RiskLevel {
  if (typeof value !== "string") {
    return "Low";
  }

  switch (value.toLowerCase()) {
    case "high":
      return "High";

    case "medium":
      return "Medium";

    case "low":
    default:
      return "Low";
  }
}
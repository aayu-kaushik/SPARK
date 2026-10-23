
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import { getFirebaseAuth } from "./auth";
import { getDb } from "./config";

const STUDENTS_COLLECTION = "students";
const USERS_COLLECTION = "users";

export type RiskLevel =
  | "Low"
  | "Medium"
  | "High"
  | "Critical";

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

// ============================================================
// STUDENT MANAGEMENT TYPES
// ============================================================

export type StudentEditableFields = Pick<
  StudentData,
  | "studentId"
  | "name"
  | "email"
  | "course"
  | "semester"
  | "department"
  | "phone"
  | "cgpa"
  | "previousGpa"
  | "attendance"
  | "assignments"
  | "assignmentCompletion"
  | "failedSubjects"
  | "internalMarks"
  | "lmsActivity"
  | "participation"
  | "libraryUsage"
  | "financialStress"
>;

export type StudentManagementInput =
  Partial<StudentEditableFields>;

export interface PractitionerOption {
  uid: string;
  name: string;
  email: string;
}

// ============================================================
// FIRESTORE REFERENCES
// ============================================================

function getStudentDocument(uid: string) {
  return doc(getDb(), STUDENTS_COLLECTION, uid);
}

function getUserDocument(uid: string) {
  return doc(getDb(), USERS_COLLECTION, uid);
}

// ============================================================
// NORMALIZATION HELPERS
// ============================================================

function numberValue(
  value: unknown,
  fallback = 0,
): number {
  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : fallback;
}

function stringValue(
  value: unknown,
  fallback = "",
): string {
  return typeof value === "string"
    ? value
    : fallback;
}

function arrayValue<T>(value: unknown): T[] {
  return Array.isArray(value)
    ? (value as T[])
    : [];
}

function normalizeRiskLevel(
  value: unknown,
): RiskLevel {
  if (typeof value !== "string") {
    return "Low";
  }

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

function mapStudent(
  id: string,
  data: Record<string, unknown>,
): StudentData {
  const assignmentCompletion = numberValue(
    data["assignmentCompletion"],
    numberValue(data["assignments"], 0),
  );

  return {
    uid: stringValue(data["uid"], id),

    studentId: stringValue(
      data["studentId"],
      id,
    ),

    name: stringValue(
      data["name"],
      "Student",
    ),

    email: stringValue(data["email"]),
    course: stringValue(data["course"]),
    semester: numberValue(data["semester"]),
    department: stringValue(data["department"]),
    mentor: stringValue(data["mentor"]),
    mentorId: stringValue(data["mentorId"]),
    phone: stringValue(data["phone"]),
    cgpa: numberValue(data["cgpa"]),

    previousGpa: numberValue(
      data["previousGpa"],
      numberValue(data["cgpa"]),
    ),

    attendance: numberValue(data["attendance"]),
    assignments: assignmentCompletion,
    assignmentCompletion,

    failedSubjects: numberValue(
      data["failedSubjects"],
    ),

    internalMarks: numberValue(
      data["internalMarks"],
    ),

    lmsActivity: numberValue(
      data["lmsActivity"],
    ),

    participation: numberValue(
      data["participation"],
    ),

    libraryUsage: numberValue(
      data["libraryUsage"],
    ),

    financialStress: numberValue(
      data["financialStress"],
    ),

    riskScore: numberValue(
      data["riskScore"],
    ),

    riskLevel: normalizeRiskLevel(
      data["riskLevel"],
    ),

    confidence: numberValue(
      data["confidence"],
    ),

    riskFactors: arrayValue<RiskFactor>(
      data["riskFactors"],
    ),

    subjects: arrayValue<StudentSubject>(
      data["subjects"],
    ),

    gpaTrend: arrayValue<StudentTrend>(
      data["gpaTrend"],
    ),

    monthlyAttendance:
      arrayValue<MonthlyAttendance>(
        data["monthlyAttendance"],
      ),

    improvements: arrayValue<string>(
      data["improvements"],
    ),

    recommendations:
      arrayValue<StudentRecommendation>(
        data["recommendations"],
      ),

    lastActivity: stringValue(
      data["lastActivity"],
      "Not available",
    ),

    createdAt: data["createdAt"],
    updatedAt: data["updatedAt"],
  };
}

// ============================================================
// AUTHENTICATION HELPER
// ============================================================

function requireSignedInUser(): string {
  const currentUser =
    getFirebaseAuth().currentUser;

  if (!currentUser) {
    throw new Error(
      "You must be signed in to perform this action.",
    );
  }

  return currentUser.uid;
}

// ============================================================
// INPUT VALIDATION
// ============================================================

function validateNumber(
  value: number,
  label: string,
  minimum: number,
  maximum: number,
): void {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new Error(
      `${label} must be between ${minimum} and ${maximum}.`,
    );
  }
}

function validateStudentInput(
  data: StudentManagementInput,
): void {
  if (
    data.studentId !== undefined &&
    !data.studentId.trim()
  ) {
    throw new Error(
      "Student ID cannot be empty.",
    );
  }

  if (
    data.name !== undefined &&
    !data.name.trim()
  ) {
    throw new Error(
      "Student name cannot be empty.",
    );
  }

  if (
    data.email !== undefined &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      data.email.trim(),
    )
  ) {
    throw new Error(
      "Enter a valid student email address.",
    );
  }

  if (data.semester !== undefined) {
    validateNumber(
      data.semester,
      "Semester",
      1,
      12,
    );

    if (!Number.isInteger(data.semester)) {
      throw new Error(
        "Semester must be a whole number.",
      );
    }
  }

  const percentageFields: Array<
    keyof StudentManagementInput
  > = [
    "attendance",
    "assignments",
    "assignmentCompletion",
    "internalMarks",
    "lmsActivity",
    "participation",
    "libraryUsage",
    "financialStress",
  ];

  for (const field of percentageFields) {
    const value = data[field];

    if (value !== undefined) {
      validateNumber(
        value as number,
        field,
        0,
        100,
      );
    }
  }

  if (data.cgpa !== undefined) {
    validateNumber(
      data.cgpa,
      "CGPA",
      0,
      10,
    );
  }

  if (data.previousGpa !== undefined) {
    validateNumber(
      data.previousGpa,
      "Previous GPA",
      0,
      10,
    );
  }

  if (data.failedSubjects !== undefined) {
    validateNumber(
      data.failedSubjects,
      "Failed subjects",
      0,
      50,
    );

    if (!Number.isInteger(data.failedSubjects)) {
      throw new Error(
        "Failed subjects must be a whole number.",
      );
    }
  }
}

function cleanStudentInput(
  data: StudentManagementInput,
): StudentManagementInput {
  const cleaned: StudentManagementInput = {};

  const textFields: Array<
    keyof Pick<
      StudentEditableFields,
      | "studentId"
      | "name"
      | "email"
      | "course"
      | "department"
      | "phone"
    >
  > = [
    "studentId",
    "name",
    "email",
    "course",
    "department",
    "phone",
  ];

  for (const field of textFields) {
    const value = data[field];

    if (typeof value === "string") {
      cleaned[field] =
        field === "email"
          ? value.trim().toLowerCase()
          : value.trim();
    }
  }

  const numericFields: Array<
    keyof Pick<
      StudentEditableFields,
      | "semester"
      | "cgpa"
      | "previousGpa"
      | "attendance"
      | "assignments"
      | "assignmentCompletion"
      | "failedSubjects"
      | "internalMarks"
      | "lmsActivity"
      | "participation"
      | "libraryUsage"
      | "financialStress"
    >
  > = [
    "semester",
    "cgpa",
    "previousGpa",
    "attendance",
    "assignments",
    "assignmentCompletion",
    "failedSubjects",
    "internalMarks",
    "lmsActivity",
    "participation",
    "libraryUsage",
    "financialStress",
  ];

  for (const field of numericFields) {
    const value = data[field];

    if (typeof value === "number") {
      cleaned[field] = value;
    }
  }

  // Keep assignment metrics synchronized.
  if (cleaned.assignmentCompletion !== undefined) {
    cleaned.assignments =
      cleaned.assignmentCompletion;
  } else if (cleaned.assignments !== undefined) {
    cleaned.assignmentCompletion =
      cleaned.assignments;
  }

  return cleaned;
}

// ============================================================
// DUPLICATE STUDENT ID CHECK
// ============================================================

export async function isStudentIdTaken(
  studentId: string,
  excludeUid?: string,
): Promise<boolean> {
  requireSignedInUser();

  const normalizedId = studentId.trim();

  if (!normalizedId) {
    return false;
  }

  const studentQuery = query(
    collection(getDb(), STUDENTS_COLLECTION),
    where("studentId", "==", normalizedId),
  );

  const snapshot = await getDocs(studentQuery);

  return snapshot.docs.some(
    (entry) => entry.id !== excludeUid,
  );
}

// ============================================================
// STUDENT RECORD INITIALIZATION
// ============================================================

export async function ensureStudentRecord(
  uid: string,
  profile: {
    name: string;
    email: string;
  },
): Promise<void> {
  if (!uid) {
    throw new Error(
      "Student UID is required.",
    );
  }

  const existing = await getDoc(
    getStudentDocument(uid),
  );

  if (existing.exists()) {
    return;
  }

  await setDoc(
    getStudentDocument(uid),
    {
      uid,
      studentId: uid.slice(0, 8).toUpperCase(),
      name: profile.name.trim() || "Student",
      email: profile.email.trim().toLowerCase(),
      course: "Not assigned",
      semester: 1,
      department: "Not assigned",
      mentor: "Not assigned",
      mentorId: "",
      phone: "",
      cgpa: 0,
      previousGpa: 0,
      attendance: 0,
      assignments: 0,
      assignmentCompletion: 0,
      failedSubjects: 0,
      internalMarks: 0,
      lmsActivity: 0,
      participation: 0,
      libraryUsage: 0,
      financialStress: 0,
      riskScore: 0,
      riskLevel: "Low",
      confidence: 0,
      riskFactors: [],
      subjects: [],
      gpaTrend: [],
      monthlyAttendance: [],
      improvements: [],
      recommendations: [],
      lastActivity:
        "No academic activity recorded yet",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  );
}

// ============================================================
// STUDENT READ OPERATIONS
// ============================================================

export async function getStudentData(
  uid: string,
): Promise<StudentData | null> {
  if (!uid) return null;

  const snapshot = await getDoc(
    getStudentDocument(uid),
  );

  return snapshot.exists()
    ? mapStudent(
        snapshot.id,
        snapshot.data() as Record<string, unknown>,
      )
    : null;
}

export async function getStudentByStudentId(
  studentId: string,
): Promise<StudentData | null> {
  if (!studentId) return null;

  const studentQuery = query(
    collection(getDb(), STUDENTS_COLLECTION),
    where(
      "studentId",
      "==",
      studentId.trim(),
    ),
    limit(1),
  );

  const snapshot = await getDocs(
    studentQuery,
  );

  const entry = snapshot.docs[0];

  return entry
    ? mapStudent(
        entry.id,
        entry.data() as Record<string, unknown>,
      )
    : null;
}

// ============================================================
// NEW: PRACTITIONER-ASSIGNED STUDENT LOOKUP
// ============================================================

export async function getStudentForPractitioner(
  studentId: string,
  practitionerUid: string,
): Promise<StudentData | null> {
  const currentUid = requireSignedInUser();

  if (
    !practitionerUid ||
    currentUid !== practitionerUid
  ) {
    throw new Error(
      "You can only access students assigned to your own account.",
    );
  }

  const normalizedStudentId = studentId.trim();

  if (!normalizedStudentId) {
    return null;
  }

  const studentQuery = query(
    collection(getDb(), STUDENTS_COLLECTION),
    where(
      "studentId",
      "==",
      normalizedStudentId,
    ),
    where(
      "mentorId",
      "==",
      practitionerUid,
    ),
    limit(1),
  );

  const snapshot = await getDocs(studentQuery);
  const entry = snapshot.docs[0];

  return entry
    ? mapStudent(
        entry.id,
        entry.data() as Record<string, unknown>,
      )
    : null;
}

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

export async function listStudents():
  Promise<StudentData[]> {
  requireSignedInUser();

  const snapshot = await getDocs(
    collection(getDb(), STUDENTS_COLLECTION),
  );

  return snapshot.docs.map((entry) =>
    mapStudent(
      entry.id,
      entry.data() as Record<string, unknown>,
    ),
  );
}

export async function listStudentsForPractitioner(
  uid: string,
): Promise<StudentData[]> {
  if (!uid) return [];

  const studentsQuery = query(
    collection(getDb(), STUDENTS_COLLECTION),
    where("mentorId", "==", uid),
  );

  const snapshot = await getDocs(
    studentsQuery,
  );

  return snapshot.docs.map((entry) =>
    mapStudent(
      entry.id,
      entry.data() as Record<string, unknown>,
    ),
  );
}

// ============================================================
// EXISTING CREATE FUNCTION
// ============================================================

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
      studentId: data.studentId || uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  );
}

// ============================================================
// EXISTING UPDATE FUNCTION
// ============================================================

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

// ============================================================
// EXISTING DELETE FUNCTION
// ============================================================

export async function deleteStudentData(
  uid: string,
): Promise<void> {
  if (!uid) {
    throw new Error(
      "Student UID is required.",
    );
  }

  await deleteDoc(
    getStudentDocument(uid),
  );
}

// ============================================================
// ADMIN — CREATE A LINKED STUDENT RECORD
// ============================================================

export async function createManagedStudent(
  uid: string,
  input: StudentManagementInput,
): Promise<void> {
  requireSignedInUser();

  const normalizedUid = uid.trim();

  if (!normalizedUid) {
    throw new Error(
      "Student Firebase UID is required.",
    );
  }

  const cleaned = cleanStudentInput(input);
  validateStudentInput(cleaned);

  const userSnapshot = await getDoc(
    getUserDocument(normalizedUid),
  );

  if (!userSnapshot.exists()) {
    throw new Error(
      "This UID does not belong to an existing SPARK user account.",
    );
  }

  const profile = userSnapshot.data();

  if (profile.role !== "student") {
    throw new Error(
      "The selected account must have the student role.",
    );
  }

  const profileEmail = stringValue(
    profile.email,
  ).trim().toLowerCase();

  const providedEmail = cleaned.email;

  if (
    providedEmail &&
    profileEmail &&
    providedEmail !== profileEmail
  ) {
    throw new Error(
      "The student email must match the linked account email.",
    );
  }

  const studentId =
    cleaned.studentId ||
    normalizedUid.slice(0, 8).toUpperCase();

  if (await isStudentIdTaken(studentId)) {
    throw new Error(
      "This student ID is already assigned to another student.",
    );
  }

  const existing = await getDoc(
    getStudentDocument(normalizedUid),
  );

  if (existing.exists()) {
    throw new Error(
      "A student record already exists for this account. Use Edit Student instead.",
    );
  }

  const studentData = {
    uid: normalizedUid,
    studentId,

    name:
      cleaned.name ||
      stringValue(profile.name, "Student"),

    email:
      profileEmail ||
      providedEmail ||
      "",

    course:
      cleaned.course ?? "Not assigned",

    semester:
      cleaned.semester ?? 1,

    department:
      cleaned.department ?? "Not assigned",

    mentor: "Not assigned",
    mentorId: "",

    phone:
      cleaned.phone ?? "",

    cgpa:
      cleaned.cgpa ?? 0,

    previousGpa:
      cleaned.previousGpa ?? 0,

    attendance:
      cleaned.attendance ?? 0,

    assignments:
      cleaned.assignments ?? 0,

    assignmentCompletion:
      cleaned.assignmentCompletion ?? 0,

    failedSubjects:
      cleaned.failedSubjects ?? 0,

    internalMarks:
      cleaned.internalMarks ?? 0,

    lmsActivity:
      cleaned.lmsActivity ?? 0,

    participation:
      cleaned.participation ?? 0,

    libraryUsage:
      cleaned.libraryUsage ?? 0,

    financialStress:
      cleaned.financialStress ?? 0,

    riskScore: 0,
    riskLevel: "Low" as RiskLevel,
    confidence: 0,

    riskFactors: [] as RiskFactor[],
    subjects: [] as StudentSubject[],
    gpaTrend: [] as StudentTrend[],

    monthlyAttendance:
      [] as MonthlyAttendance[],

    improvements: [] as string[],

    recommendations:
      [] as StudentRecommendation[],

    lastActivity:
      "No academic activity recorded yet",

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await runTransaction(
    getDb(),
    async (transaction) => {
      const reference =
        getStudentDocument(normalizedUid);

      const snapshot =
        await transaction.get(reference);

      if (snapshot.exists()) {
        throw new Error(
          "A student record already exists for this account.",
        );
      }

      transaction.set(
        reference,
        studentData,
      );
    },
  );
}

// ============================================================
// ADMIN — UPDATE STUDENT ACADEMIC DETAILS
// ============================================================

export async function updateManagedStudent(
  uid: string,
  input: StudentManagementInput,
): Promise<void> {
  requireSignedInUser();

  if (!uid.trim()) {
    throw new Error(
      "Student UID is required.",
    );
  }

  const cleaned = cleanStudentInput(input);
  validateStudentInput(cleaned);

  if (Object.keys(cleaned).length === 0) {
    throw new Error(
      "No student changes were provided.",
    );
  }

  if (
    cleaned.studentId &&
    (await isStudentIdTaken(
      cleaned.studentId,
      uid,
    ))
  ) {
    throw new Error(
      "This student ID is already assigned to another student.",
    );
  }

  // Student email is linked to Firebase Authentication.
  if (cleaned.email !== undefined) {
    const existing = await getStudentData(uid);

    if (!existing) {
      throw new Error(
        "Student record not found.",
      );
    }

    if (
      cleaned.email !==
      existing.email.trim().toLowerCase()
    ) {
      throw new Error(
        "Student login email cannot be changed from academic management.",
      );
    }

    delete cleaned.email;
  }

  await updateDoc(
    getStudentDocument(uid),
    {
      ...cleaned,
      updatedAt: serverTimestamp(),
    },
  );
}

// ============================================================
// ADMIN — LIST AVAILABLE PRACTITIONERS
// ============================================================

export async function listPractitioners():
  Promise<PractitionerOption[]> {
  requireSignedInUser();

  const practitionersQuery = query(
    collection(getDb(), USERS_COLLECTION),
    where("role", "==", "practitioner"),
  );

  const snapshot = await getDocs(
    practitionersQuery,
  );

  return snapshot.docs.map((entry) => {
    const profile = entry.data();

    return {
      uid: entry.id,

      name: stringValue(
        profile.name,
        "Practitioner",
      ),

      email: stringValue(
        profile.email,
      ),
    };
  });
}

// ============================================================
// ADMIN — ASSIGN OR REMOVE A PRACTITIONER
// ============================================================

export async function assignStudentPractitioner(
  studentUid: string,
  practitionerUid: string | null,
): Promise<void> {
  requireSignedInUser();

  if (!studentUid.trim()) {
    throw new Error(
      "Student UID is required.",
    );
  }

  const normalizedPractitionerUid =
    practitionerUid?.trim() ?? "";

  // Empty UID removes the current assignment.
  if (!normalizedPractitionerUid) {
    await updateDoc(
      getStudentDocument(studentUid),
      {
        mentorId: "",
        mentor: "Not assigned",
        updatedAt: serverTimestamp(),
      },
    );

    return;
  }

  const practitionerSnapshot =
    await getDoc(
      getUserDocument(normalizedPractitionerUid),
    );

  if (!practitionerSnapshot.exists()) {
    throw new Error(
      "Practitioner account not found.",
    );
  }

  const practitioner =
    practitionerSnapshot.data();

  if (practitioner.role !== "practitioner") {
    throw new Error(
      "The selected account is not a practitioner.",
    );
  }

  await updateDoc(
    getStudentDocument(studentUid),
    {
      mentorId:
        normalizedPractitionerUid,

      mentor: stringValue(
        practitioner.name,
        "Practitioner",
      ),

      updatedAt: serverTimestamp(),
    },
  );
}

// ============================================================
// REAL-TIME STUDENT SUBSCRIPTIONS
// ============================================================

export function subscribeStudentData(
  uid: string,
  onChange: (
    student: StudentData | null,
  ) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    getStudentDocument(uid),
    (snapshot) => {
      onChange(
        snapshot.exists()
          ? mapStudent(
              snapshot.id,
              snapshot.data() as Record<
                string,
                unknown
              >,
            )
          : null,
      );
    },
    (error) => onError?.(error),
  );
}

export function subscribeStudents(
  onChange: (
    students: StudentData[],
  ) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(
      getDb(),
      STUDENTS_COLLECTION,
    ),
    (snapshot) => {
      onChange(
        snapshot.docs.map((entry) =>
          mapStudent(
            entry.id,
            entry.data() as Record<
              string,
              unknown
            >,
          ),
        ),
      );
    },
    (error) => onError?.(error),
  );
}

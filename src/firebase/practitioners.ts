import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { getDb } from "./config";
import type { UserProfile } from "./users";
import { listStudents, listStudentsForPractitioner } from "./students";

export interface PractitionerData {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  studentsAssigned: number;
  atRisk: number;
  interventions: number;
  status: "Active" | "On Leave";
  avgAttendance: number;
}

function profileToPractitioner(profile: UserProfile, studentsAssigned = 0, atRisk = 0): PractitionerData {
  return {
    id: profile.uid,
    name: profile.name,
    email: profile.email,
    department: profile.department || "Not assigned",
    designation: profile.title || "Practitioner",
    studentsAssigned,
    atRisk,
    interventions: 0,
    status: "Active",
    avgAttendance: 0,
  };
}

export async function listPractitioners(): Promise<PractitionerData[]> {
  const snapshot = await getDocs(
    query(collection(getDb(), "users"), where("role", "==", "practitioner")),
  );

  const students = await listStudents();

  return snapshot.docs.map((entry) => {
    const profile = { ...(entry.data() as UserProfile), uid: entry.id };
    const assigned = students.filter((student) => student.mentorId === entry.id);
    const atRisk = assigned.filter((student) => student.riskScore >= 45).length;
    const avgAttendance = assigned.length
      ? Math.round((assigned.reduce((sum, student) => sum + student.attendance, 0) / assigned.length) * 10) / 10
      : 0;

    return {
      ...profileToPractitioner(profile, assigned.length, atRisk),
      avgAttendance,
    };
  });
}

export async function getPractitionerStudents(uid: string) {
  return listStudentsForPractitioner(uid);
}

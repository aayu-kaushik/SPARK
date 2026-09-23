import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
  where,
} from "firebase/firestore";

import { getDb } from "./config";

export type InterventionStatus = "Pending" | "In Progress" | "Completed" | "Cancelled";

export interface InterventionRecord {
  id: string;
  studentUid: string;
  assignedTo: string;
  reason: string;
  action: string;
  status: InterventionStatus;
  followUpDate?: string;
  notes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export async function createIntervention(
  intervention: Omit<InterventionRecord, "id" | "createdAt" | "updatedAt">,
) {
  const ref = await addDoc(collection(getDb(), "interventions"), {
    ...intervention,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listInterventions(studentUid?: string): Promise<InterventionRecord[]> {
  const base = collection(getDb(), "interventions");
  const interventionQuery = studentUid
    ? query(base, where("studentUid", "==", studentUid), orderBy("createdAt", "desc"))
    : query(base, orderBy("createdAt", "desc"));

  const snapshot = await getDocs(interventionQuery);
  return snapshot.docs.map((entry) => ({
    id: entry.id,
    ...(entry.data() as Omit<InterventionRecord, "id">),
  }));
}

export async function updateIntervention(
  id: string,
  data: Partial<Omit<InterventionRecord, "id" | "createdAt">>,
) {
  await updateDoc(doc(getDb(), "interventions", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

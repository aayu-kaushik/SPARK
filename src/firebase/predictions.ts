import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { getDb } from "./config";
import type { RiskFactor, RiskLevel } from "./students";

export interface PredictionRecord {
  id: string;
  studentUid: string;
  probability: number;
  riskLevel: RiskLevel;
  confidence: number;
  factors: RiskFactor[];
  explanation: string;
  interventions: string[];
  source: "simulation" | "ml-api";
  createdAt?: unknown;
}

export async function savePrediction(
  prediction: Omit<PredictionRecord, "id" | "createdAt">,
) {
  const ref = await addDoc(collection(getDb(), "predictions"), {
    ...prediction,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listPredictions(studentUid?: string): Promise<PredictionRecord[]> {
  const base = collection(getDb(), "predictions");
  const predictionQuery = studentUid
    ? query(base, where("studentUid", "==", studentUid), orderBy("createdAt", "desc"))
    : query(base, orderBy("createdAt", "desc"));

  const snapshot = await getDocs(predictionQuery);
  return snapshot.docs.map((entry) => ({
    id: entry.id,
    ...(entry.data() as Omit<PredictionRecord, "id">),
  }));
}

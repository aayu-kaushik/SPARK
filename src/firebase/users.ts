import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { getDb } from "./config";

const USERS_COLLECTION = "users";

export type UserRole = "admin" | "practitioner" | "student";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  department: string;
  createdAt?: unknown;
}

export async function createUserProfile(uid: string, user: Omit<UserProfile, "uid" | "createdAt">): Promise<void> {
  await setDoc(doc(getDb(), USERS_COLLECTION, uid), {
    uid,
    name: user.name,
    email: user.email,
    role: user.role,
    title: user.title,
    department: user.department,
    createdAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(getDb(), USERS_COLLECTION, uid));
  if (!snapshot.exists()) return null;
  return snapshot.data() as UserProfile;
}

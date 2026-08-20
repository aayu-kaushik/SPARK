import { collection, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, setDoc, where, type Unsubscribe } from "firebase/firestore";

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
    email: user.email.trim().toLowerCase(),
    role: user.role,
    title: user.title,
    department: user.department,
    createdAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(getDb(), USERS_COLLECTION, uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as UserProfile;
  return { ...data, uid: data.uid || snapshot.id };
}

function mapProfile(id: string, data: UserProfile): UserProfile {
  return { ...data, uid: data.uid || id };
}

export async function listUserProfiles(): Promise<UserProfile[]> {
  const snapshot = await getDocs(collection(getDb(), USERS_COLLECTION));
  return snapshot.docs.map((entry) => mapProfile(entry.id, entry.data() as UserProfile));
}

export function subscribeUserProfiles(
  onChange: (profiles: UserProfile[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(getDb(), USERS_COLLECTION),
    (snapshot) => {
      onChange(snapshot.docs.map((entry) => mapProfile(entry.id, entry.data() as UserProfile)));
    },
    (error) => onError?.(error),
  );
}

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  const snapshot = await getDocs(
    query(collection(getDb(), USERS_COLLECTION), where("email", "==", email.trim().toLowerCase())),
  );
  const match = snapshot.docs[0];
  return match ? mapProfile(match.id, match.data() as UserProfile) : null;
}

export function canMessageRole(from: UserRole, to: UserRole): boolean {
  return from !== to;
}

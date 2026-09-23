import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";

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

// =========================================================
// CREATE USER PROFILE
// =========================================================

export async function createUserProfile(
  uid: string,
  user: Omit<UserProfile, "uid" | "createdAt">,
): Promise<void> {
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

// =========================================================
// GET CURRENT USER PROFILE
// =========================================================

export async function getUserProfile(
  uid: string,
): Promise<UserProfile | null> {
  const snapshot = await getDoc(
    doc(getDb(), USERS_COLLECTION, uid),
  );

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data() as UserProfile;

  return {
    ...data,
    uid: data.uid || snapshot.id,
  };
}

// =========================================================
// INTERNAL PROFILE MAPPER
// =========================================================

function mapProfile(
  id: string,
  data: UserProfile,
): UserProfile {
  return {
    ...data,
    uid: data.uid || id,
  };
}

// =========================================================
// LIST ALL USER PROFILES
//
// Keep this for Admin / other parts of SPARK.
// Do NOT use this from the Student message picker.
// =========================================================

export async function listUserProfiles(): Promise<UserProfile[]> {
  const snapshot = await getDocs(
    collection(getDb(), USERS_COLLECTION),
  );

  return snapshot.docs.map((entry) =>
    mapProfile(
      entry.id,
      entry.data() as UserProfile,
    ),
  );
}

// =========================================================
// SUBSCRIBE TO ALL USER PROFILES
//
// Again: useful elsewhere, but the Student message picker
// should use subscribeMessageContacts() instead.
// =========================================================

export function subscribeUserProfiles(
  onChange: (profiles: UserProfile[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(getDb(), USERS_COLLECTION),

    (snapshot) => {
      onChange(
        snapshot.docs.map((entry) =>
          mapProfile(
            entry.id,
            entry.data() as UserProfile,
          ),
        ),
      );
    },

    (error) => {
      onError?.(error);
    },
  );
}

// =========================================================
// FIND USER BY EMAIL
//
// Keep this because another part of your application may
// still use it. MessagePanel no longer needs to use it.
// =========================================================

export async function findUserByEmail(
  email: string,
): Promise<UserProfile | null> {
  const normalizedEmail = email
    .trim()
    .toLowerCase();

  const snapshot = await getDocs(
    query(
      collection(getDb(), USERS_COLLECTION),
      where("email", "==", normalizedEmail),
    ),
  );

  const match = snapshot.docs[0];

  return match
    ? mapProfile(
        match.id,
        match.data() as UserProfile,
      )
    : null;
}

// =========================================================
// ROLE-BASED MESSAGING CHECK
// =========================================================

export function canMessageRole(
  from: UserRole,
  to: UserRole,
): boolean {
  if (from === "student") {
    return (
      to === "admin" ||
      to === "practitioner"
    );
  }

  if (from === "practitioner") {
    return (
      to === "admin" ||
      to === "student"
    );
  }

  if (from === "admin") {
    return (
      to === "student" ||
      to === "practitioner"
    );
  }

  return false;
}

// =========================================================
// GET ROLES THAT CURRENT USER MAY MESSAGE
// =========================================================

function getMessageableRoles(
  currentRole: UserRole,
): UserRole[] {
  if (currentRole === "student") {
    return [
      "admin",
      "practitioner",
    ];
  }

  if (currentRole === "practitioner") {
    return [
      "admin",
      "student",
    ];
  }

  return [
    "practitioner",
    "student",
  ];
}

// =========================================================
// LIST MESSAGE CONTACTS
//
// IMPORTANT:
// This does NOT request every user.
//
// Student:
//    Admin + Practitioner
//
// Practitioner:
//    Admin + Student
//
// Admin:
//    Practitioner + Student
// =========================================================

export async function listMessageContacts(
  currentRole: UserRole,
): Promise<UserProfile[]> {
  const allowedRoles =
    getMessageableRoles(currentRole);

  const contactsQuery = query(
    collection(getDb(), USERS_COLLECTION),
    where(
      "role",
      "in",
      allowedRoles,
    ),
  );

  const snapshot =
    await getDocs(contactsQuery);

  return snapshot.docs.map((entry) =>
    mapProfile(
      entry.id,
      entry.data() as UserProfile,
    ),
  );
}

// =========================================================
// REAL-TIME MESSAGE CONTACT SUBSCRIPTION
// =========================================================

export function subscribeMessageContacts(
  currentRole: UserRole,
  onChange: (profiles: UserProfile[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const allowedRoles =
    getMessageableRoles(currentRole);

  const contactsQuery = query(
    collection(getDb(), USERS_COLLECTION),
    where(
      "role",
      "in",
      allowedRoles,
    ),
  );

  return onSnapshot(
    contactsQuery,

    (snapshot) => {
      const profiles =
        snapshot.docs.map((entry) =>
          mapProfile(
            entry.id,
            entry.data() as UserProfile,
          ),
        );

      onChange(profiles);
    },

    (error) => {
      onError?.(error);
    },
  );
}
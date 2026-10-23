
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
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

const USERS_COLLECTION = "users";

export type UserRole =
  | "admin"
  | "practitioner"
  | "student";

export function isUserRole(
  value: unknown,
): value is UserRole {
  return (
    value === "admin" ||
    value === "practitioner" ||
    value === "student"
  );
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  department: string;
  createdAt?: unknown;
}

export interface UserProfileUpdate {
  name?: string;
  title?: string;
  department?: string;
}

export interface StudentAccountOption {
  uid: string;
  name: string;
  email: string;
  department: string;
}

export interface PractitionerAccountOption {
  uid: string;
  name: string;
  email: string;
  department: string;
  title: string;
}

// =========================================================
// FIRESTORE REFERENCE
// =========================================================

function getUserDocument(uid: string) {
  return doc(
    getDb(),
    USERS_COLLECTION,
    uid,
  );
}

// =========================================================
// AUTHENTICATION HELPERS
// =========================================================

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

async function requireAdmin(): Promise<string> {
  const uid = requireSignedInUser();

  const snapshot = await getDoc(
    getUserDocument(uid),
  );

  if (
    !snapshot.exists() ||
    snapshot.data().role !== "admin"
  ) {
    throw new Error(
      "Only administrators can perform this action.",
    );
  }

  return uid;
}

// =========================================================
// PROFILE MAPPER
// =========================================================

function mapProfile(
  id: string,
  data: UserProfile,
): UserProfile {
  return {
    ...data,
    uid: id,
  };
}

// =========================================================
// CREATE USER PROFILE — EXISTING FUNCTION
// =========================================================

export async function createUserProfile(
  uid: string,
  user: Omit<
    UserProfile,
    "uid" | "createdAt"
  >,
): Promise<void> {
  if (!uid.trim()) {
    throw new Error(
      "User UID is required.",
    );
  }

  if (!isUserRole(user.role)) {
    throw new Error(
      "Invalid user role.",
    );
  }

  await setDoc(
    getUserDocument(uid),
    {
      uid,
      name: user.name.trim(),
      email: user.email.trim().toLowerCase(),
      role: user.role,
      title: user.title.trim(),
      department: user.department.trim(),
      createdAt: serverTimestamp(),
    },
  );
}

// =========================================================
// GET USER PROFILE — EXISTING FUNCTION
// =========================================================

export async function getUserProfile(
  uid: string,
): Promise<UserProfile | null> {
  if (!uid) return null;

  const snapshot = await getDoc(
    getUserDocument(uid),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return mapProfile(
    snapshot.id,
    snapshot.data() as UserProfile,
  );
}

// =========================================================
// LIST ALL USER PROFILES — EXISTING FUNCTION
// =========================================================

export async function listUserProfiles():
  Promise<UserProfile[]> {
  const snapshot = await getDocs(
    collection(
      getDb(),
      USERS_COLLECTION,
    ),
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
// =========================================================

export function subscribeUserProfiles(
  onChange: (
    profiles: UserProfile[],
  ) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(
      getDb(),
      USERS_COLLECTION,
    ),

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
// FIND USER BY EMAIL — EXISTING FUNCTION
// =========================================================

export async function findUserByEmail(
  email: string,
): Promise<UserProfile | null> {
  const normalizedEmail =
    email.trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  const usersQuery = query(
    collection(
      getDb(),
      USERS_COLLECTION,
    ),
    where(
      "email",
      "==",
      normalizedEmail,
    ),
    limit(1),
  );

  const snapshot = await getDocs(
    usersQuery,
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
// ROLE-BASED MESSAGING CHECK — PRESERVED
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
// GET MESSAGEABLE ROLES — PRESERVED
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
// LIST MESSAGE CONTACTS — PRESERVED
// =========================================================

export async function listMessageContacts(
  currentRole: UserRole,
): Promise<UserProfile[]> {
  const allowedRoles =
    getMessageableRoles(currentRole);

  const contactsQuery = query(
    collection(
      getDb(),
      USERS_COLLECTION,
    ),
    where(
      "role",
      "in",
      allowedRoles,
    ),
  );

  const snapshot = await getDocs(
    contactsQuery,
  );

  return snapshot.docs.map((entry) =>
    mapProfile(
      entry.id,
      entry.data() as UserProfile,
    ),
  );
}

// =========================================================
// REAL-TIME MESSAGE CONTACTS — PRESERVED
// =========================================================

export function subscribeMessageContacts(
  currentRole: UserRole,
  onChange: (
    profiles: UserProfile[],
  ) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const allowedRoles =
    getMessageableRoles(currentRole);

  const contactsQuery = query(
    collection(
      getDb(),
      USERS_COLLECTION,
    ),
    where(
      "role",
      "in",
      allowedRoles,
    ),
  );

  return onSnapshot(
    contactsQuery,

    (snapshot) => {
      const profiles = snapshot.docs.map(
        (entry) =>
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

// =========================================================
// ADMIN — LIST STUDENT ACCOUNTS
// =========================================================

export async function listStudentAccounts():
  Promise<StudentAccountOption[]> {
  await requireAdmin();

  const studentsQuery = query(
    collection(
      getDb(),
      USERS_COLLECTION,
    ),
    where(
      "role",
      "==",
      "student",
    ),
  );

  const snapshot = await getDocs(
    studentsQuery,
  );

  return snapshot.docs.map((entry) => {
    const data = entry.data();

    return {
      uid: entry.id,
      name:
        typeof data.name === "string"
          ? data.name
          : "Student",
      email:
        typeof data.email === "string"
          ? data.email
          : "",
      department:
        typeof data.department === "string"
          ? data.department
          : "",
    };
  });
}

// =========================================================
// ADMIN — LIST PRACTITIONER ACCOUNTS
// =========================================================

export async function listPractitionerAccounts():
  Promise<PractitionerAccountOption[]> {
  await requireAdmin();

  const practitionersQuery = query(
    collection(
      getDb(),
      USERS_COLLECTION,
    ),
    where(
      "role",
      "==",
      "practitioner",
    ),
  );

  const snapshot = await getDocs(
    practitionersQuery,
  );

  return snapshot.docs.map((entry) => {
    const data = entry.data();

    return {
      uid: entry.id,
      name:
        typeof data.name === "string"
          ? data.name
          : "Practitioner",
      email:
        typeof data.email === "string"
          ? data.email
          : "",
      department:
        typeof data.department === "string"
          ? data.department
          : "",
      title:
        typeof data.title === "string"
          ? data.title
          : "",
    };
  });
}

// =========================================================
// ADMIN — GET STUDENT ACCOUNT BY UID
// =========================================================

export async function getStudentAccount(
  uid: string,
): Promise<StudentAccountOption | null> {
  await requireAdmin();

  if (!uid.trim()) {
    return null;
  }

  const snapshot = await getDoc(
    getUserDocument(uid),
  );

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  if (data.role !== "student") {
    return null;
  }

  return {
    uid: snapshot.id,
    name:
      typeof data.name === "string"
        ? data.name
        : "Student",
    email:
      typeof data.email === "string"
        ? data.email
        : "",
    department:
      typeof data.department === "string"
        ? data.department
        : "",
  };
}

// =========================================================
// ADMIN — GET PRACTITIONER ACCOUNT BY UID
// =========================================================

export async function getPractitionerAccount(
  uid: string,
): Promise<PractitionerAccountOption | null> {
  await requireAdmin();

  if (!uid.trim()) {
    return null;
  }

  const snapshot = await getDoc(
    getUserDocument(uid),
  );

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  if (data.role !== "practitioner") {
    return null;
  }

  return {
    uid: snapshot.id,
    name:
      typeof data.name === "string"
        ? data.name
        : "Practitioner",
    email:
      typeof data.email === "string"
        ? data.email
        : "",
    department:
      typeof data.department === "string"
        ? data.department
        : "",
    title:
      typeof data.title === "string"
        ? data.title
        : "",
  };
}

// =========================================================
// ADMIN — UPDATE BASIC USER PROFILE
// =========================================================

export async function updateManagedUserProfile(
  uid: string,
  updates: UserProfileUpdate,
): Promise<void> {
  await requireAdmin();

  if (!uid.trim()) {
    throw new Error(
      "User UID is required.",
    );
  }

  const cleaned: UserProfileUpdate = {};

  if (updates.name !== undefined) {
    const name = updates.name.trim();

    if (!name) {
      throw new Error(
        "Name cannot be empty.",
      );
    }

    cleaned.name = name;
  }

  if (updates.title !== undefined) {
    cleaned.title =
      updates.title.trim();
  }

  if (updates.department !== undefined) {
    cleaned.department =
      updates.department.trim();
  }

  if (
    Object.keys(cleaned).length === 0
  ) {
    throw new Error(
      "No profile changes provided.",
    );
  }

  // Do not allow role, UID, or login email
  // changes through this helper.
  await updateDoc(
    getUserDocument(uid),
    {
      ...cleaned,
      updatedAt: serverTimestamp(),
    },
  );
}

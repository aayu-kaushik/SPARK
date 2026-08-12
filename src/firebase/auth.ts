import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type Persistence,
} from "firebase/auth";

import { getFirebaseApp } from "./config";

let authInstance: Auth | undefined;

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
  }
  return authInstance;
}

export const registerUser = (email: string, password: string, persistence: Persistence = browserLocalPersistence) => {
  return setPersistence(getFirebaseAuth(), persistence).then(() =>
    createUserWithEmailAndPassword(getFirebaseAuth(), email, password),
  );
};

export const loginUser = (email: string, password: string, persistence: Persistence = browserLocalPersistence) => {
  return setPersistence(getFirebaseAuth(), persistence).then(() =>
    signInWithEmailAndPassword(getFirebaseAuth(), email, password),
  );
};

export const logoutUser = () => {
  return signOut(getFirebaseAuth());
};

export { browserLocalPersistence, browserSessionPersistence };

const FIREBASE_AUTH_ERRORS: Record<string, string> = {
  "auth/invalid-credential": "Invalid email or password.",
  "auth/user-not-found": "Invalid email or password.",
  "auth/wrong-password": "Invalid email or password.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/user-disabled": "This account has been disabled. Contact your administrator.",
  "auth/email-already-in-use": "An account with this email already exists. Try signing in instead.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "permission-denied": "Unable to save your profile. Check Firestore is enabled in Firebase Console.",
};

export function getFirebaseAuthErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  return FIREBASE_AUTH_ERRORS[code] ?? "Something went wrong. Please try again.";
}

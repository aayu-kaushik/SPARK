import { onAuthStateChanged, updateProfile, type User } from "firebase/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  browserLocalPersistence,
  browserSessionPersistence,
  getFirebaseAuth,
  getFirebaseAuthErrorMessage,
  loginUser,
  logoutUser,
  registerUser,
} from "@/firebase/auth";
import { createUserProfile, getUserProfile, type UserProfile } from "@/firebase/users";

export type Role = "admin" | "practitioner" | "student";

export interface AuthUser {
  uid: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  department: string;
}

export const ROLE_HOME: Record<Role, string> = {
  admin: "/admin/dashboard",
  practitioner: "/practitioner/dashboard",
  student: "/student/dashboard",
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrator",
  practitioner: "Practitioner",
  student: "Student",
};

const STORAGE_KEY = "edupredict.session";

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  signIn: (
    email: string,
    password: string,
    remember: boolean,
  ) => Promise<{ ok: boolean; error?: string; user?: AuthUser }>;
  signUp: (
    name: string,
    email: string,
    password: string,
    role: Role,
    remember: boolean,
  ) => Promise<{ ok: boolean; error?: string; user?: AuthUser }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredUser(email: string): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as AuthUser;
    return stored.email.toLowerCase() === email.toLowerCase() ? stored : null;
  } catch {
    return null;
  }
}

function persistUser(authUser: AuthUser, remember: boolean) {
  try {
    const store = remember ? window.localStorage : window.sessionStorage;
    const other = remember ? window.sessionStorage : window.localStorage;
    store.setItem(STORAGE_KEY, JSON.stringify(authUser));
    other.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}

function clearStoredUser() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}

async function resolveUserFromFirebase(firebaseUser: User): Promise<AuthUser | null> {
  const uid = firebaseUser.uid;
  const email = firebaseUser.email ?? "";
  const fallbackName = firebaseUser.displayName?.trim() || email.split("@")[0] || "User";

  try {
    const profile = await getUserProfile(uid);
    if (profile) {
      return {
        ...profileToAuthUser(profile),
        uid,
        name: profile.name?.trim() || fallbackName,
        email: profile.email || email,
      };
    }
  } catch {
    /* fall back to cached session */
  }

  const stored = email ? loadStoredUser(email) : null;
  if (stored) {
    return { ...stored, uid, name: stored.name?.trim() || fallbackName, email: stored.email || email };
  }

  return null;
}

function profileToAuthUser(profile: UserProfile): AuthUser {
  return {
    uid: profile.uid,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    title: profile.title,
    department: profile.department,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
      if (cancelled) return;

      if (!firebaseUser?.email) {
        setUser(null);
        setReady(true);
        return;
      }

      const authUser = await resolveUserFromFirebase(firebaseUser);
      if (!cancelled) {
        setUser(authUser ? { ...authUser, uid: firebaseUser.uid } : null);
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string, remember: boolean) => {
    try {
      const persistence = remember ? browserLocalPersistence : browserSessionPersistence;
      await loginUser(email.trim(), password, persistence);

      const firebaseUser = getFirebaseAuth().currentUser;
      if (!firebaseUser?.email) {
        return { ok: false, error: "Unable to sign in. Please try again." };
      }

      const resolved = await resolveUserFromFirebase(firebaseUser);
      if (!resolved) {
        await logoutUser();
        return { ok: false, error: "No account profile found. Please create an account first." };
      }

      const authUser = { ...resolved, uid: firebaseUser.uid };
      persistUser(authUser, remember);
      setUser(authUser);
      return { ok: true, user: authUser };
    } catch (error) {
      return { ok: false, error: getFirebaseAuthErrorMessage(error) };
    }
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string, role: Role, remember: boolean) => {
      try {
        const persistence = remember ? browserLocalPersistence : browserSessionPersistence;
        const credential = await registerUser(email.trim(), password, persistence);
        const authUser: AuthUser = {
          uid: credential.user.uid,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          title: ROLE_LABEL[role],
          department: "",
        };

        await updateProfile(credential.user, { displayName: authUser.name });
        await createUserProfile(credential.user.uid, authUser);
        persistUser(authUser, remember);
        setUser(authUser);
        return { ok: true, user: authUser };
      } catch (error) {
        if (getFirebaseAuth().currentUser) await logoutUser();
        return { ok: false, error: getFirebaseAuthErrorMessage(error) };
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    setUser(null);
    clearStoredUser();
    await logoutUser();
  }, []);

  const value = useMemo(() => ({ user, ready, signIn, signUp, signOut }), [user, ready, signIn, signUp, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

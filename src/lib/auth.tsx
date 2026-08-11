import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Role = "admin" | "practitioner" | "student";

export interface AuthUser {
  name: string;
  email: string;
  role: Role;
  title: string;
  department: string;
}

export const DEMO_ACCOUNTS: { role: Role; email: string; password: string; user: AuthUser }[] = [
  {
    role: "admin",
    email: "admin@edupredict.ai",
    password: "admin123",
    user: {
      name: "Dr. Rajesh Malhotra",
      email: "admin@edupredict.ai",
      role: "admin",
      title: "Institution Administrator",
      department: "Academic Affairs",
    },
  },
  {
    role: "practitioner",
    email: "teacher@edupredict.ai",
    password: "teacher123",
    user: {
      name: "Dr. Anil Sharma",
      email: "teacher@edupredict.ai",
      role: "practitioner",
      title: "Associate Professor & Mentor",
      department: "Computer Science",
    },
  },
  {
    role: "student",
    email: "student@edupredict.ai",
    password: "student123",
    user: {
      name: "Rahul Sharma",
      email: "student@edupredict.ai",
      role: "student",
      title: "B.Tech CSE · Semester 5",
      department: "Computer Science",
    },
  },
];

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
  signIn: (email: string, password: string, role: Role, remember: boolean) => { ok: boolean; error?: string; user?: AuthUser };
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      /* ignore corrupted session */
    }
    setReady(true);
  }, []);

  const signIn = useCallback((email: string, password: string, role: Role, remember: boolean) => {
    const match = DEMO_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password,
    );
    if (!match) return { ok: false, error: "Invalid email or password. Try a demo account below." };
    if (match.role !== role) {
      return { ok: false, error: `These credentials belong to the ${ROLE_LABEL[match.role]} role.` };
    }
    setUser(match.user);
    try {
      const store = remember ? window.localStorage : window.sessionStorage;
      store.setItem(STORAGE_KEY, JSON.stringify(match.user));
    } catch {
      /* storage unavailable */
    }
    return { ok: true, user: match.user };
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const value = useMemo(() => ({ user, ready, signIn, signOut }), [user, ready, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

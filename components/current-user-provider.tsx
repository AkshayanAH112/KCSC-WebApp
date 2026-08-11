"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type CurrentUser = { email: string; role: "admin" | "lms_manager" };

const CurrentUserContext = createContext<{ user: CurrentUser | null; loading: boolean }>({
  user: null,
  loading: true,
});

/**
 * The auth cookie is httpOnly, so client components can't just decode the JWT —
 * this fetches /api/auth/me once and hands the result down. Consumers (sidebar nav,
 * dashboard, admin-only pages) use useCurrentUser() to know whether this session is
 * a full admin or an lms_manager, since that boundary hides the entire Members area.
 */
export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => setUser(d.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CurrentUserContext.Provider value={{ user, loading }}>{children}</CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}

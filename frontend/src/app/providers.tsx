"use client";

import { AuthSessionProvider } from "../contexts/auth-session";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}


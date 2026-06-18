import type { UserRole } from "../contexts/auth-session";

export const ACCESS_DENIED_KEY = "triaje.access_denied";

export function setAccessDeniedMessage(message: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ACCESS_DENIED_KEY, message);
}

export function consumeAccessDeniedMessage(): string | null {
  if (typeof window === "undefined") return null;
  const message = sessionStorage.getItem(ACCESS_DENIED_KEY);
  if (message) sessionStorage.removeItem(ACCESS_DENIED_KEY);
  return message;
}

export function isStudentRole(role: UserRole | undefined): boolean {
  return role === "student";
}

export function isCounselorRole(role: UserRole | undefined): boolean {
  return role === "counselor";
}

export const STUDENT_HOME = "/";
export const COUNSELOR_HOME = "/admin";

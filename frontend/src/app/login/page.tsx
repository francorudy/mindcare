"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { REGISTER_PREFILL_KEY, useAuthSession, buildSession } from "../../contexts/auth-session";
import { authApi, ApiError } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuthSession();

  const [role, setRole] = useState<"student" | "counselor">("student");
  const [prefillEmail, setPrefillEmail] = useState("");
  const [prefillName, setPrefillName] = useState("");

  const [loading, setLoading] = useState(false);
  const [didLogin, setDidLogin] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const roleLabel = useMemo(
    () => (role === "student" ? "Estudiante" : "Consejero"),
    [role],
  );

  // Precarga datos si viene del registro
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(REGISTER_PREFILL_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        name?: string;
        email?: string;
        role?: "student" | "counselor";
      };
      if (parsed.email) setPrefillEmail(parsed.email);
      if (parsed.name) setPrefillName(parsed.name);
      if (parsed.role === "student" || parsed.role === "counselor") {
        setRole(parsed.role);
      }
    } catch {
    }
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (!email || !password) {
      setServerError("Completa todos los campos.");
      return;
    }

    setLoading(true);
    try {
      const tipo = role === "counselor" ? "consejero" : "estudiante";
      const data = await authApi.login({ email, password, tipo });

      const session = buildSession(data.usuario, data.rol, data.access_token);
      setSession(session);

      window.localStorage.removeItem(REGISTER_PREFILL_KEY);
      setDidLogin(true);

      // Redirigir según rol
      window.setTimeout(() => {
        router.replace(data.rol === "consejero" ? "/admin" : "/");
      }, 1000);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 0) {
          setServerError(err.message);
        } else if (err.status === 401) {
          setServerError("Correo o contraseña incorrectos.");
        } else if (err.status === 403) {
          setServerError(`Este usuario no tiene el rol de ${roleLabel}.`);
        } else {
          setServerError(err.message);
        }
      } else {
        setServerError("Ocurrió un error inesperado. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-cyan-100 via-violet-100 to-fuchsia-100">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-violet-300/35 blur-3xl" />

      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="mb-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-violet-200 bg-white/80 px-3 py-2 text-xs font-semibold text-violet-700 shadow-[0_10px_22px_rgba(124,58,237,0.16)] transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200/70"
            >
              Regresar al inicio
            </Link>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700 shadow-[0_14px_32px_rgba(2,6,23,0.10)] ring-1 ring-violet-200/70">
              <IconLock className="h-5 w-5" />
            </div>
            <h1 className="mt-4 text-base font-semibold tracking-tight text-slate-900">
              Sistema de Bienestar
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Ingresa a tu cuenta para continuar
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_16px_40px_rgba(2,6,23,0.10)] backdrop-blur sm:p-7">
            {/* Tabs de rol */}
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100/70 p-1">
              <TabButton active={role === "student"} onClick={() => { setRole("student"); setServerError(null); }}>
                Estudiante
              </TabButton>
              <TabButton active={role === "counselor"} onClick={() => { setRole("counselor"); setServerError(null); }}>
                Consejero
              </TabButton>
            </div>

            <form className="mt-5 space-y-4" onSubmit={onSubmit}>
              <Field
                label="Correo electrónico"
                type="email"
                name="email"
                placeholder="tu@ejemplo.com"
                autoComplete="email"
                defaultValue={prefillEmail}
              />
              <Field
                label={`Contraseña (${roleLabel})`}
                type="password"
                name="password"
                placeholder="••••••••"
                autoComplete="current-password"
              />

              <div className="flex items-center justify-between gap-3 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-4 focus:ring-blue-200/70"
                  />
                  Recordarme
                </label>
                <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {/* Error del servidor */}
              {serverError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
                  {serverError}
                </div>
              )}

              <PrimaryButton type="submit" disabled={loading || didLogin}>
                {didLogin ? "Ingresando..." : loading ? "Verificando..." : "Iniciar sesión"}
              </PrimaryButton>

              <p className="pt-2 text-center text-xs text-slate-600">
                ¿No tienes una cuenta?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-blue-600 hover:text-blue-700"
                >
                  Regístrate aquí
                </Link>
              </p>
            </form>
          </div>

          <LoginToast show={didLogin} />

          <p className="mt-5 text-center text-[11px] leading-5 text-slate-500">
            Al iniciar sesión, acepto nuestros{" "}
            <a href="#" className="font-semibold text-slate-600 hover:text-slate-800">
              Términos de servicio
            </a>{" "}
            y{" "}
            <a href="#" className="font-semibold text-slate-600 hover:text-slate-800">
              Política de privacidad
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
}

//Sub-componentes

function TabButton(props: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={[
        "rounded-lg px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70",
        props.active
          ? "bg-white text-slate-900 shadow-[0_10px_22px_rgba(2,6,23,0.08)]"
          : "text-slate-500 hover:text-slate-700",
      ].join(" ")}
      aria-pressed={props.active ? "true" : "false"}
    >
      {props.children}
    </button>
  );
}

function Field(props: {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
  autoComplete?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-800">{props.label}</span>
      <input
        name={props.name}
        type={props.type}
        placeholder={props.placeholder}
        autoComplete={props.autoComplete}
        defaultValue={props.defaultValue}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-900 shadow-[0_10px_22px_rgba(2,6,23,0.04)] outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-200/60"
      />
    </label>
  );
}

function PrimaryButton(props: {
  type?: "button" | "submit";
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type={props.type ?? "button"}
      disabled={props.disabled}
      className={[
        "inline-flex w-full items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.30)] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/70",
        props.disabled ? "cursor-not-allowed bg-blue-400" : "bg-blue-600 hover:bg-blue-700",
      ].join(" ")}
    >
      {props.children}
    </button>
  );
}

function LoginToast({ show }: { show: boolean }) {
  return (
    <div
      className={[
        "pointer-events-none fixed bottom-4 right-4 rounded-xl border border-emerald-200 bg-white/95 px-4 py-3 shadow-[0_18px_40px_rgba(2,6,23,0.16)] transition",
        show ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      <p className="text-xs font-semibold text-emerald-700">Inicio de sesión correcto</p>
      <p className="text-xs text-slate-500">Redirigiendo...</p>
    </div>
  );
}

function IconLock(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={props.className}>
      <path d="M7.5 11V8.8a4.5 4.5 0 0 1 9 0V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7.5 11h9A2 2 0 0 1 18.5 13v6.5A2.5 2.5 0 0 1 16 22H8a2.5 2.5 0 0 1-2.5-2.5V13A2 2 0 0 1 7.5 11Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
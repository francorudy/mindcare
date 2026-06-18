"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { REGISTER_PREFILL_KEY, type UserRole } from "../../contexts/auth-session";
import { authApi, ApiError } from "../../lib/api";

type FieldName =
  | "nombres"
  | "apellidos"
  | "email"
  | "password"
  | "confirmPassword"
  |  "fechaNacimiento"
  | "genero"
  | "telefono";

type FormState = Record<FieldName, string>;
type TouchedState = Partial<Record<FieldName, boolean>>;

const initialState: FormState = {
  nombres: "",
  apellidos: "",
  email: "",
  password: "",
  confirmPassword: "",
  fechaNacimiento: "",
  genero: "",
  telefono: ""
};

// id_rol según el backend: 1 = estudiante, 2 = consejero
const ROL_ID: Record<UserRole, number> = {
  student: 1,
  counselor: 2,
};

export default function RegisterPage() {
  const router = useRouter();
  const [values, setValues] = useState<FormState>(initialState);
  const [touched, setTouched] = useState<TouchedState>({});
  const [role, setRole] = useState<UserRole>("student");

  const [loading, setLoading] = useState(false);
  const [didSucceed, setDidSucceed] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const errors = useMemo(() => validate(values), [values]);
  const canSubmit = useMemo(() => Object.keys(errors).length === 0, [errors]);

  // Redirigir al login tras registro exitoso
  useEffect(() => {
    if (!didSucceed) return;
    const t = window.setTimeout(() => router.push("/login"), 1800);
    return () => window.clearTimeout(t);
  }, [didSucceed, router]);

  function onChange(name: FieldName, next: string) {
    setValues((prev) => ({ ...prev, [name]: next }));
    setServerError(null);
  }

  function onBlur(name: FieldName) {
    setTouched((prev) => ({ ...prev, [name]: true }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched({
      nombres: true,
      apellidos: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
    if (!canSubmit) return;

    setLoading(true);
    setServerError(null);

    try {
      const usuario = await authApi.register({
      nombres: values.nombres.trim(),
      apellidos: values.apellidos.trim(),
      email: values.email.trim(),
      password: values.password,
      fecha_nacimiento: values.fechaNacimiento || undefined,
      genero: values.genero || undefined,
      telefono: values.telefono || undefined,
      id_rol: ROL_ID[role],
});
      // Precarga el email en la página de login
      window.localStorage.setItem(
        REGISTER_PREFILL_KEY,
        JSON.stringify({
          name: `${usuario.nombres} ${usuario.apellidos}`.trim(),
          email: usuario.email,
          role,
        }),
      );

      setDidSucceed(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 0) {
          setServerError(err.message);
        } else if (err.status === 400 && err.message.toLowerCase().includes("email")) {
          setServerError("Este correo ya está registrado. Intenta con otro o inicia sesión.");
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
        <div className="w-full max-w-lg">
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
              <IconSparkles className="h-5 w-5" />
            </div>
            <h1 className="mt-4 text-base font-semibold tracking-tight text-slate-900">
              Sistema de Bienestar
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Crea tu cuenta para acceder al triaje inteligente
            </p>
          </div>

          <div className="relative mt-6 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_16px_40px_rgba(2,6,23,0.10)] backdrop-blur sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                  Crear cuenta
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Completa tus datos para registrarte.
                </p>
              </div>
              <div className="hidden sm:block rounded-2xl bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                IA + Confidencialidad
              </div>
            </div>

            <form className="mt-5 space-y-4" onSubmit={onSubmit} noValidate>
              {/* Selector de rol */}
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100/70 p-1">
                <RoleTab active={role === "student"} onClick={() => { setRole("student"); setServerError(null); }}>
                  Estudiante
                </RoleTab>
                <RoleTab active={role === "counselor"} onClick={() => { setRole("counselor"); setServerError(null); }}>
                  Consejero
                </RoleTab>
              </div>

              {/* Nombres y Apellidos */}
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Nombres"
                  name="nombres"
                  value={values.nombres}
                  placeholder="Ej. Ana María"
                  autoComplete="given-name"
                  error={touched.nombres ? errors.nombres : undefined}
                  onChange={(v) => onChange("nombres", v)}
                  onBlur={() => onBlur("nombres")}
                />
                <InputField
                  label="Apellidos"
                  name="apellidos"
                  value={values.apellidos}
                  placeholder="Ej. Pérez López"
                  autoComplete="family-name"
                  error={touched.apellidos ? errors.apellidos : undefined}
                  onChange={(v) => onChange("apellidos", v)}
                  onBlur={() => onBlur("apellidos")}
                />
              </div>

              <InputField
                label="Correo institucional"
                name="email"
                type="email"
                value={values.email}
                placeholder="tu@universidad.edu.pe"
                autoComplete="email"
                hint="Usa tu correo institucional (.edu o .edu.pe)."
                error={touched.email ? errors.email : undefined}
                onChange={(v) => onChange("email", v)}
                onBlur={() => onBlur("email")}
              />

              {/* Fecha de nacimiento */}
              <InputField
                label="Fecha de nacimiento"
                name="fechaNacimiento"
                type="date"
                value={values.fechaNacimiento}
                error={touched.fechaNacimiento ? errors.fechaNacimiento : undefined}
                onChange={(v) => onChange("fechaNacimiento", v)}
                onBlur={() => onBlur("fechaNacimiento")}
/>

              {/* Teléfono */}
              <InputField
                label="Teléfono"
                name="telefono"
                value={values.telefono}
                placeholder="Ej. 987654321"
                autoComplete="tel"
                error={touched.telefono ? errors.telefono : undefined}
                onChange={(v) => onChange("telefono", v)}
                onBlur={() => onBlur("telefono")}
/>

              <label className="block">
                <span className="text-sm font-semibold text-slate-800">
                  Género
                </span>

              <select
                value={values.genero}
                onChange={(e) => onChange("genero", e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
  >
                <option value="">Seleccione</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                </select>
                </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Contraseña"
                  name="password"
                  type="password"
                  value={values.password}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  hint="Mínimo 8 caracteres con letras y números."
                  error={touched.password ? errors.password : undefined}
                  onChange={(v) => onChange("password", v)}
                  onBlur={() => onBlur("password")}
                />
                <InputField
                  label="Confirmar contraseña"
                  name="confirmPassword"
                  type="password"
                  value={values.confirmPassword}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  error={touched.confirmPassword ? errors.confirmPassword : undefined}
                  onChange={(v) => onChange("confirmPassword", v)}
                  onBlur={() => onBlur("confirmPassword")}
                />
              </div>

              {/* Error del servidor */}
              {serverError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit || loading || didSucceed}
                className={[
                  "inline-flex w-full items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(124,58,237,0.20)] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200/70",
                  canSubmit && !loading && !didSucceed
                    ? "bg-violet-600 hover:bg-violet-700"
                    : "cursor-not-allowed bg-slate-300",
                ].join(" ")}
              >
                {didSucceed ? "Redirigiendo..." : loading ? "Registrando..." : "Crear cuenta"}
              </button>

              <p className="pt-1 text-center text-xs text-slate-600">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                  Inicia sesión
                </Link>
              </p>
            </form>

            <SuccessOverlay show={didSucceed} />
          </div>

          <p className="mt-5 text-center text-[11px] leading-5 text-slate-500">
            Este sistema está diseñado para apoyar el bienestar emocional universitario.
            Si estás en una situación de emergencia, busca ayuda inmediata.
          </p>
        </div>
      </main>
    </div>
  );
}

//Sub-componentes

function InputField(props: {
  label: string;
  name: string;
  value: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  hint?: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  const hasError = Boolean(props.error);
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-800">{props.label}</span>
      <div className="relative">
        <input
          name={props.name}
          type={props.type ?? "text"}
          value={props.value}
          placeholder={props.placeholder}
          autoComplete={props.autoComplete}
          onChange={(e) => props.onChange(e.currentTarget.value)}
          onBlur={props.onBlur}
          aria-invalid={hasError ? "true" : "false"}
          className={[
            "mt-2 w-full rounded-xl border bg-white/70 px-4 py-3 text-sm text-slate-900 shadow-[0_10px_22px_rgba(2,6,23,0.04)] outline-none transition placeholder:text-slate-400 focus:ring-4",
            hasError
              ? "border-rose-200 focus:border-rose-300 focus:ring-rose-100/70"
              : "border-slate-200 focus:border-violet-300 focus:ring-violet-200/60",
          ].join(" ")}
        />
        {hasError && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-rose-500">
            <IconError className="h-4 w-4" />
          </span>
        )}
      </div>
      {hasError ? (
        <p className="mt-1 text-xs font-medium text-rose-600">{props.error}</p>
      ) : props.hint ? (
        <p className="mt-1 text-xs text-slate-500">{props.hint}</p>
      ) : null}
    </label>
  );
}

function RoleTab(props: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
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

function SuccessOverlay(props: { show: boolean }) {
  return (
    <div
      className={[
        "pointer-events-none absolute inset-0 grid place-items-center rounded-2xl transition",
        props.show ? "opacity-100" : "opacity-0",
      ].join(" ")}
      aria-hidden={props.show ? "false" : "true"}
    >
      <div
        className={[
          "w-[92%] rounded-2xl border border-emerald-100 bg-white/90 p-5 shadow-[0_18px_44px_rgba(2,6,23,0.14)] backdrop-blur transition duration-300",
          props.show ? "translate-y-0 scale-100" : "translate-y-2 scale-[0.98]",
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            <IconCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Registro exitoso</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Te llevamos al inicio de sesión con tus datos precargados.
            </p>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-full origin-left animate-[progress_2s_ease-out_forwards] rounded-full bg-gradient-to-r from-emerald-500 to-violet-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

//Validaciones

function validate(values: FormState): Partial<Record<FieldName, string>> {
  const next: Partial<Record<FieldName, string>> = {};

  if (values.nombres.trim().length < 2) {
    next.nombres = "Ingresa tus nombres (mínimo 2 caracteres).";
  }
  if (values.apellidos.trim().length < 2) {
    next.apellidos = "Ingresa tus apellidos (mínimo 2 caracteres).";
  }
  if (!values.email.trim()) {
    next.email = "Ingresa tu correo institucional.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    next.email = "El correo no parece válido.";
  }
  if (values.password.length < 8) {
    next.password = "La contraseña debe tener al menos 8 caracteres.";
  } else if (!/[0-9]/.test(values.password) || !/[A-Za-z]/.test(values.password)) {
    next.password = "Usa letras y números.";
  }
  if (!values.confirmPassword) {
    next.confirmPassword = "Confirma tu contraseña.";
  } else if (values.confirmPassword !== values.password) {
    next.confirmPassword = "Las contraseñas no coinciden.";
  }

  return next;
}

//Íconos

function IconSparkles(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={props.className}>
      <path d="M12 3l1.2 3.7L17 8l-3.8 1.3L12 13l-1.2-3.7L7 8l3.8-1.3L12 3Z" fill="currentColor" opacity="0.95" />
      <path d="M5 12l.9 2.7L9 16l-3.1 1.3L5 20l-.9-2.7L1 16l3.1-1.3L5 12Z" fill="currentColor" opacity="0.45" />
      <path d="M19 11l.7 2.1L22 14l-2.3.9L19 17l-.7-2.1L16 14l2.3-.9L19 11Z" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

function IconError(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={props.className}>
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 16.5h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function IconCheck(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={props.className}>
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
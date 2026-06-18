import { getCached, invalidateCache } from "./api-cache";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
};

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

function assertToken(token: string | undefined): string {
  const trimmed = token?.trim();
  if (!trimmed) {
    throw new ApiError(401, "Tu sesión ha expirado. Inicia sesión de nuevo.");
  }
  return trimmed;
}

function normalizeAuthError(status: number, message: string): string {
  if (status === 401 || message === "Not authenticated") {
    return "Tu sesión ha expirado. Inicia sesión de nuevo.";
  }
  return message;
}

const AUTH_PUBLIC_PATHS = new Set(["/auth/login", "/auth/register"]);

function handleUnauthorized(path: string, status: number, message: string) {
  if (status !== 401 && message !== "Not authenticated") return;
  if (AUTH_PUBLIC_PATHS.has(path)) {
    console.log("[api] 401 en endpoint público de auth, sin cerrar sesión:", path);
    return;
  }
  console.log("[api] 401 → disparando logout global:", { path, status, message });
  unauthorizedHandler?.();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function parseApiErrorDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item) {
          return String((item as { msg: unknown }).msg);
        }
        return "Error de validación";
      })
      .join(". ");
  }
  return "Error desconocido";
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, token, signal } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if ("token" in options) {
    headers.Authorization = `Bearer ${assertToken(token)}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    throw new ApiError(
      0,
      "No se pudo conectar al servidor. Verifica que el backend esté activo (uvicorn en el puerto 8000).",
    );
  }

  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const data = await res.json();
      if (data?.detail !== undefined) {
        message = parseApiErrorDetail(data.detail);
      } else if (typeof data?.message === "string") {
        message = data.message;
      }
    } catch {
      /* ignore non-json error bodies */
    }

    message = normalizeAuthError(res.status, message);
    handleUnauthorized(path, res.status, message);
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ── Tipos base ────────────────────────────────────────────────────────────────

export type UsuarioOut = {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  email: string;
  estado: string | null;
  fecha_registro: string | null;
};

export type TokenOut = {
  access_token: string;
  token_type: string;
  usuario: UsuarioOut;
  rol: string;
};

export type EvaluacionOut = {
  id_evaluacion: number;
  id_usuario: number;
  fecha_evaluacion: string | null;
  fuente: string | null;
  estado: string | null;
};

export type RespuestaPHQ9Out = {
  id_respuesta: number;
  pregunta_numero: number;
  texto_pregunta: string | null;
  opcion_seleccionada: number | null;
  valor: number | null;
};

export type TextoLibreOut = {
  id_texto: number;
  id_evaluacion: number;
  texto_usuario: string | null;
};

export type ResultadoOut = {
  id_resultado: number;
  id_evaluacion: number;
  probabilidad: string | null;
  id_nivel_riesgo: number | null;
  nombre_nivel: string | null;
  color_nivel: string | null;
  recomendaciones: string | null;
  fecha_resultado: string | null;
  modelo_utilizado: string | null;
  version_modelo: string | null;
};

export type EvaluacionHistorialOut = {
  id_evaluacion: number;
  fecha_evaluacion: string | null;
  nombre_nivel: string | null;
  color_nivel: string | null;
  probabilidad: string | null;
  puntaje_phq9: number | null;
  tiene_resultado: boolean;
};

export type EvaluacionDetalleOut = {
  evaluacion: EvaluacionOut;
  respuestas_phq9: RespuestaPHQ9Out[];
  texto_libre: TextoLibreOut | null;
  resultado: ResultadoOut | null;
  acciones: AccionOut[];
  puntaje_phq9: number | null;
};

export type AccionOut = {
  id_accion_recomendada: number;
  id_tipo_accion: number;
  nombre_accion: string | null;
  descripcion: string | null;
  recursos: string | null;
  descripcion_personalizada: string | null;
  estado: string | null;
};

// ── Tipos Admin ───────────────────────────────────────────────────────────────

export type DashboardResumenOut = {
  total: number;
  riesgo_alto: number;
  moderado: number;
  riesgo_bajo: number;
  nuevos: number;
};

export type EstudianteRiesgoOut = {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  email: string;
  id_evaluacion: number | null;
  fecha_evaluacion: string | null;
  nombre_nivel: string | null;
  color_nivel: string | null;
  puntaje_phq9: number | null;
  probabilidad: string | null;
};

export type HistorialOut = {
  id_historial: number;
  id_evaluacion: number;
  id_resultado: number | null;
  fecha_registro: string | null;
  observacion: string | null;
  nombre_nivel: string | null;
  color_nivel: string | null;
  nombre_consejero: string | null;
  es_seguimiento: boolean;
};

export type CaseDetailOut = {
  usuario: UsuarioOut;
  ultima_evaluacion: EvaluacionOut | null;
  respuestas_phq9: RespuestaPHQ9Out[];
  texto_libre: TextoLibreOut | null;
  resultado: ResultadoOut | null;
  acciones: AccionOut[];
  historial: HistorialOut[];
};

export type SeguimientoUpdate = {
  observacion: string;
  estado_seguimiento?: string;
};

export type AlertaNotificacionOut = {
  id_alerta: number;
  id_evaluacion: number;
  id_estudiante: number;
  nombres_estudiante: string;
  apellidos_estudiante: string;
  fecha_evaluacion: string | null;
  puntaje_phq9: number;
  probabilidad: string | null;
  nombre_nivel: string;
  estado: string;
  fecha_creacion: string | null;
};

export type AlertaPendientesOut = {
  pendientes: number;
};

// ── Payloads ──────────────────────────────────────────────────────────────────

export type RegisterPayload = {
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  fecha_nacimiento?: string | null;
  genero?: string | null;
  telefono?: string | null;
  id_rol: number;
};

export type LoginPayload = {
  email: string;
  password: string;
  tipo: "estudiante" | "consejero";
};

export type RespuestaPHQ9Item = {
  pregunta_numero: number;
  texto_pregunta?: string | null;
  opcion_seleccionada: number;
  valor: number;
};

// ── Auth API ──────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: RegisterPayload) =>
    apiFetch<UsuarioOut>("/auth/register", { method: "POST", body: data }),

  login: (data: LoginPayload) =>
    apiFetch<TokenOut>("/auth/login", { method: "POST", body: data }),
};

// ── Evaluación API ────────────────────────────────────────────────────────────

export const evaluacionApi = {
  iniciar: (token: string, fuente = "WEB") =>
    apiFetch<EvaluacionOut>("/evaluaciones/", {
      method: "POST",
      token,
      body: { fuente },
    }).then((evaluacion) => {
      invalidateCache(`historial:${token}`);
      return evaluacion;
    }),

  misEvaluaciones: (token: string) =>
    apiFetch<EvaluacionOut[]>("/evaluaciones/mis-evaluaciones", { token }),

  historial: (token: string) =>
    getCached(`historial:${token}`, () =>
      apiFetch<EvaluacionHistorialOut[]>("/evaluaciones/historial", { token }),
    ),

  detalle: (token: string, id: number) =>
    getCached(`detalle:${token}:${id}`, () =>
      apiFetch<EvaluacionDetalleOut>(`/evaluaciones/${id}/detalle`, { token }),
    ),

  getEvaluacion: (token: string, id: number) =>
    apiFetch<EvaluacionOut>(`/evaluaciones/${id}`, { token }),
};

// ── PHQ-9 API ─────────────────────────────────────────────────────────────────

export const phq9Api = {
  enviar: (token: string, id_evaluacion: number, respuestas: RespuestaPHQ9Item[]) =>
    apiFetch<RespuestaPHQ9Out[]>("/phq9/", {
      method: "POST",
      token,
      body: { id_evaluacion, respuestas },
    }),

  getRespuestas: (token: string, id_evaluacion: number) =>
    apiFetch<RespuestaPHQ9Out[]>(`/phq9/${id_evaluacion}`, { token }),
};

// ── Journal API ───────────────────────────────────────────────────────────────

export const journalApi = {
  guardar: (token: string, id_evaluacion: number, texto_usuario: string) =>
    apiFetch<TextoLibreOut>("/journal/", {
      method: "POST",
      token,
      body: { id_evaluacion, texto_usuario },
    }),

  getJournal: (token: string, id_evaluacion: number) =>
    apiFetch<TextoLibreOut>(`/journal/${id_evaluacion}`, { token }),
};

// ── Procesamiento API ─────────────────────────────────────────────────────────

export const procesamientoApi = {
  obtener: (token: string, id_evaluacion: number, signal?: AbortSignal) =>
    getCached(`resultado:${token}:${id_evaluacion}`, () =>
      apiFetch<ResultadoOut>(`/procesamiento/${id_evaluacion}`, { token, signal }),
    ),

  obtenerFresh: (token: string, id_evaluacion: number, signal?: AbortSignal) =>
    apiFetch<ResultadoOut>(`/procesamiento/${id_evaluacion}`, { token, signal }),

  procesar: (token: string, id_evaluacion: number, signal?: AbortSignal) =>
    apiFetch<ResultadoOut>(`/procesamiento/${id_evaluacion}`, {
      method: "POST",
      token,
      signal,
    }).then((resultado) => {
      invalidateCache(`historial:${token}`);
      invalidateCache(`resultado:${token}:${id_evaluacion}`);
      invalidateCache(`detalle:${token}:${id_evaluacion}`);
      invalidateCache("admin:");
      return resultado;
    }),
};

// ── Recomendaciones API ───────────────────────────────────────────────────────

export const recomendacionApi = {
  obtener: (token: string, id_evaluacion: number) =>
    apiFetch<AccionOut[]>(`/recomendaciones/${id_evaluacion}`, { token }),
};

// ── Admin API ─────────────────────────────────────────────────────────────────

export const adminApi = {
  resumen: (token: string) =>
    getCached(`admin:resumen:${token}`, () =>
      apiFetch<DashboardResumenOut>("/admin/resumen", { token }),
    ),

  listarEstudiantes: (token: string, nivel?: string) => {
    const query = nivel ? `?nivel=${encodeURIComponent(nivel)}` : "";
    return getCached(`admin:estudiantes:${token}:${nivel ?? "all"}`, () =>
      apiFetch<EstudianteRiesgoOut[]>(`/admin/estudiantes${query}`, { token }),
    );
  },

  detalleCaso: (token: string, id_usuario: number) =>
    getCached(`admin:caso:${token}:${id_usuario}`, () =>
      apiFetch<CaseDetailOut>(`/admin/estudiantes/${id_usuario}`, { token }),
      15_000,
    ),

  marcarSeguimiento: (token: string, id_usuario: number, data: SeguimientoUpdate) =>
    apiFetch<{ message: string }>(`/admin/estudiantes/${id_usuario}/seguimiento`, {
      method: "POST",
      token,
      body: data,
    }).then((result) => {
      invalidateCache(`admin:caso:${token}:${id_usuario}`);
      return result;
    }),

  listarAlertas: (token: string) =>
    apiFetch<AlertaNotificacionOut[]>("/admin/alertas", { token }),

  contarAlertasPendientes: (token: string) =>
    apiFetch<AlertaPendientesOut>("/admin/alertas/pendientes", { token }),

  marcarAlertaRevisada: (token: string, id_alerta: number) =>
    apiFetch<AlertaNotificacionOut>(`/admin/alertas/${id_alerta}/revisar`, {
      method: "PATCH",
      token,
    }).then((result) => {
      invalidateCache("admin:");
      return result;
    }),
};
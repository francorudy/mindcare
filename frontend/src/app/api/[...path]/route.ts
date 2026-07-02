import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = "http://localhost:8000";
const PROXY_TIMEOUT_MS = 45_000;

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
]);

function buildBackendPath(req: NextRequest): string {
  // Preservar la ruta completa (incl. trailing slash). Sin esto, POST /evaluaciones/
  // se reenvía como /evaluaciones, FastAPI responde 307 y el cliente puede perder Authorization.
  const backendPath = req.nextUrl.pathname.replace(/^\/api/, "") || "/";
  return backendPath;
}

async function proxyRequest(req: NextRequest) {
  const target = new URL(`${BACKEND_URL}${buildBackendPath(req)}`);
  target.search = req.nextUrl.search;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    headers.set(key, value);
  });

  const init: RequestInit = {
    method: req.method,
    headers,
    // Seguir redirects en el servidor para no exponer 307 al navegador (evita perder el token).
    redirect: "follow",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  try {
    const res = await fetch(target.toString(), {
      ...init,
      signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
    });
    const responseHeaders = new Headers();

    res.headers.forEach((value, key) => {
  const lower = key.toLowerCase();

  if (
    HOP_BY_HOP.has(lower) ||
    lower === "content-encoding" ||
    lower === "content-length"
  ) {
    return;
  }
      responseHeaders.set(key, value);
    });

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { detail: "El servidor backend no respondió a tiempo. Verifica que esté activo (puerto 8000)." },
      { status: 504 },
    );
  }
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(req: NextRequest, _context: RouteContext) {
  void _context;
  return proxyRequest(req);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;

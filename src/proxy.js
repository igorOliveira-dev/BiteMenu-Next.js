import { NextResponse } from "next/server";

// Rate limit simples em memória, por IP. Funciona porque a produção roda em
// uma única instância (VPS via Coolify). Se um dia houver mais de uma
// instância, cada uma terá seu próprio contador.

const WINDOW_MS = 60 * 1000;

// Limites por minuto, por IP. Folgados para clientes reais (inclusive várias
// pessoas na mesma rede do restaurante), apertados para robôs.
const LIMITS = {
  api: 60,
  image: 400,
  menu: 60,
};

// Rotas chamadas por serviços externos: nunca limitar
const SKIP_PREFIXES = ["/api/validapay/webhook", "/api/remarketing/resend-webhook", "/api/cron/"];

const BLOCKED_BOTS = /AhrefsBot|SemrushBot|MJ12bot|DotBot|BLEXBot|DataForSeoBot|PetalBot|serpstatbot|Barkrowler/i;

const hits = new Map();

function getIp(request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown"
  );
}

function getBucket(pathname) {
  if (pathname.startsWith("/api/")) return "api";
  if (pathname.startsWith("/_next/image")) return "image";
  if (pathname.startsWith("/menu/")) return "menu";
  return null;
}

function isLimited(key, limit) {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now - entry.start > WINDOW_MS) {
    hits.set(key, { start: now, count: 1 });
    return false;
  }

  entry.count++;
  return entry.count > limit;
}

// Limpa entradas antigas para o Map não crescer indefinidamente
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of hits) {
    if (now - entry.start > WINDOW_MS) hits.delete(key);
  }
}, WINDOW_MS).unref?.();

export function proxy(request) {
  const { pathname } = request.nextUrl;

  if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Robôs de SEO que ignoram o robots.txt
  if (BLOCKED_BOTS.test(request.headers.get("user-agent") || "")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const bucket = getBucket(pathname);
  if (!bucket) return NextResponse.next();

  if (isLimited(`${bucket}:${getIp(request)}`, LIMITS[bucket])) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": "60" },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/_next/image", "/menu/:path*"],
};

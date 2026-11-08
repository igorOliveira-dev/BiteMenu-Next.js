// IP do cliente atrás do proxy (Cloudflare/Coolify). Usado pelo rate limit do proxy e pelo limite diário do atendente.
export function getClientIp(request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown"
  );
}

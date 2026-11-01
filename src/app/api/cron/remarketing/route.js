import crypto from "crypto";
import { runRemarketing } from "@/lib/remarketing";

// Remarketing por e-mail (trilhas A/B/C), chamado pelo pg_cron uma vez por dia.
// POST { mode: "dry-run" | "send" }  ·  Authorization: Bearer CRON_SECRET
// Com a pausa geral ligada (/admin/remarketing), "send" não envia nada.

// ~0,6s por destinatário (limite do Resend)
export const maxDuration = 300;

const json = (body, status = 200) => Response.json(body, { status });

function authorized(req) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  return !!secret && given.length === secret.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(secret));
}

export async function POST(req) {
  if (!authorized(req)) return json({ error: "Unauthorized" }, 401);

  try {
    const { mode = "dry-run" } = await req.json().catch(() => ({}));
    if (!["dry-run", "send"].includes(mode)) return json({ error: "mode inválido" }, 400);
    return json(await runRemarketing({ send: mode === "send" }));
  } catch (err) {
    console.error("[Remarketing] Erro:", err);
    return json({ error: err.message || "Erro interno" }, 500);
  }
}

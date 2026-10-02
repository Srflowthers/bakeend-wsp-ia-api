import { Hono } from "hono";
import { getDb } from "../db";
import { generateReply } from "../services/ai/gemini";
import { resolveProducts } from "../services/data/resolver";
import { getConversation, recentHistory, saveMessage } from "../services/conversations/manager";
import { sendText } from "../services/whatsapp/meta";
import type { AppEnv, Env } from "../types";

export const webhooks = new Hono<AppEnv>();

webhooks.get("/whatsapp", (c) => {
  const q = c.req.query();
  return q["hub.mode"] === "subscribe" && q["hub.verify_token"] === c.env.META_VERIFY_TOKEN
    ? c.text(q["hub.challenge"]) : c.text("Forbidden", 403);
});

async function validSignature(env: Env, raw: string, header?: string) {
  if (!header) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.META_APP_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  return header === `sha256=${[...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

webhooks.post("/whatsapp", async (c) => {
  const raw = await c.req.text();
  // if (!(await validSignature(c.env, raw, c.req.header("X-Hub-Signature-256")))) return c.text("Firma inválida", 401); // TODO: Reactivar en produccion
  c.executionCtx.waitUntil(handle(c.env, JSON.parse(raw)).catch((e) => console.error("webhook", e)));
  return c.text("OK");
});

async function handle(env: Env, body: any) {
  const db = getDb(env);
  for (const entry of body.entry ?? []) for (const ch of entry.changes ?? []) {
    const v = ch.value;
    const phoneNumberId: string | undefined = v?.metadata?.phone_number_id;
    if (!phoneNumberId) continue;
    
    // Buscar el negocio por su phone_number (asumimos que guardas el phone_number_id ahí)
    const result = await db.execute({
      sql: "SELECT id, name, prompt, sheet_url FROM businesses WHERE phone_number = ?",
      args: [phoneNumberId]
    });
    const business = result.rows[0] as any;
    
    if (!business) { console.warn("phone_number_id sin negocio asociado", phoneNumberId); continue; }

    for (const m of v.messages ?? []) {
      const from: string = m.from;
      const text: string | null = m.type === "text" ? m.text.body : null;
      if (!text) { await sendText(env, env.META_API_TOKEN, phoneNumberId, from, "Por ahora solo puedo leer mensajes de texto 😊"); continue; }
      
      const convId = await getConversation(env, business.id, from);
      await saveMessage(env, convId, "user", text);
      const [products, history] = await Promise.all([resolveProducts(env, business.id, text), recentHistory(env, convId)]);
      
      let reply: string;
      try {
        reply = await generateReply(env, { assistantName: business.name, personality: business.prompt, business: business.name, products, history });
      } catch (e) { console.error(e); reply = "Estamos con un problema técnico, intenta de nuevo en unos minutos 🙏"; }
      
      await saveMessage(env, convId, "assistant", reply);
      await sendText(env, env.META_API_TOKEN, phoneNumberId, from, reply); // Usando un token global por defecto
    }
  }
}

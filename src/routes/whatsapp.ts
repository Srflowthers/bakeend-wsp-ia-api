import { Hono } from "hono";
import { db } from "../db";
import { completeSignup } from "../services/whatsapp/meta";
import type { AppEnv } from "../types";

export const whatsapp = new Hono<AppEnv>();

whatsapp.get("/config", (c) => c.json({ app_id: c.env.META_APP_ID, graph_version: c.env.GRAPH_VERSION }));

whatsapp.post("/connect", async (c) => {
  const { code, waba_id, phone_number_id } = await c.req.json<{ code: string; waba_id: string; phone_number_id: string }>();
  if (!code || !waba_id || !phone_number_id) return c.json({ error: "Faltan datos del registro de Meta" }, 400);
  try {
    const { token, displayPhone } = await completeSignup(c.env, code, waba_id, phone_number_id);
    // TODO producción: cifrar access_token
    const { error } = await db(c.env).from("whatsapp_accounts").upsert(
      { tenant_id: c.get("tenantId"), waba_id, phone_number_id, access_token: token, display_phone: displayPhone, status: "connected" },
      { onConflict: "phone_number_id" });
    if (error) throw error;
    return c.json({ ok: true });
  } catch (e) { return c.json({ error: String(e) }, 502); }
});

whatsapp.post("/connect-manual", async (c) => {
  const b = await c.req.json<{ phone_number_id: string; waba_id: string; access_token: string }>();
  const pid = (b.phone_number_id || "").trim(), waba = (b.waba_id || "").trim(), token = (b.access_token || "").trim();
  if (!pid || !waba || !token) return c.json({ error: "Completa Phone Number ID, WABA ID y Access Token" }, 400);
  const g = (path: string) => `https://graph.facebook.com/${c.env.GRAPH_VERSION}/${path}`;
  const h = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const info: any = await (await fetch(g(`${pid}?fields=display_phone_number`), { headers: h })).json();
  if (info.error) return c.json({ error: `Meta no aceptó los datos: ${info.error.message}` }, 422);
  await fetch(g(`${waba}/subscribed_apps`), { method: "POST", headers: h }).catch(() => {});
  const { error } = await db(c.env).from("whatsapp_accounts").upsert(
    { tenant_id: c.get("tenantId"), waba_id: waba, phone_number_id: pid, access_token: token,
      display_phone: info.display_phone_number ?? null, status: "connected" }, { onConflict: "phone_number_id" });
  if (error) return c.json({ error: "Ese número ya está conectado a otro negocio" }, 409);
  return c.json({ ok: true });
});

whatsapp.delete("/", async (c) => {
  await db(c.env).from("whatsapp_accounts").delete().eq("tenant_id", c.get("tenantId"));
  return c.json({ ok: true });
});

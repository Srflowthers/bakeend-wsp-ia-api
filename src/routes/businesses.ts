import { Hono } from "hono";
import { db } from "../db";
import type { AppEnv } from "../types";

export const businesses = new Hono<AppEnv>();

businesses.get("/me", async (c) => {
  const id = c.get("tenantId"), sb = db(c.env);
  const [t, ai, wa, ds] = await Promise.all([
    sb.from("tenants").select("id,name,email").eq("id", id).single(),
    sb.from("ai_config").select("assistant_name,system_prompt,business_description").eq("tenant_id", id).single(),
    sb.from("whatsapp_accounts").select("display_phone,phone_number_id,waba_id,status").eq("tenant_id", id).maybeSingle(),
    sb.from("data_sources").select("type,status,config").eq("tenant_id", id),
  ]);
  const mask = (s?: string) => (s ? "****" + s.slice(-4) : null);
  return c.json({
    tenant: t.data, ai: ai.data,
    whatsapp: wa.data ? { ...wa.data, phone_number_id: mask(wa.data.phone_number_id), waba_id: mask(wa.data.waba_id) } : null,
    sources: (ds.data ?? []).map((s: any) => ({ type: s.type, status: s.status,
      summary: s.type === "excel" ? `${s.config.products?.length ?? 0} productos` : s.config.url })),
  });
});

businesses.put("/assistant", async (c) => {
  const b = await c.req.json<{ business_name?: string; assistant_name: string; system_prompt: string; business_description: string }>();
  if (b.business_name?.trim()) await db(c.env).from("tenants").update({ name: b.business_name.trim() }).eq("id", c.get("tenantId"));
  await db(c.env).from("ai_config").update({
    assistant_name: b.assistant_name, system_prompt: b.system_prompt, business_description: b.business_description,
  }).eq("tenant_id", c.get("tenantId"));
  return c.json({ ok: true });
});

businesses.get("/conversations", async (c) => {
  const { data } = await db(c.env).from("conversations")
    .select("id,customer_phone,updated_at,messages(role,content,created_at)")
    .eq("tenant_id", c.get("tenantId")).order("updated_at", { ascending: false }).limit(30);
  return c.json((data ?? []).map((x: any) => ({ ...x, messages: x.messages.sort((a: any, b: any) => a.created_at.localeCompare(b.created_at)).slice(-20) })));
});

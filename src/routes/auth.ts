import { Hono } from "hono";
import { sign } from "hono/jwt";
import { db } from "../db";
import type { AppEnv } from "../types";

const enc = new TextEncoder();
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
async function hash(pw: string, saltHex?: string) {
  const salt = saltHex ? new Uint8Array(saltHex.match(/../g)!.map((h) => parseInt(h, 16))) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 }, key, 256);
  return `${hex(salt.buffer)}:${hex(bits)}`;
}
const token = (env: AppEnv["Bindings"], id: string) => sign({ sub: id, exp: Math.floor(Date.now() / 1000) + 7 * 86400 }, env.JWT_SECRET);

export const auth = new Hono<AppEnv>();

auth.post("/register", async (c) => {
  const b = await c.req.json<{ business_name: string; email: string; password: string; assistant_name?: string; description?: string }>();
  if (!b.business_name || !b.email || (b.password?.length ?? 0) < 4) return c.json({ error: "Datos inválidos (contraseña mínimo 4 caracteres)" }, 400);
  const sb = db(c.env);
  const { data: t, error } = await sb.from("tenants")
    .insert({ name: b.business_name, email: b.email.toLowerCase(), password_hash: await hash(b.password) }).select("id").single();
  if (error) return c.json({ error: "Ese correo ya está registrado" }, 409);
  await sb.from("ai_config").insert({ tenant_id: t.id, assistant_name: b.assistant_name || "Sofía", business_description: b.description || "" });
  return c.json({ token: await token(c.env, t.id) });
});

auth.post("/login", async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();
  const { data: t } = await db(c.env).from("tenants").select("id,password_hash").eq("email", (email || "").toLowerCase()).maybeSingle();
  if (!t) return c.json({ error: "Credenciales incorrectas" }, 401);
  const [salt] = t.password_hash.split(":");
  if ((await hash(password, salt)) !== t.password_hash) return c.json({ error: "Credenciales incorrectas" }, 401);
  return c.json({ token: await token(c.env, t.id) });
});

import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import type { AppEnv } from "../types";
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const apiSecret = c.req.header("x-api-secret");
  if (c.env.API_SECRET && apiSecret !== c.env.API_SECRET) return c.json({ error: "API Secret inválido" }, 403);

  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return c.json({ error: "No autenticado" }, 401);
  try {
    const p = await verify(token, c.env.JWT_SECRET, "HS256");
    c.set("tenantId", p.sub as string);
  } catch { return c.json({ error: "Sesión inválida" }, 401); }
  await next();
});

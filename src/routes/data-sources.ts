import { Hono } from "hono";
import { db } from "../db";
import { parseExcel } from "../services/data/excel";
import { fetchApiProducts } from "../services/data/api";
import type { AppEnv } from "../types";

export const dataSources = new Hono<AppEnv>();

dataSources.post("/excel", async (c) => {
  const file = (await c.req.parseBody())["file"];
  if (!(file instanceof File)) return c.json({ error: "Sube un archivo .xlsx o .csv" }, 400);
  const products = parseExcel(await file.arrayBuffer());
  if (!products.length) return c.json({ error: "No se encontraron productos. Revisa las columnas: nombre, precio, stock, categoria, talla, color" }, 422);
  await db(c.env).from("data_sources").upsert(
    { tenant_id: c.get("tenantId"), type: "excel", config: { products }, status: "active" }, { onConflict: "tenant_id,type" });
  return c.json({ ok: true, count: products.length });
});

dataSources.post("/api", async (c) => {
  const cfg = await c.req.json<{ url: string; method?: string; token?: string }>();
  if (!/^https:\/\//.test(cfg.url || "")) return c.json({ error: "La URL debe empezar con https://" }, 400);
  try {
    const products = await fetchApiProducts(cfg);
    await db(c.env).from("data_sources").upsert(
      { tenant_id: c.get("tenantId"), type: "api", config: cfg, status: "active" }, { onConflict: "tenant_id,type" });
    return c.json({ ok: true, count: products.length });
  } catch (e) { return c.json({ error: `No se pudo leer la API: ${e}` }, 422); }
});

dataSources.delete("/:type", async (c) => {
  await db(c.env).from("data_sources").delete().eq("tenant_id", c.get("tenantId")).eq("type", c.req.param("type"));
  return c.json({ ok: true });
});

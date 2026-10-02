import { db } from "../../db";
import type { Env, Product } from "../../types";
import { fetchApiProducts } from "./api";

const strip = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const STOP = new Set(["tienen","tiene","hay","quiero","busco","para","con","los","las","una","unos","que","por","favor","hola","talla","precio","cuanto","cuesta","del"]);

/** Carga los productos del tenant y devuelve solo los relevantes para la consulta. */
export async function resolveProducts(env: Env, tenantId: string, query: string): Promise<Product[]> {
  const { data } = await db(env).from("data_sources").select("type,config").eq("tenant_id", tenantId).eq("status", "active");
  let all: Product[] = [];
  for (const s of data ?? []) {
    try { all = all.concat(s.type === "excel" ? s.config.products ?? [] : await fetchApiProducts(s.config)); }
    catch (e) { console.error("fuente falló", s.type, e); }
  }
  const tokens = strip(query).split(/[^a-z0-9]+/).filter((t) => t.length > 1 && !STOP.has(t)).map((t) => t.replace(/s$/, ""));
  if (!tokens.length) return all.slice(0, 10);
  return all.map((p) => {
    const hay = strip(`${p.name} ${p.category} ${p.color} ${p.size}`);
    return { p, score: tokens.filter((t) => hay.includes(t)).length };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 10).map((x) => x.p);
}

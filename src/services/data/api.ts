import type { Product } from "../../types";
import { normalize } from "./excel";

export type ApiConfig = { url: string; method?: string; token?: string };

export async function fetchApiProducts(cfg: ApiConfig): Promise<Product[]> {
  const res = await fetch(cfg.url, {
    method: cfg.method || "GET",
    headers: { Accept: "application/json", ...(cfg.token ? { Authorization: `Bearer ${cfg.token}` } : {}) },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`La API respondió ${res.status}`);
  const json: any = await res.json();
  const rows = Array.isArray(json) ? json : json.products ?? json.data ?? json.items ?? [];
  return normalize(rows);
}

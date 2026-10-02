import * as XLSX from "xlsx";
import type { Product } from "../../types";

const num = (v: unknown) => Number(String(v ?? "").replace(/[^\d.-]/g, "")) || 0;
const pick = (r: Record<string, any>, ...keys: string[]) => { for (const k of keys) if (r[k] !== undefined) return r[k]; return ""; };

/** Normaliza una fila (es/en) a la estructura interna. */
export function normalize(rows: Record<string, any>[]): Product[] {
  return rows.map((raw) => {
    const r: Record<string, any> = {};
    for (const [k, v] of Object.entries(raw)) r[k.trim().toLowerCase()] = v;
    return {
      name: String(pick(r, "nombre", "name", "producto", "title")).trim(),
      price: num(pick(r, "precio", "price")), stock: num(pick(r, "stock", "cantidad", "quantity")),
      category: String(pick(r, "categoria", "categoría", "category")).trim(),
      size: String(pick(r, "talla", "size")).trim(), color: String(pick(r, "color")).trim(),
    };
  }).filter((p) => p.name);
}

export function parseExcel(buf: ArrayBuffer): Product[] {
  const wb = XLSX.read(buf, { type: "array" });
  return normalize(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" }));
}

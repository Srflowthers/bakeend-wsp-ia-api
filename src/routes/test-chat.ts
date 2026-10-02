import { Hono } from "hono";
import { getDb } from "../db";
import { generateReply } from "../services/ai/gemini";
import { resolveProducts } from "../services/data/resolver";
import { getConversation, recentHistory, saveMessage } from "../services/conversations/manager";
import type { AppEnv } from "../types";

export const testChat = new Hono<AppEnv>();

testChat.post("/", async (c) => {
  const { message, phone_number_id } = await c.req.json<{ message: string, phone_number_id?: string }>();
  const db = getDb(c.env);
  
  // Usamos el id del tenant autenticado
  const id = c.get("tenantId"); 
  
  const result = await db.execute({
    sql: "SELECT name, prompt FROM businesses WHERE id = ?",
    args: [id || 1] // Fallback a 1 si el auth no está enviando id correctamente en local
  });
  const business = result.rows[0] as any;
  if (!business) return c.json({ reply: "Error: No se encontró el negocio en la base de datos." }, 404);

  const from = "test_user_simulated";
  const text = message;

  const convId = await getConversation(c.env, business.id, from);
  await saveMessage(c.env, convId, "user", text);
  const [products, history] = await Promise.all([resolveProducts(c.env, business.id, text), recentHistory(c.env, convId)]);
  
  let reply: string;
  try {
    reply = await generateReply(c.env, { assistantName: business.name, personality: business.prompt, business: business.name, products, history });
  } catch (e) {
    console.error(e);
    reply = "Error técnico: " + String(e);
  }
  
  await saveMessage(c.env, convId, "assistant", reply);
  
  return c.json({ reply });
});

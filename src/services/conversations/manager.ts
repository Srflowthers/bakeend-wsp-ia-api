import { db } from "../../db";
import type { Env } from "../../types";

export async function getConversation(env: Env, tenantId: string, phone: string) {
  const { data } = await db(env).from("conversations")
    .upsert({ tenant_id: tenantId, customer_phone: phone, updated_at: new Date().toISOString() }, { onConflict: "tenant_id,customer_phone" })
    .select("id").single();
  return data!.id as string;
}
export async function saveMessage(env: Env, conversationId: string, role: "user" | "assistant", content: string) {
  await db(env).from("messages").insert({ conversation_id: conversationId, role, content });
}
export async function recentHistory(env: Env, conversationId: string, limit = 10) {
  const { data } = await db(env).from("messages").select("role,content")
    .eq("conversation_id", conversationId).order("created_at", { ascending: false }).limit(limit);
  return ((data ?? []) as { role: "user" | "assistant"; content: string }[]).reverse();
}

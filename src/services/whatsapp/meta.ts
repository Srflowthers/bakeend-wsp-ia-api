import type { Env } from "../../types";
const g = (env: Env, p: string) => `https://graph.facebook.com/${env.GRAPH_VERSION}/${p}`;

export async function sendText(env: Env, token: string, phoneNumberId: string, to: string, body: string) {
  const r = await fetch(g(env, `${phoneNumberId}/messages`), {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body } }),
  });
  if (!r.ok) console.error("sendText", r.status, await r.text());
}

/** Embedded Signup: intercambia el code por un token y activa el número. */
export async function completeSignup(env: Env, code: string, wabaId: string, phoneNumberId: string) {
  const t = await fetch(g(env, `oauth/access_token?client_id=${env.META_APP_ID}&client_secret=${env.META_APP_SECRET}&code=${code}`));
  const tj: any = await t.json();
  if (!tj.access_token) throw new Error("Meta rechazó el código: " + JSON.stringify(tj));
  const token = tj.access_token as string;
  const h = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  await fetch(g(env, `${wabaId}/subscribed_apps`), { method: "POST", headers: h });
  await fetch(g(env, `${phoneNumberId}/register`), { method: "POST", headers: h,
    body: JSON.stringify({ messaging_product: "whatsapp", pin: "123456" }) }).catch(() => {});
  const info: any = await (await fetch(g(env, `${phoneNumberId}?fields=display_phone_number`), { headers: h })).json();
  return { token, displayPhone: (info.display_phone_number as string) ?? null };
}

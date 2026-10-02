import type { Env, Product } from "../../types";

export async function generateReply(env: Env, o: {
  assistantName: string; personality: string; business: string; products: Product[];
  history: { role: "user" | "assistant"; content: string }[];
}) {
  const system = `Eres ${o.assistantName}, asistente de WhatsApp de un negocio.
Negocio: ${o.business || "(sin descripción)"}
Personalidad e instrucciones: ${o.personality}
REGLAS: Responde en el idioma del cliente, breve y natural (es WhatsApp). NUNCA inventes precios, stock ni productos:
usa únicamente los datos de PRODUCTOS. Si no hay coincidencias, dilo y ofrece alternativas o ayuda humana. Precios en CLP con punto de miles.
PRODUCTOS (JSON, datos reales y actuales):
${JSON.stringify(o.products)}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: o.history.map((m) => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.content }] })),
        generationConfig: { temperature: 0.4, maxOutputTokens: 400 },
      }),
    });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const j: any = await res.json();
  return (j.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined)?.trim()
    || "Disculpa, no pude procesar tu mensaje. ¿Puedes repetirlo?";
}

import fs from 'fs';

async function testGemini() {
  const vars = fs.readFileSync('./.dev.vars', 'utf-8');
  let GEMINI_API_KEY = "";
  for (const line of vars.split('\n')) {
    if (line.startsWith('GEMINI_API_KEY=')) {
      GEMINI_API_KEY = line.split('=')[1].replace(/"/g, '').trim();
    }
  }

  const GEMINI_MODEL = "gemini-3.8-flash";

  if (!GEMINI_API_KEY) {
    console.error("No GEMINI_API_KEY found in .dev.vars");
    return;
  }

  const system = "Eres un asistente de prueba. Responde brevemente.";
  const o = {
    history: [{ role: "user", content: "Hola, ¿funcionas correctamente?" }]
  };

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: o.history.map((m) => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.content }] })),
          generationConfig: { temperature: 0.4, maxOutputTokens: 400 },
        }),
      }
    );

    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
    
    const j = await res.json();
    const reply = j.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Respuesta vacía";
    console.log("=== RESPUESTA DE LA IA ===");
    console.log(reply);
    console.log("==========================");
  } catch (err) {
    console.error("Error al conectar con Gemini:", err);
  }
}

testGemini();

import { Hono } from "hono";
import { cors } from "hono/cors";
import { requireAuth } from "./middleware/auth";
import { auth } from "./routes/auth";
import { businesses } from "./routes/businesses";
import { whatsapp } from "./routes/whatsapp";
import { dataSources } from "./routes/data-sources";
import { webhooks } from "./routes/webhooks";
import { testChat } from "./routes/test-chat";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();
app.use("/api/*", cors());
app.get("/api/health", (c) => c.json({ ok: true }));

app.route("/api/auth", auth);
app.route("/webhooks", webhooks);            // público: lo llama Meta (valida firma)
app.use("/api/*", requireAuth);              // todo lo demás requiere sesión
app.route("/api/business", businesses);
app.route("/api/whatsapp", whatsapp);
app.route("/api/data-sources", dataSources);
app.route("/api/test-chat", testChat);

// Cualquier otra ruta: 404
app.all("*", (c) => c.json({ error: "Not Found" }, 404));
export default app;

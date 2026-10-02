import { createClient } from "@libsql/client";

async function main() {
  const db = createClient({
    url: "libsql://centinal-wsp-centinal.aws-sa-east-1.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA4OTk1NDMsImlkIjoiMDFhMGY5ZWUtM2IwMS03ODIxLTg3MjQtNTlmYTY0MDNiYmRhIiwia2lkIjoiN2NJeC1QNV9GZ1Y1dEhVdUEzT2ZhY0tORjU2bnlqc1BVUXpIRWNNUkotNCIsInJpZCI6IjgyYzA0NDg1LTBiOWMtNDdiMS1hNmRkLWIyZTFlNzA2OTFiNCJ9.mkmH71vr0Glw4Qy9ymJbdWUM-BKVWY31OKQ6sLgdWSN2QgjToHZ7pCywXuefx_KOFqffaxCELPY-Eud3RAPyDw"
  });

  try {
    await db.execute("ALTER TABLE businesses ADD COLUMN webhook_secret TEXT;");
    console.log("Columna webhook_secret añadida.");
  } catch (e) {
    console.log("La columna webhook_secret posiblemente ya existe.", e.message);
  }

  try {
    await db.execute("ALTER TABLE businesses ADD COLUMN sheet_url TEXT;");
    console.log("Columna sheet_url añadida.");
  } catch (e) {
    console.log("La columna sheet_url posiblemente ya existe.", e.message);
  }

  console.log("Tabla businesses actualizada exitosamente en Turso.");
}

main().catch(console.error);

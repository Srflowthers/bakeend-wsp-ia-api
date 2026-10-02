import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

async function main() {
  const db = createClient({
    url: "libsql://centinal-wsp-centinal.aws-sa-east-1.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA4OTk1NDMsImlkIjoiMDFhMGY5ZWUtM2IwMS03ODIxLTg3MjQtNTlmYTY0MDNiYmRhIiwia2lkIjoiN2NJeC1QNV9GZ1Y1dEhVdUEzT2ZhY0tORjU2bnlqc1BVUXpIRWNNUkotNCIsInJpZCI6IjgyYzA0NDg1LTBiOWMtNDdiMS1hNmRkLWIyZTFlNzA2OTFiNCJ9.mkmH71vr0Glw4Qy9ymJbdWUM-BKVWY31OKQ6sLgdWSN2QgjToHZ7pCywXuefx_KOFqffaxCELPY-Eud3RAPyDw"
  });

  const plainPassword = "Chripan2026";
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(plainPassword, salt);

  await db.execute({
    sql: "UPDATE users SET password = ? WHERE email = ?",
    args: [hashedPassword, "centinalwsp.cl@gmail.com"]
  });

  console.log("Contraseña del usuario admin encriptada y actualizada exitosamente en Turso.");
}

main().catch(console.error);

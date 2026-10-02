import { createClient } from "@libsql/client/web";
import type { Env } from "./types";

export const getDb = (env: Env) => {
  return createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });
};

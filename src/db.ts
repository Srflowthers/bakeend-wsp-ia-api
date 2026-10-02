import { createClient as createTursoClient } from "@libsql/client/web";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Env } from "./types";

export const getDb = (env: Env) => {
  return createTursoClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });
};

export const db = (env: Env) => {
  return createSupabaseClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
};

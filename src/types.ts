export type Fetcher = any;

export type Env = {
  ASSETS: Fetcher;
  SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string;
  GEMINI_API_KEY: string; GEMINI_MODEL: string;
  META_APP_ID: string; META_APP_SECRET: string; META_VERIFY_TOKEN: string; GRAPH_VERSION: string; META_API_TOKEN: string;
  JWT_SECRET: string;
  TURSO_DATABASE_URL: string; TURSO_AUTH_TOKEN: string;
  FRONTEND_URL: string;
};
export type Vars = { tenantId: string };
export type AppEnv = { Bindings: Env; Variables: Vars };
export type Product = { name: string; price: number; stock: number; category: string; size: string; color: string };

export type Env = {
  ASSETS: Fetcher;
  SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string;
  GEMINI_API_KEY: string; GEMINI_MODEL: string;
  META_APP_ID: string; META_APP_SECRET: string; META_VERIFY_TOKEN: string; GRAPH_VERSION: string;
  JWT_SECRET: string;
};
export type Vars = { tenantId: string };
export type AppEnv = { Bindings: Env; Variables: Vars };
export type Product = { name: string; price: number; stock: number; category: string; size: string; color: string };

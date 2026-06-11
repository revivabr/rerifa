import process from "node:process";

export function getServerConfig() {
  return {
    nodeEnv: process.env.NODE_ENV,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    mercadopagoAccessToken: process.env.ACCESS_TOKEN,
    mercadopagoPublicKey: process.env.PUBLIC_KEY,
    appBaseUrl: process.env.APP_BASE_URL,
  };
}


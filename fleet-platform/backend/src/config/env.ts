import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: process.env.PORT || "4000",
  nodeEnv: process.env.NODE_ENV || "development",
  supabaseDbUrl: process.env.SUPABASE_DB_URL || "",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || ""
};

if (!env.supabaseDbUrl) {
  console.warn("⚠️  SUPABASE_DB_URL is not set — database queries will fail");
}

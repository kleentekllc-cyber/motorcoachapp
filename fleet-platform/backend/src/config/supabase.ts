import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

// Convert postgres:// to https:// for Supabase client
const supabaseUrl = env.supabaseDbUrl
  ? env.supabaseDbUrl.replace("postgresql://", "https://").split("@")[1]?.split(":")[0] || ""
  : "";

export const supabase = env.supabaseServiceRoleKey && supabaseUrl
  ? createClient(`https://${supabaseUrl}`, env.supabaseServiceRoleKey)
  : null;

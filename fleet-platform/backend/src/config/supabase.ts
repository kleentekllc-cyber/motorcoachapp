import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

export const supabase = env.supabaseUrl && env.supabaseServiceRoleKey
  ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey)
  : null;

import { createClient } from "@supabase/supabase-js";

function getServerSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase server environment variables are not configured.");
  }

  return { url, serviceRoleKey };
}

export function createServiceSupabaseClient() {
  const { url, serviceRoleKey } = getServerSupabaseEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getStorageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || "order-media";
}

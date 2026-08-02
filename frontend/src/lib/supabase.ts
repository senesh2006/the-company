import { createClient, SupabaseClient } from "@supabase/supabase-js";

let clientUrl = 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.SUPABASE_URL ||
  "https://placeholder-project.supabase.co";

let clientKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  process.env.SUPABASE_PUBLISHABLE_KEY || 
  process.env.SUPABASE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";

export const isSupabaseConfigured = () => {
  return Boolean(
    clientUrl && 
    clientKey &&
    !clientUrl.includes("placeholder-project") &&
    !clientKey.includes("placeholder")
  );
};

export let supabase: SupabaseClient = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const updateSupabaseClient = (newUrl: string, newKey: string): SupabaseClient => {
  if (newUrl && newKey && !newUrl.includes("placeholder-project")) {
    clientUrl = newUrl;
    clientKey = newKey;
    supabase = createClient(newUrl, newKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabase;
};

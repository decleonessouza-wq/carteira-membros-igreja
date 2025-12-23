// src/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";

if (!url || !anon) {
  // Isso ajuda MUITO no deploy (Vercel/Netlify) quando esquecer variável
  throw new Error(
    "Supabase env vars ausentes. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env e no deploy."
  );
}

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

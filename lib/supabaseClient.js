import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Fails loudly at build/runtime rather than silently rendering broken
  // pages if the env vars weren't set in Vercel.
  console.warn(
    "Supabase env vars are missing -- set NEXT_PUBLIC_SUPABASE_URL and " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (dev) or the Vercel " +
      "project's Environment Variables (production)."
  );
}

export const supabase = createClient(url, anonKey);

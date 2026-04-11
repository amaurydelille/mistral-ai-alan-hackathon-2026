import { createClient } from "@supabase/supabase-js";

// Uses existing env var names already in .env.local
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. " +
      "Goals API routes will return errors until env vars are configured."
  );
}

// Server-only client — service role key bypasses RLS (fine for single-account demo)
export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseKey ?? "placeholder"
);

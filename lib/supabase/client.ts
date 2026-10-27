import { createBrowserClient } from "@supabase/ssr";

import { hasEnvVars } from "@/lib/utils";
import type { Database } from "@/types/database";

export function createClient() {
  if (!hasEnvVars) {
    throw new Error(
      "Supabase is not configured with a project URL and publishable key.",
    );
  }

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

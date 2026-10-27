import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type SessionMatch = Database["public"]["Functions"]["get_session_matches"]["Returns"][number];
type PlayerMatch = Database["public"]["Functions"]["get_my_match_history"]["Returns"][number];

export type SessionMatchRecord = SessionMatch;
export type PlayerMatchRecord = PlayerMatch;

export async function loadSessionMatches(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<{ data: SessionMatchRecord[] | null }> {
  const { data, error } = await supabase.rpc("get_session_matches", {
    _session_id: sessionId,
  });

  if (error) {
    console.error("Could not load session matches.", error.code);
    return { data: null };
  }

  return { data };
}

export async function loadMyMatchHistory(
  supabase: SupabaseClient,
): Promise<{ data: PlayerMatchRecord[] | null }> {
  const { data, error } = await supabase.rpc("get_my_match_history");

  if (error) {
    console.error("Could not load the current user's match history.", error.code);
    return { data: null };
  }

  return { data };
}

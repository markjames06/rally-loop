import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type QueueEntryRow = Database["public"]["Tables"]["queue_entries"]["Row"];

export type WaitingQueueEntry = {
  entryId: string;
  playerName: string;
  position: number;
  joinedAt: string;
  isCurrentUser: boolean;
};

export type MyQueueEntry = Pick<
  QueueEntryRow,
  "id" | "status" | "joined_at" | "admin_note"
>;

export type SessionQueueSnapshot = {
  entries: WaitingQueueEntry[];
  myEntry: MyQueueEntry | null;
};

type QueueLoadResult = {
  data: SessionQueueSnapshot | null;
};

export async function loadSessionQueue(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
): Promise<QueueLoadResult> {
  const [queueResult, myEntryResult] = await Promise.all([
    supabase.rpc("get_session_queue", { _session_id: sessionId }),
    supabase
      .from("queue_entries")
      .select("id, status, joined_at, admin_note")
      .eq("session_id", sessionId)
      .eq("player_id", userId)
      .order("joined_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (queueResult.error) {
    console.error("Could not load session queue.", queueResult.error.code);
  }
  if (myEntryResult.error) {
    console.error("Could not load the current user's queue entry.", myEntryResult.error.code);
  }
  if (queueResult.error || myEntryResult.error) {
    return { data: null };
  }

  const entries = (queueResult.data ?? []).map((entry) => ({
    entryId: entry.entry_id,
    playerName: entry.player_name,
    position: entry.queue_position,
    joinedAt: entry.joined_at,
    isCurrentUser: entry.is_current_user,
  }));
  const myEntry = myEntryResult.data
    ? {
        id: myEntryResult.data.id,
        status: myEntryResult.data.status,
        joined_at: myEntryResult.data.joined_at,
        admin_note: myEntryResult.data.admin_note,
      }
    : null;

  return { data: { entries, myEntry } };
}

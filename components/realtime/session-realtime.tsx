"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/shared/supabase/client";

type ConnectionState = "connecting" | "connected" | "reconnecting";

export function SessionRealtime({ sessionIds }: { sessionIds: string[] }) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");
  const sessionIdsKey = [...new Set(sessionIds)].sort().join(",");

  useEffect(() => {
    const ids = sessionIdsKey ? sessionIdsKey.split(",") : [];
    if (!ids.length) {
      return;
    }

    const supabase = createClient();
    const channelStates = new Map<string, ConnectionState>();
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    const refreshFromServer = () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      refreshTimer = setTimeout(() => {
        startRefresh(() => router.refresh());
      }, 150);
    };

    const channels = ids.map((sessionId) => {
      const channel = supabase
        .channel(`session:${sessionId}`, { config: { private: true } })
        .on("broadcast", { event: "session_changed" }, refreshFromServer)
        .subscribe((status) => {
          const subscribed = status === "SUBSCRIBED";
          const failed =
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED";
          channelStates.set(
            sessionId,
            subscribed ? "connected" : failed ? "reconnecting" : "connecting",
          );
          const states = [...channelStates.values()];
          setConnectionState(
            states.every((state) => state === "connected")
              ? "connected"
              : states.some((state) => state === "reconnecting")
                ? "reconnecting"
                : "connecting",
          );
          if (subscribed) {
            refreshFromServer();
          }
        });
      return channel;
    });

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      for (const channel of channels) {
        void supabase.removeChannel(channel);
      }
    };
  }, [router, sessionIdsKey]);

  const statusText =
    connectionState === "connected"
      ? "Live updates connected"
      : connectionState === "reconnecting"
        ? "Connection interrupted. Reconnecting; displayed data may be stale."
        : "Connecting to live updates…";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-900/70 p-3 sm:flex-row sm:items-center sm:justify-between">
      <p aria-live="polite" className="text-sm text-slate-300" role="status">
        {sessionIds.length ? statusText : "Live updates are not available for this view."}
      </p>
      <Button
        disabled={isRefreshing}
        onClick={() => startRefresh(() => router.refresh())}
        type="button"
        variant="outline"
      >
        {isRefreshing ? "Refreshing…" : "Refresh"}
      </Button>
    </div>
  );
}

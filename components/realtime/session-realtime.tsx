"use client";

import { Activity, CircleOff, LoaderCircle, RefreshCw } from "lucide-react";
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
  const hasSessions = sessionIdsKey.length > 0;

  useEffect(() => {
    const ids = sessionIdsKey ? sessionIdsKey.split(",") : [];
    if (!ids.length) return;

    const supabase = createClient();
    const channelStates = new Map<string, ConnectionState>();
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    const refreshFromServer = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
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
          if (subscribed) refreshFromServer();
        });
      return channel;
    });

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      for (const channel of channels) void supabase.removeChannel(channel);
    };
  }, [router, sessionIdsKey]);

  const statusLabel = !hasSessions
    ? "No active games"
    : connectionState === "connected"
      ? "Live"
      : connectionState === "reconnecting"
        ? "Reconnecting"
        : "Connecting";
  const statusDescription = !hasSessions
    ? "Join a game to get live court updates."
    : connectionState === "connected"
      ? "Live updates connected"
      : connectionState === "reconnecting"
        ? "Connection interrupted. Reconnecting; displayed data may be stale."
        : "Connecting to live updates";
  const StatusIcon = !hasSessions
    ? CircleOff
    : connectionState === "connected"
      ? Activity
      : LoaderCircle;

  return (
    <div className={`player-sync${hasSessions ? ` is-${connectionState}` : " is-idle"}`}>
      <div className="player-sync-state" role="status" aria-live="polite">
        <span className="player-sync-icon" aria-hidden="true">
          <StatusIcon className={connectionState === "connecting" && hasSessions ? "is-spinning" : ""} />
        </span>
        <span className="player-sync-copy">
          <strong>{statusLabel}</strong>
          <span className="sr-only">{statusDescription}</span>
        </span>
      </div>
      <Button
        aria-label={isRefreshing ? "Refreshing player data" : "Refresh player data"}
        className="player-sync-refresh"
        disabled={isRefreshing}
        onClick={() => startRefresh(() => router.refresh())}
        title="Refresh player data"
        type="button"
        variant="outline"
      >
        <RefreshCw aria-hidden="true" className={isRefreshing ? "is-spinning" : ""} />
      </Button>
    </div>
  );
}

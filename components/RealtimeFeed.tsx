"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface FeedEvent {
  id: string;
  type: "playlist" | "press" | "listener" | "stream";
  message: string;
  timestamp: string;
}

export default function RealtimeFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([]);

  useEffect(() => {
    // Subscribe to playlist additions
    const playlistChannel = supabase
      .channel("feed_playlists")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "playlist_placements" },
        (payload) => {
          const p = payload.new as Record<string, string | number>;
          addEvent({
            type: "playlist",
            message: `📋 New playlist: "${p.playlist_name}" (${p.country}, ${Number(p.followers).toLocaleString()} followers)`,
          });
        }
      )
      .subscribe();

    // Subscribe to press coverage
    const pressChannel = supabase
      .channel("feed_press")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "press_coverage" },
        (payload) => {
          const p = payload.new as Record<string, string>;
          addEvent({
            type: "press",
            message: `📰 New press: ${p.outlet} (${p.country}) — ${p.track}`,
          });
        }
      )
      .subscribe();

    // Subscribe to stream updates
    const streamChannel = supabase
      .channel("feed_streams")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "spotify_daily" },
        (payload) => {
          const p = payload.new as Record<string, number>;
          addEvent({
            type: "stream",
            message: `🔊 Stats updated: ${p.total_streams?.toLocaleString()} total streams, ${p.monthly_listeners?.toLocaleString()} listeners`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(playlistChannel);
      supabase.removeChannel(pressChannel);
      supabase.removeChannel(streamChannel);
    };
  }, []);

  function addEvent(partial: Omit<FeedEvent, "id" | "timestamp">) {
    const event: FeedEvent = {
      ...partial,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    setEvents((prev) => [event, ...prev].slice(0, 20));
  }

  return (
    <div className="border border-war-border bg-war-panel">
      <div className="p-4 border-b border-war-border flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-war-green animate-war-pulse" />
        <p className="text-[10px] text-war-muted tracking-[0.2em] uppercase">REAL-TIME FEED</p>
      </div>
      <div className="p-4 max-h-64 overflow-y-auto">
        {events.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-war-muted text-xs">Listening for signals...</p>
            <div className="w-2 h-2 rounded-full bg-gold/30 mx-auto mt-2 animate-war-pulse" />
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event, i) => (
              <div
                key={event.id}
                className="animate-fade-in"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <p className="text-xs text-war-text">{event.message}</p>
                <p className="text-[10px] font-data text-war-muted/50 mt-0.5">
                  {new Date(event.timestamp).toLocaleTimeString("en-US", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import WarRoomHeader from "@/components/WarRoomHeader";
import StatCard from "@/components/StatCard";
import ShareCard from "@/components/ShareCard";
import { usePoll } from "@/lib/use-poll";
import { IDENTITY_MESSAGES } from "@/lib/loop-identity";
import type { LoopIdentity } from "@/lib/loop-identity";

interface ListenerData {
  identity: LoopIdentity;
  confidence: number;
  breakdown: {
    totalStreams28d: number;
    kingSuitePercentage: number;
    lateNightPercentage: number;
    lateNightCompletionRate: number;
    skipRate: number;
    distinctDays: number;
    topTrackId: string | null;
    topTrackName: string | null;
    qualifies: Record<LoopIdentity, boolean>;
  };
  stats: {
    firstListen: string | null;
    totalStreams: number;
    favouriteTrack: string;
    favouriteTrackCount: number;
    albumCompletions: number;
    listeningDepth: number;
    daysAsListener: number;
  };
}

export default function ListenerPage() {
  const [data, setData] = useState<ListenerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [identityRevealed, setIdentityRevealed] = useState(false);

  // Poll every 30 seconds
  const { data: pollData } = usePoll({ intervalMs: 30000, enabled: true });

  useEffect(() => {
    async function fetchListener() {
      try {
        const res = await fetch("/api/listener");
        if (res.status === 401) {
          setError("auth");
          return;
        }
        if (!res.ok) {
          setError("Failed to load listener data");
          return;
        }
        const json = await res.json();
        setData(json);

        // Dramatic reveal delay
        setTimeout(() => setIdentityRevealed(true), 1500);
      } catch {
        setError("Connection error");
      } finally {
        setLoading(false);
      }
    }
    fetchListener();
  }, []);

  // --- Auth redirect ---
  if (error === "auth") {
    return (
      <main className="min-h-screen bg-war-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-war-muted text-sm mb-4">Authentication required</p>
          <a
            href="/api/auth/login"
            className="border border-gold bg-gold/10 px-8 py-3 text-gold font-bold tracking-widest uppercase text-sm hover:bg-gold/20 transition-colors"
          >
            Connect with Spotify
          </a>
        </div>
      </main>
    );
  }

  // --- Loading state ---
  if (loading) {
    return (
      <main className="min-h-screen bg-war-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gold font-data animate-war-pulse tracking-widest text-sm">
            ANALYZING YOUR SIGNAL...
          </p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-war-black flex items-center justify-center">
        <p className="text-war-red font-data">{error || "Unknown error"}</p>
      </main>
    );
  }

  const { identity, stats } = data;
  const message = IDENTITY_MESSAGES[identity];

  return (
    <main className="min-h-screen bg-war-black p-4 lg:p-6">
      <WarRoomHeader />

      {/* Identity Reveal */}
      <div className="border border-gold/30 bg-war-panel p-8 lg:p-12 mb-6 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`w-[400px] h-[400px] rounded-full bg-gold/5 blur-[100px] transition-opacity duration-1000 ${
              identityRevealed ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        <p className="text-war-muted text-xs tracking-[0.3em] uppercase mb-4 relative z-10">
          Your Loop Identity
        </p>

        <h1
          className={`font-data font-bold text-gold transition-all duration-1000 relative z-10 ${
            identityRevealed
              ? "text-5xl lg:text-7xl glow-gold opacity-100 translate-y-0"
              : "text-3xl opacity-0 translate-y-4"
          }`}
        >
          {identity}
        </h1>

        <p
          className={`text-war-text text-lg lg:text-xl mt-6 max-w-lg mx-auto leading-relaxed relative z-10 transition-all duration-1000 delay-500 ${
            identityRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          {message}
        </p>

        {/* Confidence bar */}
        <div className="mt-8 max-w-xs mx-auto relative z-10">
          <div className="flex justify-between text-[10px] text-war-muted tracking-widest uppercase mb-1">
            <span>Signal Strength</span>
            <span className="font-data">{(data.confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1 bg-war-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-gold transition-all duration-2000 ease-out"
              style={{ width: identityRevealed ? `${data.confidence * 100}%` : "0%" }}
            />
          </div>
        </div>
      </div>

      {/* Now Playing indicator */}
      {pollData?.playing && (
        <div className="border border-gold/20 bg-war-panel p-3 mb-6 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-war-green animate-war-pulse" />
          <span className="text-xs text-war-muted">NOW PLAYING:</span>
          <span className="text-sm text-gold font-data">{pollData.track}</span>
          {pollData.completed && (
            <span className="text-[10px] bg-war-green/20 text-war-green px-2 py-0.5 font-data">
              COMPLETED
            </span>
          )}
        </div>
      )}

      {/* Stats Grid — 6 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="First Listen"
          value={
            stats.firstListen
              ? new Date(stats.firstListen).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"
          }
          icon="📅"
        />
        <StatCard
          label="Total Streams"
          value={stats.totalStreams.toLocaleString()}
          icon="🔊"
        />
        <StatCard
          label="Favourite Track"
          value={stats.favouriteTrack}
          change={stats.favouriteTrackCount > 0 ? `${stats.favouriteTrackCount} plays` : undefined}
          changeType="neutral"
          icon="❤️"
        />
        <StatCard
          label="Album Completions"
          value={stats.albumCompletions}
          icon="💿"
        />
        <StatCard
          label="Listening Depth"
          value={`${stats.listeningDepth} tracks/session`}
          icon="📊"
        />
        <StatCard
          label="Days as Listener"
          value={stats.daysAsListener}
          icon="⏱️"
        />
      </div>

      {/* Identity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Qualification matrix */}
        <div className="border border-war-border bg-war-panel p-4">
          <p className="text-[10px] text-war-muted tracking-[0.2em] uppercase mb-4">
            IDENTITY QUALIFICATION MATRIX
          </p>
          <div className="space-y-3">
            {(["LOVE", "LYON", "LONELY", "LONY", "ONLY"] as LoopIdentity[]).map((id) => {
              const qualifies = data.breakdown.qualifies[id];
              const isCurrent = id === identity;
              return (
                <div
                  key={id}
                  className={`flex items-center justify-between p-2 ${
                    isCurrent ? "bg-gold/10 border border-gold/20" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        qualifies ? "bg-war-green" : "bg-war-red/50"
                      }`}
                    />
                    <span
                      className={`font-data text-sm ${
                        isCurrent ? "text-gold font-bold" : "text-war-text"
                      }`}
                    >
                      {id}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-data ${
                      qualifies ? "text-war-green" : "text-war-muted"
                    }`}
                  >
                    {qualifies ? "QUALIFIED" : "NOT MET"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Share Card */}
        <ShareCard identity={identity} />
      </div>

      {/* Bottom status */}
      <div className="border border-war-border bg-war-panel p-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className="text-war-muted">LOOP:</span>
          <span className="text-gold font-data">{identity}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-war-muted">SIGNAL:</span>
          <span className="text-war-green font-data">{(data.confidence * 100).toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-war-muted">POLLING:</span>
          <span className="text-war-text font-data">30s</span>
        </div>
      </div>
    </main>
  );
}

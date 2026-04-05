"use client";

import { useState, useEffect } from "react";
import WarRoomHeader from "@/components/WarRoomHeader";
import StatCard from "@/components/StatCard";
import SundayPulseChart from "@/components/SundayPulseChart";
import GrowthChart from "@/components/GrowthChart";
import SaveRateChart from "@/components/SaveRateChart";
import AlbumFunnel from "@/components/AlbumFunnel";
import TrackTable from "@/components/TrackTable";
import WorldMap from "@/components/WorldMap";
import PlaylistPlacements from "@/components/PlaylistPlacements";
import PressCoverage from "@/components/PressCoverage";
import RealtimeFeed from "@/components/RealtimeFeed";

const RELEASE_DATE = new Date("2026-03-19");

export default function SovereigntyPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [growth, setGrowth] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [press, setPress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthenticated(true);
      setError("");
    } else {
      setError("ACCESS DENIED");
    }
  };

  useEffect(() => {
    if (!authenticated) return;
    const fetchData = async () => {
      try {
        const [growthRes, tracksRes, playlistsRes, pressRes] = await Promise.all([
          fetch("/api/data/growth"),
          fetch("/api/data/tracks"),
          fetch("/api/data/playlists"),
          fetch("/api/data/press"),
        ]);
        if (growthRes.ok) setGrowth(await growthRes.json());
        if (tracksRes.ok) setTracks(await tracksRes.json());
        if (playlistsRes.ok) setPlaylists(await playlistsRes.json());
        if (pressRes.ok) setPress(await pressRes.json());
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authenticated]);

  // --- Login gate ---
  if (!authenticated) {
    return (
      <main className="min-h-screen bg-war-black flex items-center justify-center">
        <div className="w-full max-w-md p-8">
          <div className="border border-war-border bg-war-panel p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-black tracking-tighter text-gold glow-gold">
                SOVEREIGNTY
              </h1>
              <p className="text-war-muted text-xs tracking-[0.3em] uppercase mt-2">
                Authorized Personnel Only
              </p>
            </div>
            <form onSubmit={handleLogin}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter access code"
                className="w-full bg-war-dark border border-war-border p-3 text-war-text font-data text-sm focus:border-gold focus:outline-none placeholder:text-war-muted/50"
              />
              {error && (
                <p className="text-war-red text-xs font-data mt-2 tracking-widest">{error}</p>
              )}
              <button
                type="submit"
                className="w-full mt-4 bg-gold/10 border border-gold text-gold py-3 text-sm font-bold tracking-[0.2em] uppercase hover:bg-gold/20 transition-colors"
              >
                AUTHENTICATE
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  const latest = growth[growth.length - 1];
  const daysSinceRelease = Math.ceil(
    (Date.now() - RELEASE_DATE.getTime()) / (1000 * 60 * 60 * 24)
  );

  const growthChartData = growth.map((g: any) => ({
    date: new Date(g.snapshot_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    listeners: g.monthly_listeners,
    streams: g.total_streams,
  }));

  const playlistReach = playlists.reduce((sum: number, p: any) => sum + (p.followers || 0), 0);

  return (
    <main className="min-h-screen bg-war-black p-4 lg:p-6">
      <WarRoomHeader />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gold font-data animate-war-pulse">LOADING INTEL...</p>
        </div>
      ) : (
        <>
          {/* Panel 1: COMMAND HEADER — 6 stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <StatCard
              label="Total Streams"
              value={latest?.total_streams?.toLocaleString() || "—"}
              icon="🔊"
            />
            <StatCard
              label="Monthly Listeners"
              value={latest?.monthly_listeners?.toLocaleString() || "—"}
              icon="👁️"
            />
            <StatCard
              label="Followers"
              value={latest?.followers?.toLocaleString() || "—"}
              icon="🫡"
            />
            <StatCard
              label="Countries"
              value={latest?.countries_count || "—"}
              icon="🌍"
            />
            <StatCard
              label="Days Since Release"
              value={daysSinceRelease}
              icon="📅"
            />
            <StatCard
              label="Playlist Reach"
              value={playlistReach.toLocaleString()}
              icon="📋"
            />
          </div>

          {/* Panel 2: GROWTH TRAJECTORY */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <GrowthChart data={growthChartData} title="Day 1 → Day 17: Listener Growth" dataKey="listeners" />
            <GrowthChart data={growthChartData} title="Stream Accumulation" dataKey="streams" />
          </div>

          {/* Panel 3: TRACK PERFORMANCE */}
          <div className="mb-6">
            <TrackTable tracks={tracks} />
          </div>

          {/* Panel 4: PLAYLIST PLACEMENTS */}
          <div className="mb-6">
            <PlaylistPlacements playlists={playlists} />
          </div>

          {/* Panel 5: WORLD MAP */}
          <div className="mb-6">
            <WorldMap />
          </div>

          {/* Panel 6: SUNDAY PULSE + SAVE RATE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <SundayPulseChart />
            <SaveRateChart tracks={tracks} />
          </div>

          {/* Panel 7: PRESS COVERAGE */}
          <div className="mb-6">
            <PressCoverage press={press} />
          </div>

          {/* Panel 8: ALBUM FUNNEL */}
          <div className="mb-6">
            <AlbumFunnel tracks={tracks} />
          </div>

          {/* Panel 9: REAL-TIME FEED */}
          <div className="mb-6">
            <RealtimeFeed />
          </div>

          {/* Status bar */}
          <div className="border border-war-border bg-war-panel p-3 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4">
              <span className="text-war-muted">ARTIST:</span>
              <span className="text-gold font-data">Anthony John Sissian / YOU THEE ME</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-war-muted">SAVE RATE:</span>
              <span className="text-war-green font-data">10-37% (industry avg 2-5%)</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-war-muted">STATUS:</span>
              <span className="text-war-green font-data">SOVEREIGN</span>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

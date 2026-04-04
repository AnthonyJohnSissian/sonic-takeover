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

interface GrowthSnapshot {
  snapshot_date: string;
  monthly_listeners: number;
  total_streams: number;
  followers: number;
  countries_count: number;
  super_listeners: number;
}

interface TrackStat {
  track_id: string;
  track_name: string;
  total_streams: number;
  unique_listeners: number;
  total_saves: number;
  completion_rate: number;
  skip_rate: number;
  repeat_rate: number;
  save_rate: number;
}

export default function SovereigntyPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [growth, setGrowth] = useState<GrowthSnapshot[]>([]);
  const [tracks, setTracks] = useState<TrackStat[]>([]);
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
        const [growthRes, tracksRes] = await Promise.all([
          fetch("/api/data/growth"),
          fetch("/api/data/tracks"),
        ]);
        if (growthRes.ok) setGrowth(await growthRes.json());
        if (tracksRes.ok) setTracks(await tracksRes.json());
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authenticated]);

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
  const previous = growth[growth.length - 2];

  const pctChange = (curr: number, prev: number) => {
    if (!prev) return "+0%";
    const pct = ((curr - prev) / prev * 100).toFixed(1);
    return `${+pct > 0 ? "+" : ""}${pct}%`;
  };

  const growthChartData = growth.map((g) => ({
    date: new Date(g.snapshot_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    listeners: g.monthly_listeners,
    streams: g.total_streams,
  }));

  return (
    <main className="min-h-screen bg-war-black p-4 lg:p-6">
      <WarRoomHeader />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gold font-data animate-war-pulse">LOADING INTEL...</p>
        </div>
      ) : (
        <>
          {/* Top metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatCard
              label="Total Streams"
              value={latest?.total_streams?.toLocaleString() || "—"}
              change={previous ? pctChange(latest.total_streams, previous.total_streams) : undefined}
              changeType="up"
              icon="🔊"
            />
            <StatCard
              label="Monthly Listeners"
              value={latest?.monthly_listeners?.toLocaleString() || "—"}
              change={previous ? pctChange(latest.monthly_listeners, previous.monthly_listeners) : undefined}
              changeType="up"
              icon="👁️"
            />
            <StatCard
              label="Countries"
              value={latest?.countries_count || "—"}
              change={previous ? pctChange(latest.countries_count, previous.countries_count) : undefined}
              changeType="up"
              icon="🌍"
            />
            <StatCard
              label="Super Listeners"
              value={latest?.super_listeners || "—"}
              change={previous ? pctChange(latest.super_listeners, previous.super_listeners) : undefined}
              changeType="up"
              icon="⚡"
            />
            <StatCard
              label="Followers"
              value={latest?.followers?.toLocaleString() || "—"}
              change={previous ? pctChange(latest.followers, previous.followers) : undefined}
              changeType="up"
              icon="🫡"
            />
          </div>

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <GrowthChart data={growthChartData} title="Listener Growth Trajectory" dataKey="listeners" />
            <GrowthChart data={growthChartData} title="Stream Accumulation" dataKey="streams" />
          </div>

          {/* Charts row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <SundayPulseChart />
            <SaveRateChart tracks={tracks} />
          </div>

          {/* World Map */}
          <div className="mb-6">
            <WorldMap />
          </div>

          {/* Album Funnel */}
          <div className="mb-6">
            <AlbumFunnel tracks={tracks} />
          </div>

          {/* Track Intel Table */}
          <div className="mb-6">
            <TrackTable tracks={tracks} />
          </div>

          {/* Bottom status */}
          <div className="border border-war-border bg-war-panel p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="text-war-muted">ARTIST:</span>
              <span className="text-gold font-data">YOU THEE ME</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-war-muted">DATA POINTS:</span>
              <span className="text-war-text font-data">{growth.length} snapshots</span>
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

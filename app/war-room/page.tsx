"use client";

import WarRoomHeader from "@/components/WarRoomHeader";
import StatCard from "@/components/StatCard";
import NowPlaying from "@/components/NowPlaying";
import TrackTable from "@/components/TrackTable";
import GrowthChart from "@/components/GrowthChart";

// Placeholder data — will be replaced with live Supabase/Spotify data
const PLACEHOLDER_TRACKS = [
  { track_id: "1", track_name: "Loading...", total_streams: 0, completion_rate: 0, skip_rate: 0, repeat_rate: 0 },
];

const PLACEHOLDER_GROWTH = [
  { date: "Apr 1", listeners: 0, streams: 0 },
];

export default function WarRoomPage() {
  return (
    <main className="min-h-screen bg-war-black p-4 lg:p-6">
      <WarRoomHeader />

      {/* Top-level stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Monthly Listeners" value="—" icon="👁️" />
        <StatCard label="Total Streams" value="—" icon="🔊" />
        <StatCard label="Countries Reached" value="—" icon="🌍" />
        <StatCard label="Super Listeners" value="—" icon="⚡" />
      </div>

      {/* Middle row: Now Playing + Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-1">
          <NowPlaying />
        </div>
        <div className="lg:col-span-2">
          <GrowthChart data={PLACEHOLDER_GROWTH} title="Listener Growth" dataKey="listeners" />
        </div>
      </div>

      {/* Track Intel */}
      <div className="mb-6">
        <TrackTable tracks={PLACEHOLDER_TRACKS} />
      </div>

      {/* Bottom status bar */}
      <div className="border border-war-border bg-war-panel p-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className="text-war-muted">ARTIST:</span>
          <span className="text-gold font-data">YOU THEE ME</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-war-muted">ALBUM:</span>
          <span className="text-war-text font-data">Target Locked</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-war-muted">STATUS:</span>
          <span className="text-war-green font-data">OPERATIONAL</span>
        </div>
      </div>
    </main>
  );
}

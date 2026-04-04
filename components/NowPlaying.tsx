"use client";

import { useEffect, useState } from "react";

interface NowPlayingData {
  is_playing: boolean;
  item?: {
    name: string;
    artists: { name: string }[];
    album: {
      name: string;
      images: { url: string }[];
    };
    duration_ms: number;
  };
  progress_ms?: number;
}

export default function NowPlaying() {
  const [data, setData] = useState<NowPlayingData | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/spotify/now-playing");
        if (res.ok) setData(await res.json());
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!data?.is_playing || !data.item) {
    return (
      <div className="border border-war-border bg-war-panel p-4">
        <p className="text-[10px] text-war-muted tracking-[0.2em] uppercase mb-3">NOW PLAYING</p>
        <p className="text-war-muted text-sm">No active playback</p>
      </div>
    );
  }

  const progress = data.progress_ms && data.item.duration_ms
    ? (data.progress_ms / data.item.duration_ms) * 100
    : 0;

  return (
    <div className="border border-gold/30 bg-war-panel p-4">
      <p className="text-[10px] text-gold tracking-[0.2em] uppercase mb-3">⚡ NOW PLAYING</p>
      <div className="flex gap-4">
        {data.item.album.images[0] && (
          <img
            src={data.item.album.images[0].url}
            alt={data.item.album.name}
            className="w-16 h-16 border border-war-border"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-gold font-semibold truncate">{data.item.name}</p>
          <p className="text-war-muted text-sm truncate">
            {data.item.artists.map((a) => a.name).join(", ")}
          </p>
          <div className="mt-2 h-1 bg-war-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-gold transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

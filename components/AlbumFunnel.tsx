"use client";

interface TrackStat {
  track_name: string;
  total_streams: number;
  unique_listeners: number;
  completion_rate: number;
}

interface AlbumFunnelProps {
  tracks: TrackStat[];
}

export default function AlbumFunnel({ tracks }: AlbumFunnelProps) {
  if (!tracks.length) return null;

  const maxStreams = Math.max(...tracks.map((t) => t.total_streams));

  return (
    <div className="border border-war-border bg-war-panel p-4">
      <p className="text-[10px] text-war-muted tracking-[0.2em] uppercase mb-4">
        ALBUM FUNNEL — TRACK RETENTION
      </p>
      <div className="space-y-2">
        {tracks
          .sort((a, b) => b.total_streams - a.total_streams)
          .map((track, i) => {
            const width = (track.total_streams / maxStreams) * 100;
            const completionWidth = track.completion_rate * 100;

            return (
              <div key={track.track_name} className="group">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-war-muted font-data text-xs w-6 text-right">
                    {i + 1}
                  </span>
                  <span className="text-war-text text-sm flex-1 truncate">
                    {track.track_name}
                  </span>
                  <span className="text-gold font-data text-xs">
                    {track.total_streams.toLocaleString()}
                  </span>
                  <span className="text-war-green font-data text-xs">
                    {(track.completion_rate * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6" />
                  <div className="flex-1 h-6 bg-war-dark relative overflow-hidden">
                    {/* Stream volume bar */}
                    <div
                      className="absolute inset-y-0 left-0 bg-gold/20 transition-all duration-500"
                      style={{ width: `${width}%` }}
                    />
                    {/* Completion overlay */}
                    <div
                      className="absolute inset-y-0 left-0 bg-gold/40 transition-all duration-500"
                      style={{ width: `${(width * completionWidth) / 100}%` }}
                    />
                    {/* Labels inside bar */}
                    <div className="absolute inset-0 flex items-center px-2">
                      <span className="text-[10px] font-data text-gold/70">
                        {track.unique_listeners} unique
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
      <div className="flex gap-6 mt-4 text-[10px] text-war-muted">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gold/20" />
          <span>Stream Volume</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gold/40" />
          <span>Completion Rate</span>
        </div>
      </div>
    </div>
  );
}

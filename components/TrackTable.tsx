"use client";

interface Track {
  track_id: string;
  track_name: string;
  total_streams: number;
  completion_rate: number;
  skip_rate: number;
  repeat_rate: number;
}

interface TrackTableProps {
  tracks: Track[];
}

export default function TrackTable({ tracks }: TrackTableProps) {
  return (
    <div className="border border-war-border bg-war-panel">
      <div className="p-4 border-b border-war-border">
        <p className="text-[10px] text-war-muted tracking-[0.2em] uppercase">TRACK INTEL</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-war-border text-war-muted text-[10px] tracking-[0.15em] uppercase">
              <th className="text-left p-3">#</th>
              <th className="text-left p-3">Track</th>
              <th className="text-right p-3">Streams</th>
              <th className="text-right p-3">Complete</th>
              <th className="text-right p-3">Skip</th>
              <th className="text-right p-3">Repeat</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((track, i) => (
              <tr
                key={track.track_id}
                className="border-b border-war-border/50 hover:bg-war-dark/50 transition-colors"
              >
                <td className="p-3 font-data text-war-muted">{i + 1}</td>
                <td className="p-3 text-war-text font-medium">{track.track_name}</td>
                <td className="p-3 text-right font-data text-gold">
                  {track.total_streams.toLocaleString()}
                </td>
                <td className="p-3 text-right font-data text-war-green">
                  {(track.completion_rate * 100).toFixed(1)}%
                </td>
                <td className="p-3 text-right font-data text-war-red">
                  {(track.skip_rate * 100).toFixed(1)}%
                </td>
                <td className="p-3 text-right font-data text-gold-dim">
                  {(track.repeat_rate * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

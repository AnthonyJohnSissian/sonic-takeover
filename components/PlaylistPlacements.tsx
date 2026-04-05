"use client";

interface Playlist {
  playlist_name: string;
  owner: string;
  country: string;
  followers: number;
  track_name: string;
  track_position: number;
  added_at: string;
}

interface PlaylistPlacementsProps {
  playlists: Playlist[];
}

export default function PlaylistPlacements({ playlists }: PlaylistPlacementsProps) {
  const totalReach = playlists.reduce((sum, p) => sum + (p.followers || 0), 0);

  return (
    <div className="border border-war-border bg-war-panel">
      <div className="p-4 border-b border-war-border flex items-center justify-between">
        <p className="text-[10px] text-war-muted tracking-[0.2em] uppercase">PLAYLIST PLACEMENTS</p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-war-muted">TOTAL REACH:</span>
          <span className="font-data text-sm text-gold font-bold">
            {totalReach.toLocaleString()} ears
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-war-border text-[10px] tracking-[0.15em] uppercase text-war-muted">
              <th className="text-left p-3">Playlist</th>
              <th className="text-left p-3">Owner</th>
              <th className="text-left p-3">Country</th>
              <th className="text-right p-3">Followers</th>
              <th className="text-right p-3">Position</th>
              <th className="text-right p-3">Added</th>
            </tr>
          </thead>
          <tbody>
            {playlists.map((p, i) => (
              <tr key={i} className="border-b border-war-border/50 hover:bg-war-dark/50 transition-colors">
                <td className="p-3 text-gold font-medium">{p.playlist_name}</td>
                <td className="p-3 text-war-text">{p.owner}</td>
                <td className="p-3 text-war-muted">{p.country}</td>
                <td className="p-3 text-right font-data text-gold">{p.followers?.toLocaleString()}</td>
                <td className="p-3 text-right font-data text-war-green">#{p.track_position}</td>
                <td className="p-3 text-right font-data text-war-muted">
                  {new Date(p.added_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

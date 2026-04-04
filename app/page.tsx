export default function WarRoom() {
  return (
    <main className="min-h-screen bg-war-black p-6">
      {/* Header */}
      <div className="border border-war-border bg-war-panel p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-gold glow-gold">
              SONIC TAKEOVER OF EARTH
            </h1>
            <p className="text-war-muted mt-1 text-sm tracking-widest uppercase">
              YOU THEE ME — Real-Time Command Center
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-war-green animate-war-pulse" />
            <span className="font-data text-xs text-war-muted">LIVE</span>
          </div>
        </div>
      </div>

      {/* Grid placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {["MONTHLY LISTENERS", "TOTAL STREAMS", "COUNTRIES", "SUPER LISTENERS"].map((label) => (
          <div key={label} className="border border-war-border bg-war-panel p-4">
            <p className="text-xs text-war-muted tracking-widest uppercase">{label}</p>
            <p className="text-3xl font-data font-bold text-gold mt-2">—</p>
          </div>
        ))}
      </div>

      {/* Status */}
      <div className="border border-war-border bg-war-panel p-4 text-center">
        <p className="text-war-muted text-sm">
          War room scaffolded. Awaiting Spotify auth &amp; data pipeline connection.
        </p>
      </div>
    </main>
  );
}

"use client";

interface PressItem {
  outlet: string;
  country: string;
  outlet_type: string;
  track: string;
  coverage_type: string;
  url: string | null;
  quote: string | null;
  published_at: string;
  reach_estimate: number;
}

interface PressCoverageProps {
  press: PressItem[];
}

const TYPE_BADGES: Record<string, string> = {
  blog: "bg-gold/20 text-gold",
  radio: "bg-war-green/20 text-war-green",
  media: "bg-blue-500/20 text-blue-400",
};

export default function PressCoverage({ press }: PressCoverageProps) {
  const totalReach = press.reduce((sum, p) => sum + (p.reach_estimate || 0), 0);

  return (
    <div className="border border-war-border bg-war-panel">
      <div className="p-4 border-b border-war-border flex items-center justify-between">
        <p className="text-[10px] text-war-muted tracking-[0.2em] uppercase">PRESS COVERAGE</p>
        <div className="flex items-center gap-4">
          <span className="font-data text-xs text-war-muted">
            {press.length} features · {totalReach.toLocaleString()} est. reach
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {press.map((item, i) => (
          <div
            key={i}
            className="border border-war-border/50 bg-war-dark p-4 hover:border-gold/20 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gold font-semibold text-sm">{item.outlet}</span>
              <span
                className={`text-[10px] px-2 py-0.5 font-data ${
                  TYPE_BADGES[item.outlet_type] || "bg-war-border text-war-muted"
                }`}
              >
                {item.outlet_type.toUpperCase()}
              </span>
            </div>
            <p className="text-war-muted text-xs mb-2">
              {item.country} · {item.coverage_type}
            </p>
            <p className="text-war-muted text-xs mb-1">
              Track: <span className="text-war-text">{item.track}</span>
            </p>
            {item.quote && (
              <p className="text-war-text/70 text-xs italic mt-2 leading-relaxed">
                &ldquo;{item.quote}&rdquo;
              </p>
            )}
            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] font-data text-war-muted">
                {new Date(item.published_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-gold hover:text-gold-bright transition-colors"
                >
                  READ →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

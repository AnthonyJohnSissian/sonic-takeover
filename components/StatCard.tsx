"use client";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon?: string;
}

export default function StatCard({ label, value, change, changeType = "neutral", icon }: StatCardProps) {
  const changeColor = {
    up: "text-war-green",
    down: "text-war-red",
    neutral: "text-war-muted",
  }[changeType];

  return (
    <div className="border border-war-border bg-war-panel p-4 hover:border-gold/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] text-war-muted tracking-[0.2em] uppercase font-medium">{label}</p>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <p className="text-3xl font-data font-bold text-gold glow-gold">{value}</p>
      {change && (
        <p className={`text-xs font-data mt-2 ${changeColor}`}>
          {changeType === "up" ? "▲" : changeType === "down" ? "▼" : "●"} {change}
        </p>
      )}
    </div>
  );
}

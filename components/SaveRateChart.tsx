"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

interface TrackStat {
  track_name: string;
  save_rate: number;
  total_saves: number;
}

interface SaveRateChartProps {
  tracks: TrackStat[];
}

export default function SaveRateChart({ tracks }: SaveRateChartProps) {
  const chartData = tracks
    .map((t) => ({
      name: t.track_name,
      saveRate: +(t.save_rate * 100).toFixed(1),
      saves: t.total_saves,
    }))
    .sort((a, b) => b.saveRate - a.saveRate);

  return (
    <div className="border border-war-border bg-war-panel p-4">
      <p className="text-[10px] text-war-muted tracking-[0.2em] uppercase mb-4">
        SAVE RATE BY TRACK
      </p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" horizontal={false} />
            <XAxis
              type="number"
              stroke="#666"
              tick={{ fill: "#666", fontSize: 10 }}
              axisLine={{ stroke: "#1A1A1A" }}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#666"
              tick={{ fill: "#999", fontSize: 9 }}
              axisLine={{ stroke: "#1A1A1A" }}
              width={120}
            />
            <Tooltip
              contentStyle={{
                background: "#111",
                border: "1px solid #1A1A1A",
                color: "#E5E5E5",
                fontFamily: "JetBrains Mono",
                fontSize: 12,
              }}
              formatter={(value: number) => [`${value}%`, "Save Rate"]}
            />
            <Bar dataKey="saveRate" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell
                  key={index}
                  fill={index === 0 ? "#FFD700" : index < 3 ? "#D4AF37" : "#B8960F"}
                  opacity={1 - index * 0.07}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface PulsePoint {
  recorded_at: string;
  hour_utc: number;
  stream_count: number;
  listener_count: number;
}

export default function SundayPulseChart() {
  const [data, setData] = useState<PulsePoint[]>([]);

  useEffect(() => {
    fetch("/api/data/sunday-pulse")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  // Group by Sunday date, then show hourly bars
  const sundayMap = new Map<string, PulsePoint[]>();
  data.forEach((d) => {
    const date = d.recorded_at.split("T")[0];
    if (!sundayMap.has(date)) sundayMap.set(date, []);
    sundayMap.get(date)!.push(d);
  });

  const sundays = Array.from(sundayMap.entries()).slice(-3);

  const chartData = Array.from({ length: 8 }, (_, i) => {
    const hour = i * 3;
    const point: Record<string, string | number> = { hour: `${hour}:00` };
    sundays.forEach(([date, points], idx) => {
      const match = points.find((p) => p.hour_utc === hour);
      point[`Sun ${idx + 1}`] = match?.stream_count || 0;
    });
    return point;
  });

  const colors = ["#B8960F", "#D4AF37", "#FFD700"];

  return (
    <div className="border border-war-border bg-war-panel p-4">
      <p className="text-[10px] text-war-muted tracking-[0.2em] uppercase mb-4">
        SUNDAY PULSE — 3 WEEK OVERLAY
      </p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
            <XAxis
              dataKey="hour"
              stroke="#666"
              tick={{ fill: "#666", fontSize: 10 }}
              axisLine={{ stroke: "#1A1A1A" }}
            />
            <YAxis
              stroke="#666"
              tick={{ fill: "#666", fontSize: 10 }}
              axisLine={{ stroke: "#1A1A1A" }}
            />
            <Tooltip
              contentStyle={{
                background: "#111",
                border: "1px solid #1A1A1A",
                color: "#E5E5E5",
                fontFamily: "JetBrains Mono",
                fontSize: 12,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 10, color: "#666" }}
            />
            {sundays.map(([, ], idx) => (
              <Bar
                key={idx}
                dataKey={`Sun ${idx + 1}`}
                fill={colors[idx]}
                opacity={0.7 + idx * 0.1}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

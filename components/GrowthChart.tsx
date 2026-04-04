"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface GrowthDataPoint {
  date: string;
  listeners: number;
  streams: number;
}

interface GrowthChartProps {
  data: GrowthDataPoint[];
  title: string;
  dataKey: "listeners" | "streams";
}

export default function GrowthChart({ data, title, dataKey }: GrowthChartProps) {
  return (
    <div className="border border-war-border bg-war-panel p-4">
      <p className="text-[10px] text-war-muted tracking-[0.2em] uppercase mb-4">{title}</p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gold-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
            <XAxis
              dataKey="date"
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
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke="#D4AF37"
              strokeWidth={2}
              fill={`url(#gold-${dataKey})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

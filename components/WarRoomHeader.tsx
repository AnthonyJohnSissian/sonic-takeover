"use client";

import { useEffect, useState } from "react";

export default function WarRoomHeader() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          timeZone: "UTC",
        }) + " UTC"
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
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
        <div className="flex items-center gap-4">
          <span className="font-data text-sm text-war-muted">{time}</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-war-green animate-war-pulse" />
            <span className="font-data text-xs text-war-green">LIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

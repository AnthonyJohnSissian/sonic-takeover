"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import {
  COUNTRY_STREAMS,
  CITY_DOTS,
  getStreamColor,
  TOTAL_COUNTRIES,
  type CityDot,
} from "@/lib/country-streams";
import { supabase } from "@/lib/supabase";

interface LiveEvent {
  id: string;
  city: string;
  track_name: string;
  timestamp: string;
}

export default function WorldMap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [countryCount, setCountryCount] = useState(TOTAL_COUNTRIES);
  const [flashCountry, setFlashCountry] = useState(false);
  const [liveDots, setLiveDots] = useState<CityDot[]>(CITY_DOTS);
  const projectionRef = useRef<d3.GeoProjection | null>(null);

  // --- Draw the map ---
  const drawMap = useCallback(async () => {
    const svg = d3.select(svgRef.current);
    if (!svgRef.current || !containerRef.current) return;

    const { width } = containerRef.current.getBoundingClientRect();
    const height = width * 0.5;

    svg.attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();

    // Projection
    const projection = d3
      .geoNaturalEarth1()
      .scale(width / 5.5)
      .translate([width / 2, height / 2]);

    projectionRef.current = projection;
    const path = d3.geoPath().projection(projection);

    // Load world topology
    const worldData: Topology = await d3.json(
      "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
    ) as Topology;

    const countries = feature(
      worldData,
      worldData.objects.countries as GeometryCollection
    );

    // --- Country name lookup (from world-atlas properties) ---
    // world-atlas 110m uses numeric IDs; we need to map names
    // Using the built-in name property
    const countryNameMap = new Map<string, string>();
    (countries as GeoJSON.FeatureCollection).features.forEach((f) => {
      if (f.properties?.name) {
        countryNameMap.set(f.id as string, f.properties.name);
      }
    });

    // Defs for glow filter
    const defs = svg.append("defs");

    const glowFilter = defs.append("filter").attr("id", "gold-glow");
    glowFilter
      .append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "blur");
    glowFilter
      .append("feMerge")
      .selectAll("feMergeNode")
      .data(["blur", "SourceGraphic"])
      .enter()
      .append("feMergeNode")
      .attr("in", (d) => d);

    // Pulse animation filter
    const pulseFilter = defs.append("filter").attr("id", "pulse-glow");
    pulseFilter
      .append("feGaussianBlur")
      .attr("stdDeviation", "4")
      .attr("result", "blur");
    pulseFilter
      .append("feMerge")
      .selectAll("feMergeNode")
      .data(["blur", "SourceGraphic"])
      .enter()
      .append("feMergeNode")
      .attr("in", (d) => d);

    // Background
    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#000000");

    // Graticule
    const graticule = d3.geoGraticule();
    svg
      .append("path")
      .datum(graticule())
      .attr("d", path as never)
      .attr("fill", "none")
      .attr("stroke", "#111")
      .attr("stroke-width", 0.3);

    // Countries
    const countryGroup = svg.append("g").attr("class", "countries");

    countryGroup
      .selectAll("path")
      .data((countries as GeoJSON.FeatureCollection).features)
      .enter()
      .append("path")
      .attr("d", path as never)
      .attr("fill", (d) => {
        const name = d.properties?.name || "";
        const streams = COUNTRY_STREAMS[name] || 0;
        return getStreamColor(streams);
      })
      .attr("stroke", "#0a0a0a")
      .attr("stroke-width", 0.4)
      .attr("filter", (d) => {
        const name = d.properties?.name || "";
        const streams = COUNTRY_STREAMS[name] || 0;
        return streams >= 20 ? "url(#gold-glow)" : "none";
      })
      .append("title")
      .text((d) => {
        const name = d.properties?.name || "Unknown";
        const streams = COUNTRY_STREAMS[name] || 0;
        return streams > 0 ? `${name}: ${streams} streams` : name;
      });

    // --- Pulsing city dots ---
    const dotGroup = svg.append("g").attr("class", "city-dots");

    liveDots.forEach((city) => {
      const coords = projection([city.lng, city.lat]);
      if (!coords) return;

      // Pulse ring (animated via CSS)
      dotGroup
        .append("circle")
        .attr("cx", coords[0])
        .attr("cy", coords[1])
        .attr("r", 3)
        .attr("fill", "none")
        .attr("stroke", "#D4AF37")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0)
        .attr("class", "pulse-ring");

      // Core dot
      dotGroup
        .append("circle")
        .attr("cx", coords[0])
        .attr("cy", coords[1])
        .attr("r", 2.5)
        .attr("fill", "#D4AF37")
        .attr("filter", "url(#pulse-glow)")
        .attr("class", "city-core");

      // Label
      dotGroup
        .append("text")
        .attr("x", coords[0] + 6)
        .attr("y", coords[1] + 3)
        .attr("fill", "#666")
        .attr("font-size", "8px")
        .attr("font-family", "JetBrains Mono, monospace")
        .text(city.name);
    });
  }, [liveDots]);

  // --- Initialize map ---
  useEffect(() => {
    drawMap();
    const handleResize = () => drawMap();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawMap]);

  // --- Subscribe to Supabase Realtime ---
  useEffect(() => {
    const channel = supabase
      .channel("live-playback")
      .on("broadcast", { event: "playback" }, (payload) => {
        const data = payload.payload;
        if (!data) return;

        const newEvent: LiveEvent = {
          id: crypto.randomUUID(),
          city: data.city || data.country || "Unknown",
          track_name: data.track_name || "Unknown Track",
          timestamp: data.timestamp || new Date().toISOString(),
        };

        setEvents((prev) => [newEvent, ...prev].slice(0, 10));

        // If we have coordinates, add a new dot
        if (data.lat && data.lng) {
          const newDot: CityDot = {
            name: data.city || "Live",
            lat: data.lat,
            lng: data.lng,
          };
          setLiveDots((prev) => [...prev, newDot]);
        }

        // Flash country counter if new country
        if (data.new_country) {
          setCountryCount((prev) => prev + 1);
          setFlashCountry(true);
          setTimeout(() => setFlashCountry(false), 2000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="border border-war-border bg-war-panel">
      {/* Header bar */}
      <div className="p-4 border-b border-war-border flex items-center justify-between">
        <p className="text-[10px] text-war-muted tracking-[0.2em] uppercase">
          GLOBAL SIGNAL COVERAGE
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-war-muted tracking-widest">COUNTRIES:</span>
          <span
            className={`font-data text-sm font-bold transition-all duration-500 ${
              flashCountry ? "text-gold-bright scale-125 glow-gold" : "text-gold"
            }`}
          >
            {countryCount}
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Map */}
        <div ref={containerRef} className="flex-1 p-2 min-h-[300px]">
          <svg
            ref={svgRef}
            className="w-full h-full"
            style={{ minHeight: 300 }}
          />
          {/* Inject pulse animation CSS */}
          <style>{`
            .pulse-ring {
              animation: map-pulse 2s ease-out infinite;
            }
            @keyframes map-pulse {
              0% {
                r: 3;
                opacity: 0.8;
                stroke-width: 1.5;
              }
              100% {
                r: 8;
                opacity: 0;
                stroke-width: 0.5;
              }
            }
            .city-core {
              animation: core-glow 2s ease-in-out infinite;
            }
            @keyframes core-glow {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.6; }
            }
          `}</style>
        </div>

        {/* Live event ticker */}
        <div className="lg:w-64 border-t lg:border-t-0 lg:border-l border-war-border p-4">
          <p className="text-[10px] text-war-muted tracking-[0.2em] uppercase mb-3">
            LIVE FEED
          </p>
          {events.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-war-muted text-xs">Waiting for signals...</p>
              <div className="w-2 h-2 rounded-full bg-gold/30 mx-auto mt-2 animate-war-pulse" />
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((event, i) => (
                <div
                  key={event.id}
                  className="text-xs animate-fade-in"
                  style={{
                    opacity: 1 - i * 0.08,
                    animationDelay: `${i * 50}ms`,
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-gold shrink-0">🌏</span>
                    <div className="min-w-0">
                      <span className="text-gold font-data">{event.city}</span>
                      <span className="text-war-muted"> — </span>
                      <span className="text-war-text truncate block">
                        {event.track_name}
                      </span>
                      <span className="text-war-muted/50 font-data text-[10px]">
                        {new Date(event.timestamp).toLocaleTimeString("en-US", {
                          hour12: false,
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-war-border/50 space-y-1.5">
            <p className="text-[9px] text-war-muted tracking-widest uppercase mb-2">
              INTENSITY
            </p>
            {[
              { label: "20+ streams", color: "#D4AF37" },
              { label: "10 streams", color: "#b89000" },
              { label: "5 streams", color: "#7a6000" },
              { label: "1 stream", color: "#3d3000" },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[10px] text-war-muted font-data">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

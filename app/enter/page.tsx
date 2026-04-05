"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const WORDS = ["ONLY", "LONLY", "LONELY", "LYON", "LOVE"];
const CYCLE_MS = 2200;
const RELEASE_DATE = new Date("2026-03-19");

interface PressQuote {
  outlet: string;
  country: string;
  quote: string;
}

export default function EnterPage() {
  const [wordIndex, setWordIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [streams, setStreams] = useState<number | null>(null);
  const [countries, setCountries] = useState<number | null>(null);
  const [pulse, setPulse] = useState(false);
  const [quotes, setQuotes] = useState<PressQuote[]>([]);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const daysSinceRelease = Math.ceil(
    (Date.now() - RELEASE_DATE.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Word cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % WORDS.length);
        setFade(true);
      }, 400);
    }, CYCLE_MS);
    return () => clearInterval(interval);
  }, []);

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from("spotify_daily")
        .select("total_streams, countries_count")
        .order("snapshot_date", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setStreams(data.total_streams);
        setCountries(data.countries_count);
      }

      const { data: pressData } = await supabase
        .from("press_coverage")
        .select("outlet, country, quote")
        .not("quote", "is", null);

      if (pressData) setQuotes(pressData);
    }
    fetchData();
  }, []);

  // Realtime stream updates
  useEffect(() => {
    const channel = supabase
      .channel("enter_stats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "spotify_daily" },
        (payload) => {
          const newRow = payload.new as Record<string, number>;
          if (newRow?.total_streams) {
            setStreams(newRow.total_streams);
            setCountries(newRow.countries_count);
            setPulse(true);
            setTimeout(() => setPulse(false), 1000);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Quote rotation
  useEffect(() => {
    if (quotes.length < 2) return;
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [quotes]);

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-gold/5 blur-[120px]" />
      </div>

      {/* Album title */}
      <div className="relative z-10 text-center mb-8">
        <h1
          className={`text-6xl md:text-8xl font-black text-gold glow-gold transition-all duration-400 ${
            fade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          {WORDS[wordIndex]}
        </h1>
        <p className="text-war-muted text-xs tracking-[0.4em] uppercase mt-4">
          YOU THEE ME
        </p>
      </div>

      {/* Word dots */}
      <div className="relative z-10 flex gap-3 mb-10">
        {WORDS.map((word, i) => (
          <div
            key={word}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === wordIndex
                ? "bg-gold scale-125"
                : i < wordIndex
                ? "bg-gold/40"
                : "bg-war-border"
            }`}
          />
        ))}
      </div>

      {/* Tagline */}
      <p className="relative z-10 text-war-text text-center text-sm md:text-base max-w-lg leading-relaxed mb-10">
        {countries || 35} countries. {daysSinceRelease} days. No label. No machine. Just the music.
      </p>

      {/* Live stream counter */}
      <div className="relative z-10 mb-10 text-center">
        <p className="text-[10px] text-war-muted tracking-[0.3em] uppercase mb-2">
          TOTAL STREAMS
        </p>
        <p
          className={`text-5xl md:text-7xl font-data font-bold text-gold glow-gold transition-transform duration-300 ${
            pulse ? "scale-110" : "scale-100"
          }`}
        >
          {streams !== null ? streams.toLocaleString() : "—"}
        </p>
      </div>

      {/* CTAs */}
      <div className="relative z-10 flex flex-col sm:flex-row gap-4 mb-12">
        <a
          href="https://open.spotify.com/artist/63keA8pKANFifi2ioQsCXN"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-gold bg-gold/10 px-8 py-4 hover:bg-gold/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gold" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            <span className="text-gold font-bold tracking-[0.15em] uppercase text-sm">
              Listen on Spotify
            </span>
          </div>
        </a>
        <a
          href="/api/auth/login"
          className="border border-war-border bg-war-panel px-8 py-4 hover:border-gold/30 transition-colors"
        >
          <span className="text-war-text font-bold tracking-[0.15em] uppercase text-sm">
            Enter as Listener
          </span>
        </a>
      </div>

      {/* Press quote carousel */}
      {quotes.length > 0 && (
        <div className="relative z-10 max-w-md text-center mb-8 h-20">
          <p className="text-war-text/80 italic text-sm leading-relaxed">
            &ldquo;{quotes[quoteIndex]?.quote}&rdquo;
          </p>
          <p className="text-war-muted text-xs mt-2">
            — {quotes[quoteIndex]?.outlet}, {quotes[quoteIndex]?.country}
          </p>
        </div>
      )}

      {/* Footer */}
      <p className="relative z-10 text-war-muted/30 text-xs tracking-[0.2em] uppercase">
        youtheeme.com
      </p>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";

const WORDS = ["ONLY", "LONLY", "LONELY", "LYON", "LOVE"];
const CYCLE_MS = 2200;

export default function EnterPage() {
  const [wordIndex, setWordIndex] = useState(0);
  const [fade, setFade] = useState(true);

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

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Subtle radial glow behind artwork */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-gold/5 blur-[120px]" />
      </div>

      {/* Album artwork placeholder */}
      <div className="relative z-10 mb-12">
        <div className="w-72 h-72 md:w-80 md:h-80 border border-war-border bg-war-panel flex items-center justify-center relative overflow-hidden">
          {/* Album art gradient placeholder */}
          <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-black to-gold/5" />
          <div className="relative text-center">
            <p className="text-war-muted text-xs tracking-[0.3em] uppercase mb-2">YOU THEE ME</p>
            <h2
              className={`text-5xl md:text-6xl font-black text-gold glow-gold transition-all duration-400 ${
                fade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              }`}
            >
              {WORDS[wordIndex]}
            </h2>
          </div>
        </div>
        {/* Shadow beneath */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-64 h-4 bg-gold/10 blur-xl rounded-full" />
      </div>

      {/* Word progression dots */}
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
            title={word}
          />
        ))}
      </div>

      {/* Connect button */}
      <a
        href="/api/auth/login"
        className="relative z-10 group"
      >
        <div className="border border-gold bg-gold/5 px-10 py-4 hover:bg-gold/15 transition-all duration-300 group-hover:border-gold-bright">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-gold"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            <span className="text-gold font-bold tracking-[0.15em] uppercase text-sm">
              Connect with Spotify
            </span>
          </div>
        </div>
      </a>

      {/* Bottom text */}
      <p className="relative z-10 mt-8 text-war-muted/40 text-xs tracking-[0.2em] uppercase">
        Sonic Takeover of Earth
      </p>
    </main>
  );
}

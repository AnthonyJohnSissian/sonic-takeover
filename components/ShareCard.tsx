"use client";

import { useRef, useCallback, useState } from "react";
import type { LoopIdentity } from "@/lib/loop-identity";

interface ShareCardProps {
  identity: LoopIdentity;
}

const CARD_WIDTH = 600;
const CARD_HEIGHT = 800;

export default function ShareCard({ identity }: ShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generating, setGenerating] = useState(false);

  const generateCard = useCallback(async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;

    // --- Background ---
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    // --- Subtle gold border ---
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, CARD_WIDTH - 40, CARD_HEIGHT - 40);

    // Corner accents
    const cornerSize = 30;
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 3;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(20, 20 + cornerSize);
    ctx.lineTo(20, 20);
    ctx.lineTo(20 + cornerSize, 20);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(CARD_WIDTH - 20 - cornerSize, 20);
    ctx.lineTo(CARD_WIDTH - 20, 20);
    ctx.lineTo(CARD_WIDTH - 20, 20 + cornerSize);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(20, CARD_HEIGHT - 20 - cornerSize);
    ctx.lineTo(20, CARD_HEIGHT - 20);
    ctx.lineTo(20 + cornerSize, CARD_HEIGHT - 20);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(CARD_WIDTH - 20 - cornerSize, CARD_HEIGHT - 20);
    ctx.lineTo(CARD_WIDTH - 20, CARD_HEIGHT - 20);
    ctx.lineTo(CARD_WIDTH - 20, CARD_HEIGHT - 20 - cornerSize);
    ctx.stroke();

    // --- Album artwork placeholder (gold gradient square) ---
    const artSize = 200;
    const artX = (CARD_WIDTH - artSize) / 2;
    const artY = 80;
    const gradient = ctx.createLinearGradient(artX, artY, artX + artSize, artY + artSize);
    gradient.addColorStop(0, "#1A1A1A");
    gradient.addColorStop(0.5, "#D4AF37");
    gradient.addColorStop(1, "#1A1A1A");
    ctx.fillStyle = gradient;
    ctx.fillRect(artX, artY, artSize, artSize);

    // Art border
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.strokeRect(artX, artY, artSize, artSize);

    // --- "I am" text ---
    ctx.fillStyle = "#666666";
    ctx.font = '300 18px "Inter", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("I am", CARD_WIDTH / 2, artY + artSize + 70);

    // --- Identity text (large gold) ---
    ctx.fillStyle = "#D4AF37";
    ctx.font = 'bold 72px "JetBrains Mono", monospace';
    ctx.textAlign = "center";

    // Gold glow effect
    ctx.shadowColor = "#D4AF37";
    ctx.shadowBlur = 20;
    ctx.fillText(identity, CARD_WIDTH / 2, artY + artSize + 140);
    ctx.shadowBlur = 0;

    // --- Divider line ---
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, artY + artSize + 180);
    ctx.lineTo(400, artY + artSize + 180);
    ctx.stroke();

    // --- "YOU THEE ME" ---
    ctx.fillStyle = "#FFFFFF";
    ctx.font = 'bold 28px "Inter", sans-serif';
    ctx.letterSpacing = "4px";
    ctx.fillText("YOU THEE ME", CARD_WIDTH / 2, artY + artSize + 230);

    // --- Sonic Takeover subtext ---
    ctx.fillStyle = "#444444";
    ctx.font = '300 14px "Inter", sans-serif';
    ctx.fillText("SONIC TAKEOVER OF EARTH", CARD_WIDTH / 2, artY + artSize + 270);

    // --- "youtheme.com" ---
    ctx.fillStyle = "#666666";
    ctx.font = '400 16px "Inter", sans-serif';
    ctx.fillText("youtheme.com", CARD_WIDTH / 2, CARD_HEIGHT - 50);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }, [identity]);

  const handleDownload = useCallback(async () => {
    setGenerating(true);
    try {
      const blob = await generateCard();
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sonic-takeover-${identity.toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  }, [generateCard, identity]);

  const handleShare = useCallback(async () => {
    setGenerating(true);
    try {
      const blob = await generateCard();
      if (!blob) return;

      if (navigator.share && navigator.canShare) {
        const file = new File([blob], `sonic-takeover-${identity.toLowerCase()}.png`, {
          type: "image/png",
        });

        const shareData = {
          title: `I am ${identity}`,
          text: `I am ${identity} — YOU THEE ME · Sonic Takeover of Earth`,
          files: [file],
        };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }

      // Fallback: download
      handleDownload();
    } finally {
      setGenerating(false);
    }
  }, [generateCard, identity, handleDownload]);

  const supportsShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className="border border-war-border bg-war-panel p-6">
      <p className="text-[10px] text-war-muted tracking-[0.2em] uppercase mb-4">SHARE YOUR IDENTITY</p>

      {/* Hidden canvas for generation */}
      <canvas
        ref={canvasRef}
        className="hidden"
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
      />

      {/* Preview */}
      <div className="bg-black border border-war-border p-6 mb-4 text-center">
        <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-war-panel via-gold/20 to-war-panel border border-war-border" />
        <p className="text-war-muted text-sm mb-1">I am</p>
        <p className="text-4xl font-data font-bold text-gold glow-gold mb-2">{identity}</p>
        <p className="text-white font-bold tracking-wide">YOU THEE ME</p>
        <p className="text-war-muted text-xs mt-2">youtheme.com</p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          disabled={generating}
          className="flex-1 bg-war-dark border border-war-border py-3 text-sm font-data text-war-text hover:border-gold/30 transition-colors disabled:opacity-50"
        >
          {generating ? "GENERATING..." : "↓ DOWNLOAD PNG"}
        </button>
        {supportsShare && (
          <button
            onClick={handleShare}
            disabled={generating}
            className="flex-1 bg-gold/10 border border-gold py-3 text-sm font-data text-gold hover:bg-gold/20 transition-colors disabled:opacity-50"
          >
            {generating ? "GENERATING..." : "⬆ SHARE"}
          </button>
        )}
      </div>
    </div>
  );
}

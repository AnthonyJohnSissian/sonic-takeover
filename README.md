# 🎖️ SONIC TAKEOVER OF EARTH

Real-time Spotify analytics war room for **Anthony John Sissian / YOU THEE ME**.

🌐 [youtheeme.com](https://youtheeme.com)

## Stack

- **Next.js 15** — App Router, TypeScript
- **Tailwind CSS v4** — Dark war room theme (#000 + gold #D4AF37)
- **Supabase** — Postgres, Realtime broadcast
- **Recharts + D3** — Charts, world map choropleth
- **Spotify Web API** — OAuth, playback tracking

## Pages

| Route | Description |
|-------|-------------|
| `/enter` | Album entry — ONLY→LONLY→LONELY→LYON→LOVE word cycle, Spotify connect |
| `/sovereignty` | Password-protected war room: metrics, charts, D3 world map, live feed |
| `/listener` | Personal listener page with Loop Identity reveal + share card |
| `/war-room` | Main dashboard with now-playing tracker |

## Loop Identity Algorithm

Each listener is assigned an identity based on their listening patterns:

| Identity | Condition |
|----------|-----------|
| **LOVE** | 15+ streams in 28 days (super listener) |
| **LYON** | >50% streams from King suite (tracks 06-10) |
| **LONELY** | >60% late-night streams (22:00-04:00) + >0.7 completion rate |
| **LONY** | >0.4 skip rate + returned 3+ separate days |
| **ONLY** | Track 01 most played (default entry identity) |

## API Routes

| Endpoint | Purpose |
|----------|---------|
| `/api/auth/login` | Spotify OAuth initiation |
| `/api/auth/callback` | OAuth token exchange |
| `/api/auth/admin` | War room password auth |
| `/api/poll` | Playback polling with 429 backoff, event recording |
| `/api/listener` | Listener profile + identity calculation |
| `/api/data/growth` | Growth snapshots from Supabase |
| `/api/data/tracks` | Track stats from Supabase |
| `/api/data/sunday-pulse` | Sunday listening patterns |
| `/api/spotify/artist` | Artist data proxy |
| `/api/spotify/now-playing` | Currently playing proxy |
| `/api/spotify/recent` | Recently played proxy |

## Setup

```bash
npm install
cp .env.local.example .env.local  # Add your credentials
npm run dev
```

## Database

Run `supabase/migrations/001_initial_schema.sql` against your Supabase project.

Tables: `listeners`, `playback_events`, `sessions`, `track_stats`, `sunday_pulse`, `growth_snapshots`, `campaigns`

## Design

- **Black** `#000000` — war room darkness
- **Gold** `#D4AF37` — accent, data, emphasis
- **Inter** — UI text
- **JetBrains Mono** — numbers, data, code
- This is a war room, not a dashboard.

---

*Sonic Takeover of Earth — youtheeme.com*

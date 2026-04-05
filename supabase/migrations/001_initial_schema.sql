-- SONIC TAKEOVER OF EARTH — Complete Database Schema (11 Tables)
-- Project: plhweaqabftqninxeljh.supabase.co

-- 1. Track stats
CREATE TABLE IF NOT EXISTS track_stats (
    id uuid primary key default gen_random_uuid(),
    track_id text unique not null,
    track_name text,
    spotify_id text,
    total_streams integer default 0,
    unique_listeners integer default 0,
    total_saves integer default 0,
    completion_rate numeric default 0,
    skip_rate numeric default 0,
    repeat_rate numeric default 0,
    avg_listen_depth numeric default 0,
    save_rate numeric default 0,
    updated_at timestamptz default now()
);

-- 2. Growth snapshots (daily Spotify stats)
CREATE TABLE IF NOT EXISTS spotify_daily (
    id uuid primary key default gen_random_uuid(),
    snapshot_date date unique default current_date,
    monthly_listeners integer,
    total_streams integer,
    followers integer,
    countries_count integer,
    super_listeners integer,
    active_listeners integer,
    saves integer,
    playlist_adds integer,
    streams_today integer,
    source text default 'manual'
);

-- 3. Per-track daily stats
CREATE TABLE IF NOT EXISTS track_daily (
    id uuid primary key default gen_random_uuid(),
    snapshot_date date default current_date,
    track_id text,
    track_name text,
    streams integer,
    listeners integer,
    saves integer,
    canvas_views integer,
    UNIQUE(snapshot_date, track_id)
);

-- 4. Playlist placements
CREATE TABLE IF NOT EXISTS playlist_placements (
    id uuid primary key default gen_random_uuid(),
    playlist_name text,
    playlist_id text,
    owner text,
    country text,
    followers integer,
    is_editorial boolean default false,
    is_botted boolean default false,
    track_name text,
    track_id text,
    track_position integer,
    added_at date,
    removed_at date,
    platform text default 'SPOTIFY',
    recorded_at timestamptz default now()
);

-- 5. Geographic data
CREATE TABLE IF NOT EXISTS geographic_data (
    id uuid primary key default gen_random_uuid(),
    snapshot_date date default current_date,
    country text,
    city text,
    stream_count integer,
    listener_count integer,
    track_id text
);

-- 6. Press coverage
CREATE TABLE IF NOT EXISTS press_coverage (
    id uuid primary key default gen_random_uuid(),
    outlet text,
    country text,
    outlet_type text,
    track text,
    coverage_type text,
    url text,
    quote text,
    published_at date,
    recorded_at timestamptz default now(),
    reach_estimate integer
);

-- 7. Campaign submissions (SubmitHub/Groover)
CREATE TABLE IF NOT EXISTS campaign_submissions (
    id uuid primary key default gen_random_uuid(),
    platform text,
    track text,
    outlet text,
    outlet_country text,
    outlet_type text,
    action text,
    listen_time_seconds integer,
    feedback text,
    email text,
    campaign_date date,
    response_date date,
    sharing_links text
);

-- 8. Outreach log
CREATE TABLE IF NOT EXISTS outreach_log (
    id uuid primary key default gen_random_uuid(),
    contact text,
    email text,
    platform text,
    subject text,
    sent_at timestamptz default now(),
    response_received boolean default false,
    response_at timestamptz,
    outcome text,
    notes text
);

-- 9. Listeners
CREATE TABLE IF NOT EXISTS listeners (
    id uuid primary key default gen_random_uuid(),
    spotify_id_hash text unique not null,
    country text,
    account_type text,
    joined_at timestamptz default now(),
    loop_identity text,
    total_streams integer default 0,
    is_super_listener boolean default false,
    last_seen timestamptz
);

-- 10. Playback events
CREATE TABLE IF NOT EXISTS playback_events (
    id uuid primary key default gen_random_uuid(),
    listener_id uuid references listeners(id),
    track_id text not null,
    track_name text,
    position_ms integer,
    duration_ms integer,
    is_playing boolean,
    device_type text,
    completed boolean default false,
    skipped boolean default false,
    repeated boolean default false,
    timestamp timestamptz default now(),
    day_of_week integer,
    hour_of_day integer
);

-- 11. Sunday pulse
CREATE TABLE IF NOT EXISTS sunday_pulse (
    id uuid primary key default gen_random_uuid(),
    recorded_at timestamptz default now(),
    day_of_week integer,
    hour_utc integer,
    stream_count integer default 0,
    listener_count integer default 0,
    country text
);

-- Enable RLS on all tables
ALTER TABLE listeners ENABLE ROW LEVEL SECURITY;
ALTER TABLE playback_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE spotify_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE press_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE sunday_pulse ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE geographic_data ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read" ON track_stats FOR SELECT USING (true);
CREATE POLICY "Public read" ON spotify_daily FOR SELECT USING (true);
CREATE POLICY "Public read" ON playlist_placements FOR SELECT USING (true);
CREATE POLICY "Public read" ON press_coverage FOR SELECT USING (true);
CREATE POLICY "Public read" ON sunday_pulse FOR SELECT USING (true);
CREATE POLICY "Public read" ON track_daily FOR SELECT USING (true);
CREATE POLICY "Public read" ON geographic_data FOR SELECT USING (true);
CREATE POLICY "Public read" ON campaign_submissions FOR SELECT USING (true);

-- Service write policies
CREATE POLICY "Service write" ON spotify_daily FOR INSERT WITH CHECK (true);
CREATE POLICY "Service write" ON track_daily FOR INSERT WITH CHECK (true);
CREATE POLICY "Service write" ON playlist_placements FOR INSERT WITH CHECK (true);
CREATE POLICY "Service write" ON press_coverage FOR INSERT WITH CHECK (true);
CREATE POLICY "Service write" ON geographic_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Service write" ON sunday_pulse FOR INSERT WITH CHECK (true);
CREATE POLICY "Service write" ON track_stats FOR ALL USING (true);

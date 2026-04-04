-- SONIC TAKEOVER OF EARTH - Database Schema
-- Run this against your Supabase project

CREATE TABLE listeners (
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

CREATE TABLE playback_events (
  id uuid primary key default gen_random_uuid(),
  listener_id uuid references listeners(id),
  track_id text not null,
  track_name text,
  position_ms integer,
  duration_ms integer,
  is_playing boolean,
  device_type text,
  device_name text,
  completed boolean default false,
  skipped boolean default false,
  repeated boolean default false,
  timestamp timestamptz default now(),
  day_of_week integer,
  hour_of_day integer,
  listener_timezone text
);

CREATE TABLE sessions (
  id uuid primary key default gen_random_uuid(),
  listener_id uuid references listeners(id),
  started_at timestamptz default now(),
  ended_at timestamptz,
  tracks_played integer default 0,
  completed_album boolean default false,
  entry_track text,
  exit_track text
);

CREATE TABLE track_stats (
  id uuid primary key default gen_random_uuid(),
  track_id text unique not null,
  track_name text,
  total_streams integer default 0,
  unique_listeners integer default 0,
  total_saves integer default 0,
  completion_rate numeric default 0,
  skip_rate numeric default 0,
  repeat_rate numeric default 0,
  save_rate numeric default 0,
  updated_at timestamptz default now()
);

CREATE TABLE sunday_pulse (
  id uuid primary key default gen_random_uuid(),
  recorded_at timestamptz default now(),
  day_of_week integer,
  hour_utc integer,
  stream_count integer default 0,
  listener_count integer default 0,
  country text
);

CREATE TABLE growth_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date default current_date,
  monthly_listeners integer,
  total_streams integer,
  followers integer,
  countries_count integer,
  super_listeners integer
);

-- campaigns table (placeholder - send full definition for completion)
CREATE TABLE campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for performance
CREATE INDEX idx_playback_events_listener ON playback_events(listener_id);
CREATE INDEX idx_playback_events_track ON playback_events(track_id);
CREATE INDEX idx_playback_events_timestamp ON playback_events(timestamp);
CREATE INDEX idx_sessions_listener ON sessions(listener_id);
CREATE INDEX idx_sunday_pulse_recorded ON sunday_pulse(recorded_at);
CREATE INDEX idx_growth_snapshots_date ON growth_snapshots(snapshot_date);
CREATE INDEX idx_listeners_super ON listeners(is_super_listener) WHERE is_super_listener = true;

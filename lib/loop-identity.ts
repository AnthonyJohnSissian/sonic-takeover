/**
 * LOOP IDENTITY ALGORITHM
 *
 * Each listener is assigned an identity based on their listening patterns.
 * Priority order (highest to lowest):
 *   LOVE → LYON → LONELY → LONY → ONLY
 */

export type LoopIdentity = "LOVE" | "LYON" | "LONELY" | "LONY" | "ONLY";

export interface PlaybackEvent {
  id: string;
  track_id: string;
  track_name: string;
  position_ms: number;
  duration_ms: number;
  completed: boolean;
  skipped: boolean;
  timestamp: string;
  hour_of_day: number;
  day_of_week: number;
}

export interface LoopIdentityResult {
  identity: LoopIdentity;
  confidence: number; // 0-1 how strongly they match
  breakdown: {
    totalStreams28d: number;
    kingSuitePercentage: number;
    lateNightPercentage: number;
    lateNightCompletionRate: number;
    skipRate: number;
    distinctDays: number;
    topTrackId: string | null;
    topTrackName: string | null;
    qualifies: Record<LoopIdentity, boolean>;
  };
}

// King suite = tracks 06-10 (track IDs for the second half of the album)
const KING_SUITE_TRACK_IDS = new Set([
  "track_06",
  "track_07",
  "track_08",
  "track_09",
  "track_10",
]);

// Track 01 ID for ONLY identity
const TRACK_01_ID = "track_01";

// Late night hours: 22:00-03:59 (22, 23, 0, 1, 2, 3)
const LATE_NIGHT_HOURS = new Set([22, 23, 0, 1, 2, 3]);

export function calculateLoopIdentity(events: PlaybackEvent[]): LoopIdentityResult {
  if (!events.length) {
    return {
      identity: "ONLY",
      confidence: 0,
      breakdown: {
        totalStreams28d: 0,
        kingSuitePercentage: 0,
        lateNightPercentage: 0,
        lateNightCompletionRate: 0,
        skipRate: 0,
        distinctDays: 0,
        topTrackId: null,
        topTrackName: null,
        qualifies: { LOVE: false, LYON: false, LONELY: false, LONY: false, ONLY: true },
      },
    };
  }

  // --- Filter to last 28 days ---
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 28);
  const recent = events.filter((e) => new Date(e.timestamp) >= cutoff);
  const totalStreams28d = recent.length;

  // --- Track frequency map ---
  const trackCounts = new Map<string, { count: number; name: string }>();
  for (const e of recent) {
    const existing = trackCounts.get(e.track_id);
    if (existing) {
      existing.count++;
    } else {
      trackCounts.set(e.track_id, { count: 1, name: e.track_name });
    }
  }

  // Top track
  let topTrackId: string | null = null;
  let topTrackName: string | null = null;
  let topTrackCount = 0;
  for (const [id, { count, name }] of trackCounts) {
    if (count > topTrackCount) {
      topTrackId = id;
      topTrackName = name;
      topTrackCount = count;
    }
  }

  // --- King suite percentage (tracks 06-10) ---
  const kingSuiteStreams = recent.filter((e) => KING_SUITE_TRACK_IDS.has(e.track_id)).length;
  const kingSuitePercentage = totalStreams28d > 0 ? kingSuiteStreams / totalStreams28d : 0;

  // --- Late night percentage & completion rate ---
  const lateNightEvents = recent.filter((e) => LATE_NIGHT_HOURS.has(e.hour_of_day));
  const lateNightPercentage = totalStreams28d > 0 ? lateNightEvents.length / totalStreams28d : 0;
  const lateNightCompleted = lateNightEvents.filter((e) => e.completed).length;
  const lateNightCompletionRate =
    lateNightEvents.length > 0 ? lateNightCompleted / lateNightEvents.length : 0;

  // --- Skip rate ---
  const skippedCount = recent.filter((e) => e.skipped).length;
  const skipRate = totalStreams28d > 0 ? skippedCount / totalStreams28d : 0;

  // --- Distinct days listened ---
  const distinctDays = new Set(
    recent.map((e) => new Date(e.timestamp).toISOString().split("T")[0])
  ).size;

  // --- Qualification checks (in priority order) ---
  const qualifiesLOVE = totalStreams28d >= 15;
  const qualifiesLYON = kingSuitePercentage > 0.5;
  const qualifiesLONELY = lateNightPercentage > 0.6 && lateNightCompletionRate > 0.7;
  const qualifiesLONY = skipRate > 0.4 && distinctDays >= 3;
  const qualifiesONLY = topTrackId === TRACK_01_ID || true; // Default fallback

  const qualifies: Record<LoopIdentity, boolean> = {
    LOVE: qualifiesLOVE,
    LYON: qualifiesLYON,
    LONELY: qualifiesLONELY,
    LONY: qualifiesLONY,
    ONLY: qualifiesONLY,
  };

  // --- Determine identity (highest priority match) ---
  let identity: LoopIdentity = "ONLY";
  let confidence = 0.3; // Base confidence for ONLY

  if (qualifiesLOVE) {
    identity = "LOVE";
    confidence = Math.min(totalStreams28d / 30, 1); // Scales up to 30 streams
  } else if (qualifiesLYON) {
    identity = "LYON";
    confidence = kingSuitePercentage;
  } else if (qualifiesLONELY) {
    identity = "LONELY";
    confidence = (lateNightPercentage + lateNightCompletionRate) / 2;
  } else if (qualifiesLONY) {
    identity = "LONY";
    confidence = Math.min(distinctDays / 7, 1) * 0.5 + (1 - skipRate) * 0.5;
  } else if (topTrackId === TRACK_01_ID) {
    confidence = topTrackCount / (totalStreams28d || 1);
  }

  return {
    identity,
    confidence,
    breakdown: {
      totalStreams28d,
      kingSuitePercentage,
      lateNightPercentage,
      lateNightCompletionRate,
      skipRate,
      distinctDays,
      topTrackId,
      topTrackName,
      qualifies,
    },
  };
}

// --- Identity display messages ---
export const IDENTITY_MESSAGES: Record<LoopIdentity, string> = {
  ONLY: "You found the beginning. The loop starts here.",
  LONY: "You move between states. That is the transmission working.",
  LONELY: "You listen in the dark. The album knows.",
  LYON: "You stayed for the King. The arc completes itself.",
  LOVE: "You are the signal. You have been here from the start.",
};

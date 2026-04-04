"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface PollResponse {
  playing: boolean;
  track: string | null;
  position: number;
  completed: boolean;
  error?: string;
}

interface UsePollOptions {
  intervalMs?: number;    // Base polling interval (default 5000)
  enabled?: boolean;      // Kill switch
}

export function usePoll(options: UsePollOptions = {}) {
  const { intervalMs = 5000, enabled = true } = options;

  const [data, setData] = useState<PollResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef(1000); // 1s starting backoff
  const MAX_BACKOFF = 16000;
  const mountedRef = useRef(true);

  const poll = useCallback(async () => {
    if (!mountedRef.current) return;

    setIsPolling(true);
    try {
      const res = await fetch("/api/poll");

      if (res.status === 429) {
        // Server-side 429: apply exponential backoff
        backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF);
        scheduleNext(backoffRef.current);
        return;
      }

      if (res.status === 401) {
        setData({ playing: false, track: null, position: 0, completed: false, error: "auth" });
        return; // Stop polling on auth failure
      }

      // Success: reset backoff
      backoffRef.current = 1000;

      if (res.ok) {
        const json: PollResponse = await res.json();
        if (mountedRef.current) setData(json);
      }

      scheduleNext(intervalMs);
    } catch {
      // Network error: backoff
      backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF);
      scheduleNext(backoffRef.current);
    } finally {
      if (mountedRef.current) setIsPolling(false);
    }
  }, [intervalMs]);

  const scheduleNext = useCallback((delay: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(poll, delay);
  }, [poll]);

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // --- Page Visibility API: pause on hidden, resume on visible ---
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
        setIsPaused(true);
      } else {
        setIsPaused(false);
        // Resume immediately with a fresh poll
        poll();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [poll, stopPolling]);

  // --- Start/stop polling based on enabled flag ---
  useEffect(() => {
    mountedRef.current = true;

    if (enabled && !document.hidden) {
      poll();
    }

    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [enabled, poll, stopPolling]);

  return { data, isPolling, isPaused };
}

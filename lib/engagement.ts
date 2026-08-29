export const MIN_ENGAGEMENT_MS = 5_000;
export const ROUND_ENGAGEMENT_MS = 5_000;
export const MAX_ENGAGEMENT_MS = 30 * 60 * 1_000;

export function normalizeEngagedSeconds(durationMs: number): number | null {
  if (!Number.isFinite(durationMs) || durationMs < MIN_ENGAGEMENT_MS) {
    return null;
  }

  const cappedDuration = Math.min(durationMs, MAX_ENGAGEMENT_MS);
  const roundedDuration = Math.round(cappedDuration / ROUND_ENGAGEMENT_MS) * ROUND_ENGAGEMENT_MS;
  return roundedDuration / 1_000;
}

export class EngagementAccumulator {
  private activeSince: number | null = null;
  private accumulatedMs = 0;

  setActive(active: boolean, now: number): void {
    if (active && this.activeSince === null) {
      this.activeSince = now;
      return;
    }

    if (!active && this.activeSince !== null) {
      this.accumulatedMs += Math.max(0, now - this.activeSince);
      this.activeSince = null;
    }
  }

  flush(now: number): number | null {
    this.setActive(false, now);
    const engagedSeconds = normalizeEngagedSeconds(this.accumulatedMs);
    this.accumulatedMs = 0;
    return engagedSeconds;
  }

  isActive(): boolean {
    return this.activeSince !== null;
  }
}

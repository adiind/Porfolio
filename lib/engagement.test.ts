import { describe, expect, it } from 'vitest';
import {
  EngagementAccumulator,
  MAX_ENGAGEMENT_MS,
  normalizeEngagedSeconds,
} from './engagement';

describe('normalizeEngagedSeconds', () => {
  it('discards intervals shorter than five seconds', () => {
    expect(normalizeEngagedSeconds(4_999)).toBeNull();
  });

  it('rounds eligible intervals to the nearest five seconds', () => {
    expect(normalizeEngagedSeconds(5_000)).toBe(5);
    expect(normalizeEngagedSeconds(7_400)).toBe(5);
    expect(normalizeEngagedSeconds(7_600)).toBe(10);
  });

  it('caps an interval at thirty minutes', () => {
    expect(normalizeEngagedSeconds(MAX_ENGAGEMENT_MS + 900_000)).toBe(1_800);
  });
});

describe('EngagementAccumulator', () => {
  it('accumulates active time and flushes once', () => {
    const timer = new EngagementAccumulator();
    timer.setActive(true, 0);
    timer.setActive(false, 12_400);

    expect(timer.flush(12_400)).toBe(10);
    expect(timer.flush(12_400)).toBeNull();
  });

  it('excludes time spent paused', () => {
    const timer = new EngagementAccumulator();
    timer.setActive(true, 0);
    timer.setActive(false, 6_000);
    timer.setActive(true, 20_000);

    expect(timer.flush(26_000)).toBe(10);
  });

  it('closes an active interval when flushed', () => {
    const timer = new EngagementAccumulator();
    timer.setActive(true, 2_000);

    expect(timer.flush(14_400)).toBe(10);
    expect(timer.isActive()).toBe(false);
  });

  it('starts a fresh interval after a completed flush', () => {
    const timer = new EngagementAccumulator();
    timer.setActive(true, 0);
    expect(timer.flush(5_000)).toBe(5);

    timer.setActive(true, 10_000);
    expect(timer.flush(15_000)).toBe(5);
  });
});

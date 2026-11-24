import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ACCEPTED, AFTER_AT, CANCELLED, DELIVERED, DRIVER_STOPPED, JOURNEY_END, journeyAt, journeySteps, myPart, OFFERS, PICKUP, REROUTED, REWARD_SETTLED_AT } from './rescueJourney';

describe('Food Rescue journey', () => {
  it('numbers seven events, holds each long enough to read, and is not slow', () => {
    expect(journeySteps.map(s => s.n)).toEqual(['01', '02', '03', '04', '05', '06', '07']);
    for (const [index, step] of journeySteps.entries()) {
      expect(journeyAt(step.at)).toBe(index);
      if (index > 0) expect(step.at - journeySteps[index - 1].at).toBeGreaterThanOrEqual(2);
      // a board line is at most two printed lines of about 49 characters
      expect(step.line.length).toBeLessThanOrEqual(98);
      if (step.why) expect(step.why.length).toBeLessThanOrEqual(98);
    }
  });

  it('keeps the order of the film', () => {
    const events = [PICKUP, CANCELLED, DRIVER_STOPPED, OFFERS, ACCEPTED, REROUTED, DELIVERED, REWARD_SETTLED_AT, AFTER_AT, JOURNEY_END];
    expect(events.every((time, index) => index === 0 || time > events[index - 1])).toBe(true);
    expect(journeySteps[journeyAt(DRIVER_STOPPED)].title).toBe('Customer cancels');
    expect(journeySteps[journeyAt(OFFERS)].title).toBe('Offer goes out nearby');
  });

  it('holds the delivered state', () => expect(journeyAt(100)).toBe(journeySteps.length - 1));

  it('finishes in under 18 seconds (Adi: "dont make it too slow")', () => expect(JOURNEY_END).toBeLessThan(18));

});

describe('the "My part" sheets', () => {
  // No browser here: each canvas is a stand-in whose 2D context remembers the words drawn on it.
  const printed: string[] = [];
  const canvas = () => {
    const state: Record<string | symbol, unknown> = {};
    const g = new Proxy(state, {
      get: (target, key) => {
        if (key in target) return target[key];
        if (key === 'fillText') return (text: string) => { printed.push(text); };
        if (key === 'measureText') return (text: string) => ({ width: text.length * 20 });
        if (key === 'createRadialGradient' || key === 'createLinearGradient') return () => ({ addColorStop: () => undefined });
        return () => undefined;
      },
      set: (target, key, value) => { target[key] = value; return true; },
    });
    return { width: 0, height: 0, getContext: () => g };
  };
  /** Everything the phone board (once the journey is over) and the wide "My part" sheet print. */
  const draw = async () => {
    const { createPartSheet, createRescueBoard } = await import('./rescueBoard');
    printed.length = 0;
    createRescueBoard('narrow', { offer: null }).draw({ step: journeySteps.length - 1, sinceStep: 5, done: true, sinceDone: 5 });
    const phone = [...printed];
    printed.length = 0;
    createPartSheet().draw({ step: 0, sinceStep: 0, done: true, sinceDone: 5 });
    return { phone, wide: [...printed] };
  };

  beforeEach(() => { vi.stubGlobal('document', { createElement: canvas }); vi.resetModules(); });
  afterEach(() => { vi.unstubAllGlobals(); vi.doUnmock('./rescueJourney'); });

  it('prints "My part" without a draft mark: Adi confirmed it on 2026-11-17', async () => {
    const { phone, wide } = await draw();
    for (const sheet of [phone, wide]) {
      expect(sheet).toContain(myPart.title);
      expect(sheet).not.toContain('Draft');
    }
  });

  it('prints a draft mark on both sheets while "My part" is unconfirmed', async () => {
    vi.doMock('./rescueJourney', async (original) => {
      const actual = await original<typeof import('./rescueJourney')>();
      return { ...actual, myPart: { ...actual.myPart, confirmed: false } };
    });
    const { phone, wide } = await draw();
    for (const sheet of [phone, wide]) expect(sheet).toContain('Draft');
  });
});

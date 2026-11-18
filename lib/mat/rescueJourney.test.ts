import { describe, expect, it } from 'vitest';
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

  it('prints "My part" without a draft mark: Adi confirmed it on 2026-11-17', () => expect(myPart.confirmed).toBe(true));
});

import { describe, expect, it } from 'vitest';
import { EXPERIENCE_STORIES, experienceIdFromHash } from './experienceStories';

describe('work experience stories', () => {
  it('opens each work role with its own sourced cards', () => {
    expect(Object.keys(EXPERIENCE_STORIES)).toEqual(['self', 'zomato', 'udaan', 'schmooze', 'snapdeal']);
    expect(EXPERIENCE_STORIES.udaan.cards.map(card => card.id)).toEqual(['supply', 'scale', 'wondermart', 'percept']);
    expect(EXPERIENCE_STORIES.schmooze.cards[0].title).toBe('Second analyst');
    expect(experienceIdFromHash('#experience-udaan')).toBe('udaan');
    expect(experienceIdFromHash('#experience-unknown')).toBeNull();
  });
});

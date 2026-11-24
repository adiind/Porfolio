import { describe, expect, it } from 'vitest';
import { EXPERIENCE_STORIES, experienceIdFromHash } from './experienceStories';

describe('work experience stories', () => {
  it('opens each work role with its own cards, each with a title and its words', () => {
    for (const [id, story] of Object.entries(EXPERIENCE_STORIES)) {
      expect(story.cards.length, id).toBeGreaterThan(0);
      for (const card of story.cards) {
        expect(card.title.trim(), id).not.toBe('');
        expect(card.lines.some((line) => line.trim() !== ''), `${id}: ${card.title}`).toBe(true);
      }
    }
    expect(experienceIdFromHash('#experience-udaan')).toBe('udaan');
    expect(experienceIdFromHash('#experience-unknown')).toBeNull();
  });
});

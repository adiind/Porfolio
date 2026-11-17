import { describe, expect, it } from 'vitest';
import { SNAPDEAL_STORY } from './snapdealCards';

describe('Snapdeal story cards', () => {
  it('covers seller ads, the reported result, warehousing and the analyst role', () => {
    expect(SNAPDEAL_STORY.map((card) => card.id)).toEqual(['ads', 'result', 'warehouse', 'role']);
    const copy = JSON.stringify(SNAPDEAL_STORY);
    expect(copy).toContain('14%');
    expect(copy).toMatch(/contributed|supported/i);
    expect(copy).toContain('warehouse');
  });
});

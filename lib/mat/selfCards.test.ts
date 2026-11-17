import { describe, expect, it } from 'vitest';
import { SELF_STORY } from './selfCards';

describe('Self story cards', () => {
  it('presents Agent Vault, its protected checkout, the PM role, and the DeleteMe work', () => {
    expect(SELF_STORY.map((card) => card.id)).toEqual(['vault', 'protect', 'role', 'deleteme']);
    const story = JSON.stringify(SELF_STORY);
    expect(story).toContain('Agent Vault');
    expect(story).toContain('DeleteMe');
    expect(story).toContain('AI product manager');
    expect(story).not.toMatch(/launched.*DeleteMe/i);
  });
});

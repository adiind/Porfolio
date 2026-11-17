import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { patchGithubPill } from './flatGithubPill';

const page = readFileSync(new URL('../../public/home-flat/index.html', import.meta.url), 'utf8');
const days = Array.from({ length: 84 }, (_, i) => {
  const date = new Date(Date.UTC(2026, 10, 1 + i - 83));
  return { date: date.toISOString().slice(0, 10), count: i === 83 ? 8 : i % 7 === 0 ? 2 : 0 };
});

describe('flat home page GitHub pill', () => {
  it('writes the build count, the 84 days, the title and the label', () => {
    const out = patchGithubPill(page, 4321, days);
    expect(out).toContain('<b>4321</b>commits');
    expect(out.match(/<i data-l="\d" title="\d{4}-\d{2}-\d{2}: \d+"><\/i>/g)).toHaveLength(84);
    expect(out).toContain('title="2026-11-01: 8"');
    expect(out).toMatch(/title="\d+ commits on \d+ active days in the 12 weeks ending 1 Nov 2026"/);
    expect(out).toContain('aria-label="GitHub: 4321 commits in this site\'s source, ');
    // the busiest day is level 4, an empty day level 0
    expect(out).toContain('<i data-l="4" title="2026-11-01: 8"></i>');
    expect(out).toContain('<i data-l="0" title="2026-10-31: 0"></i>');
  });

  it('keeps the typed values when the build has none', () => {
    expect(patchGithubPill(page, null, null)).toBe(page);
  });

  it('updates only the count when there is no 12-week history', () => {
    const out = patchGithubPill(page, 400, null);
    expect(out).toContain('<b>400</b>commits');
    expect(out).toContain('GitHub: 400 commits');
    expect(out).toContain('in the 12 weeks ending 27 Oct 2026');
  });
});

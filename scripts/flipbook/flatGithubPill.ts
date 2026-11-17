/**
 * The flat home page's GitHub pill, filled from the build's own numbers (the same ones the mat's pill and the old home's
 * GitHubActivity read: vite.config.ts counts this site's commits and keeps the last 12 weeks of days).
 *
 * The flat page is a static folder (public/home-flat), so Vite's `define` cannot reach it. This plugin opens the copy the
 * build wrote to dist/home-flat/index.html and rewrites the pill's count, its 12-week grid, and its title and label.
 * When the build has no number, or no 84-day history, the page keeps the values typed into it.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

export type GitActivityDay = { date: string; count: number };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayName = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1] ?? ''} ${y}`; };
/** The same scale as the old home's ContributionChart and lib/mat/matPieces.ts: 0 for none, 1 to 4 by share of the busiest day. */
const levelOf = (count: number, max: number) => (count === 0 ? 0 : Math.min(4, Math.max(1, Math.ceil((count / max) * 4))));
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function patchGithubPill(html: string, commitCount: number | null, activity: GitActivityDay[] | null): string {
  const days = activity && activity.length === 84 ? activity : null;
  const count = typeof commitCount === 'number' && Number.isFinite(commitCount) ? commitCount : null;
  let out = html;
  let title: string | null = null;
  if (days) {
    const total = days.reduce((sum, day) => sum + day.count, 0);
    const active = days.filter((day) => day.count > 0).length;
    title = `${plural(total, 'commit')} on ${plural(active, 'active day')} in the 12 weeks ending ${dayName(days[days.length - 1].date)}`;
    const max = Math.max(1, ...days.map((day) => day.count));
    const cells = days.map((day) => `<i data-l="${levelOf(day.count, max)}" title="${day.date}: ${day.count}"></i>`).join('');
    out = out.replace(/(<span class="gh-grid" aria-hidden="true">)[\s\S]*?(<\/span>)/, `$1${cells}$2`);
  }
  if (count !== null) out = out.replace(/(<span class="gh-n"><b>)[^<]*(<\/b>)/, `$1${count}$2`);
  if (title || count !== null) {
    out = out.replace(/<a class="bx-a bx-gh"([^>]*)>/, (whole, attrs: string) => {
      let next = attrs;
      if (title) next = next.replace(/ title="[^"]*"/, ` title="${title}"`);
      const label = /aria-label="GitHub: (\d+) commits in this site's source, ([^"]*?)\. Opens the repository\."/.exec(next);
      if (label) next = next.replace(label[0], `aria-label="GitHub: ${count ?? label[1]} commits in this site's source, ${title ?? label[2]}. Opens the repository."`);
      return `<a class="bx-a bx-gh"${next}>`;
    });
  }
  return out;
}

/** After the build: fill the pill of dist/home-flat/index.html (a no-op when the build has no flat page). */
export function flatHomeGithubPill(history: { commitCount: number | null; activity: GitActivityDay[] | null }): Plugin {
  return {
    name: 'flat-home-github-pill',
    apply: 'build',
    writeBundle(options) {
      const file = path.join(options.dir ?? 'dist', 'home-flat/index.html');
      if (!existsSync(file)) return;
      const html = readFileSync(file, 'utf8');
      const next = patchGithubPill(html, history.commitCount, history.activity);
      if (next !== html) writeFileSync(file, next);
    },
  };
}

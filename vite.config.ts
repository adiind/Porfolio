/// <reference types="vitest/config" />
import path from 'path';
import { execFileSync } from 'node:child_process';
import { defineConfig, loadEnv, type Plugin, type Rollup } from 'vite';
import react from '@vitejs/plugin-react';
import sourceHistoryFallback from './data/portfolio-source-history.json';
import { flatHomeGithubPill } from './scripts/flipbook/flatGithubPill';
import { sharePreviewPages } from './scripts/share/sharePages';
import { liveHostPageAddresses } from './scripts/pageAddresses';

const getPortfolioRevision = (): string | null => {
  try {
    const revision = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: __dirname,
      encoding: 'utf8',
    }).trim();
    return /^[0-9a-f]{40}$/i.test(revision) ? revision : null;
  } catch {
    return null;
  }
};

type GitActivityDay = {
  date: string;
  count: number;
};

type PortfolioHistory = {
  revision: string | null;
  commitCount: number | null;
  activity: GitActivityDay[] | null;
  /** The last 350 days (50 columns of 7) ending on the same day as `activity`: the GitHub card's opened year (lib/mat/githubRiseLayer.ts). */
  year?: GitActivityDay[] | null;
};

/** The `length` days ending on `latest`, oldest first, each with its commit count. */
const daysEnding = (counts: Map<string, number>, latest: Date, length: number): GitActivityDay[] => Array.from({ length }, (_, index) => {
  const date = new Date(latest);
  date.setUTCDate(latest.getUTCDate() - (length - 1 - index));
  const key = date.toISOString().slice(0, 10);
  return { date: key, count: counts.get(key) ?? 0 };
});

const getLocalPortfolioHistory = (): PortfolioHistory | null => {
  const revision = getPortfolioRevision();
  if (!revision) return null;
  try {
    if (execFileSync('git', ['rev-parse', '--is-shallow-repository'], { cwd: __dirname, encoding: 'utf8' }).trim() === 'true') return null;
    const rawCount = execFileSync('git', ['rev-list', '--count', revision], { cwd: __dirname, encoding: 'utf8' }).trim();
    const commitCount = Number.parseInt(rawCount, 10);
    const dates = execFileSync('git', ['log', revision, '--format=%ad', '--date=short'], {
      cwd: __dirname,
      encoding: 'utf8',
    })
      .trim()
      .split('\n')
      .filter(Boolean);

    if (!Number.isFinite(commitCount) || dates.length === 0) return null;

    const counts = new Map<string, number>();
    dates.forEach((date) => counts.set(date, (counts.get(date) ?? 0) + 1));

    const latest = new Date(`${dates[0]}T00:00:00Z`);
    return { revision, commitCount, activity: daysEnding(counts, latest, 84), year: daysEnding(counts, latest, 350) };
  } catch {
    return null;
  }
};

type GitHubCommit = { sha: string; commit?: { author?: { date?: string } } };

const getGitHubPortfolioHistory = async (): Promise<PortfolioHistory | null> => {
  const commits: GitHubCommit[] = [];
  let page = 1;
  try {
    while (true) {
      const response = await fetch(`https://api.github.com/repos/adiind/Porfolio/commits?sha=main&per_page=100&page=${page}`, {
        headers: { Accept: 'application/vnd.github+json' },
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) return null;
      const batch = await response.json() as GitHubCommit[];
      if (!Array.isArray(batch) || batch.length === 0) break;
      commits.push(...batch);
      if (batch.length < 100) break;
      page += 1;
    }
  } catch {
    return null;
  }
  const dates = commits.map((commit) => commit.commit?.author?.date?.slice(0, 10)).filter((date): date is string => Boolean(date));
  if (!commits.length || !dates.length) return null;
  const counts = new Map<string, number>();
  dates.forEach((date) => counts.set(date, (counts.get(date) ?? 0) + 1));
  const latest = new Date(`${dates[0]}T00:00:00Z`);
  return { revision: commits[0].sha, commitCount: commits.length, activity: daysEnding(counts, latest, 84), year: daysEnding(counts, latest, 350) };
};

/**
 * (ship layer, scripts/ship/main.patch) index.html's preload script asks for each home's first code from the head, together with
 * the entry, instead of one step later, once the entry has run and imported it (both homes are lazy chunks). Only the build knows
 * the hashed file names, so this writes them in: the 3D home (components/flipbook/FlipBookApp.tsx, which holds MatHome) and the old
 * home (lib/ship/OldHome.tsx), each with every chunk and stylesheet it imports, less what index.html already loads. The addresses
 * and the crossorigin setting are the ones Vite's own loader uses, so it finds these links and adds no second copy.
 */
function shipHeadPreloads(): Plugin {
  return {
    name: 'ship-head-preloads',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const fail = (why: string): never => { throw new Error(`ship-head-preloads (vite.config.ts): ${why}`); };
        const bundle = ctx.bundle ?? fail('no bundle');
        const entry = ctx.chunk ?? fail('no entry chunk');
        const chunkOf = (name: string): Rollup.OutputChunk => {
          const item = bundle[name];
          return item && item.type === 'chunk' ? item : fail(`${name} is not a chunk`);
        };
        // a chunk and everything it imports statically, as addresses
        const closure = (start: Rollup.OutputChunk) => {
          const js: string[] = [];
          const css = new Set<string>();
          const walk = (chunk: Rollup.OutputChunk) => {
            if (js.includes(`/${chunk.fileName}`)) return;
            js.push(`/${chunk.fileName}`);
            chunk.viteMetadata?.importedCss.forEach((file) => css.add(`/${file}`));
            chunk.imports.forEach((name) => walk(chunkOf(name)));
          };
          walk(start);
          return { js, css: [...css] };
        };
        const loaded = closure(entry);
        // the chunk the entry loads lazily that holds this module (FlipBookApp's chunk has no facade: two lazy imports share it)
        const home = (file: string) => {
          const found = [...new Set(entry.dynamicImports)].map(chunkOf).filter((chunk) => chunk.moduleIds.some((id) => id.endsWith(`/${file}`)));
          if (found.length !== 1) fail(`the entry loads ${found.length} lazy chunks holding ${file}, not 1`);
          const all = closure(found[0]);
          return { js: all.js.filter((url) => !loaded.js.includes(url)), css: all.css.filter((url) => !loaded.css.includes(url)) };
        };
        const code = { mat: home('components/flipbook/FlipBookApp.tsx'), old: home('lib/ship/OldHome.tsx') };
        if (!code.mat.js.some((url) => /\/three-[\w-]+\.js$/.test(url))) fail('the 3D home no longer starts with the three chunk');
        const anchor = 'var code = {};';
        if (html.split(anchor).length !== 2) fail(`index.html: \`${anchor}\` is not there exactly once`);
        return html.replace(anchor, () => `var code = ${JSON.stringify(code)};`);
      },
    },
  };
}

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const portfolioHistory: PortfolioHistory = await getGitHubPortfolioHistory()
    ?? getLocalPortfolioHistory()
    ?? sourceHistoryFallback;
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      headers: {
        // Force download with correct filename for PDFs
      },
    },
    plugins: [react(), shipHeadPreloads(), flatHomeGithubPill(portfolioHistory), sharePreviewPages(), liveHostPageAddresses()],
    test: { exclude: ['**/node_modules/**', '**/.git/**', '.claude/**', 'dist/**', 'e2e/**'] },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (
              id.includes('@openpanel')
              || id.includes('@rrweb')
              || id.includes('/rrweb')
            ) {
              // Keep OpenPanel and its replay recorder behind the dynamic
              // import in lib/openpanel.ts. The catch-all vendor chunk is
              // module-preloaded on every visit, including opted-out visits.
              return undefined;
            }
            if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) {
              return 'vendor-motion';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/scheduler/')
            ) {
              return 'vendor-react';
            }
            // (ship layer) three.js and GSAP each in a chunk of its own, downloaded only by code that imports it: three by the 3D
            // home and the books (and the old home's project wheel, behind ?projectWheelWebgl), GSAP by the old home's process
            // stories. In the catch-all chunk below they came as one 605 KB file to both homes.
            if (/[\\/]node_modules[\\/]three[\\/]/.test(id)) return 'three';
            if (/[\\/]node_modules[\\/]gsap[\\/]/.test(id)) return 'gsap';
            // remaining small deps (radix, clsx, cva, tailwind-merge, next-themes, ...)
            return 'vendor';
          },
        },
      },
    },
    define: {
      __PORTFOLIO_REVISION__: JSON.stringify(portfolioHistory.revision),
      __PORTFOLIO_COMMIT_COUNT__: JSON.stringify(portfolioHistory.commitCount),
      __PORTFOLIO_GIT_ACTIVITY__: JSON.stringify(portfolioHistory.activity),
      __PORTFOLIO_GIT_YEAR__: JSON.stringify(portfolioHistory.year ?? null),
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});

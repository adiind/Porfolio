import path from 'path';
import { execFileSync } from 'node:child_process';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import sourceHistoryFallback from './data/portfolio-source-history.json';

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
};

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
    const activity = Array.from({ length: 84 }, (_, index) => {
      const date = new Date(latest);
      date.setUTCDate(latest.getUTCDate() - (83 - index));
      const key = date.toISOString().slice(0, 10);
      return { date: key, count: counts.get(key) ?? 0 };
    });
    return { revision, commitCount, activity };
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
  const activity = Array.from({ length: 84 }, (_, index) => {
    const date = new Date(latest);
    date.setUTCDate(latest.getUTCDate() - (83 - index));
    const key = date.toISOString().slice(0, 10);
    return { date: key, count: counts.get(key) ?? 0 };
  });
  return { revision: commits[0].sha, commitCount: commits.length, activity };
};

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const portfolioHistory = await getGitHubPortfolioHistory()
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
    plugins: [react()],
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

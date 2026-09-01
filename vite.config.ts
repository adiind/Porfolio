import path from 'path';
import { execFileSync } from 'node:child_process';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

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

const getPortfolioCommitCount = (revision: string | null): number | null => {
  if (!revision) return null;
  try {
    const rawCount = execFileSync('git', ['rev-list', '--count', revision], {
      cwd: __dirname,
      encoding: 'utf8',
    }).trim();
    const count = Number.parseInt(rawCount, 10);
    return Number.isFinite(count) ? count : null;
  } catch {
    return null;
  }
};

type GitActivityDay = {
  date: string;
  count: number;
};

const getPortfolioGitActivity = (revision: string | null): GitActivityDay[] | null => {
  if (!revision) return null;
  try {
    const dates = execFileSync('git', ['log', revision, '--format=%ad', '--date=short'], {
      cwd: __dirname,
      encoding: 'utf8',
    })
      .trim()
      .split('\n')
      .filter(Boolean);

    if (dates.length === 0) return [];

    const counts = new Map<string, number>();
    dates.forEach((date) => counts.set(date, (counts.get(date) ?? 0) + 1));

    const latest = new Date(`${dates[0]}T00:00:00Z`);
    return Array.from({ length: 84 }, (_, index) => {
      const date = new Date(latest);
      date.setUTCDate(latest.getUTCDate() - (83 - index));
      const key = date.toISOString().slice(0, 10);
      return { date: key, count: counts.get(key) ?? 0 };
    });
  } catch {
    return null;
  }
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  // Pin every build-time Git signal to one resolved revision so a concurrent
  // commit cannot make the count, chart, and verified artifact disagree.
  const portfolioRevision = getPortfolioRevision();
  const portfolioCommitCount = getPortfolioCommitCount(portfolioRevision);
  const portfolioGitActivity = getPortfolioGitActivity(portfolioRevision);
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
      __PORTFOLIO_REVISION__: JSON.stringify(portfolioRevision),
      __PORTFOLIO_COMMIT_COUNT__: JSON.stringify(portfolioCommitCount),
      __PORTFOLIO_GIT_ACTIVITY__: JSON.stringify(portfolioGitActivity),
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

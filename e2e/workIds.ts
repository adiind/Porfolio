import { createServer } from 'vite';

/**
 * Every /work/<id> the site answers, read from the app's own modules (data/projects.ts and lib/workRoutes.ts), so a new
 * project is tested with no edit here. Node cannot import those files directly (they import JSON without an import
 * attribute), so Vite loads them, as it does for the site.
 */
export async function loadWorkIds(): Promise<string[]> {
  const vite = await createServer({ configFile: false, logLevel: 'silent', server: { middlewareMode: true, hmr: false }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
  try {
    const { PROJECTS_BY_ID } = await vite.ssrLoadModule('/data/projects.ts');
    const { SLUG_ALIASES } = await vite.ssrLoadModule('/lib/workRoutes.ts');
    return [...(PROJECTS_BY_ID as Map<string, unknown>).keys(), ...Object.keys(SLUG_ALIASES as Record<string, string>)];
  } finally {
    await vite.close();
  }
}

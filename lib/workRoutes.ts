/**
 * Shareable URLs for Selected Work case studies: /work/<project-id>.
 *
 * The site has no router — project detail views are overlays whose history
 * entries are owned by useDialogA11y. These helpers only resolve paths to
 * project ids; the overlay itself pushes /work/<id> via the hook's
 * `historyPath` option so URL + Back behavior stay in one mechanism.
 */

import { PROJECTS_BY_ID } from '../data/projects';

/** Friendly slugs that map onto canonical project ids. */
const SLUG_ALIASES: Record<string, string> = {
    zero: 'zero-my-ai',
};

const WORK_PATH_PATTERN = /^\/work\/([A-Za-z0-9-]+)\/?$/;

/** True for any /work path (valid or not) — used to reset the boot URL to /. */
export const isWorkPath = (pathname: string): boolean => /^\/work(\/|$)/.test(pathname);

/** The canonical shareable path for a project id. */
export const projectPath = (projectId: string): string => `/work/${projectId}`;

/** Resolve a pathname to a known project id, or null (unknown ids fall back). */
export const resolveWorkProjectId = (pathname: string): string | null => {
    const match = WORK_PATH_PATTERN.exec(pathname);
    if (!match) return null;
    const slug = match[1].toLowerCase();
    const projectId = SLUG_ALIASES[slug] ?? slug;
    return PROJECTS_BY_ID.has(projectId) ? projectId : null;
};

/**
 * Deep-linked project id, captured once at boot (mirrors the /studio route
 * detection in index.tsx). index.tsx resets the address bar to / before React
 * renders; the detail overlay then re-pushes /work/<id> as the entry it owns,
 * so browser Back closes the detail without leaving the site.
 */
export const INITIAL_WORK_PROJECT_ID: string | null =
    typeof window === 'undefined' ? null : resolveWorkProjectId(window.location.pathname);

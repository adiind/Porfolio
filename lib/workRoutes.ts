/**
 * Shareable URLs for Selected Work case studies: /work/<project-id>.
 *
 * The site has no router — project detail views are overlays whose history
 * entries are owned by useDialogA11y. These helpers only resolve paths to
 * project ids; the overlay itself pushes /work/<id> via the hook's
 * `historyPath` option so URL + Back behavior stay in one mechanism.
 */

import { PROJECTS_BY_ID } from '../data/projects';
import { TIMELINE_DATA } from '../data/timeline';
import { BOOT } from './ship/boot';

/** Friendly slugs that map onto canonical project ids. */
export const SLUG_ALIASES: Record<string, string> = {
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
 * Read from lib/ship/boot (the address as it arrived): this module loads lazily,
 * after index.tsx has already reset the address bar.
 */
export const INITIAL_WORK_PROJECT_ID: string | null =
    typeof window === 'undefined' ? null : resolveWorkProjectId(BOOT.pathname);

/**
 * Shareable URLs for the timeline stops' detail views: /experience/<id>, with
 * the ids of data/timeline.ts. Same mechanism as /work/<id>: the detail pushes
 * its path via useDialogA11y's `historyPath`; a fresh load opens it at boot.
 */
const EXPERIENCE_PATH_PATTERN = /^\/experience\/([A-Za-z0-9-]+)\/?$/;
const EXPERIENCE_IDS = new Set(TIMELINE_DATA.map((item) => item.id));

/** The shareable path for a timeline stop. */
export const experiencePath = (experienceId: string): string => `/experience/${experienceId}`;

/** Resolve a pathname to a known timeline stop id, or null. */
export const resolveExperienceId = (pathname: string): string | null => {
    const match = EXPERIENCE_PATH_PATTERN.exec(pathname);
    if (!match) return null;
    const id = match[1].toLowerCase();
    return EXPERIENCE_IDS.has(id) ? id : null;
};

/** Deep-linked timeline stop id, captured once at boot (see INITIAL_WORK_PROJECT_ID). */
export const INITIAL_EXPERIENCE_ID: string | null =
    typeof window === 'undefined' ? null : resolveExperienceId(BOOT.pathname);

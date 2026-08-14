#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2];
const validModes = new Set(['shared', 'care', 'mcdonalds', 'integration', 'all']);
const errors = [];

const sharedRequirements = {
  'components/hcd/types.ts': [
    'export interface HcdEvidence',
    'treatment: HcdTreatment;',
    'export interface HcdProjectStory',
  ],
  'components/hcd/HcdCaseStudy.tsx': [
    'export const HcdCaseStudyShell',
    'useDialogA11y',
    'aria-modal="true"',
    'aria-labelledby=',
    "loading={isHero ? 'eager' : 'lazy'}",
    'sizes=',
    'prefers-reduced-motion',
    'View source in Figma',
    'onClick={() => scrollToChapter(chapter.key)}',
    'ref={setClosePortalTarget}',
    '<div ref={setClosePortalTarget} className="fixed right-3 top-3 z-[9999] md:right-6 md:top-6" />',
    'ReactDOM.createPortal(',
    'closePortalTarget,',
    'LIGHTBOX_FOCUSABLE',
    'lightboxRef.current?.querySelectorAll<HTMLElement>',
    'event.shiftKey',
    'const [isLightboxFullSize, setIsLightboxFullSize] = useState(false);',
    'ref={lightboxViewportRef}',
    'aria-pressed={isLightboxFullSize}',
    "aria-label={isLightboxFullSize ? 'Fit evidence to screen' : 'View evidence at full size'}",
    'Full size · scroll in any direction to inspect',
    'touch-pan-x touch-pan-y overflow-auto',
    "isLightboxFullSize ? 'mx-auto block h-auto max-w-none",
    'setIsLightboxFullSize(false);',
    'activeEvidence && ReactDOM.createPortal(',
    'className="hcd-case fixed inset-0 z-[20000] pointer-events-auto flex flex-col overflow-hidden overscroll-contain bg-black/95 p-3 sm:p-5"',
    'document.body.style.overflow = \'hidden\';',
    'document.body.style.overflow = previousBodyOverflow;',
    'document.body,',
  ],
  'scripts/build-hcd-assets.py': ['Image.Resampling.LANCZOS', "format='WEBP'"],
};

const sharedForbiddenMarkers = {
  'components/hcd/types.ts': ["treatment: 'full' | 'focus' | 'editorial'"],
  'components/hcd/HcdCaseStudy.tsx': [
    'href={`#${story.projectId}-${chapter.key}`}',
    'lightboxCloseRef.current?.focus();',
    'text-white/45',
    'className="contents"',
    'className="fixed right-3 top-3 z-[9999] flex',
    'className="mx-auto h-auto max-h-full max-w-full object-contain"',
    '{activeEvidence && (',
  ],
};

const canonicalEvidence = {
  care: [
    'care-stakeholders', 'care-trust-takeaways', 'care-crisis-journey',
    'care-schedule-management', 'care-clinical-guardian-flow',
    'care-familysync-intro', 'care-three-pillars', 'care-escalation-flow',
    'care-visibility-presence',
  ],
  mcdonalds: [
    'mcd-research-proof', 'mcd-research-insight', 'mcd-capabilities-gap',
    'mcd-problem-landscape', 'mcd-opportunity-brief', 'mcd-kiosk-journey',
    'mcd-app-journey', 'mcd-trigger-setup', 'mcd-join-architecture',
    'mcd-system-map', 'mcd-readiness-engine', 'mcd-invite-touchpoints',
    'mcd-value-props', 'mcd-live-progress', 'mcd-squad-details',
    'mcd-delegated-payment', 'mcd-readiness', 'mcd-order-complete',
  ],
};

const projectConfig = {
  care: {
    storyPath: 'data/hcd/familysync-story.json',
    componentPath: 'components/hcd/FamilySyncProjectDetail.tsx',
    componentMarkers: ['HcdCaseStudyShell', 'familysync-story.json'],
  },
  mcdonalds: {
    storyPath: 'data/hcd/mcdonalds-story.json',
    componentPath: 'components/hcd/McDonaldsProjectDetail.tsx',
    componentMarkers: ['HcdCaseStudyShell', 'mcdonalds-story.json'],
  },
};

const allowedChapterKeys = new Set([
  'frame', 'tension', 'opportunity', 'journey', 'decisions', 'interaction', 'outcome',
]);

function resolveRepo(relativePath) {
  return path.join(repoRoot, relativePath);
}

function requireFile(relativePath) {
  const absolutePath = resolveRepo(relativePath);
  if (!fs.existsSync(absolutePath)) {
    errors.push(`Missing required file: ${relativePath}`);
    return null;
  }
  return absolutePath;
}

function requireMarkers(relativePath, markers) {
  const absolutePath = requireFile(relativePath);
  if (!absolutePath) return;
  const source = fs.readFileSync(absolutePath, 'utf8');
  for (const marker of markers) {
    if (!source.includes(marker)) {
      errors.push(`${relativePath} is missing required marker: ${marker}`);
    }
  }
}

function verifyShared() {
  for (const [relativePath, markers] of Object.entries(sharedRequirements)) {
    requireMarkers(relativePath, markers);
  }
  for (const [relativePath, markers] of Object.entries(sharedForbiddenMarkers)) {
    const absolutePath = requireFile(relativePath);
    if (!absolutePath) continue;
    const source = fs.readFileSync(absolutePath, 'utf8');
    for (const marker of markers) {
      if (source.includes(marker)) {
        errors.push(`${relativePath} contains forbidden marker: ${marker}`);
      }
    }
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function publicAssetPath(sourcePath, field, evidenceId) {
  if (typeof sourcePath !== 'string' || !sourcePath.startsWith('/images/hcd/')) {
    errors.push(`${evidenceId}.${field} must reference /images/hcd/: ${String(sourcePath)}`);
    return null;
  }
  const publicRoot = resolveRepo('public/images/hcd');
  const absolutePath = resolveRepo(path.join('public', sourcePath.slice(1)));
  const relativePath = path.relative(publicRoot, absolutePath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    errors.push(`${evidenceId}.${field} escapes public/images/hcd: ${sourcePath}`);
    return null;
  }
  return absolutePath;
}

function verifyEvidence(evidence, seenIds, location) {
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) {
    errors.push(`${location} must be an evidence object`);
    return;
  }

  const evidenceId = isNonEmptyString(evidence.id) ? evidence.id : `${location} (missing id)`;
  if (!isNonEmptyString(evidence.id)) {
    errors.push(`${location}.id must be a non-empty string`);
  } else if (seenIds.has(evidence.id)) {
    errors.push(`Duplicate evidence id: ${evidence.id}`);
  } else {
    seenIds.add(evidence.id);
  }

  for (const field of ['alt', 'caption', 'sourceLabel']) {
    if (!isNonEmptyString(evidence[field])) {
      errors.push(`${evidenceId}.${field} must be a non-empty string`);
    }
  }

  if (!['full', 'focus', 'editorial'].includes(evidence.treatment)) {
    errors.push(`${evidenceId}.treatment is not allowed: ${String(evidence.treatment)}`);
  }

  if (!isNonEmptyString(evidence.sourceUrl)) {
    errors.push(`${evidenceId}.sourceUrl must be a non-empty Figma URL`);
  } else {
    try {
      const sourceUrl = new URL(evidence.sourceUrl);
      if (sourceUrl.protocol !== 'https:' || !/(^|\.)figma\.com$/i.test(sourceUrl.hostname)) {
        errors.push(`${evidenceId}.sourceUrl is not a Figma URL: ${evidence.sourceUrl}`);
      }
    } catch {
      errors.push(`${evidenceId}.sourceUrl is not a valid URL: ${evidence.sourceUrl}`);
    }
  }

  for (const field of ['src', 'fullSrc']) {
    const absolutePath = publicAssetPath(evidence[field], field, evidenceId);
    if (absolutePath && !fs.existsSync(absolutePath)) {
      errors.push(`Missing ${field} asset for ${evidenceId}: ${evidence[field]}`);
    }
  }
}

function verifyProject(projectMode) {
  const config = projectConfig[projectMode];
  requireMarkers(config.componentPath, config.componentMarkers);
  const storyAbsolutePath = requireFile(config.storyPath);
  if (!storyAbsolutePath) return;

  let story;
  try {
    story = JSON.parse(fs.readFileSync(storyAbsolutePath, 'utf8'));
  } catch (error) {
    errors.push(`Could not parse ${config.storyPath}: ${error.message}`);
    return;
  }

  const seenIds = new Set();
  verifyEvidence(story.hero, seenIds, `${config.storyPath}.hero`);

  if (!Array.isArray(story.chapters)) {
    errors.push(`${config.storyPath}.chapters must be an array`);
  } else {
    const seenChapterKeys = new Set();
    for (const [chapterIndex, chapter] of story.chapters.entries()) {
      const location = `${config.storyPath}.chapters[${chapterIndex}]`;
      if (!chapter || typeof chapter !== 'object' || Array.isArray(chapter)) {
        errors.push(`${location} must be a chapter object`);
        continue;
      }
      if (!allowedChapterKeys.has(chapter.key)) {
        errors.push(`${location}.key is not allowed: ${String(chapter.key)}`);
      } else if (seenChapterKeys.has(chapter.key)) {
        errors.push(`Duplicate chapter key: ${chapter.key}`);
      } else {
        seenChapterKeys.add(chapter.key);
      }
      if (!Array.isArray(chapter.evidence)) {
        errors.push(`${location}.evidence must be an array`);
        continue;
      }
      for (const [evidenceIndex, evidence] of chapter.evidence.entries()) {
        verifyEvidence(evidence, seenIds, `${location}.evidence[${evidenceIndex}]`);
      }
    }
    const missingChapterKeys = [...allowedChapterKeys].filter((key) => !seenChapterKeys.has(key));
    if (missingChapterKeys.length) {
      errors.push(`${projectMode} is missing chapter keys: ${missingChapterKeys.join(', ')}`);
    }
  }

  const expectedIds = canonicalEvidence[projectMode];
  const missingIds = expectedIds.filter((id) => !seenIds.has(id));
  const unexpectedIds = [...seenIds].filter((id) => !expectedIds.includes(id));
  if (missingIds.length) errors.push(`${projectMode} is missing canonical evidence: ${missingIds.join(', ')}`);
  if (unexpectedIds.length) errors.push(`${projectMode} has unexpected evidence: ${unexpectedIds.join(', ')}`);

  if (projectMode === 'care') {
    const expectedHeroSource = 'https://www.figma.com/slides/1QewB1TAZ1vx7sdz3wiwqg/FINAL---TEAM-CARE?node-id=406-1678';
    if (story.hero?.sourceUrl !== expectedHeroSource) {
      errors.push(`care hero must use the verified home-update sequence: ${expectedHeroSource}`);
    }

    const storySource = JSON.stringify(story);
    for (const phrase of ['Strong opening evidence', 'Strong evidence', 'Especially useful', 'Use when the portfolio needs']) {
      if (storySource.includes(phrase)) {
        errors.push(`care story contains selector commentary: ${phrase}`);
      }
    }
  }
}

function verifyIntegration() {
  requireMarkers('components/ProjectDetail.tsx', [
    "import FamilySyncProjectDetail from './hcd/FamilySyncProjectDetail';",
    "import McDonaldsProjectDetail from './hcd/McDonaldsProjectDetail';",
    "if (props.project.id === 'glyph') return <GlyphProjectDetail {...props} />;",
    "if (props.project.id === 'familysync-jpmorgan') return <FamilySyncProjectDetail {...props} />;",
    "if (props.project.id === 'mcdonalds-interaction-design') return <McDonaldsProjectDetail {...props} />;",
    'return <DefaultProjectDetail {...props} />;',
  ]);
}

if (!validModes.has(mode)) {
  console.error('Usage: node scripts/verify-hcd-case-studies.mjs <shared|care|mcdonalds|integration|all>');
  process.exit(2);
}

if (mode === 'shared' || mode === 'all') verifyShared();
if (mode === 'care' || mode === 'all') verifyProject('care');
if (mode === 'mcdonalds' || mode === 'all') verifyProject('mcdonalds');
if (mode === 'integration' || mode === 'all') verifyIntegration();

if (errors.length) {
  console.error(`HCD case study verification failed (${mode}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`HCD case study verification passed (${mode}).`);

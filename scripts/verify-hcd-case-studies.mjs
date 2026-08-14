#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2];
const validModes = new Set(['shared', 'care', 'mcdonalds', 'integration', 'all']);
const errors = [];

const allowedSectionKeys = ['situation', 'learning', 'idea', 'mechanics', 'reflection'];

const expectedHeadings = {
  care: [
    'Care coordination is work',
    'The family is the system',
    'Three principles shaped the idea',
    'Designing the handoff',
    'What I took forward',
  ],
  mcdonalds: [
    'The order starts before checkout',
    'One person becomes the coordinator',
    'One order, individual agency',
    'From invite to pickup',
    'What I took forward',
  ],
};

const approvedNotes = {
  care: [
    'Care coordination expands when attention is already scarce.',
    'Proactive help still needs clear permission.',
    'Trust does not erase privacy boundaries.',
  ],
  mcdonalds: [
    'The order is part of the hangout, not a separate task.',
    'One person coordinates the food, or everyone coordinates payment.',
    'Group visibility and payment clarity have to improve together.',
  ],
};

const allowedPostItTones = {
  care: new Set(['yellow', 'blue', 'green']),
  mcdonalds: new Set(['yellow', 'cream', 'red']),
};

const forbiddenPublicPatterns = [
  /figma\.com/i,
  /view source/i,
  /slide\s*\d+/i,
  /\bevidence\b/i,
  /\bboundary\b/i,
  /\bprovenance\b/i,
  /\bverification\b/i,
];

const rendererForbiddenPublicPatterns = [
  ['Figma', /\bfigma\b/i],
  ['View source/source-label UI', /\bview\s+source\b|\bsource[-\s]?label\b/i],
  ['Boundary', /\bboundary\b/i],
  ['evidence', /\bevidence\b/i],
  ['provenance', /\bprovenance\b/i],
  ['verification', /\bverification\b/i],
  ['artifact', /\bartifact\b/i],
  ['proof', /\bproof\b/i],
];

const sharedRequirements = {
  'components/hcd/types.ts': [
    'export interface HcdVisual',
    'export interface HcdPostIt',
    'export interface HcdVisualGroup',
    'export interface HcdStorySection',
    'export interface HcdProjectStory',
    'treatment: HcdTreatment;',
  ],
  'components/hcd/HcdCaseStudy.tsx': [
    'HcdVisual',
    'HcdPostIt',
    'data-hcd-workshop-surface',
    'data-hcd-post-it',
    'data-hcd-visual-id',
    'View larger',
    'Fit to screen',
    'ReactDOM.createPortal(',
    "document.body.style.overflow = 'hidden';",
    'document.body.style.overflow = previousBodyOverflow;',
    'document.body,',
    'touch-pan-x touch-pan-y overflow-auto',
    "isLightboxFullSize ? 'mx-auto block h-auto max-w-none",
  ],
  'scripts/build-hcd-assets.py': ['Image.Resampling.LANCZOS', "format='WEBP'"],
};

const sharedForbiddenMarkers = {
  'components/hcd/types.ts': [
    'HcdEvidence',
    'HcdChapter',
    'sourceUrl',
    'sourceLabel',
  ],
  'components/hcd/HcdCaseStudy.tsx': [
    'HcdEvidence',
    'EvidenceFigure',
    'data-evidence',
    'Read the evidence',
    'View source in Figma',
    'ArrowUpRight',
    'sourceUrl',
    'sourceLabel',
    'story.chapters',
    'scrollToChapter',
    'data-hcd-chapter',
    'chapter.index',
    'chapter.eyebrow',
  ],
};

const canonicalVisuals = {
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

  const rendererPath = 'components/hcd/HcdCaseStudy.tsx';
  const rendererAbsolutePath = requireFile(rendererPath);
  if (!rendererAbsolutePath) return;
  const rendererSource = fs.readFileSync(rendererAbsolutePath, 'utf8');
  for (const [label, pattern] of rendererForbiddenPublicPatterns) {
    if (pattern.test(rendererSource)) {
      errors.push(`${rendererPath} contains forbidden public language: ${label}`);
    }
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function publicAssetPath(sourcePath, field, visualId) {
  if (typeof sourcePath !== 'string' || !sourcePath.startsWith('/images/hcd/')) {
    errors.push(`${visualId}.${field} must reference /images/hcd/: ${String(sourcePath)}`);
    return null;
  }
  const publicRoot = resolveRepo('public/images/hcd');
  const absolutePath = resolveRepo(path.join('public', sourcePath.slice(1)));
  const relativePath = path.relative(publicRoot, absolutePath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    errors.push(`${visualId}.${field} escapes public/images/hcd: ${sourcePath}`);
    return null;
  }
  return absolutePath;
}

function verifyCaption(caption, visualId) {
  if (!isNonEmptyString(caption)) {
    errors.push(`${visualId}.caption must be a non-empty string`);
    return;
  }
  const wordCount = caption.trim().split(/\s+/).length;
  if (wordCount < 8 || wordCount > 20) {
    errors.push(`${visualId}.caption must contain 8–20 words; received ${wordCount}`);
  }
}

function verifyVisual(visual, seenIds, location) {
  if (!visual || typeof visual !== 'object' || Array.isArray(visual)) {
    errors.push(`${location} must be a visual object`);
    return;
  }

  const visualId = isNonEmptyString(visual.id) ? visual.id : `${location} (missing id)`;
  if (!isNonEmptyString(visual.id)) {
    errors.push(`${location}.id must be a non-empty string`);
  } else if (seenIds.has(visual.id)) {
    errors.push(`Duplicate visual id: ${visual.id}`);
  } else {
    seenIds.add(visual.id);
  }

  if (!isNonEmptyString(visual.alt)) {
    errors.push(`${visualId}.alt must be a non-empty string`);
  }
  verifyCaption(visual.caption, visualId);

  if (!['full', 'focus', 'editorial'].includes(visual.treatment)) {
    errors.push(`${visualId}.treatment is not allowed: ${String(visual.treatment)}`);
  }

  for (const field of ['src', 'fullSrc']) {
    const absolutePath = publicAssetPath(visual[field], field, visualId);
    if (absolutePath && !fs.existsSync(absolutePath)) {
      errors.push(`Missing ${field} asset for ${visualId}: ${visual[field]}`);
    }
  }
}

function verifyPostIt(note, projectMode, location) {
  if (!note || typeof note !== 'object' || Array.isArray(note)) {
    errors.push(`${location} must be a post-it object`);
    return;
  }
  const noteId = isNonEmptyString(note.id) ? note.id : `${location} (missing id)`;
  if (!isNonEmptyString(note.id)) errors.push(`${location}.id must be a non-empty string`);
  if (!approvedNotes[projectMode].includes(note.text)) {
    errors.push(`${noteId}.text is not an approved ${projectMode} post-it`);
  }
  if (!allowedPostItTones[projectMode].has(note.tone)) {
    errors.push(`${noteId}.tone is not allowed by the ${projectMode} palette: ${String(note.tone)}`);
  }
  if (typeof note.rotation !== 'number' || !Number.isFinite(note.rotation) || note.rotation < -2 || note.rotation > 2) {
    errors.push(`${noteId}.rotation must be a number between -2 and 2: ${String(note.rotation)}`);
  }
}

function verifyPublicLanguage(story, projectMode) {
  const publicStory = JSON.stringify(story);
  for (const pattern of forbiddenPublicPatterns) {
    if (pattern.test(publicStory)) {
      errors.push(`${projectMode} story contains forbidden public language: ${pattern}`);
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

  verifyPublicLanguage(story, projectMode);

  const seenIds = new Set();
  verifyVisual(story.hero, seenIds, `${config.storyPath}.hero`);

  if (!Array.isArray(story.sections)) {
    errors.push(`${config.storyPath}.sections must be an array`);
  } else {
    const sectionKeys = story.sections.map((section) => section?.key);
    if (sectionKeys.length !== allowedSectionKeys.length || sectionKeys.some((key, index) => key !== allowedSectionKeys[index])) {
      errors.push(`${projectMode}.sections must contain these keys once and in order: ${allowedSectionKeys.join(', ')}`);
    }

    const sectionTitles = story.sections.map((section) => section?.title);
    if (sectionTitles.length !== expectedHeadings[projectMode].length || sectionTitles.some((title, index) => title !== expectedHeadings[projectMode][index])) {
      errors.push(`${projectMode}.sections must use the approved headings in order: ${expectedHeadings[projectMode].join(' | ')}`);
    }

    const seenSectionKeys = new Set();
    for (const [sectionIndex, section] of story.sections.entries()) {
      const location = `${config.storyPath}.sections[${sectionIndex}]`;
      if (!section || typeof section !== 'object' || Array.isArray(section)) {
        errors.push(`${location} must be a story section object`);
        continue;
      }
      if (seenSectionKeys.has(section.key)) {
        errors.push(`Duplicate section key: ${String(section.key)}`);
      } else {
        seenSectionKeys.add(section.key);
      }
      if (!Array.isArray(section.groups)) {
        errors.push(`${location}.groups must be an array`);
      } else {
        for (const [groupIndex, group] of section.groups.entries()) {
          const groupLocation = `${location}.groups[${groupIndex}]`;
          if (!group || typeof group !== 'object' || Array.isArray(group)) {
            errors.push(`${groupLocation} must be a visual group object`);
            continue;
          }
          if (!Array.isArray(group.visuals)) {
            errors.push(`${groupLocation}.visuals must be an array`);
            continue;
          }
          for (const [visualIndex, visual] of group.visuals.entries()) {
            verifyVisual(visual, seenIds, `${groupLocation}.visuals[${visualIndex}]`);
          }
        }
      }
      if (section.notes !== undefined) {
        if (!Array.isArray(section.notes)) {
          errors.push(`${location}.notes must be an array when present`);
        } else {
          for (const [noteIndex, note] of section.notes.entries()) {
            verifyPostIt(note, projectMode, `${location}.notes[${noteIndex}]`);
          }
        }
      }
    }
  }

  const expectedIds = canonicalVisuals[projectMode];
  const missingIds = expectedIds.filter((id) => !seenIds.has(id));
  const unexpectedIds = [...seenIds].filter((id) => !expectedIds.includes(id));
  if (missingIds.length) errors.push(`${projectMode} is missing canonical visuals: ${missingIds.join(', ')}`);
  if (unexpectedIds.length) errors.push(`${projectMode} has unexpected visuals: ${unexpectedIds.join(', ')}`);
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

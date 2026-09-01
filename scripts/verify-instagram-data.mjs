#!/usr/bin/env node

import fs from 'node:fs';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '..');
const DEFAULT_MANIFEST = path.join(ROOT, 'data', 'tinkerverse_journal.json');
const UPDATER = path.join(ROOT, 'scripts', 'update-instagram-data.js');
const REQUIRED_FIELDS = [
  'id',
  'instagramUrl',
  'publishedAt',
  'caption',
  'mediaType',
  'localMediaUrl',
  'alt',
  'statusLabel',
];
const MEDIA_TYPES = new Set(['image', 'video-thumbnail']);

function isInstagramPostUrl(value) {
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === 'https:'
      && ['instagram.com', 'www.instagram.com'].includes(parsed.hostname)
      && /^\/(p|reel)\/[^/]+\/?$/.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}

function isIsoTimestamp(value) {
  return (
    typeof value === 'string'
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)
    && Number.isFinite(Date.parse(value))
  );
}

function looksLikeImage(filePath) {
  const header = fs.readFileSync(filePath).subarray(0, 12);
  const isPng = header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isWebp = (
    header.subarray(0, 4).toString('ascii') === 'RIFF'
    && header.subarray(8, 12).toString('ascii') === 'WEBP'
  );
  return isPng || isJpeg || isWebp;
}

export function validateJournalEntries(entries, options = {}) {
  const root = options.root ?? ROOT;
  const errors = [];

  if (!Array.isArray(entries) || entries.length === 0) {
    return ['Journal manifest must be a non-empty array.'];
  }

  const ids = new Set();
  let previousTime = Number.POSITIVE_INFINITY;

  entries.forEach((entry, index) => {
    const prefix = `Entry ${index}`;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      errors.push(`${prefix} must be an object.`);
      return;
    }

    for (const field of REQUIRED_FIELDS) {
      if (typeof entry[field] !== 'string' || entry[field].trim() === '') {
        errors.push(`${prefix} is missing non-empty ${field}.`);
      }
    }

    if (typeof entry.id === 'string') {
      if (ids.has(entry.id)) errors.push(`${prefix} duplicates id ${entry.id}.`);
      ids.add(entry.id);
    }

    if (!isInstagramPostUrl(entry.instagramUrl)) {
      errors.push(`${prefix} has a non-public Instagram post URL.`);
    }

    if (!isIsoTimestamp(entry.publishedAt)) {
      errors.push(`${prefix} publishedAt must be an ISO UTC timestamp.`);
    } else {
      const publishedTime = Date.parse(entry.publishedAt);
      if (publishedTime > previousTime) {
        errors.push(`${prefix} breaks newest-first ordering.`);
      }
      previousTime = publishedTime;
    }

    if (!MEDIA_TYPES.has(entry.mediaType)) {
      errors.push(`${prefix} mediaType must be image or video-thumbnail.`);
    }

    if (typeof entry.projectId !== 'undefined' && (
      typeof entry.projectId !== 'string' || entry.projectId.trim() === ''
    )) {
      errors.push(`${prefix} projectId must be a non-empty string when present.`);
    } else if (typeof entry.projectId === 'string') {
      const projectPath = path.join(root, 'data', 'projects', `${entry.projectId}.json`);
      if (!fs.existsSync(projectPath)) {
        errors.push(`${prefix} projectId does not resolve to a local project: ${entry.projectId}.`);
      } else {
        const project = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
        if (project.id !== entry.projectId) {
          errors.push(`${prefix} projectId does not match the referenced project record.`);
        }
      }
    }

    if (typeof entry.localMediaUrl === 'string') {
      if (!entry.localMediaUrl.startsWith('/images/tinkerverse/')) {
        errors.push(`${prefix} localMediaUrl must use /images/tinkerverse/.`);
      } else {
        const mediaDirectory = path.resolve(root, 'public', 'images', 'tinkerverse');
        const localPath = path.resolve(root, 'public', entry.localMediaUrl.replace(/^\//, ''));
        const isContained = localPath.startsWith(`${mediaDirectory}${path.sep}`);
        if (!isContained) {
          errors.push(`${prefix} localMediaUrl escapes the TinkerVerse media directory.`);
        } else if (!fs.existsSync(localPath) || !fs.statSync(localPath).isFile()) {
          errors.push(`${prefix} local media is missing: ${entry.localMediaUrl}.`);
        } else if (!looksLikeImage(localPath)) {
          errors.push(`${prefix} local media is not a valid PNG, JPEG, or WebP image.`);
        }
      }
    }
  });

  return errors;
}

export function readAndValidateManifest(manifestPath = DEFAULT_MANIFEST, options = {}) {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Journal manifest does not exist: ${manifestPath}`);
  }
  const entries = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const errors = validateJournalEntries(entries, options);
  if (errors.length > 0) {
    throw new Error(`Journal manifest is invalid:\n- ${errors.join('\n- ')}`);
  }
  return entries;
}

const TEST_IMAGE_DATA_URL = `data:image/png;base64,${Buffer.from([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
  0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137,
  0, 0, 0, 13, 73, 68, 65, 84, 8, 215, 99, 248, 207, 192, 240,
  31, 0, 5, 0, 1, 255, 137, 153, 61, 29, 0, 0, 0, 0, 73, 69,
  78, 68, 174, 66, 96, 130,
]).toString('base64')}`;

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function hashFile(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function createLastKnownGoodRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-instagram-safety-'));
  const mediaPath = path.join(root, 'public', 'images', 'tinkerverse', 'sentinel.png');
  fs.mkdirSync(path.dirname(mediaPath), { recursive: true });
  fs.writeFileSync(mediaPath, Buffer.from(TEST_IMAGE_DATA_URL.split(',')[1], 'base64'));
  writeJson(path.join(root, 'data', 'tinkerverse_journal.json'), [
    {
      id: 'sentinel',
      instagramUrl: 'https://www.instagram.com/p/SENTINEL/',
      publishedAt: '2025-01-01T00:00:00.000Z',
      caption: 'Last-known-good journal entry.',
      mediaType: 'image',
      localMediaUrl: '/images/tinkerverse/sentinel.png',
      alt: 'Sentinel image used to verify update safety.',
      statusLabel: 'Verified fallback',
    },
  ]);
  return root;
}

function snapshotLastKnownGood(root) {
  const manifestPath = path.join(root, 'data', 'tinkerverse_journal.json');
  const mediaDirectory = path.join(root, 'public', 'images', 'tinkerverse');
  return {
    manifestHash: hashFile(manifestPath),
    mediaHashes: Object.fromEntries(
      fs.readdirSync(mediaDirectory).sort().map((filename) => [
        filename,
        hashFile(path.join(mediaDirectory, filename)),
      ]),
    ),
  };
}

function runUpdater(root, argumentsList, environment = {}) {
  return spawnSync(process.execPath, [UPDATER, '--root', root, ...argumentsList], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, APIFY_API_TOKEN: '', ...environment },
  });
}

function assertFailurePreserved(root, before, result, expectedMessage) {
  if (result.status === 0) throw new Error('Updater unexpectedly succeeded.');
  const diagnostic = `${result.stdout}\n${result.stderr}`;
  if (!expectedMessage.test(diagnostic)) {
    throw new Error(`Expected ${expectedMessage}, received: ${diagnostic.trim()}`);
  }
  const after = snapshotLastKnownGood(root);
  if (
    after.manifestHash !== before.manifestHash
    || JSON.stringify(after.mediaHashes) !== JSON.stringify(before.mediaHashes)
  ) {
    throw new Error('Last-known-good manifest or media was overwritten.');
  }
  const stagingLeftovers = fs.readdirSync(root).filter((name) => name.startsWith('.instagram-sync-stage-'));
  if (stagingLeftovers.length > 0) throw new Error('Interrupted staging directory was not cleaned up.');
}

function rawFixture(overrides = {}) {
  return {
    id: 'fixture-post',
    shortCode: 'FIXTURE123',
    url: 'https://www.instagram.com/p/FIXTURE123/',
    timestamp: '2026-01-02T03:04:05.000Z',
    caption: 'Testing a real staged workshop artifact.',
    type: 'Video',
    displayUrl: TEST_IMAGE_DATA_URL,
    ...overrides,
  };
}

export function runSchemaTests() {
  const root = createLastKnownGoodRoot();
  try {
    const baseEntry = readAndValidateManifest(
      path.join(root, 'data', 'tinkerverse_journal.json'),
      { root },
    )[0];
    const cases = [
      {
        name: 'required media field',
        entries: [{ ...baseEntry, localMediaUrl: '' }],
        expected: /localMediaUrl/,
      },
      {
        name: 'valid local file',
        entries: [{ ...baseEntry, localMediaUrl: '/images/tinkerverse/missing.png' }],
        expected: /local media is missing/,
      },
      {
        name: 'media path containment',
        entries: [{ ...baseEntry, localMediaUrl: '/images/tinkerverse/../../escape.png' }],
        expected: /escapes the TinkerVerse media directory/,
      },
      {
        name: 'newest-first order',
        entries: [
          { ...baseEntry, id: 'older', publishedAt: '2024-01-01T00:00:00.000Z' },
          { ...baseEntry, id: 'newer', publishedAt: '2025-01-01T00:00:00.000Z' },
        ],
        expected: /newest-first ordering/,
      },
      {
        name: 'unique IDs',
        entries: [baseEntry, { ...baseEntry }],
        expected: /duplicates id/,
      },
      {
        name: 'public Instagram URL',
        entries: [{ ...baseEntry, instagramUrl: 'https://example.com/p/SENTINEL/' }],
        expected: /non-public Instagram/,
      },
    ];

    for (const schemaCase of cases) {
      const errors = validateJournalEntries(schemaCase.entries, { root });
      if (!errors.some((error) => schemaCase.expected.test(error))) {
        throw new Error(`${schemaCase.name} did not fail with ${schemaCase.expected}: ${errors.join(' | ')}`);
      }
    }
    console.log(`Instagram journal schema verified: ${cases.length} invalid fixture contracts were rejected.`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

export function runSafetyTests() {
  const scenarios = [
    {
      name: 'missing token',
      prepare: () => [],
      args: () => [],
      expected: /APIFY_API_TOKEN is required/i,
    },
    {
      name: 'empty response',
      prepare: (root) => {
        const fixturePath = path.join(root, 'empty.json');
        writeJson(fixturePath, []);
        return ['--fixture', fixturePath];
      },
      expected: /empty/i,
    },
    {
      name: 'missing media candidate',
      prepare: (root) => {
        const fixturePath = path.join(root, 'missing-media.json');
        writeJson(fixturePath, [rawFixture({ displayUrl: '' })]);
        return ['--fixture', fixturePath];
      },
      expected: /media/i,
    },
    {
      name: 'invalid downloaded media',
      prepare: (root) => {
        const fixturePath = path.join(root, 'invalid-media.json');
        writeJson(fixturePath, [rawFixture({ displayUrl: 'data:text/plain;base64,bm90IGFuIGltYWdl' })]);
        return ['--fixture', fixturePath];
      },
      expected: /not a valid image/i,
    },
    {
      name: 'partial response',
      prepare: (root) => {
        const fixturePath = path.join(root, 'partial.json');
        writeJson(fixturePath, [rawFixture({ caption: '' })]);
        return ['--fixture', fixturePath];
      },
      expected: /partial/i,
    },
    {
      name: 'download failure',
      prepare: (root) => {
        const fixturePath = path.join(root, 'download-failure.json');
        writeJson(fixturePath, [rawFixture({ displayUrl: 'http://127.0.0.1:9/unavailable.png' })]);
        return ['--fixture', fixturePath];
      },
      expected: /download/i,
    },
    {
      name: 'interrupted staging',
      prepare: (root) => {
        const fixturePath = path.join(root, 'valid.json');
        writeJson(fixturePath, [rawFixture()]);
        return ['--fixture', fixturePath, '--failpoint', 'after-stage-validation'];
      },
      expected: /interrupt/i,
    },
    {
      name: 'existing asset collision',
      prepare: (root) => {
        const fixturePath = path.join(root, 'collision.json');
        const fixtureBytes = Buffer.from(TEST_IMAGE_DATA_URL.split(',')[1], 'base64');
        const digest = crypto.createHash('sha256').update(fixtureBytes).digest('hex').slice(0, 12);
        const collisionPath = path.join(
          root,
          'public',
          'images',
          'tinkerverse',
          `FIXTURE123-video-still-${digest}.png`,
        );
        fs.writeFileSync(collisionPath, 'verified existing asset must not be overwritten');
        writeJson(fixturePath, [rawFixture()]);
        return ['--fixture', fixturePath];
      },
      expected: /collision/i,
    },
  ];

  const failures = [];
  for (const scenario of scenarios) {
    const root = createLastKnownGoodRoot();
    try {
      const updaterArguments = scenario.prepare(root);
      const before = snapshotLastKnownGood(root);
      const result = runUpdater(root, updaterArguments);
      assertFailurePreserved(root, before, result, scenario.expected);
    } catch (error) {
      failures.push(`${scenario.name}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }

  if (failures.length > 0) {
    throw new Error(`Instagram updater safety tests failed:\n- ${failures.join('\n- ')}`);
  }
  console.log(`Instagram updater safety verified: ${scenarios.length} failure paths preserved last-known-good data.`);

  const successRoot = createLastKnownGoodRoot();
  try {
    const fixturePath = path.join(successRoot, 'publish.json');
    writeJson(fixturePath, [rawFixture()]);
    const result = runUpdater(successRoot, ['--fixture', fixturePath]);
    if (result.status !== 0) throw new Error(`Fixture publish failed: ${result.stderr || result.stdout}`);
    const entries = readAndValidateManifest(
      path.join(successRoot, 'data', 'tinkerverse_journal.json'),
      { root: successRoot },
    );
    if (entries.length !== 1 || entries[0].id !== 'FIXTURE123') {
      throw new Error('Fixture publish did not atomically replace the manifest with the staged entry.');
    }
    if (!fs.existsSync(path.join(successRoot, 'public', 'images', 'tinkerverse', 'sentinel.png'))) {
      throw new Error('Successful publish removed last-known-good media instead of preserving it.');
    }
    console.log('Instagram updater publish verified: validated media landed before atomic manifest replacement.');
  } finally {
    fs.rmSync(successRoot, { recursive: true, force: true });
  }
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  try {
    if (process.argv.includes('--schema-tests')) {
      runSchemaTests();
    } else if (process.argv.includes('--safety-tests')) {
      runSafetyTests();
    } else {
      const manifestArgument = process.argv.slice(2).find((argument) => !argument.startsWith('--'));
      const manifestPath = manifestArgument ? path.resolve(manifestArgument) : DEFAULT_MANIFEST;
      const entries = readAndValidateManifest(manifestPath);
      console.log(`Instagram journal verified: ${entries.length} entries in ${manifestPath}`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

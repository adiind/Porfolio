#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateJournalEntries } from './verify-instagram-data.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(SCRIPT_DIR, '..');
const APIFY_URL = 'https://api.apify.com/v2/acts/apify~instagram-post-scraper/run-sync-get-dataset-items';

function parseArguments(argv) {
  const options = { root: DEFAULT_ROOT, fixturePath: null, failpoint: null };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const value = argv[index + 1];
    if (!['--root', '--fixture', '--failpoint'].includes(argument)) {
      throw new Error(`Unknown argument: ${argument}`);
    }
    if (!value || value.startsWith('--')) throw new Error(`${argument} requires a value.`);
    if (argument === '--root') options.root = path.resolve(value);
    if (argument === '--fixture') options.fixturePath = path.resolve(value);
    if (argument === '--failpoint') options.failpoint = value;
    index += 1;
  }
  return options;
}

function firstString(...values) {
  return values.find((value) => typeof value === 'string' && value.trim())?.trim() ?? '';
}

function mediaCandidate(post) {
  const child = Array.isArray(post.childPosts)
    ? post.childPosts.map((item) => firstString(item?.displayUrl, item?.imageUrl)).find(Boolean)
    : '';
  const image = Array.isArray(post.images)
    ? post.images.map((item) => typeof item === 'string' ? item : firstString(item?.url)).find(Boolean)
    : '';
  return firstString(
    post.videoThumbnail,
    post.videoThumbnailUrl,
    post.thumbnailUrl,
    post.displayUrl,
    post.imageUrl,
    child,
    image,
  );
}

function normalizePost(post, index) {
  if (!post || typeof post !== 'object' || Array.isArray(post)) {
    throw new Error(`Apify response item ${index} is invalid.`);
  }
  const explicitUrl = firstString(post.url, post.instagramUrl);
  const shortCode = firstString(post.shortCode, post.shortcode);
  const instagramUrl = explicitUrl || (shortCode ? `https://www.instagram.com/p/${shortCode}/` : '');
  const urlId = instagramUrl.match(/\/(?:p|reel)\/([^/]+)/)?.[1] ?? '';
  const id = shortCode || urlId || firstString(post.id);
  const caption = firstString(post.caption);
  const publishedAt = firstString(post.timestamp, post.publishedAt);
  const candidate = mediaCandidate(post);
  const rawType = firstString(post.type, post.typeName, post.productType).toLowerCase();
  const mediaType = rawType.includes('video') || rawType.includes('reel') ? 'video-thumbnail' : 'image';

  if (!instagramUrl || !id || !caption || !publishedAt) {
    throw new Error(`Apify response item ${index} is partial or missing identity, caption, or timestamp.`);
  }
  if (!candidate) {
    throw new Error(`Apify response item ${index} has no downloadable image or video-thumbnail media.`);
  }

  return {
    id,
    instagramUrl,
    publishedAt,
    caption,
    mediaType,
    candidate,
    alt: `TinkerVerse workshop artifact shared on Instagram: ${caption.replace(/\s+/g, ' ').slice(0, 140)}`,
    statusLabel: 'Workshop update',
  };
}

async function loadRawPosts(options) {
  if (options.fixturePath) return JSON.parse(fs.readFileSync(options.fixturePath, 'utf8'));
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error('APIFY_API_TOKEN is required for a public refresh; last-known-good data was preserved.');
  }
  console.log('Fetching public TinkerVerse Instagram data from Apify.');
  const response = await fetch(APIFY_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: ['tinker_verse'], resultsLimit: 12, resultsType: 'posts' }),
  });
  if (!response.ok) throw new Error(`Apify API error ${response.status}; last-known-good data was preserved.`);
  return response.json();
}

function imageExtension(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
  if (bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  return null;
}

async function downloadMedia(post, stageMediaDirectory) {
  let response;
  try {
    response = await fetch(post.candidate);
  } catch (error) {
    throw new Error(`Media download failed for ${post.id}: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!response.ok) throw new Error(`Media download failed for ${post.id}: HTTP ${response.status}.`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const extension = imageExtension(bytes);
  if (!extension) throw new Error(`Media download for ${post.id} was not a valid image.`);
  const digest = crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 12);
  const safeId = post.id.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '') || 'instagram';
  const role = post.mediaType === 'video-thumbnail' ? 'video-still' : 'image';
  const filename = `${safeId}-${role}-${digest}.${extension}`;
  fs.writeFileSync(path.join(stageMediaDirectory, filename), bytes, { flag: 'wx' });
  return filename;
}

function durableWrite(filePath, content) {
  const descriptor = fs.openSync(filePath, 'wx');
  try {
    fs.writeFileSync(descriptor, content);
    fs.fsyncSync(descriptor);
  } finally {
    fs.closeSync(descriptor);
  }
}

function publish(root, stageRoot, entries) {
  const finalMediaDirectory = path.join(root, 'public', 'images', 'tinkerverse');
  const stagedMediaDirectory = path.join(stageRoot, 'public', 'images', 'tinkerverse');
  const finalManifest = path.join(root, 'data', 'tinkerverse_journal.json');
  fs.mkdirSync(finalMediaDirectory, { recursive: true });
  fs.mkdirSync(path.dirname(finalManifest), { recursive: true });

  for (const filename of fs.readdirSync(stagedMediaDirectory)) {
    const stagedPath = path.join(stagedMediaDirectory, filename);
    const finalPath = path.join(finalMediaDirectory, filename);
    if (fs.existsSync(finalPath)) {
      const stagedHash = crypto.createHash('sha256').update(fs.readFileSync(stagedPath)).digest('hex');
      const finalHash = crypto.createHash('sha256').update(fs.readFileSync(finalPath)).digest('hex');
      if (stagedHash !== finalHash) throw new Error(`Content-addressed media collision: ${filename}`);
    } else {
      fs.renameSync(stagedPath, finalPath);
    }
  }

  const temporaryManifest = path.join(path.dirname(finalManifest), `.tinkerverse_journal.${process.pid}.${Date.now()}.tmp`);
  durableWrite(temporaryManifest, `${JSON.stringify(entries, null, 2)}\n`);
  fs.renameSync(temporaryManifest, finalManifest);
}

export async function runJournalUpdate(options) {
  const rawPosts = await loadRawPosts(options);
  if (!Array.isArray(rawPosts) || rawPosts.length === 0) {
    throw new Error('Apify response was empty; last-known-good data was preserved.');
  }
  const posts = rawPosts.map(normalizePost).sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt));
  const stageRoot = path.join(options.root, `.instagram-sync-stage-${process.pid}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`);
  const stageMediaDirectory = path.join(stageRoot, 'public', 'images', 'tinkerverse');
  const stageManifest = path.join(stageRoot, 'data', 'tinkerverse_journal.json');

  try {
    fs.mkdirSync(stageMediaDirectory, { recursive: true });
    fs.mkdirSync(path.dirname(stageManifest), { recursive: true });
    const entries = [];
    for (const post of posts) {
      const filename = await downloadMedia(post, stageMediaDirectory);
      entries.push({
        id: post.id,
        instagramUrl: post.instagramUrl,
        publishedAt: new Date(post.publishedAt).toISOString(),
        caption: post.caption,
        mediaType: post.mediaType,
        localMediaUrl: `/images/tinkerverse/${filename}`,
        alt: post.alt,
        statusLabel: post.statusLabel,
      });
    }
    fs.writeFileSync(stageManifest, `${JSON.stringify(entries, null, 2)}\n`);
    const errors = validateJournalEntries(entries, { root: stageRoot });
    if (errors.length) throw new Error(`Staged journal validation failed: ${errors.join(' | ')}`);
    if (options.failpoint === 'after-stage-validation') throw new Error('Simulated interrupted staging after validation.');
    publish(options.root, stageRoot, entries);
    return entries;
  } finally {
    fs.rmSync(stageRoot, { recursive: true, force: true });
  }
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  try {
    const entries = await runJournalUpdate(parseArguments(process.argv.slice(2)));
    console.log(`Instagram journal updated atomically with ${entries.length} entries.`);
  } catch (error) {
    console.error(`Instagram journal update failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

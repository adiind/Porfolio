import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const REEL_LIMIT = 6;
export const REEL_MANIFEST_NAME = 'tinkerverse_reels.json';
export const REEL_PUBLIC_PREFIX = '/media/tinkerverse/reels/';
const MAX_ENCODED_BYTES = 8 * 1024 * 1024;

function firstString(...values) {
  return values.find((value) => typeof value === 'string' && value.trim())?.trim() ?? '';
}

export function videoSource(post) {
  return firstString(post?.videoUrl, post?.video_url);
}

function publishedTime(value) {
  if (typeof value !== 'string') return Number.NaN;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return Date.parse(`${value}T00:00:00.000Z`);
  return Date.parse(value);
}

function reelAlt(caption, publishedAt) {
  const clean = caption.replace(/\s+/g, ' ').trim();
  if (clean) return clean.slice(0, 140);
  return `TinkerVerse reel from ${publishedAt.slice(0, 10)}`;
}

export function selectReels(rawPosts, limit = REEL_LIMIT) {
  if (!Array.isArray(rawPosts)) return [];
  const reels = [];
  for (const post of rawPosts) {
    if (!post || typeof post !== 'object' || Array.isArray(post)) continue;
    const source = videoSource(post);
    if (!source) continue;
    const explicitUrl = firstString(post.url, post.instagramUrl);
    const shortCode = firstString(post.shortCode, post.shortcode);
    const instagramUrl = explicitUrl || (shortCode ? `https://www.instagram.com/reel/${shortCode}/` : '');
    const urlId = instagramUrl.match(/\/(?:p|reel)\/([^/?#]+)/)?.[1] ?? '';
    const id = shortCode || urlId;
    const publishedAt = firstString(post.timestamp, post.publishedAt, post.date);
    const caption = typeof post.caption === 'string' ? post.caption : '';
    if (!instagramUrl || !id || !publishedAt || !Number.isFinite(publishedTime(publishedAt))) continue;
    reels.push({
      id,
      instagramUrl,
      publishedAt,
      caption,
      videoUrl: source,
      alt: reelAlt(caption, publishedAt),
    });
  }
  reels.sort((left, right) => publishedTime(right.publishedAt) - publishedTime(left.publishedAt));
  return reels.slice(0, limit);
}

function runFfmpeg(args) {
  const result = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], { encoding: 'utf8' });
  if (result.error || result.status !== 0) {
    throw new Error(result.stderr || result.error?.message || `ffmpeg exited ${result.status}`);
  }
}

function probeHeight(filePath) {
  const result = spawnSync('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=height',
    '-of', 'csv=p=0',
    filePath,
  ], { encoding: 'utf8' });
  const height = Number.parseInt(result.stdout, 10);
  return Number.isFinite(height) ? height : 0;
}

function looksLikeMp4(filePath) {
  const header = fs.readFileSync(filePath).subarray(0, 32);
  return header.includes(Buffer.from('ftyp'));
}

function transcodeReel(sourcePath, targetPath) {
  const height = probeHeight(sourcePath);
  const scale = height > 720 ? 'scale=-2:720' : 'scale=trunc(iw/2)*2:trunc(ih/2)*2';
  runFfmpeg([
    '-i', sourcePath,
    '-an',
    '-vf', scale,
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '28',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    targetPath,
  ]);
  if (fs.statSync(targetPath).size > MAX_ENCODED_BYTES) {
    runFfmpeg([
      '-i', sourcePath,
      '-an',
      '-vf', 'scale=-2:540',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '32',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      targetPath,
    ]);
  }
  if (fs.statSync(targetPath).size > MAX_ENCODED_BYTES) {
    throw new Error(`Encoded reel is still too large (${fs.statSync(targetPath).size} bytes).`);
  }
  if (!looksLikeMp4(targetPath)) throw new Error('Encoded reel is not an MP4.');
}

function extractPoster(videoPath, posterPath) {
  runFfmpeg([
    '-ss', '0.2',
    '-i', videoPath,
    '-frames:v', '1',
    '-vf', 'scale=480:-2',
    '-q:v', '4',
    posterPath,
  ]);
}

async function downloadToFile(url, filePath) {
  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 32 || !bytes.subarray(0, 32).includes(Buffer.from('ftyp'))) {
    throw new Error('Response was not an MP4.');
  }
  fs.writeFileSync(filePath, bytes);
}

export async function materializeReel(reel, stageDirectory) {
  fs.mkdirSync(stageDirectory, { recursive: true });
  const scratch = path.join(stageDirectory, `.download-${reel.id}-${crypto.randomBytes(4).toString('hex')}.mp4`);
  try {
    await downloadToFile(reel.videoUrl, scratch);
    const encoded = path.join(stageDirectory, `.encoded-${reel.id}.mp4`);
    const posterScratch = path.join(stageDirectory, `.poster-${reel.id}.jpg`);
    transcodeReel(scratch, encoded);
    extractPoster(encoded, posterScratch);
    const videoDigest = crypto.createHash('sha256').update(fs.readFileSync(encoded)).digest('hex').slice(0, 12);
    const posterDigest = crypto.createHash('sha256').update(fs.readFileSync(posterScratch)).digest('hex').slice(0, 12);
    const safeId = reel.id.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '') || 'reel';
    const videoName = `${safeId}-reel-${videoDigest}.mp4`;
    const posterName = `${safeId}-poster-${posterDigest}.jpg`;
    fs.renameSync(encoded, path.join(stageDirectory, videoName));
    fs.renameSync(posterScratch, path.join(stageDirectory, posterName));
    return {
      id: reel.id,
      instagramUrl: reel.instagramUrl,
      publishedAt: reel.publishedAt,
      caption: reel.caption,
      posterUrl: `${REEL_PUBLIC_PREFIX}${posterName}`,
      videoUrl: `${REEL_PUBLIC_PREFIX}${videoName}`,
      alt: reel.alt,
    };
  } catch (error) {
    throw new Error(`Reel download failed for ${reel.id}: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    fs.rmSync(scratch, { force: true });
  }
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

export function publishReels(root, stageRoot, entries) {
  const finalDirectory = path.join(root, 'public', 'media', 'tinkerverse', 'reels');
  const stagedDirectory = path.join(stageRoot, 'public', 'media', 'tinkerverse', 'reels');
  const manifestPath = path.join(root, 'data', REEL_MANIFEST_NAME);
  fs.mkdirSync(finalDirectory, { recursive: true });
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  const keep = new Set();
  for (const entry of entries) {
    for (const publicUrl of [entry.videoUrl, entry.posterUrl]) {
      const filename = path.basename(publicUrl);
      keep.add(filename);
      const stagedPath = path.join(stagedDirectory, filename);
      const finalPath = path.join(finalDirectory, filename);
      if (fs.existsSync(finalPath)) {
        const stagedHash = crypto.createHash('sha256').update(fs.readFileSync(stagedPath)).digest('hex');
        const finalHash = crypto.createHash('sha256').update(fs.readFileSync(finalPath)).digest('hex');
        if (stagedHash !== finalHash) throw new Error(`Content-addressed reel collision: ${filename}`);
      } else {
        fs.renameSync(stagedPath, finalPath);
      }
    }
  }
  const temporaryManifest = path.join(
    path.dirname(manifestPath),
    `.tinkerverse_reels.${process.pid}.${Date.now()}.tmp`,
  );
  durableWrite(temporaryManifest, `${JSON.stringify(entries, null, 2)}\n`);
  fs.renameSync(temporaryManifest, manifestPath);
  for (const filename of fs.readdirSync(finalDirectory)) {
    if (!keep.has(filename)) fs.rmSync(path.join(finalDirectory, filename));
  }
}

export function extractEmbedVideoUrl(html) {
  const marker = 'video_url\\":\\"';
  const start = html.indexOf(marker);
  if (start < 0) return '';
  const from = start + marker.length;
  const end = html.indexOf('\\"', from);
  if (end < 0) return '';
  try {
    const once = JSON.parse(`"${html.slice(from, end)}"`);
    const twice = JSON.parse(`"${once}"`);
    return twice.startsWith('https://') ? twice : '';
  } catch {
    return '';
  }
}

function shortCodeFromUrl(url) {
  return url.match(/\/(?:p|reel)\/([^/?#]+)/)?.[1] ?? '';
}

export async function collectArchiveReels(posts, fetchHtml) {
  const sorted = [...posts].sort((left, right) => String(right.date).localeCompare(String(left.date)));
  const selected = [];
  const skippedVideoUrls = [];
  for (const post of sorted) {
    if (selected.length >= REEL_LIMIT) break;
    const pageUrl = firstString(post?.url);
    const shortCode = shortCodeFromUrl(pageUrl);
    if (!pageUrl || !shortCode) continue;
    const html = await fetchHtml(`${pageUrl.replace(/\/+$/, '')}/embed/captioned/`);
    if (!html.includes('data-media-type="GraphVideo"')) continue;
    const videoUrl = extractEmbedVideoUrl(html);
    if (!videoUrl) {
      skippedVideoUrls.push(pageUrl);
      continue;
    }
    const publishedAt = firstString(post.date);
    const caption = typeof post.caption === 'string' ? post.caption : '';
    selected.push({
      id: shortCode,
      shortCode,
      url: pageUrl,
      instagramUrl: pageUrl,
      timestamp: publishedAt,
      date: publishedAt,
      caption,
      videoUrl,
      type: 'Video',
    });
  }
  return { reels: selectReels(selected), skippedVideoUrls };
}

import React, { useEffect, useRef, useState } from 'react';
import { TinkerVerseReel } from '../types';

const TINKERVERSE_PROFILE = 'https://www.instagram.com/tinker_verse/';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function formatReelDate(publishedAt: string) {
  const [year, month, day] = publishedAt.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return publishedAt.slice(0, 10);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function reelLabel(reel: TinkerVerseReel) {
  const caption = reel.caption.replace(/\s+/g, ' ').trim();
  const date = formatReelDate(reel.publishedAt);
  if (caption) return `Open on Instagram, ${date}: ${caption}`;
  return `Open the ${date} TinkerVerse reel on Instagram`;
}

const ReelCard: React.FC<{ reel: TinkerVerseReel; reducedMotion: boolean }> = ({ reel, reducedMotion }) => {
  const frameRef = useRef<HTMLAnchorElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const showVideo = !reducedMotion && !videoFailed;

  useEffect(() => {
    const frame = frameRef.current;
    const video = videoRef.current;
    if (!frame || !video || !showVideo) return undefined;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      if (entry.intersectionRatio >= 0.6) {
        video.muted = true;
        if (!video.currentSrc) video.src = reel.videoUrl;
        video.play().catch(() => {});
        return;
      }
      video.pause();
    }, { threshold: [0, 0.6, 1] });

    observer.observe(frame);
    return () => {
      observer.disconnect();
      video.pause();
    };
  }, [reel.videoUrl, showVideo]);

  return (
    <a
      ref={frameRef}
      href={reel.instagramUrl}
      target="_blank"
      rel="noopener noreferrer"
      data-reel-id={reel.id}
      aria-label={reelLabel(reel)}
      className="group flex w-[8.75rem] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-white/10 bg-[#07110f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0f18a] sm:w-[9.25rem]"
    >
      <div className="relative aspect-[9/16] bg-[#04110e]">
        <img
          src={reel.posterUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-contain"
        />
        {showVideo && (
          <video
            ref={videoRef}
            poster={reel.posterUrl}
            muted
            loop
            playsInline
            preload="none"
            disablePictureInPicture
            aria-hidden="true"
            onError={() => setVideoFailed(true)}
            className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          />
        )}
      </div>
      <div className="flex min-h-[4.5rem] flex-col gap-1 border-t border-[#e5e55a]/25 bg-[#07110f] px-2.5 py-2">
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#f0f18a]/80">
          {formatReelDate(reel.publishedAt)}
        </div>
        {reel.caption.trim() && (
          <p className="line-clamp-2 text-[11px] leading-snug text-white/75 [overflow-wrap:anywhere]">
            {reel.caption}
          </p>
        )}
      </div>
    </a>
  );
};

const TinkerVerseReels: React.FC<{ reels: TinkerVerseReel[] }> = ({ reels }) => {
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  if (reels.length === 0) return null;

  return (
    <section aria-labelledby="tinkerverse-reels-title" data-tinkerverse-reels className="mb-6 min-w-0">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 id="tinkerverse-reels-title" className="text-xl font-bold text-white sm:text-2xl">Workshop reels</h3>
        <a
          href={TINKERVERSE_PROFILE}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 font-mono text-[11px] tracking-[0.04em] text-[#f0f18a] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0f18a]"
        >
          @tinker_verse
        </a>
      </div>
      <div className="max-w-full min-w-0 overflow-x-auto overscroll-x-contain pb-2">
        <div className="flex w-max gap-3 snap-x snap-mandatory">
          {reels.slice(0, 6).map((reel) => (
            <ReelCard key={reel.id} reel={reel} reducedMotion={reducedMotion} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TinkerVerseReels;

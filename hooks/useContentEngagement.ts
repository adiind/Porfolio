import { useEffect, useRef, type RefObject } from 'react';
import { EngagementAccumulator } from '../lib/engagement';
import { trackEvent } from '../lib/analytics';

export type TrackedContentType =
  | 'section'
  | 'project'
  | 'experience'
  | 'writing'
  | 'profile'
  | 'tinkerverse';

export interface ContentEngagementOptions {
  contentType: TrackedContentType;
  contentId: string;
  section?: string;
  active?: boolean;
  observeVisibility?: boolean;
  threshold?: number;
}

function getDeviceMode(): 'mobile' | 'tablet' | 'desktop' {
  if (window.innerWidth < 640) return 'mobile';
  if (window.innerWidth < 1024) return 'tablet';
  return 'desktop';
}

export function useContentEngagement<T extends HTMLElement = HTMLElement>({
  contentType,
  contentId,
  section,
  active = true,
  observeVisibility = false,
  threshold = 0.5,
}: ContentEngagementOptions): RefObject<T | null> {
  const contentRef = useRef<T>(null);

  useEffect(() => {
    const timer = new EngagementAccumulator();
    let pageVisible = document.visibilityState !== 'hidden';
    let windowFocused = document.hasFocus();
    let contentVisible = !observeVisibility;

    const now = () => performance.now();
    const updateActivity = () => {
      timer.setActive(active && pageVisible && windowFocused && contentVisible, now());
    };
    const flush = () => {
      const engagedSeconds = timer.flush(now());
      if (engagedSeconds === null) return;

      trackEvent('content_engaged', {
        content_type: contentType,
        content_id: contentId,
        section,
        engaged_seconds: engagedSeconds,
        device_mode: getDeviceMode(),
      });
    };

    const handleVisibilityChange = () => {
      pageVisible = document.visibilityState !== 'hidden';
      updateActivity();
    };
    const handleFocus = () => {
      windowFocused = true;
      updateActivity();
    };
    const handleBlur = () => {
      windowFocused = false;
      updateActivity();
    };
    const handlePageHide = () => flush();
    const handlePageShow = () => {
      pageVisible = document.visibilityState !== 'hidden';
      windowFocused = document.hasFocus();
      updateActivity();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);

    let observer: IntersectionObserver | null = null;
    if (observeVisibility && contentRef.current) {
      observer = new IntersectionObserver(([entry]) => {
        contentVisible = entry?.isIntersecting === true && entry.intersectionRatio >= threshold;
        updateActivity();
      }, { threshold });
      observer.observe(contentRef.current);
    }

    updateActivity();

    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
      flush();
    };
  }, [active, contentId, contentType, observeVisibility, section, threshold]);

  return contentRef;
}

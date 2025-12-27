import React, { useState, useCallback, useEffect, useRef } from 'react';
import { TimelineMode } from '../types';
import { smoothScrollTo } from '../utils';

export const useScroll = (
  mode: TimelineMode,
  scrollCooldown: boolean,
  onZoomToIntro: () => void,
  onZoomToNormal: () => void,
  isModalOpen: boolean
) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const isScrollingRef = useRef(false); // Ref for sync access
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);

    // Set scrolling state
    setIsScrolling(true);
    isScrollingRef.current = true; // Sync update

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set timeout to reset scrolling state
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      isScrollingRef.current = false; // Sync update
    }, 150);
  }, []);

  const scrollToPosition = useCallback((top: number) => {
    if (scrollContainerRef.current) {
      smoothScrollTo(scrollContainerRef.current, top);
    }
  }, []);

  // Global wheel handler for intro -> normal transition
  useEffect(() => {
    const handleGlobalWheel = (e: WheelEvent) => {
      if (scrollCooldown || isModalOpen) return;
      if (mode === 'intro' && e.deltaY > 5) {
        onZoomToNormal();
      }
    };
    window.addEventListener('wheel', handleGlobalWheel);
    return () => window.removeEventListener('wheel', handleGlobalWheel);
  }, [mode, scrollCooldown, isModalOpen, onZoomToNormal]);

  // Container wheel handler for normal -> intro transition
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleContainerWheel = (e: WheelEvent) => {
      if (scrollCooldown || isModalOpen) return;
      if (mode === 'normal' && container.scrollTop <= 10 && e.deltaY < -5) {
        onZoomToIntro();
      }
      if (mode === 'fit' && e.deltaY < -5) {
        onZoomToIntro();
      }
    };

    container.addEventListener('wheel', handleContainerWheel);
    return () => container.removeEventListener('wheel', handleContainerWheel);
  }, [mode, scrollCooldown, isModalOpen, onZoomToIntro]);

  return {
    scrollTop,
    scrollContainerRef,
    handleScroll,
    scrollToPosition,
    isScrolling,
    isScrollingRef // Export the Ref
  };
};



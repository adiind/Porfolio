import { useState, useCallback } from 'react';
import { TimelineMode } from '../types';
import { CONFIG } from '../constants';
import { getMonthDiff, parseDate } from '../utils';

const DEFAULT_PIXELS_PER_MONTH = 35;
const MIN_PIXELS_PER_MONTH = 2;
const MAX_PIXELS_PER_MONTH = 150;
const ZOOM_STEP = 5;

export const useZoom = () => {
  const [mode, setMode] = useState<TimelineMode>('intro');
  const [pixelsPerMonth, setPixelsPerMonth] = useState<number>(DEFAULT_PIXELS_PER_MONTH);
  const [scrollCooldown, setScrollCooldown] = useState(false);

  const handleZoom = useCallback((targetMode: TimelineMode, container?: HTMLElement | null) => {
    if (scrollCooldown) return;

    setScrollCooldown(true);
    setTimeout(() => setScrollCooldown(false), 800);

    setMode(targetMode);

    if (targetMode === 'fit') {
      const totalMonths = getMonthDiff(parseDate(CONFIG.startDate), parseDate(CONFIG.endDate));
      const newPixelsPerMonth = Math.max((window.innerHeight - 200) / totalMonths, MIN_PIXELS_PER_MONTH);
      setPixelsPerMonth(newPixelsPerMonth);
      if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (targetMode === 'normal') {
      setPixelsPerMonth(DEFAULT_PIXELS_PER_MONTH);
    } else if (targetMode === 'detail') {
      setPixelsPerMonth(60);
    }
  }, [scrollCooldown]);

  const handleManualZoom = useCallback((direction: 'in' | 'out') => {
    setMode('normal');
    setPixelsPerMonth(prev => {
      const newVal = direction === 'in' 
        ? prev + ZOOM_STEP 
        : prev - ZOOM_STEP;
      return Math.min(Math.max(newVal, MIN_PIXELS_PER_MONTH), MAX_PIXELS_PER_MONTH);
    });
  }, []);

  return {
    mode,
    pixelsPerMonth,
    scrollCooldown,
    handleZoom,
    handleManualZoom,
  };
};




import { useMemo } from 'react';
import { TimelineItem } from '../types';
import { CONFIG } from '../constants';
import { getMonthDiff, parseDate } from '../utils';

export const useTimeline = (
  data: TimelineItem[],
  pixelsPerMonth: number
) => {
  const totalMonths = useMemo(() => {
    return getMonthDiff(parseDate(CONFIG.startDate), parseDate(CONFIG.endDate));
  }, []);

  const contentHeight = useMemo(() => {
    return totalMonths * pixelsPerMonth;
  }, [totalMonths, pixelsPerMonth]);

  const totalContainerHeight = useMemo(() => {
    return contentHeight + 400;
  }, [contentHeight]);

  const calculateItemPosition = useMemo(() => {
    return (item: TimelineItem) => {
      const startDate = parseDate(item.start);
      const endDate = parseDate(item.end);
      const timelineEnd = parseDate(CONFIG.endDate);

      const monthsFromTop = getMonthDiff(endDate, timelineEnd);
      const durationMonths = getMonthDiff(startDate, endDate);

      const top = monthsFromTop * pixelsPerMonth;
      const height = Math.max(durationMonths * pixelsPerMonth, 30);

      return { top, height };
    };
  }, [pixelsPerMonth]);

  return {
    totalMonths,
    contentHeight,
    totalContainerHeight,
    calculateItemPosition,
  };
};




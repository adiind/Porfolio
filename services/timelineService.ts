import { TimelineItem } from '../types';
import { CONFIG } from '../constants';
import { getMonthDiff, parseDate } from '../utils';

export interface ItemPosition {
  top: number;
  height: number;
  isVisible: boolean;
}

export const timelineService = {
  /**
   * Calculate position and dimensions for a timeline item
   */
  calculateItemPosition: (
    item: TimelineItem,
    pixelsPerMonth: number,
    minHeight: number = 30
  ): ItemPosition => {
    const startDate = parseDate(item.start);
    const endDate = parseDate(item.end);
    const timelineEnd = parseDate(CONFIG.endDate);

    const monthsFromTop = getMonthDiff(endDate, timelineEnd);
    const durationMonths = getMonthDiff(startDate, endDate);

    const top = monthsFromTop * pixelsPerMonth;
    const height = Math.max(durationMonths * pixelsPerMonth, minHeight);
    const isVisible = top >= -1000; // Only render if within reasonable viewport

    return { top, height, isVisible };
  },

  /**
   * Get visible items based on viewport
   */
  getVisibleItems: (
    items: TimelineItem[],
    scrollTop: number,
    viewportHeight: number,
    pixelsPerMonth: number
  ): TimelineItem[] => {
    const viewportTop = scrollTop;
    const viewportBottom = scrollTop + viewportHeight;

    return items.filter(item => {
      const position = timelineService.calculateItemPosition(item, pixelsPerMonth);
      const itemBottom = position.top + position.height;
      const itemTop = position.top;

      return (
        (itemTop >= viewportTop - 500 && itemTop <= viewportBottom + 500) ||
        (itemBottom >= viewportTop - 500 && itemBottom <= viewportBottom + 500) ||
        (itemTop <= viewportTop && itemBottom >= viewportBottom)
      );
    });
  },

  /**
   * Get lane style for positioning
   */
  getLaneStyle: (lane: 0 | 1 | 2): { left: string; width: string } => {
    const laneWidth = '30%';
    switch (lane) {
      case 0: return { left: '0%', width: laneWidth };
      case 1: return { left: '35%', width: laneWidth };
      case 2: return { left: '70%', width: laneWidth };
      default: return { left: '35%', width: laneWidth };
    }
  },
};



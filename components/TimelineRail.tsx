
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CONFIG } from '../constants';
import { getMonthDiff, parseDate, getLogarithmicPosition } from '../utils';
import { TimelineItem } from '../types';

interface Props {
  pixelsPerMonth: number;
  totalHeight: number;
  onYearClick: (top: number) => void;
  currentScrollTop: number;
  hoveredItem?: TimelineItem | null;
}

const TimelineRail: React.FC<Props> = ({ pixelsPerMonth, totalHeight, onYearClick, currentScrollTop, hoveredItem }) => {
  const startYear = parseInt(CONFIG.startDate.split('-')[0]);
  const endYear = parseInt(CONFIG.endDate.split('-')[0]);
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i);

  // Show quarters if zoomed in slightly
  const showQuarters = pixelsPerMonth > 15;

  // Hide everything if too zoomed out (Fit Mode) to show clean Poster View
  // Increase threshold so fit mode (usually ppm < 5) hides it
  const isVisible = pixelsPerMonth > 8;

  // Determine active year based on scroll position proximity
  const getIsActive = (top: number) => {
    return Math.abs(currentScrollTop - top) < 400; // Increased range
  };

  const endDate = parseDate(CONFIG.endDate);
  const startDate = parseDate(CONFIG.startDate);
  const totalMonths = getMonthDiff(startDate, endDate);

  // Calculate Bookmark Position if an item is hovered (using logarithmic positioning)
  const bookmarkStyle = (() => {
    if (!hoveredItem) return null;
    const itemStart = parseDate(hoveredItem.start);
    const itemEnd = parseDate(hoveredItem.end);

    const monthsFromTop = getMonthDiff(itemEnd, endDate);
    const durationMonths = getMonthDiff(itemStart, itemEnd);

    const top = getLogarithmicPosition(monthsFromTop, totalMonths, totalHeight);
    const endPos = getLogarithmicPosition(monthsFromTop + durationMonths, totalMonths, totalHeight);
    const height = Math.max(endPos - top, 20);

    let colorClass = 'bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.7)]'; // Default Corp - enhanced glow
    if (hoveredItem.type === 'education') colorClass = 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.7)]';
    if (hoveredItem.id === 'tinkerverse') colorClass = 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.7)]';
    if (hoveredItem.type === 'competition') colorClass = 'bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.7)]';
    if (hoveredItem.type === 'foundational') colorClass = 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.7)]';

    return { top, height, colorClass };
  })();

  if (!isVisible) return null;

  return (
    <div className="absolute left-0 top-0 bottom-0 w-28 md:w-36 border-r border-white/10 z-20 pointer-events-none select-none h-full bg-gradient-to-r from-black/20 to-transparent">

      {/* --- HOVER BOOKMARK INDICATOR --- */}
      <AnimatePresence>
        {bookmarkStyle && (
          <motion.div
            layoutId="bookmark"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0, top: bookmarkStyle.top, height: bookmarkStyle.height }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`absolute right-[-2px] w-1.5 rounded-l-full z-30 ${bookmarkStyle.colorClass}`}
          />
        )}
      </AnimatePresence>

      {years.map((year) => {
        // 1. Calculate Position for JAN 1st of this year relative to Config End Date
        const yearDate = parseDate(`${year}-01-01`);

        // Calculate distance from the Timeline Top (Config.endDate) down to Jan 1st of this year
        const monthsDiff = getMonthDiff(yearDate, endDate);

        // Use logarithmic positioning
        const top = getLogarithmicPosition(monthsDiff, totalMonths, totalHeight);
        const isActive = getIsActive(top);

        // 2. Calculate Position for JUNE 1st (Mid-year)
        const midYearDate = parseDate(`${year}-06-01`);
        const midMonthsDiff = getMonthDiff(midYearDate, endDate);
        const midTop = getLogarithmicPosition(midMonthsDiff, totalMonths, totalHeight);

        return (
          <React.Fragment key={year}>

            {/* --- JAN 1st MARKER (The Year Label) --- */}
            <div
              className="absolute right-0 w-full flex items-start justify-end pr-4 md:pr-6 group pointer-events-auto cursor-pointer"
              style={{ top: `${top}px` }}
              onClick={() => onYearClick(top)}
            >
              <div className={`transition-all duration-500 flex items-center gap-3 translate-y-[-50%] ${isActive ? 'scale-110' : 'opacity-50 hover:opacity-100'}`}>
                {/* Dot - Refined */}
                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${isActive ? 'bg-white shadow-[0_0_10px_white]' : 'bg-white/20'}`} />

                {/* Year Text - Larger and more prominent */}
                <span className={`font-mono text-lg md:text-2xl font-bold transition-all duration-300 ${isActive ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-white/50 group-hover:text-white/80'}`}>
                  {year}
                </span>
              </div>

              {/* Full Width Grid Line for Jan 1st - Subtle Solid */}
              <div className={`absolute top-0 right-0 h-[1px] transition-all duration-500 w-[200vw] origin-right ${isActive ? 'bg-white/10 opacity-100' : 'bg-white/5 opacity-50'}`} />
            </div>

            {/* --- JUNE MARKER (Mid Year) --- */}
            {(showQuarters || pixelsPerMonth > 12) && (
              <div
                className="absolute right-0 w-full flex items-center justify-end pr-6 opacity-30 pointer-events-none"
                style={{ top: `${midTop}px` }}
              >
                <span className="text-[10px] font-mono text-white/50 mr-2 tracking-widest">JUN</span>
                <div className="w-3 h-[1px] bg-white/30" />
              </div>
            )}

            {/* --- QUARTERLY MARKERS (Apr, Oct) --- */}
            {showQuarters && [3, 9].map((monthIndex) => {
              const qDate = new Date(year, monthIndex, 1);
              const qDiff = getMonthDiff(qDate, endDate);
              const qTop = getLogarithmicPosition(qDiff, totalMonths, totalHeight);
              const label = monthIndex === 3 ? 'APR' : 'OCT';

              return (
                <div
                  key={`${year}-${monthIndex}`}
                  className="absolute right-0 w-full flex items-center justify-end pr-6 opacity-20 pointer-events-none"
                  style={{ top: `${qTop}px` }}
                >
                  <span className="text-[9px] font-mono text-white/40 mr-2">{label}</span>
                  <div className="w-2 h-[1px] bg-white/10" />
                </div>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default TimelineRail;

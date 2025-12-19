
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CONFIG } from '../constants';
import { getMonthDiff, parseDate } from '../utils';
import { TimelineItem } from '../types';

interface Props {
  pixelsPerMonth: number;
  onYearClick: (top: number) => void;
  currentScrollTop: number;
  hoveredItem?: TimelineItem | null;
}

const TimelineRail: React.FC<Props> = ({ pixelsPerMonth, onYearClick, currentScrollTop, hoveredItem }) => {
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

  // Calculate Bookmark Position if an item is hovered
  const bookmarkStyle = (() => {
    if (!hoveredItem) return null;
    const itemStart = parseDate(hoveredItem.start);
    const itemEnd = parseDate(hoveredItem.end);
    
    const top = getMonthDiff(itemEnd, endDate) * pixelsPerMonth;
    const height = getMonthDiff(itemStart, itemEnd) * pixelsPerMonth;
    
    let colorClass = 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]'; // Default Corp
    if (hoveredItem.type === 'education') colorClass = 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]';
    if (hoveredItem.id === 'tinkerverse') colorClass = 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]';
    if (hoveredItem.type === 'competition') colorClass = 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.6)]';
    if (hoveredItem.type === 'foundational') colorClass = 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]';

    return { top, height, colorClass };
  })();

  if (!isVisible) return null;

  return (
    <div className="absolute left-0 top-0 bottom-0 w-20 md:w-24 border-r border-white/5 z-20 pointer-events-none select-none h-full">
      
      {/* --- HOVER BOOKMARK INDICATOR --- */}
      <AnimatePresence>
        {bookmarkStyle && (
          <motion.div
            layoutId="bookmark"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0, top: bookmarkStyle.top, height: bookmarkStyle.height }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`absolute right-[-2px] w-1 rounded-l-full z-30 ${bookmarkStyle.colorClass}`}
          />
        )}
      </AnimatePresence>

      {years.map((year) => {
        // 1. Calculate Position for JAN 1st of this year relative to Config End Date
        const yearDate = parseDate(`${year}-01-01`);
        
        // Calculate distance from the Timeline Top (Config.endDate) down to Jan 1st of this year
        const monthsDiff = getMonthDiff(yearDate, endDate);
        
        const top = monthsDiff * pixelsPerMonth;
        const isActive = getIsActive(top);

        // 2. Calculate Position for JUNE 1st (Mid-year)
        const midYearDate = parseDate(`${year}-06-01`);
        const midMonthsDiff = getMonthDiff(midYearDate, endDate);
        const midTop = midMonthsDiff * pixelsPerMonth;

        return (
          <React.Fragment key={year}>
            
            {/* --- JAN 1st MARKER (The Year Label) --- */}
            <div 
              className="absolute right-0 w-full flex items-start justify-end pr-6 group pointer-events-auto cursor-pointer"
              style={{ top: `${top}px` }}
              onClick={() => onYearClick(top)}
            >
              <div className={`transition-all duration-500 flex items-center gap-3 translate-y-[-50%] ${isActive ? 'scale-110' : 'opacity-40 hover:opacity-100'}`}>
                {/* Dot */}
                <div className={`w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_white] transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                
                {/* Year Text */}
                <span className={`font-mono text-sm md:text-lg font-bold transition-colors ${isActive ? 'text-white' : 'text-white/60'}`}>
                  {year}
                </span>
              </div>
              
              {/* Full Width Grid Line for Jan 1st */}
              <div className={`absolute top-0 right-0 h-[1px] border-b border-dashed border-white/20 transition-all duration-500 w-[200vw] origin-right ${isActive ? 'opacity-40' : 'opacity-10'}`} />
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
               const qTop = qDiff * pixelsPerMonth;
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

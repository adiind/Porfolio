import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TimelineItem, TimelineMode, CaseStudy } from '../types';
import { CONFIG, TINKERVERSE_JOURNAL, TINKERVERSE_LOGO } from '../constants';
import { getMonthDiff, parseDate, formatDate, getLogarithmicPosition, getLogarithmicHeight } from '../utils';
import { useProjects } from '../context/ProjectsContext';
import { Trophy, Flower } from 'lucide-react';

interface Props {
  item: TimelineItem;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onLaneHover: (lane: number | null) => void;
  isDimmed: boolean;
  pixelsPerMonth: number;
  totalHeight: number;
  mode: TimelineMode;
  onOpenCaseStudy: (study: CaseStudy) => void;
  onOpenProject?: (project: TimelineItem) => void;
  onOpenTinkerVerse?: () => void;
  isScrolling?: boolean;
  isScrollingRef?: React.MutableRefObject<boolean>;
  layoutMode?: 'absolute' | 'grid';
  isExpanded?: boolean;
  onExpand?: (cardId: string | null) => void;
}

const TimelineEvent: React.FC<Props> = ({
  item,
  isHovered,
  onHover,
  onLaneHover,
  isDimmed,
  pixelsPerMonth,
  totalHeight,
  mode,
  onOpenCaseStudy,
  onOpenProject,
  onOpenTinkerVerse,
  isScrolling = false,
  isScrollingRef,
  layoutMode = 'absolute',
  isExpanded = false,
  onExpand
}) => {
  const isFit = mode === 'fit' || mode === 'intro';
  const isZoomedOut = pixelsPerMonth < 20;
  const isTinkerVerse = item.id === 'tinkerverse';
  const isCompetition = item.type === 'competition';
  const isProject = item.type === 'project';

  // --- GRID MODE RENDER (Original Design - DO NOT MODIFY) ---
  // This is the collapsed view that serves as the visual anchor
  if (layoutMode === 'grid') {
    const handleGridClick = () => {
      if (isTinkerVerse && onOpenTinkerVerse) {
        onOpenTinkerVerse();
      } else if (onOpenProject) {
        onOpenProject(item);
      }
    };

    const handleCaseStudyClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (item.caseStudy) {
        onOpenCaseStudy(item.caseStudy);
      }
    };

    // Dynamic height based on item type (no expansion needed)
    const getHeightClass = () => {
      if (item.type === 'education' || item.type === 'foundational') return 'h-48';
      if (item.id === 'tinkerverse') return 'h-96 md:h-[600px]';
      return 'h-28';
    };

    // TinkerVerse special case
    if (isTinkerVerse) {
      const tinkerStyles = {
        glass: 'bg-amber-500/10 border-t-amber-400/20 border-amber-500/5 shadow-[0_4px_30px_rgba(245,158,11,0.02)]',
        hoverGlass: '',
        text: 'text-amber-50',
        subtext: 'text-amber-200/90',
        icon: 'text-amber-200'
      };
      return (
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: 'tween',
            duration: 0.3,
            ease: 'easeOut',
            layout: { duration: 0.3, ease: 'easeOut' }
          }}
          className="relative w-full h-96 md:h-[600px] rounded-xl overflow-hidden cursor-pointer border border-amber-500/20 bg-amber-500/10 hover:border-amber-400/40 transition-colors duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80"
          onClick={handleGridClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleGridClick();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`Open ${item.title}`}
        >
          <TinkerVerseGrid
            item={item}
            styles={tinkerStyles}
            isFit={true}
          />
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: 'tween',
          duration: 0.3,
          ease: 'easeOut',
          layout: { duration: 0.3, ease: 'easeOut' }
        }}
        className={`relative w-full ${getHeightClass()} rounded-xl overflow-hidden cursor-pointer border border-white/5 bg-white/5 hover:border-white/20 transition-colors duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80`}
        onClick={handleGridClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleGridClick();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Open ${item.title}`}
      >
        {/* Background Image */}
        {item.imageUrl && (
          <>
            <img
              src={item.imageUrl}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-105 group-focus-within:opacity-40 group-focus-within:scale-105"
              style={{ transition: 'opacity 0.3s, transform 0.5s' }}
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-90"
            />
          </>
        )}

        {!item.imageUrl && (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${item.type === 'education' ? 'from-rose-900/40' :
              item.type === 'foundational' ? 'from-emerald-900/40' :
                item.id === 'tinkerverse' ? 'from-amber-900/40' :
                  'from-indigo-900/40'
              } via-black to-black opacity-80`}
          />
        )}

        {/* Content */}
        <div
          className="relative z-10 h-full flex flex-col p-4 justify-end"
        >
          <div
            className="absolute top-3 right-3 text-[9px] font-mono opacity-50 bg-[#0a0a0a] px-1.5 py-0.5 rounded border border-white/5"
          >
            {formatDate(item.start)} — {formatDate(item.end)}
          </div>
          {item.logoUrl && (
            <img
              src={item.logoUrl}
              className="absolute top-3 left-3 w-6 h-6 object-contain opacity-80"
              alt={`${item.company ?? item.title} logo`}
            />
          )}
          <h3
            data-full-timeline-title
            className={`text-sm font-bold text-white leading-tight mb-0.5 group-hover:text-indigo-200 group-focus-within:text-indigo-200 transition-colors ${item.id === 'bits' ? '' : 'line-clamp-1'}`}
          >
            {item.title}
          </h3>
          <div
            className="text-[10px] text-white/60 font-medium uppercase tracking-wide truncate"
          >
            {item.company}
          </div>
        </div>
      </motion.div>
    );
  }

  // --- ABSOLUTE LAYOUT (Legacy/Mobile Internal logic?) ---

  // Calculate position and height using logarithmic scaling
  const startDate = parseDate(item.start);
  const endDate = parseDate(item.end);
  const timelineEnd = parseDate(CONFIG.endDate);
  const timelineStart = parseDate(CONFIG.startDate);
  const totalMonths = getMonthDiff(timelineStart, timelineEnd);
  const monthsFromTop = getMonthDiff(endDate, timelineEnd);
  const durationMonths = getMonthDiff(startDate, endDate);
  const top = getLogarithmicPosition(monthsFromTop, totalMonths, totalHeight);
  const height = getLogarithmicHeight(monthsFromTop, durationMonths, totalMonths, totalHeight, isZoomedOut ? 80 : 100);

  const getStyles = () => {
    if (item.type === 'foundational') {
      return {
        glass: 'bg-emerald-500/20 border-t-emerald-400/30 border-emerald-500/10 shadow-[0_4px_30px_rgba(16,185,129,0.05)]',
        hoverGlass: 'hover:bg-emerald-500/30 hover:border-emerald-300/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]',
        text: 'text-emerald-100',
        subtext: 'text-emerald-400/80',
        icon: 'text-emerald-400'
      };
    }
    switch (item.lane) {
      case 0:
        return {
          glass: 'bg-rose-500/20 border-t-rose-400/30 border-rose-500/10 shadow-[0_4px_30px_rgba(244,63,94,0.05)]',
          hoverGlass: 'hover:bg-rose-500/30 hover:border-rose-300/50 hover:shadow-[0_0_30px_rgba(244,63,94,0.2)]',
          text: 'text-rose-100',
          subtext: 'text-rose-400/80',
          icon: 'text-rose-400'
        };
      case 2:
        return {
          glass: 'bg-amber-500/10 border-t-amber-400/20 border-amber-500/5 shadow-[0_4px_30px_rgba(245,158,11,0.02)]',
          hoverGlass: '',
          text: 'text-amber-50',
          subtext: 'text-amber-200/90',
          icon: 'text-amber-200'
        };
      case 1:
      default:
        return {
          glass: 'bg-indigo-500/20 border-t-indigo-400/30 border-indigo-500/10 shadow-[0_4px_30px_rgba(99,102,241,0.05)]',
          hoverGlass: 'hover:bg-indigo-500/30 hover:border-indigo-300/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]',
          text: 'text-indigo-100',
          subtext: 'text-indigo-400/80',
          icon: 'text-indigo-400'
        };
    }
  };

  const s = getStyles();

  const getLaneStyle = () => {
    const laneWidth = '33%';
    switch (item.lane) {
      case 0: return { left: '0%', width: laneWidth };
      case 1: return { left: '33.5%', width: laneWidth };
      case 2: return { left: '67%', width: laneWidth };
      default: return { left: '33.5%', width: laneWidth };
    }
  };

  const laneStyle = getLaneStyle();

  const highlight = () => {
    if (isScrolling) return;
    onHover(item.id);
    onLaneHover(isCompetition || isProject ? null : item.lane);
  };
  const clearHighlight = () => {
    onHover(null);
    onLaneHover(null);
  };
  const openDetail = () => {
    if (isTinkerVerse) onOpenTinkerVerse?.();
    else onOpenProject?.(item);
  };

  // Date bookmarks and lane cards keep their geometry during pointer movement.
  // Detailed reading belongs to the existing dialog, opened deliberately.
  if (isCompetition || isProject) {
    return (
      <motion.button
        type="button"
        data-timeline-bookmark={item.id}
        initial={false}
        animate={{ y: top }}
        transition={{ type: 'tween', duration: 0.24, ease: 'easeOut' }}
        style={{ position: 'absolute', top: 0, left: '-5.5rem', width: '5rem', height: Math.max(height, 60), zIndex: 20 }}
        onMouseEnter={highlight}
        onMouseMove={highlight}
        onMouseLeave={clearHighlight}
        onFocus={highlight}
        onBlur={clearHighlight}
        onClick={openDetail}
        aria-label={`Open ${item.title}`}
        className={`flex flex-col items-center justify-center gap-2 rounded-l-md border-y border-l p-1 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80 ${isCompetition ? 'bg-purple-900 border-purple-400/40 hover:bg-purple-800' : 'bg-teal-900 border-teal-400/40 hover:bg-teal-800'}`}
      >
        {isCompetition ? <Trophy size={20} /> : <Flower size={20} />}
        <span className="text-[9px] font-bold text-center leading-tight uppercase tracking-wider">{isCompetition ? 'ASEAN Top 10' : 'Project'}</span>
      </motion.button>
    );
  }

  return (
    <motion.div
      data-item-id={item.id}
      initial={false}
      animate={{ y: top }}
      transition={{ type: 'tween', duration: 0.24, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        top: 0,
        ...laneStyle,
        height: isTinkerVerse ? Math.max(height, 320) : height,
        zIndex: 10,
      }}
      onClick={openDetail}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openDetail();
        }
      }}
      onMouseEnter={highlight}
      onMouseMove={highlight}
      onMouseLeave={clearHighlight}
      onFocus={highlight}
      onBlur={clearHighlight}
      role="button"
      tabIndex={0}
      aria-label={`Open ${item.title}`}
      className={`group cursor-pointer overflow-hidden rounded-xl border bg-[#0a0a0a] shadow-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80 ${isHovered ? 'border-indigo-400/70' : 'border-white/15 hover:border-white/35'}`}
    >
      {isTinkerVerse ? <TinkerVerseGrid item={item} styles={s} isFit={true} /> : (
        <>
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.title} className="absolute inset-0 h-full w-full object-cover opacity-65" style={{ objectPosition: 'center top' }} />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-[#101014] to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="relative flex h-full flex-col justify-end p-4">
            <div className="absolute top-3 right-3 rounded border border-white/15 bg-[#0a0a0a] px-1.5 py-0.5 text-[9px] font-mono text-white/75">
              {formatDate(item.start)} — {formatDate(item.end)}
            </div>
            {item.logoUrl && <img src={item.logoUrl} alt={`${item.company ?? item.title} logo`} className="absolute left-3 top-3 h-8 w-8 object-contain" />}
            <h3 data-full-timeline-title className="text-sm font-bold leading-tight text-white line-clamp-2">{item.title}</h3>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-white/70">{item.company}</p>
            {item.headline && height >= 160 && <p className="mt-2 text-xs leading-relaxed text-white/80 line-clamp-2">{item.headline}</p>}
          </div>
        </>
      )}
    </motion.div>
  );
};

const TinkerVerseGrid: React.FC<{
  item: TimelineItem,
  styles: any,
  isFit: boolean,
  onClick?: () => void
}> = ({ item, styles, isFit, onClick }) => {
  const { getProjectsByIds } = useProjects();
  const [previewFailed, setPreviewFailed] = useState(false);
  const leadEntry = TINKERVERSE_JOURNAL[0];
  const leadProject = useMemo(
    () => leadEntry?.projectId ? getProjectsByIds([leadEntry.projectId])[0] : undefined,
    [getProjectsByIds, leadEntry?.projectId],
  );

  return (
    <div
      data-tinkerverse-preview
      onClick={isFit ? undefined : onClick}
      onKeyDown={isFit ? undefined : (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick && onClick();
        }
      }}
      role={isFit ? undefined : 'button'}
      tabIndex={isFit ? undefined : 0}
      aria-label={isFit ? undefined : 'Open TinkerVerse'}
      className={`relative h-full w-full overflow-hidden ${isFit ? '' : 'pointer-events-auto cursor-pointer'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5e55a]`}
    >
      {leadEntry && !previewFailed ? (
        <img
          src={leadEntry.localMediaUrl}
          alt={leadEntry.alt}
          loading="lazy"
          decoding="async"
          onError={() => setPreviewFailed(true)}
          className="absolute inset-0 h-full w-full object-contain opacity-90 transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(145deg,#0b3028,#04110e)]" aria-label="TinkerVerse image unavailable" role="img" />
      )}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#03100d] via-[#03100d]/25 to-black/15" />

      <div className={`relative z-10 flex h-full flex-col ${isFit ? 'p-3 md:p-5' : 'p-3'}`}>
        <div className="flex items-center gap-2">
          <img src={TINKERVERSE_LOGO} alt="" className="h-6 w-6 rounded-md border border-white/15 bg-black object-cover" />
          <span className={`text-[10px] font-bold uppercase tracking-[0.16em] ${styles.text}`}>TinkerVerse</span>
        </div>

        <div className="mt-auto">
          <span className="inline-flex rounded-full border border-[#e5e55a]/35 bg-black/60 px-2 py-1 font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#f0f18a]">
            {item.title}
          </span>
          <h3 className={`mt-2 font-bold leading-tight ${isFit ? 'text-sm md:text-lg' : 'text-sm'} ${styles.text}`}>
            {leadProject?.hero.title ?? item.title}
          </h3>
          <p className={`mt-1 font-mono text-[9px] uppercase tracking-[0.12em] ${styles.subtext}`}>
            {TINKERVERSE_JOURNAL.length} posts · Open
          </p>
        </div>
        {isFit && (
          <div className="mt-3 grid grid-cols-4 gap-1.5" aria-hidden="true">
            {TINKERVERSE_JOURNAL.slice(1, 5).map((entry) => (
              <div key={entry.id} className="h-1 rounded-full bg-[#e5e55a]/55" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Memoized so app-level re-renders (scroll tracking, hover elsewhere) only
// re-render the cards whose props actually changed.
export default React.memo(TimelineEvent);

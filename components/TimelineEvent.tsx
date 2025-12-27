import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimelineItem, TimelineMode, SocialPost, CaseStudy } from '../types';
import SnapdealAdsCard from './SnapdealAdsCard';
import { SOCIAL_POSTS, CONFIG, TINKERVERSE_LOGO } from '../constants';
import { getMonthDiff, parseDate, formatDate } from '../utils';
import { Briefcase, GraduationCap, User, Sparkles, Heart, MessageCircle, ArrowUpRight, Trophy, ScrollText, PlayCircle, Flower, Eye, ExternalLink } from 'lucide-react';

interface Props {
  item: TimelineItem;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onLaneHover: (lane: number | null) => void;
  isDimmed: boolean;
  pixelsPerMonth: number;
  mode: TimelineMode;
  onOpenCaseStudy: (study: CaseStudy) => void;
  onOpenProject?: (project: TimelineItem) => void;
  isScrolling?: boolean;
  isScrollingRef?: React.MutableRefObject<boolean>;
}

const TimelineEvent: React.FC<Props> = ({
  item,
  hoveredId,
  onHover,
  onLaneHover,
  isDimmed,
  pixelsPerMonth,
  mode,
  onOpenCaseStudy,
  onOpenProject,
  isScrolling = false,
  isScrollingRef
}) => {
  // Once hoveredId is set, show it regardless of isScrolling (isScrolling check only prevents setting hover, not showing it)
  const isHovered = hoveredId === item.id;

  // Track if mouse is currently over this card
  const isMouseOverRef = useRef(false);
  const prevIsScrollingRef = useRef(isScrolling);

  // Helper to check scrolling status (combining Prop and Ref for best accuracy)
  const isActuallyScrolling = () => isScrolling || (isScrollingRef?.current === true);

  // Manage which feature card is expanded (by index)
  const [expandedCardIndex, setExpandedCardIndex] = useState<number | null>(null);

  // When scrolling stops and mouse is over card, trigger hover
  useEffect(() => {
    const wasScrolling = prevIsScrollingRef.current;
    prevIsScrollingRef.current = isScrolling;

    // Scrolling just stopped and mouse is over this card
    if (wasScrolling && !isScrolling && isMouseOverRef.current && hoveredId !== item.id) {
      onHover(item.id);
      onLaneHover(item.lane);
    }
  }, [isScrolling, hoveredId, item.id, item.lane, onHover, onLaneHover]);

  // #region agent log
  React.useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/6fde9818-753e-4df5-be34-d19024eb2017', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'debug-session', runId: 'run1', hypothesisId: 'H1', location: 'TimelineEvent.tsx:isHovered', message: 'isHovered calculated', data: { itemId: item.id, hoveredId, isScrolling, isHovered, itemTitle: item.title }, timestamp: Date.now() }) }).catch(() => { });
  }, [hoveredId, isScrolling, item.id, isHovered]);
  // #endregion agent log
  const isFit = mode === 'fit' || mode === 'intro';
  const isZoomedOut = pixelsPerMonth < 20;
  const isTinkerVerse = item.id === 'tinkerverse';
  const isCompetition = item.type === 'competition';
  const isProject = item.type === 'project';
  const isVignette = item.type === 'vignette';

  // Calculate position and height
  const { top, height, isVisible } = useMemo(() => {
    const startDate = parseDate(item.start);
    const endDate = parseDate(item.end);
    const timelineEnd = parseDate(CONFIG.endDate);

    const monthsFromTop = getMonthDiff(endDate, timelineEnd);
    const durationMonths = getMonthDiff(startDate, endDate);

    const calculatedTop = monthsFromTop * pixelsPerMonth;

    // Auto-height adjustment for TinkerVerse to prevent clipping content
    const minHeight = isFit ? (isTinkerVerse ? 20 : 30) : (isZoomedOut ? 40 : 80);
    const calculatedHeight = Math.max(durationMonths * pixelsPerMonth, minHeight);

    return {
      top: calculatedTop,
      height: calculatedHeight,
      isVisible: calculatedTop >= -1000
    };
  }, [item, pixelsPerMonth, isZoomedOut, isFit, isTinkerVerse]);

  if (!isVisible) return null;

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
    const laneWidth = '30%';
    switch (item.lane) {
      case 0: return { left: '0%', width: laneWidth };
      case 1: return { left: '35%', width: laneWidth };
      case 2: return { left: '70%', width: laneWidth };
      default: return { left: '35%', width: laneWidth };
    }
  };

  const laneStyle = getLaneStyle();

  const Icon = () => {
    if (item.type === 'competition') return <Trophy size={isFit ? 12 : 14} className="text-purple-200" />;
    if (item.type === 'project') return <Flower size={isFit ? 12 : 14} className="text-teal-200" />;
    if (item.type === 'vignette') return <Eye size={12} className="text-white" />;
    if (item.type === 'education') return <GraduationCap size={isFit ? 12 : 14} className={s.icon} />;
    if (item.type === 'personal') return <User size={isFit ? 12 : 14} className={s.icon} />;
    if (item.type === 'foundational') return <Sparkles size={isFit ? 12 : 14} className={s.icon} />;
    return <Briefcase size={isFit ? 12 : 14} className={s.icon} />;
  };

  // --- SPECIAL RENDER FOR COMPETITION OR PROJECT OR VIGNETTE (BOOKMARK STYLE) ---
  if (isCompetition || isProject || isVignette) {
    const videoId = item.videoUrl ? (item.videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/) || [])[1] : null;
    const imageUrl = item.imageUrl;

    // Vignette Style: Minimalist White Horizontal Line
    if (isVignette) {
      return (
        <motion.div
          layout
          initial={{ opacity: 0, x: -20 }}
          animate={{ top, opacity: 1, x: 0, zIndex: isHovered ? 60 : 10 }}
          style={{
            position: 'absolute',
            left: '-6rem', // Start from rail area
            width: '5.5rem', // Extend towards timeline
            height: '40px', // Hit area
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start' // Place items at start (left)
          }}
          onMouseEnter={() => {
            isMouseOverRef.current = true;
            if (!isScrolling) {
              onHover(item.id);
              onLaneHover(null);
            }
          }}
          onMouseMove={() => {
            if (!isScrolling && hoveredId !== item.id) {
              onHover(item.id);
              onLaneHover(null);
            }
          }}
          onMouseLeave={() => {
            isMouseOverRef.current = false;
            onHover(null);
            onLaneHover(null);
          }}
          onClick={() => onOpenProject && onOpenProject(item)}
          className="group cursor-pointer flex-row-reverse" // Flex reverse or manual placement
        >
          {/* Glowing Horizontal Line */}
          <div className={`w-full h-[1px] bg-white/50 relative transition-all duration-300 ${!isScrolling ? 'group-hover:w-[140%] group-hover:h-[3px] group-hover:bg-white group-hover:shadow-[0_0_35px_rgba(255,255,255,1)]' : 'blur-[1px]'} rounded-full`}>
            {/* Bigger Eye Icon at the LEFT End */}
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-sm border border-white/30 p-1.5 rounded-full ${!isScrolling ? 'group-hover:scale-125 group-hover:bg-black group-hover:border-white group-hover:shadow-[0_0_25px_white]' : ''} transition-all duration-300`}>
              <Eye size={18} className={`transition-colors duration-300 ${!isScrolling ? 'text-white/50 group-hover:text-white' : 'text-white/30'}`} />
            </div>
          </div>

          {/* Simple Tooltip */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 30 }}
                exit={{ opacity: 0 }}
                className="absolute left-full top-1/2 -translate-y-1/2 whitespace-nowrap bg-white/10 backdrop-blur-md border border-white/50 px-3 py-1.5 rounded text-xs font-mono tracking-widest text-white uppercase shadow-[0_0_25px_rgba(255,255,255,0.5)]"
              >
                {item.title}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      );
    }

    // Theme logic: Purple for Competition, Teal for Project
    const theme = isCompetition
      ? {
        grad: 'from-purple-900/80 to-purple-600/80 border-purple-400/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]',
        icon: <Trophy size={20} className="text-white drop-shadow-md" />,
        popoverBg: 'bg-[#1a1a1a] border-purple-500/40 hover:border-purple-400',
        headerBg: 'bg-purple-900/30 border-purple-500/20',
        headerText: 'text-purple-200',
        subText: 'text-purple-300',
        badgeText: 'National Winner',
        accent: 'text-purple-400',
        bulletDot: 'bg-purple-500'
      }
      : {
        grad: 'from-cyan-900/80 to-teal-600/80 border-teal-400/30 shadow-[0_0_15px_rgba(20,184,166,0.3)]',
        icon: <Flower size={20} className="text-white drop-shadow-md" />,
        popoverBg: 'bg-[#1a1a1a] border-teal-500/40 hover:border-teal-400',
        headerBg: 'bg-teal-900/30 border-teal-500/20',
        headerText: 'text-teal-200',
        subText: 'text-teal-300',
        badgeText: 'Project',
        accent: 'text-teal-400',
        bulletDot: 'bg-teal-500'
      };

    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -50 }}
        animate={{
          top: top,
          opacity: 1,
          x: 0,
          zIndex: isHovered ? 60 : 10
        }}
        style={{
          position: 'absolute',
          left: '-5.5rem',
          width: '5rem',
          height: Math.max(height, 60),
        }}
        onMouseEnter={() => {
          isMouseOverRef.current = true;
          if (!isScrolling) {
            onHover(item.id);
            onLaneHover(null);
          }
        }}
        onMouseMove={() => {
          if (!isScrolling && hoveredId !== item.id) {
            onHover(item.id);
            onLaneHover(null);
          }
        }}
        onMouseLeave={() => {
          isMouseOverRef.current = false;
          onHover(null);
          onLaneHover(null);
        }}
        className="group flex flex-col items-end"
      >
        {/* The Bookmark Tab */}
        <div className={`
          w-full h-full rounded-l-md bg-gradient-to-r ${theme.grad}
          border-y border-l backdrop-blur-md
          flex flex-col items-center justify-center gap-2 p-1 cursor-pointer
          transition-all duration-300 ${!isScrolling ? 'group-hover:w-[5.5rem] group-hover:brightness-125' : ''}
        `}>
          {theme.icon}
          {!isFit && (
            <span className="text-[9px] font-bold text-white/90 text-center leading-tight uppercase tracking-wider">
              {theme.badgeText}
            </span>
          )}
        </div>

        {/* Hover: Detailed Popover Card */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`absolute left-[110%] top-0 w-[400px] max-w-[80vw] rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col cursor-pointer transition-colors border ${theme.popoverBg}`}
              onClick={() => onOpenProject && onOpenProject(item)}
            >
              {/* Header */}
              <div className={`p-3 border-b flex items-center justify-between ${theme.headerBg}`}>
                <div className="flex items-center gap-2">
                  {isCompetition ? <Trophy size={14} className={theme.accent} /> : <Flower size={14} className={theme.accent} />}
                  <span className={`text-xs font-bold uppercase tracking-wider ${theme.headerText}`}>{item.type}</span>
                </div>
                <span className="text-[10px] text-white/40">{formatDate(item.start)}</span>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                {item.companyUrl ? (
                  <a
                    href={item.companyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-sm mb-3 ${theme.subText} hover:underline hover:text-white transition-colors flex items-center gap-1 w-fit`}
                    onClick={(e) => e.stopPropagation()} // Prevent card click
                  >
                    {item.company}
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <p className={`text-sm mb-3 ${theme.subText}`}>{item.company}</p>
                )}
                <p className="text-xs text-gray-300 mb-4 leading-relaxed line-clamp-3">{item.summary}</p>

                {/* Video/Image Embed Thumbnail */}
                {videoId ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10 group/vid">
                    <img
                      src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                      alt="Thumbnail"
                      className="w-full h-full object-cover opacity-80 group-hover/vid:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover/vid:bg-black/20 transition-colors">
                      <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center shadow-lg transform group-hover/vid:scale-110 transition-transform ${isCompetition ? 'bg-purple-600' : 'bg-teal-600'}`}>
                        <PlayCircle size={20} fill="currentColor" />
                      </div>
                    </div>
                  </div>
                ) : imageUrl ? (
                  // Image thumbnail if video is missing
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10 group/img">
                    <img
                      src={imageUrl}
                      alt="Project"
                      className="w-full h-full object-cover opacity-90 group-hover/img:opacity-100 transition-opacity"
                    />
                  </div>
                ) : (
                  // Fallback visual if no media
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
                    {isCompetition ? <Trophy size={48} className="text-white/10" /> : <Flower size={48} className="text-white/10" />}
                  </div>
                )}

                {/* Bullets */}
                <ul className="mt-4 space-y-2">
                  {item.bullets?.slice(0, 2).map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-[10px] text-gray-400">
                      <span className={`w-1 h-1 rounded-full mt-1.5 shrink-0 ${theme.bulletDot}`} />
                      {b}
                    </li>
                  ))}
                </ul>

                <div className={`mt-4 text-center text-xs font-bold uppercase tracking-wider ${theme.accent}`}>Click for details</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // --- TINKERVERSE RENDER ---
  if (isTinkerVerse) {
    return (
      <div
        className={`rounded-lg md:rounded-xl backdrop-blur-md transition-colors duration-500 border border-transparent ${s.glass}`}
        style={{
          position: 'absolute',
          ...laneStyle,
          top: top,
          // Auto height to fit grid content + padding
          height: isFit ? height : 'auto',
          minHeight: height,
          opacity: isDimmed ? 0.1 : 1,
          filter: isDimmed ? 'grayscale(100%) blur(2px)' : 'grayscale(0%) blur(0px)',
          zIndex: isHovered ? 50 : 10
        }}
        onMouseEnter={() => {
          isMouseOverRef.current = true;
          if (!isScrolling) {
            onHover(item.id);
            onLaneHover(item.lane);
          }
        }}
        onMouseMove={() => {
          if (!isScrolling && hoveredId !== item.id) {
            onHover(item.id);
            onLaneHover(item.lane);
          }
        }}
        onMouseLeave={() => {
          isMouseOverRef.current = false;
          onHover(null);
          onLaneHover(null);
        }}
      >
        <TinkerVerseGrid
          item={item}
          posts={SOCIAL_POSTS}
          height={height}
          pixelsPerMonth={pixelsPerMonth}
          styles={s}
          isFit={isFit}
        />
      </div>
    );
  }

  // --- STANDARD CARD RENDER ---
  return (
    <motion.div
      onMouseEnter={() => {
        isMouseOverRef.current = true;
        if (!isActuallyScrolling()) {
          onHover(item.id);
          onLaneHover(item.lane);
        }
      }}
      onMouseMove={() => {
        // Also trigger on mouse move - handles case where card scrolls under cursor
        if (!isActuallyScrolling() && hoveredId !== item.id) {
          onHover(item.id);
          onLaneHover(item.lane);
        }
      }}
      onMouseLeave={() => {
        isMouseOverRef.current = false;
        // Only clear hover if NOT scrolling
        if (!isActuallyScrolling()) {
          onHover(null);
          onLaneHover(null);
        }
      }}
      initial={{ opacity: 0, y: 100 }}
      animate={{
        top: top,
        opacity: isDimmed ? 0.1 : 1,
        scale: isDimmed ? 0.98 : isHovered ? 1.05 : 1,
        y: 0,
        filter: isDimmed ? 'grayscale(100%) blur(2px)' : 'grayscale(0%) blur(0px)',
        zIndex: isHovered ? 50 : 10,
      }}
      transition={{
        type: 'spring',
        stiffness: 100,
        damping: 25,
        layout: { duration: 0.4, ease: 'easeOut' }
      }}
      style={{
        position: 'absolute',
        ...laneStyle,
        ...(isHovered && !isFit ? {
          height: 'auto',
          width: '450px',
          maxWidth: '85vw',
          left: laneStyle.left,
          right: 'auto',
          minHeight: `${height}px`
        } : {
          height: `${height}px`,
          minHeight: `${height}px`
        }),
      }}
      className={`
        rounded-lg md:rounded-xl backdrop-blur-md cursor-pointer overflow-hidden group
        transition-colors duration-500 border border-transparent
        flex flex-col
        ${s.glass} ${!isFit && s.hoverGlass}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 pointer-events-none" />
      <div className={`flex flex-col relative z-10 ${isFit ? 'h-full p-2 justify-center' : 'p-3 md:p-4'}`}>
        <div className="flex justify-between items-start gap-2">
          <motion.div className="flex-1 min-w-0 relative">
            {/* Header Row */}
            <div className="flex justify-between items-start w-full">
              {(!isZoomedOut || isHovered) && !isFit && (
                <div className="flex items-center gap-2 mb-1.5">
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold ${s.subtext}`}
                  >
                    <Icon />
                    <span>{item.type}</span>
                  </motion.div>
                </div>
              )}
              {/* Optional University/Corporate Logo in Header */}
              {item.logoUrl && !isFit && (
                <div className="flex-shrink-0 ml-2">
                  <img
                    src={item.logoUrl}
                    alt="Logo"
                    // CONDITIONAL FILTER: Keep white monochrome only for Northwestern
                    className={`w-8 h-8 md:w-10 md:h-10 object-contain ${item.id === 'ms-edi'
                      ? 'opacity-80 filter brightness-0 invert'
                      : 'opacity-100'
                      }`}
                  />
                </div>
              )}
            </div>

            <motion.h3 className={`font-bold leading-tight truncate group-hover:whitespace-normal ${s.text} ${isFit ? 'text-[11px] md:text-sm' : 'text-sm md:text-base'} ${item.logoUrl ? 'pr-2' : ''}`}>
              {item.title}
            </motion.h3>
            <motion.p className={`font-medium mt-0.5 truncate group-hover:whitespace-normal ${s.subtext} ${isFit ? 'text-[9px] md:text-xs opacity-70' : 'text-xs'}`}>
              {item.company}
            </motion.p>
          </motion.div>
        </div>

        <AnimatePresence>
          {(isHovered && !isFit) && (
            <motion.div
              layout
              initial={{ opacity: 0, maxHeight: 0 }}
              animate={{ opacity: 1, maxHeight: 2000 }}
              exit={{ opacity: 0, maxHeight: 0 }}
              transition={{
                maxHeight: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.3 }
              }}
              style={{ overflow: 'hidden' }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              <p className={`text-xs leading-relaxed mb-3 opacity-90 ${s.text}`}>{item.summary}</p>
              <ul className={`space-y-1.5 text-xs ${s.subtext}`}>
                {item.bullets?.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-current opacity-60 shrink-0" />
                    <span className="opacity-90">{bullet}</span>
                  </li>
                ))}
              </ul>

              {/* SKILLS PILLS (Footer) */}
              {item.skills && (
                <motion.div layout className="mt-4 pt-3 border-t border-white/10">
                  <div className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-2">Toolkit</div>
                  <div className="flex flex-wrap gap-2">
                    {item.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className={`text-[9px] uppercase tracking-wide border px-2 py-1 rounded-full bg-white/5 whitespace-nowrap ${item.lane === 0 ? 'border-rose-500/30 text-rose-100' : 'border-white/20 text-white/80'}`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* AWARD MODULE (Gold Theme) */}
              {item.award && (
                <motion.div layout className="mt-4 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-lg p-3 text-amber-900 shadow-lg relative overflow-hidden border border-yellow-200">
                  <div className="flex gap-3 items-center relative z-10">
                    <div className="w-10 h-10 rounded-full bg-yellow-300 flex items-center justify-center text-yellow-700 shadow-inner flex-shrink-0">
                      <Trophy size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] uppercase font-bold tracking-widest text-amber-700 mb-0.5">Achievement</div>
                      <h4 className="text-xs font-bold leading-tight truncate">{item.award.title}</h4>
                      <p className="text-[10px] text-amber-800/80 mt-1 line-clamp-2">{item.award.summary}</p>
                    </div>
                  </div>
                  {/* Decoration */}
                  <div className="absolute -right-4 -bottom-4 text-yellow-500/10">
                    <Trophy size={80} />
                  </div>
                </motion.div>
              )}

              {/* FEATURE CARDS (Snapdeal Ads etc.) */}
              {item.featureCards && item.featureCards.map((card, idx) => (
                <SnapdealAdsCard
                  key={idx}
                  data={card}
                  isExpanded={expandedCardIndex === idx}
                  onToggle={() => setExpandedCardIndex(expandedCardIndex === idx ? null : idx)}
                />
              ))}

              {/* PUBLICATION MODULE (Blue Theme) */}
              {item.publication && (
                <motion.div layout className="mt-4 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg p-3 text-blue-900 shadow-lg relative overflow-hidden border border-blue-200">
                  <div className="flex gap-3 items-center relative z-10">
                    <div className="w-10 h-10 rounded-full bg-blue-300 flex items-center justify-center text-blue-700 shadow-inner flex-shrink-0">
                      <ScrollText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] uppercase font-bold tracking-widest text-blue-700 mb-0.5">Publication</div>
                      <h4 className="text-xs font-bold leading-tight truncate">{item.publication.title}</h4>
                      <p className="text-[10px] text-blue-800/80 mt-1 line-clamp-2">{item.publication.summary}</p>
                      {item.publication.journal && (
                        <p className="text-[9px] text-blue-900/60 mt-0.5 italic">{item.publication.journal}</p>
                      )}
                    </div>
                  </div>
                  {/* Decoration */}
                  <div className="absolute -right-4 -bottom-4 text-blue-500/10">
                    <ScrollText size={80} />
                  </div>
                </motion.div>
              )}

              {/* CASE STUDY MODULE (High Contrast) */}
              {item.caseStudy && (
                <motion.div
                  layout
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCaseStudy(item.caseStudy!);
                  }}
                  className="mt-4 bg-gray-100 rounded-lg p-3 text-gray-900 shadow-lg transform translate-y-0 relative overflow-hidden group/cs hover:bg-white transition-colors cursor-pointer"
                >
                  <div className="flex gap-3 items-center relative z-10">
                    {item.caseStudy.thumbnailUrl && (
                      <img
                        src={item.caseStudy.thumbnailUrl}
                        alt="Thumbnail"
                        className="w-10 h-10 rounded bg-gray-200 object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className={`text-[10px] uppercase font-bold tracking-widest mb-0.5 ${item.caseStudy.themeColor === 'orange' ? 'text-orange-600' : 'text-indigo-600'}`}>Case Study</div>
                      <h4 className="text-xs font-bold leading-tight truncate">{item.caseStudy.title}</h4>
                      <p className="text-[10px] text-gray-600 mt-1 line-clamp-2">{item.caseStudy.summary}</p>
                    </div>
                    <div className="bg-gray-200 p-1.5 rounded-full group-hover/cs:bg-indigo-100 transition-colors">
                      <ArrowUpRight size={14} className="text-gray-400 group-hover/cs:text-indigo-600 transition-colors" />
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const TinkerVerseGrid: React.FC<{
  item: TimelineItem,
  posts: SocialPost[],
  height: number,
  pixelsPerMonth: number,
  styles: any,
  isFit: boolean
}> = ({ item, posts, height, pixelsPerMonth, styles, isFit }) => {
  const startDate = parseDate(item.start);
  const endDate = parseDate(item.end);
  const [hoveredPost, setHoveredPost] = useState<SocialPost | null>(null);

  const rows = useMemo(() => {
    const r = [];
    let current = new Date(endDate);
    current.setDate(1);
    while (current >= startDate) {
      const year = current.getFullYear();
      const month = current.getMonth();
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      const monthPosts = posts.filter(p => p.date.startsWith(monthKey));
      r.push({ date: new Date(current), monthKey, posts: monthPosts });
      current.setMonth(current.getMonth() - 1);
    }
    return r;
  }, [startDate, endDate, posts]);

  const rowHeight = pixelsPerMonth;

  if (isFit) {
    const allPosts = rows.flatMap(r => r.posts);
    const visiblePosts = allPosts.slice(0, 48);
    return (
      <div className="w-full h-full flex flex-col p-2 overflow-hidden relative">
        <div className="flex flex-wrap content-start gap-[2px] mb-1 overflow-hidden h-[60%] opacity-80">
          {visiblePosts.map((post, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-[1px] bg-amber-400" />
          ))}
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={`fill-${i}`} className="w-1.5 h-1.5 rounded-[1px] bg-amber-900/20" />
          ))}
        </div>
        <div className="mt-auto relative z-10 bg-gradient-to-t from-black/80 to-transparent pt-2">
          <h3 className={`font-bold text-[10px] leading-tight ${styles.text}`}>{item.title}</h3>
          <p className={`text-[9px] opacity-70 ${styles.subtext}`}>{item.company}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full p-2 pb-4 flex flex-col items-center pointer-events-auto">
      <div className="flex items-center gap-2 mb-2 w-full px-2 opacity-80 sticky top-0 z-10">
        <img src={TINKERVERSE_LOGO} alt="TV" className="w-4 h-4 rounded-sm bg-white p-[1px] object-cover" />
        <span className={`text-xs font-bold uppercase tracking-widest ${styles.text}`}>TinkerVerse</span>
      </div>
      <div className="w-full flex-1 flex flex-col relative">
        {rows.map((row, idx) => (
          <div
            key={row.monthKey}
            className="flex items-center gap-2 w-full border-b border-amber-500/5 hover:bg-amber-500/5 transition-colors relative"
            style={{ height: `${rowHeight}px`, minHeight: '24px' }}
          >
            {rowHeight > 20 && (
              <div className="w-8 text-[9px] font-mono text-amber-200/40 text-right shrink-0">
                {row.date.toLocaleDateString('en-US', { month: 'short' })}
              </div>
            )}
            <div className="flex-1 flex flex-wrap gap-1 items-center content-center h-full">
              {Array.from({ length: 8 }).map((_, i) => {
                const post = row.posts[i];
                const hasPost = !!post;
                return (
                  <div
                    key={i}
                    onMouseEnter={(e) => {
                      if (hasPost) {
                        e.stopPropagation();
                        setHoveredPost(post);
                      }
                    }}
                    onMouseLeave={() => hasPost && setHoveredPost(null)}
                    onClick={(e) => {
                      if (hasPost) {
                        e.stopPropagation();
                        window.open(post.url, '_blank');
                      }
                    }}
                    className={`
                         w-3 h-3 md:w-4 md:h-4 rounded-[3px] transition-all duration-300 relative
                         ${hasPost
                        ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)] cursor-pointer hover:scale-125 hover:z-[200] hover:bg-amber-200'
                        : 'bg-amber-900/20'
                      }
                       `}
                  >
                    <AnimatePresence>
                      {hoveredPost === post && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, x: 20 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          style={{ zIndex: 9999 }} // Force extreme Z-index
                          className="fixed md:absolute right-full mr-4 top-1/2 -translate-y-1/2 w-64 bg-[#111] border border-amber-500/30 rounded-lg shadow-2xl p-3 overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-amber-500/5 pointer-events-none" />
                          <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                              <img src={TINKERVERSE_LOGO} className="w-6 h-6 rounded-full bg-white p-0.5 object-cover" alt="TV" />
                              <span className="text-[10px] font-bold text-amber-100">tinker_verse</span>
                              <span className="text-[9px] text-white/40 ml-auto">{formatDate(post.date)}</span>
                            </div>
                            <p className="text-[10px] text-white/80 line-clamp-3 mb-2 leading-relaxed">{post.caption}</p>
                            <div className="flex items-center gap-3 text-white/50 text-[10px] border-t border-white/10 pt-2">
                              <div className="flex items-center gap-1"><Heart size={10} className="text-red-400" /> {post.likes}</div>
                              <div className="flex items-center gap-1"><MessageCircle size={10} /> {post.comments}</div>
                              <div className="ml-auto text-[9px] text-amber-400">Click to view</div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineEvent;
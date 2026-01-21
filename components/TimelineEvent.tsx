import React, { useMemo, useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useInView } from 'framer-motion';
import { TimelineItem, TimelineMode, SocialPost, CaseStudy } from '../types';
import SnapdealAdsCard from './SnapdealAdsCard';
import { SOCIAL_POSTS, CONFIG, TINKERVERSE_LOGO } from '../constants';
import { getMonthDiff, parseDate, formatDate, getLogarithmicPosition, getLogarithmicHeight, mapTimelineItemToProject } from '../utils';
import { PROJECTS } from '../data/projects';
import { Briefcase, GraduationCap, User, Sparkles, Heart, MessageCircle, ArrowUpRight, Trophy, ScrollText, PlayCircle, Flower, Eye, ExternalLink } from 'lucide-react';

interface Props {
  item: TimelineItem;
  hoveredId: string | null;
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
  hoveredId,
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
  // Once hoveredId is set, show it regardless of isScrolling (isScrolling check only prevents setting hover, not showing it)
  const isHovered = hoveredId === item.id;

  // Track if mouse is currently over this card
  const isMouseOverRef = useRef(false);
  const prevIsScrollingRef = useRef(isScrolling);

  // Scroll-triggered reveal animation
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, {
    once: true,           // Only animate once (don't re-hide on scroll up)
    margin: "-80px"       // Trigger when card is 80px into viewport
  });

  // Helper to check scrolling status (combining Prop and Ref for best accuracy)
  const isActuallyScrolling = () => isScrolling || (isScrollingRef?.current === true);

  // Manage which feature card is expanded (by index)
  const [expandedCardIndex, setExpandedCardIndex] = useState<number | null>(null);

  // State for toolkit skill tooltips
  const [hoveredToolkitSkill, setHoveredToolkitSkill] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });


  // 3D Tilt Logic
  const tiltX = useMotionValue(0.5);
  const tiltY = useMotionValue(0.5);
  const springX = useSpring(tiltX, { stiffness: 300, damping: 30 });
  const springY = useSpring(tiltY, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(springY, [0, 1], [8, -8]); // Reduced tilt to 8deg
  const rotateY = useTransform(springX, [0, 1], [-8, 8]);

  const handleTiltMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    tiltX.set(x);
    tiltY.set(y);
  };

  const handleTiltLeave = () => {
    tiltX.set(0.5);
    tiltY.set(0.5);
  };

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


  const isFit = mode === 'fit' || mode === 'intro';
  const isZoomedOut = pixelsPerMonth < 20;
  const isTinkerVerse = item.id === 'tinkerverse';
  const isCompetition = item.type === 'competition';
  const isProject = item.type === 'project';
  const isVignette = false;

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
          layoutId={`timeline-card-${item.id}`}
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: 'tween',
            duration: 0.3,
            ease: 'easeOut',
            layout: { duration: 0.3, ease: 'easeOut' }
          }}
          className="relative w-full h-96 md:h-[600px] rounded-xl overflow-hidden cursor-pointer border border-amber-500/20 bg-amber-500/10 hover:border-amber-400/40 transition-colors duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] group"
          onClick={handleGridClick}
        >
          <TinkerVerseGrid
            item={item}
            posts={SOCIAL_POSTS}
            height={600}
            pixelsPerMonth={pixelsPerMonth}
            styles={tinkerStyles}
            isFit={true}
            onClick={handleGridClick}
          />
        </motion.div>
      );
    }

    return (
      <motion.div
        layoutId={`timeline-card-${item.id}`}
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: 'tween',
          duration: 0.3,
          ease: 'easeOut',
          layout: { duration: 0.3, ease: 'easeOut' }
        }}
        className={`relative w-full ${getHeightClass()} rounded-xl overflow-hidden cursor-pointer border border-white/5 bg-white/5 hover:border-white/20 transition-colors duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] group`}
        onClick={handleGridClick}
      >
        {/* Background Image */}
        {item.imageUrl && (
          <>
            <img
              src={item.imageUrl}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-105"
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
            className="absolute top-3 right-3 text-[9px] font-mono opacity-50 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/5"
          >
            {formatDate(item.start)} — {formatDate(item.end)}
          </div>
          {item.logoUrl && (
            <img
              src={item.logoUrl}
              className={`absolute top-3 left-3 w-6 h-6 object-contain opacity-70 ${item.id === 'ms-edi' ? 'brightness-0 invert' : ''}`}
              alt="Logo"
            />
          )}
          <h3
            className="text-sm font-bold text-white leading-tight mb-0.5 line-clamp-1 group-hover:text-indigo-200 transition-colors"
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
  const { top, height, isVisible } = useMemo(() => {
    const startDate = parseDate(item.start);
    const endDate = parseDate(item.end);
    const timelineEnd = parseDate(CONFIG.endDate);
    const timelineStart = parseDate(CONFIG.startDate);
    const totalMonths = getMonthDiff(timelineStart, timelineEnd);

    const monthsFromTop = getMonthDiff(endDate, timelineEnd);
    const durationMonths = getMonthDiff(startDate, endDate);

    // Use logarithmic positioning for compressed older items
    const calculatedTop = getLogarithmicPosition(monthsFromTop, totalMonths, totalHeight);

    // Auto-height adjustment for TinkerVerse to prevent clipping content
    // Increased minHeight to prevent empty box rendering with aggressive compression
    const minHeight = isFit ? (isTinkerVerse ? 30 : 40) : (isZoomedOut ? 80 : 100);
    const calculatedHeight = getLogarithmicHeight(monthsFromTop, durationMonths, totalMonths, totalHeight, minHeight);

    return {
      top: calculatedTop,
      height: calculatedHeight,
      isVisible: calculatedTop >= -1000
    };
  }, [item, pixelsPerMonth, totalHeight, isZoomedOut, isFit, isTinkerVerse]);

  if (!isVisible && layoutMode === 'absolute') return null;

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

  const Icon = () => {
    if (item.type === 'competition') return <Trophy size={isFit ? 12 : 14} className="text-purple-200" />;
    if (item.type === 'project') return <Flower size={isFit ? 12 : 14} className="text-teal-200" />;

    if (item.type === 'education') return <GraduationCap size={isFit ? 12 : 14} className={s.icon} />;
    if (item.type === 'personal') return <User size={isFit ? 12 : 14} className={s.icon} />;
    if (item.type === 'foundational') return <Sparkles size={isFit ? 12 : 14} className={s.icon} />;
    return <Briefcase size={isFit ? 12 : 14} className={s.icon} />;
  };

  // --- SPECIAL RENDER FOR COMPETITION OR PROJECT OR VIGNETTE (BOOKMARK STYLE) ---
  if ((isCompetition || isProject) && layoutMode !== 'grid') {
    const videoId = item.videoUrl ? (item.videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/) || [])[1] : null;
    const imageUrl = item.imageUrl;



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
        ref={cardRef}
        layout
        initial={{ opacity: 0, x: -50 }}
        animate={{
          top: top,
          opacity: isInView ? 1 : 0,
          x: isInView ? 0 : -50,
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
          border-y border-l
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
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        className={`rounded-lg md:rounded-xl transition-colors duration-500 border border-transparent ${s.glass}`}
        style={{
          position: 'absolute',
          ...laneStyle,
          top: top,
          // Auto height to fit grid content + padding
          height: isFit ? height : 'auto',
          minHeight: height,
          filter: isDimmed ? 'grayscale(100%) blur(2px)' : 'grayscale(0%) blur(0px)',
          zIndex: isHovered ? 50 : 10,
          perspective: 1000,
          rotateX: isHovered && !isScrolling ? rotateX : 0,
          rotateY: isHovered && !isScrolling ? rotateY : 0,
        }}
        animate={{
          opacity: isInView ? (isDimmed ? 0.1 : 1) : 0,
          y: isInView ? 0 : 40,
          scale: isInView ? (isHovered ? 1.15 : 1) : 0.95,
        }}
        transition={{
          type: 'spring',
          stiffness: 100,
          damping: 25,
          layout: { duration: 0.5, ease: [0.32, 0.72, 0, 1] }
        }}
        onMouseEnter={(e) => {
          isMouseOverRef.current = true;
          if (!isScrolling) {
            onHover(item.id);
            onLaneHover(item.lane);
            handleTiltMove(e);
          }
        }}
        onMouseMove={(e) => {
          if (!isScrolling && hoveredId !== item.id) {
            onHover(item.id);
            onLaneHover(item.lane);
          }
          if (!isScrolling) {
            handleTiltMove(e);
          }
        }}
        onMouseLeave={() => {
          isMouseOverRef.current = false;
          onHover(null);
          onLaneHover(null);
          handleTiltLeave();
        }}
      >
        <TinkerVerseGrid
          item={item}
          posts={SOCIAL_POSTS}
          height={height}
          pixelsPerMonth={pixelsPerMonth}
          styles={s}
          isFit={isFit}
          onClick={() => !isScrolling && onOpenTinkerVerse && onOpenTinkerVerse()}
        />
      </motion.div>
    );
  }

  // --- STANDARD CARD RENDER ---
  return (
    <motion.div
      layoutId={`timeline-card-${item.id}`}
      ref={cardRef}
      data-item-id={item.id}
      onClick={() => onOpenProject && onOpenProject(item)}
      onMouseEnter={(e) => {
        isMouseOverRef.current = true;
        if (!isActuallyScrolling()) {
          onHover(item.id);
          onLaneHover(item.lane);
          handleTiltMove(e);
        }
      }}
      onMouseMove={(e) => {
        // Also trigger on mouse move - handles case where card scrolls under cursor
        if (!isActuallyScrolling()) {
          if (hoveredId !== item.id) {
            onHover(item.id);
            onLaneHover(item.lane);
          }
          handleTiltMove(e);
        }
      }}
      onMouseLeave={() => {
        isMouseOverRef.current = false;
        handleTiltLeave();
        // Only clear hover if NOT scrolling
        if (!isActuallyScrolling()) {
          onHover(null);
          onLaneHover(null);
        }
      }}
      initial={{ opacity: 0, y: 60, scale: 0.95 }}
      animate={{
        top: top,
        // Scroll-triggered reveal: fade in when card enters viewport
        opacity: isInView ? (isDimmed ? 0.1 : 1) : 0,
        scale: isInView ? (isDimmed ? 0.98 : isHovered ? 1.02 : 1) : 0.95,
        y: isInView ? 0 : 60,
        filter: isDimmed ? 'grayscale(100%) blur(2px)' : 'grayscale(0%) blur(0px)',
        zIndex: isHovered ? 50 : 10,
      }}
      transition={{
        type: 'tween',
        duration: 0.5,
        ease: [0.32, 0.72, 0, 1],
        layout: { duration: 0.5, ease: [0.32, 0.72, 0, 1] }
      }}
      style={{
        position: 'absolute',
        ...laneStyle,
        ...(isHovered && !isFit ? {
          height: 'auto',
          // Wider expansion to reduce vertical overflow
          width: '700px',
          maxWidth: '90vw',
          minHeight: `${height}px`,
          zIndex: 50, // Ensure z-index is high when hovered
          perspective: 1000, // Add perspective for 3D effect
          rotateX: !isScrolling ? rotateX : 0, // Apply tilt only when not scrolling
          rotateY: !isScrolling ? rotateY : 0,
          // Lane-aware positioning:
          // Lane 0 (left): anchor left edge, expand right
          // Lane 1 (middle): center expansion using calc() instead of transform to avoid flicker
          // Lane 2 (right): anchor right edge, expand left
          ...(item.lane === 0 ? {
            left: laneStyle.left,
            right: 'auto',
            transform: 'none'
          } : item.lane === 1 ? {
            left: 'calc(50% - 350px)', // Strictly center 700px width
            right: 'auto',
            minWidth: '30%', // Ensure we don't shrink smaller than the lane
            transform: 'none'
          } : {
            left: 'auto',
            right: '0%',
            transform: 'none'
          })
        } : {
          height: `${height}px`,
          minHeight: `${height}px`
        }),
      }}
      className={`
        rounded-lg md:rounded-xl cursor-pointer overflow-hidden group
        transition-colors duration-500 border border-transparent
        flex flex-col
        ${s.glass} ${!isFit && s.hoverGlass}
      `}
    >
      {/* --- BACKGROUND IMAGE (Unified with Grid Mode) --- */}
      {item.imageUrl && (
        <>
          {/* Solid Black Backing for Expanded State (matches ExperienceDetail base) */}
          {!isFit && <div className="absolute inset-0 bg-[#0a0a0a] z-0" />}

          <div
            className={`absolute transition-all duration-700 ease-out z-0 overflow-visible ${!isFit
              ? (isHovered ? 'top-0 right-0 w-[60%] h-64' : 'top-0 left-0 w-full h-64') // Expanded: Shift Right (Hover) vs Full Banner (Default). Both h-64.
              : 'inset-0 h-full' // Collapsed: Full Cover
              }`}
          >
            <motion.img
              layoutId={`timeline-image-${item.id}`}
              src={item.imageUrl}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out"
              style={{
                objectPosition: 'center top' // Anchor to top
              }}
            />

            {/* Overlays - extended beyond bounds to cover animation lag */}
            <div
              className="absolute -inset-8 bg-gradient-to-t from-black via-black/70 to-transparent"
              style={{
                opacity: (!isFit && isHovered) ? 0 : 0.9,
                transition: 'opacity 0.7s ease-out'
              }}
            />
            <div
              className="absolute -inset-8 pointer-events-none"
              style={{
                opacity: (!isFit && isHovered) ? 1 : 0,
                transition: 'opacity 0.7s ease-out'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
            </div>
          </div>
        </>
      )}

      {/* Glass overlay for non-image cards (Matches Grid Mode) */}
      {!item.imageUrl && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 pointer-events-none" />
      )}

      {/* --- CONTENT SECTION (Overlay) --- */}
      <div className={`flex flex-col relative z-10 h-full p-4 ${(!isFit && isHovered) ? 'justify-start' : 'justify-end'}`}>

        {/* Header Row: Date & Logo (PINNED like Grid Mode) */}
        {!isFit && (
          <>
            <div className="absolute top-3 right-3 text-[9px] font-mono opacity-60 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/5">
              {formatDate(item.start)} — {formatDate(item.end)}
            </div>

            {/* Logo pinned Top Left */}
            {item.logoUrl && (
              <img
                src={item.logoUrl}
                alt="Logo"
                className={`absolute top-3 left-3 object-contain transition-all duration-500 ${isHovered && !isFit ? 'w-10 h-10 md:w-16 md:h-16' : 'w-6 h-6 md:w-8 md:h-8'
                  } ${item.id === 'ms-edi' ? 'opacity-80 filter brightness-0 invert' : 'opacity-80'
                  }`}
              />
            )}

            {/* Type Badge Removed as per request */}
          </>
        )}

        {/* Spacer: In Grid mode, NO margin (center). In Expanded, margin below image. */}
        <div className={`transition-all duration-500 flex flex-col justify-end ${(!isFit && isHovered) ? 'mt-32' : 'mt-0'}`}>
          <h3 className="text-sm font-bold text-white leading-tight mb-0.5 line-clamp-1 group-hover:text-indigo-200 transition-colors">
            {item.title}
          </h3>
          <p className="text-[10px] text-white/60 font-medium uppercase tracking-wide truncate">
            {item.company}
          </p>

          {item.headline && !isFit && (
            <motion.p className={`hidden md:block mt-2 text-xs md:text-sm leading-relaxed text-white/80 line-clamp-2 mix-blend-plus-lighter`}>
              {item.headline}
            </motion.p>
          )}
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
              className="mt-4 pt-4 border-t border-white/10"
            >
              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed mb-4 text-white/90 drop-shadow-sm">{item.summary}</p>
                <ul className="space-y-2 text-xs md:text-sm text-white/80">
                  {item.bullets?.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-current opacity-60 shrink-0" />
                      <span className="opacity-90">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* SKILLS PILLS (Footer) with Hover Effects & Tooltips */}
              {item.skills && (
                <motion.div layout className="mt-4 pt-3 border-t border-white/10">
                  <div className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-2">Toolkit</div>
                  <div className="flex flex-wrap gap-2">
                    {item.skills.map((skill, idx) => (
                      <motion.div
                        key={idx}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltipPos({
                            top: rect.top + window.scrollY,
                            left: rect.left + rect.width / 2 + window.scrollX
                          });
                          setHoveredToolkitSkill(skill.label);
                        }}
                        onMouseLeave={() => setHoveredToolkitSkill(null)}
                        whileHover={{
                          scale: 1.05,
                          boxShadow: item.lane === 0
                            ? '0 0 12px rgba(244,63,94,0.4)'
                            : '0 0 12px rgba(255,255,255,0.2)'
                        }}
                        className={`text-[9px] uppercase tracking-wide border px-2 py-1 rounded-full bg-white/5 whitespace-nowrap cursor-help transition-all duration-200 ${hoveredToolkitSkill === skill.label
                          ? (item.lane === 0
                            ? 'border-rose-400/60 text-rose-50 bg-rose-500/15'
                            : 'border-white/50 text-white bg-white/15')
                          : (item.lane === 0
                            ? 'border-rose-500/30 text-rose-100 hover:border-rose-400/50 hover:text-rose-50 hover:bg-rose-500/10'
                            : 'border-white/20 text-white/80 hover:border-white/40 hover:text-white hover:bg-white/10')
                          }`}
                      >
                        {skill.label}
                      </motion.div>
                    ))}
                  </div>

                  {/* Toolkit Skill Tooltip Portal */}
                  {hoveredToolkitSkill && ReactDOM.createPortal(
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        position: 'absolute',
                        top: tooltipPos.top - 15,
                        left: tooltipPos.left,
                        zIndex: 99999,
                        transform: 'translate(-50%, -100%)'
                      }}
                      className={`w-56 p-4 rounded-xl bg-[#0a0a0a] shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden pointer-events-none ${item.lane === 0 ? 'border border-rose-500/40' : 'border border-white/30'
                        }`}
                    >
                      <div className={`absolute top-0 left-0 w-full h-1 ${item.lane === 0 ? 'bg-gradient-to-r from-rose-600 to-rose-300' : 'bg-gradient-to-r from-gray-500 to-gray-300'
                        }`} />
                      <div className={`text-[9px] uppercase font-bold mb-1.5 tracking-wider ${item.lane === 0 ? 'text-rose-400' : 'text-gray-400'
                        }`}>
                        {hoveredToolkitSkill}
                      </div>
                      <div className="text-xs text-gray-200 leading-snug font-medium">
                        {item.skills?.find(s => s.label === hoveredToolkitSkill)?.description}
                      </div>
                      <div className={`absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0a0a0a] rotate-45 ${item.lane === 0 ? 'border-r border-b border-rose-500/40' : 'border-r border-b border-white/30'
                        }`} />
                    </motion.div>,
                    document.body
                  )}
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

              {/* DIFFERENTIATOR CALLOUT - Enhanced & Above Projects */}
              {item.differentiator && (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mt-4 relative rounded-xl overflow-hidden"
                >
                  {/* Animated gradient border */}
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600 opacity-30 blur-sm" />
                  <div className="absolute inset-[1px] rounded-xl bg-[#0a0a0a]" />

                  {/* Shimmer effect */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_3s_infinite]"
                        style={{ animation: 'shimmer 3s infinite linear' }} />
                    </div>
                  </div>

                  <div className="relative p-4">
                    <div className="flex items-start gap-4">
                      {/* Icon with glow */}
                      <div className="relative flex-shrink-0">
                        <div className="absolute inset-0 bg-violet-500/30 rounded-xl blur-md" />
                        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-violet-500/40">
                          <svg className="w-5 h-5 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[9px] uppercase tracking-widest font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                            What Sets Me Apart
                          </span>
                          <div className="flex-1 h-px bg-gradient-to-r from-violet-500/30 to-transparent" />
                        </div>
                        <p className="text-sm text-gray-200 leading-relaxed font-medium">{item.differentiator}</p>
                      </div>
                    </div>
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
    </motion.div >
  );
};

const TinkerVerseGrid: React.FC<{
  item: TimelineItem,
  posts: SocialPost[],
  height: number,
  pixelsPerMonth: number,
  styles: any,
  isFit: boolean,
  onClick?: () => void
}> = ({ item, posts, height, pixelsPerMonth, styles, isFit, onClick }) => {
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

  // Memoize projects for the thumbnail grid
  const projectsToShow = useMemo(() => PROJECTS.slice(0, 3), []);

  if (isFit) {
    return (
      <div className="w-full h-full flex flex-col p-2 overflow-hidden relative" onClick={onClick}>
        {/* Project thumbnails grid */}
        <div className="flex-1 grid grid-cols-2 gap-1.5 overflow-hidden">
          {projectsToShow.map((project, i) => (
            <div
              key={project.id}
              className={`relative rounded overflow-hidden ${i === 0 ? 'col-span-2 row-span-1' : ''}`}
            >
              <img
                src={project.heroImage}
                alt={project.hero.title}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
              {/* Dark overlay for legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              {/* Mini label */}
              <div className="absolute bottom-1 left-1 right-1">
                <span className="text-[8px] font-medium text-white/90 line-clamp-1">
                  {project.hero.title.split('–')[0].trim()}
                </span>
              </div>
            </div>
          ))}
        </div>
        {/* Footer info */}
        <div className="mt-auto relative z-10 pt-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[8px] font-mono text-amber-400/80 uppercase tracking-wider">
              {PROJECTS.length} Projects
            </span>
          </div>
          <h3 className={`font-bold text-[10px] leading-tight ${styles.text}`}>{item.title}</h3>
          <p className={`text-[9px] opacity-70 ${styles.subtext}`}>{item.company}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="relative w-full p-2 pb-4 flex flex-col items-center pointer-events-auto cursor-pointer"
    >
      <div className="flex flex-col w-full px-2 mb-2 sticky top-0 z-10">
        <div className="flex items-center gap-2 opacity-80">
          <img src={TINKERVERSE_LOGO} alt="TV" className="w-4 h-4 rounded-sm bg-white p-[1px] object-cover" />
          <span className={`text-xs font-bold uppercase tracking-widest ${styles.text}`}>TinkerVerse</span>
        </div>
        {item.headline && (
          <p className={`text-[10px] leading-tight opacity-70 mt-1 ${styles.subtext}`}>
            {item.headline}
          </p>
        )}
      </div>
      <div className="w-full flex-1 flex flex-col relative">
        {rows.map((row, idx) => (
          <div
            key={row.monthKey}
            className="flex items-center gap-2 w-full border-b border-amber-500/5 hover:bg-amber-500/5 transition-colors relative"
            style={{ height: `${rowHeight}px`, minHeight: '24px' }}
          >
            {rowHeight > 20 && (
              <div className="hidden md:block w-8 text-[9px] font-mono text-amber-200/40 text-right shrink-0">
                {row.date.toLocaleDateString('en-US', { month: 'short' })}
              </div>
            )}
            <div className="hidden md:flex flex-1 flex-wrap gap-1 items-center content-center h-full">
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
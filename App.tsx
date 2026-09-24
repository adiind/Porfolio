

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, LayoutGroup } from 'framer-motion';
import { TIMELINE_DATA, CONFIG, SOCIAL_POSTS, REAL_USER_IMAGE } from './constants';
import { getMonthDiff, parseDate, smoothScrollTo } from './utils';
import TimelineEvent from './components/TimelineEvent';
import TimelineRail from './components/TimelineRail';
import Hero from './components/Hero';
import CaseStudyModal from './components/CaseStudyModal';
import ProfileModal from './components/ProfileModal';
import ExperienceDetail from './components/ExperienceDetail';
import TinkerVerseModal from './components/TinkerVerseModal';
import MobileTimeline from './components/MobileTimeline';
import ProjectsSection from './components/ProjectsSection';
import BlogSection from './components/BlogSection';
import VerticalNavbar from './components/VerticalNavbar'; // Added
import { Maximize, Minimize, MousePointer2, Plus, Minus, Home } from 'lucide-react';
import { TimelineMode, CaseStudy, TimelineItem } from './types';
import { ProjectsProvider, useProjects } from './context/ProjectsContext';
// Background removed for performance
import { useScrollDetection } from './hooks/useScrollDetection';
import { trackEvent } from './lib/analytics';
import { INITIAL_WORK_PROJECT_ID } from './lib/workRoutes';

type PublicNavSection = 'profile' | 'experiences' | 'projects';
type ActiveSection = PublicNavSection | 'writings';

const SECTION_LABELS: Record<ActiveSection, string> = {
  profile: 'Profile',
  experiences: 'Experience',
  projects: 'Selected Work',
  writings: 'Writings',
};

const PortfolioApp: React.FC = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredLane, setHoveredLane] = useState<number | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [activeSection, setActiveSection] = useState<ActiveSection>('profile');
  const [showDirectWritings, setShowDirectWritings] = useState(
    () => typeof window !== 'undefined' && window.location.hash === '#writings'
  );


  // Mouse tracking for Spotlight
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  // Center a fixed-size gradient on the cursor via transform (compositor-only)
  // instead of repainting a full-screen background gradient on every mousemove.
  const spotlightX = useTransform(mouseX, (v) => v - 600);
  const spotlightY = useTransform(mouseY, (v) => v - 600);


  // Timeline Logic
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Scrolling never changes the timeline layout. Zoom is an explicit control.
  const [mode, setMode] = useState<TimelineMode>('fit');

  const getSectionTop = useCallback((id: string) => {
    const container = scrollContainerRef.current;
    const section = document.getElementById(id);
    if (!container || !section) return 0;
    return section.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
  }, []);
  const [pixelsPerMonth, setPixelsPerMonth] = useState<number>(35);
  const [isAnimating, setIsAnimating] = useState(false);
  const isAnimatingRef = useRef(false);

  // Scroll Detection - short debounce for responsive hover
  const isScrolling = useScrollDetection(scrollContainerRef, 50);
  const isScrollingRef = useRef(isScrolling);

  // Keep ref in sync
  useEffect(() => {
    isScrollingRef.current = isScrolling;
  }, [isScrolling]);

  // Track hoveredId state changes
  useEffect(() => {
    // Debug logging removed
  }, [hoveredId, isScrolling, mode, isAnimating]);

  // Modal State
  const [activeCaseStudy, setActiveCaseStudy] = useState<CaseStudy | null>(null);
  const [activeProject, setActiveProject] = useState<TimelineItem | null>(null);
  const [activeProjectSource, setActiveProjectSource] = useState('timeline');
  const { projects } = useProjects();

  const richProject = useMemo(() => {
    return activeProject ? projects.find(p => p.id === activeProject.id) : null;
  }, [activeProject, projects]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isTinkerVerseOpen, setIsTinkerVerseOpen] = useState(false);
  // Deep link: ProjectsSection mounts with its detail already open and fires
  // projectDetailOpen before this component's listener attaches, so seed it.
  const [isProjectDetailOpen, setIsProjectDetailOpen] = useState(INITIAL_WORK_PROJECT_ID !== null);
  const [isBlogDetailOpen, setIsBlogDetailOpen] = useState(false);
  const hasBlockingOverlay = isProfileOpen || activeCaseStudy !== null || activeProject !== null || isTinkerVerseOpen || isProjectDetailOpen || isBlogDetailOpen;

  // Listen for project detail modal open/close from ProjectsSection
  useEffect(() => {
    const onOpen = () => setIsProjectDetailOpen(true);
    const onClose = () => setIsProjectDetailOpen(false);
    window.addEventListener('projectDetailOpen', onOpen);
    window.addEventListener('projectDetailClose', onClose);
    return () => {
      window.removeEventListener('projectDetailOpen', onOpen);
      window.removeEventListener('projectDetailClose', onClose);
    };
  }, []);

  // Deep link: park the underlying page at the Selected Work section so
  // closing the detail reveals the grid the project belongs to.
  useEffect(() => {
    if (!INITIAL_WORK_PROJECT_ID) return;
    const projectsEl = document.getElementById('projects');
    if (projectsEl && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = Math.max(0, getSectionTop('projects') - 80);
    }
  }, [getSectionTop]);

  // Listen for future blog detail modal open/close from BlogSection
  useEffect(() => {
    const onOpen = () => setIsBlogDetailOpen(true);
    const onClose = () => setIsBlogDetailOpen(false);
    window.addEventListener('blogDetailOpen', onOpen);
    window.addEventListener('blogDetailClose', onClose);
    return () => {
      window.removeEventListener('blogDetailOpen', onOpen);
      window.removeEventListener('blogDetailClose', onClose);
    };
  }, []);

  // Writings stay intact and directly addressable, but are absent from the
  // ordinary public flow unless the visitor arrives with the retained hash.
  useEffect(() => {
    const syncDirectWritings = () => setShowDirectWritings(window.location.hash === '#writings');
    window.addEventListener('hashchange', syncDirectWritings);
    return () => window.removeEventListener('hashchange', syncDirectWritings);
  }, []);

  useEffect(() => {
    if (!showDirectWritings) return;
    const writingsEl = document.getElementById('writings');
    if (writingsEl && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = Math.max(0, getSectionTop('writings') - 80);
    }
  }, [getSectionTop, showDirectWritings]);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const handleCardExpand = useCallback((cardId: string | null) => {
    setExpandedCardId(prev => prev === cardId ? null : cardId);
  }, []);

  const handleOpenProfile = useCallback((source: string) => {
    trackEvent('profile_opened', { source });
    setIsProfileOpen(true);
  }, []);

  const handleOpenCaseStudy = useCallback((caseStudy: CaseStudy) => {
    trackEvent('case_study_opened', {
      title: caseStudy.title,
      theme: caseStudy.themeColor ?? 'none',
    });
    setActiveCaseStudy(caseStudy);
  }, []);

  const handleOpenTimelineProject = useCallback((item: TimelineItem, source = 'timeline') => {
    trackEvent('timeline_item_opened', {
      id: item.id,
      title: item.title,
      company: item.company,
      type: item.type,
      source,
    });
    setActiveProjectSource(source);
    setActiveProject(item);
  }, []);

  const handleOpenTinkerVerse = useCallback((source = 'timeline') => {
    trackEvent('tinkerverse_opened', {
      source,
      posts: SOCIAL_POSTS.length,
    });
    setIsTinkerVerseOpen(true);
  }, []);

  // Stable per-source variants so memoized TimelineEvent cards don't re-render
  // when the app re-renders (inline lambdas would break React.memo).
  const openTimelineProjectFromGrid = useCallback(
    (item: TimelineItem) => handleOpenTimelineProject(item, 'timeline_grid'),
    [handleOpenTimelineProject]
  );
  const openTimelineProjectFromRail = useCallback(
    (item: TimelineItem) => handleOpenTimelineProject(item, 'timeline_rail'),
    [handleOpenTimelineProject]
  );
  const openTinkerVerseFromGrid = useCallback(
    () => handleOpenTinkerVerse('timeline_grid'),
    [handleOpenTinkerVerse]
  );
  const openTinkerVerseFromRail = useCallback(
    () => handleOpenTinkerVerse('timeline_rail'),
    [handleOpenTinkerVerse]
  );

  const finishModeTransition = useCallback(() => {
    const transitionDelay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 550;
    window.setTimeout(() => {
      setIsAnimating(false);
      isAnimatingRef.current = false;
      // Debug logging removed
    }, transitionDelay);
  }, []);

  // 1. Handle Zoom Transitions - simplified
  const handleZoom = useCallback((targetMode: TimelineMode, source = 'control') => {
    if (isAnimatingRef.current || mode === targetMode) return;

    trackEvent('timeline_mode_changed', {
      from: mode,
      to: targetMode,
      source,
    });

    isAnimatingRef.current = true;
    setIsAnimating(true);


    // Debug logging removed


    setMode(targetMode);

    if (targetMode === 'fit') {
      const totalMonths = getMonthDiff(parseDate(CONFIG.startDate), parseDate(CONFIG.endDate));
      setPixelsPerMonth(Math.max((window.innerHeight - 200) / totalMonths, 2));
    } else if (targetMode === 'normal') {
      setPixelsPerMonth(35);
    } else if (targetMode === 'detail') {
      setPixelsPerMonth(60);
    }

    finishModeTransition();
  }, [finishModeTransition, mode]);

  // Listen for openProject events from the Hero project wheel.
  useEffect(() => {
    const handleOpenProject = (e: CustomEvent<{ id: string; type: 'project' | 'experience' }>) => {
      const { id, type } = e.detail;
      trackEvent('hero_project_link_clicked', { id, type });

      // For experiences, open the timeline modal directly
      if (type === 'experience') {
        const timelineItem = TIMELINE_DATA.find(item => item.id === id);
        if (timelineItem) {
          handleOpenTimelineProject(timelineItem, 'hero_related_project');
        }
        return;
      }

      // The grid is already mounted; opening a project needs no timed handoff.
      const projectCard = document.querySelector(`[data-project-id="${id}"]`);
      if (projectCard && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = Math.max(0, getSectionTop('projects') - 80);
        const clickableCard = projectCard.querySelector<HTMLElement>('[class*="cursor-pointer"]');
        clickableCard?.click();
      }
    };

    window.addEventListener('openProject', handleOpenProject as EventListener);
    return () => window.removeEventListener('openProject', handleOpenProject as EventListener);
  }, [getSectionTop, handleOpenTimelineProject]);

  const handleManualZoom = (direction: 'in' | 'out') => {
    trackEvent('timeline_zoom_clicked', {
      direction,
      mode,
      pixels_per_month: pixelsPerMonth,
    });
    setMode('normal'); // Switch to normal mode on manual zoom
    setPixelsPerMonth(prev => {
      const step = 5;
      const newVal = direction === 'in' ? prev + step : prev - step;
      return Math.min(Math.max(newVal, 2), 150); // Clamp between 2 and 150
    });
  };

  const getCurrentSection = useCallback((position: number): ActiveSection => {
    const threshold = position + (scrollContainerRef.current?.clientHeight ?? window.innerHeight) * 0.3;
    if (showDirectWritings && threshold >= getSectionTop('writings')) return 'writings';
    if (threshold >= getSectionTop('projects')) return 'projects';
    if (threshold >= getSectionTop('resume')) return 'experiences';
    return 'profile';
  }, [getSectionTop, showDirectWritings]);

  useEffect(() => {
    const handleShellWheel = (event: WheelEvent) => {
      const container = scrollContainerRef.current;
      const target = event.target as HTMLElement | null;
      if (!container || hasBlockingOverlay || event.defaultPrevented || event.ctrlKey || event.deltaY === 0
        || container.contains(target) || target?.closest('[data-project-wheel]')) return;

      // Only fixed shell controls need forwarding. Within the page, the browser
      // owns wheel/touch momentum and every section boundary is ordinary flow.
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? container.clientHeight : 1;
      event.preventDefault();
      container.scrollTop += event.deltaY * unit;
    };
    const handleShellKey = (event: KeyboardEvent) => {
      const container = scrollContainerRef.current;
      const target = event.target as HTMLElement | null;
      if (!container || hasBlockingOverlay || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey
        || container.contains(target) || target?.closest('input, textarea, select, [contenteditable="true"], [data-project-wheel]')) return;
      const page = container.clientHeight * 0.875;
      const delta = event.key === 'ArrowDown' ? 40 : event.key === 'ArrowUp' ? -40
        : event.key === 'PageDown' ? page : event.key === 'PageUp' ? -page
        : event.key === ' ' && !target?.closest('button, a') ? (event.shiftKey ? -page : page) : 0;
      const destination = event.key === 'Home' ? 0 : event.key === 'End' ? container.scrollHeight : container.scrollTop + delta;
      if (!delta && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();
      smoothScrollTo(container, destination);
    };
    window.addEventListener('wheel', handleShellWheel, { passive: false });
    window.addEventListener('keydown', handleShellKey);
    return () => {
      window.removeEventListener('wheel', handleShellWheel);
      window.removeEventListener('keydown', handleShellKey);
    };
  }, [hasBlockingOverlay]);

  const scrollMilestonesRef = useRef<Set<number>>(new Set());

  const trackScrollDepth = useCallback((container: HTMLDivElement, nextScrollTop: number) => {
    const maxScrollable = container.scrollHeight - container.clientHeight;
    if (maxScrollable <= 0) return;

    const depth = Math.min(100, Math.round((nextScrollTop / maxScrollable) * 100));
    [25, 50, 75, 100].forEach((milestone) => {
      if (depth < milestone || scrollMilestonesRef.current.has(milestone)) return;

      scrollMilestonesRef.current.add(milestone);
      trackEvent('scroll_depth_reached', {
        depth: milestone,
        section: getCurrentSection(nextScrollTop),
        mode,
      });
    });
  }, [getCurrentSection, mode]);

  // Throttled scroll handler for better performance
  const scrollRafRef = useRef<number | null>(null);
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const nextScrollTop = e.currentTarget.scrollTop;
    // scrollTop state only feeds TimelineRail's year highlighting, which renders
    // in normal/detail mode. Skipping the state update otherwise avoids
    // re-rendering the whole tree on every scroll frame; rAF coalesces updates.
    if (mode === 'normal' || mode === 'detail') {
      if (scrollRafRef.current === null) {
        scrollRafRef.current = requestAnimationFrame(() => {
          scrollRafRef.current = null;
          if (scrollContainerRef.current) {
            setScrollTop(scrollContainerRef.current.scrollTop);
          }
        });
      }
    }
    trackScrollDepth(e.currentTarget, nextScrollTop);

    setActiveSection(getCurrentSection(nextScrollTop));
  }, [getCurrentSection, mode, trackScrollDepth]);

  useEffect(() => () => {
    if (scrollRafRef.current !== null) cancelAnimationFrame(scrollRafRef.current);
  }, []);

  // Sync rail highlight when entering a rail mode (scroll updates are skipped elsewhere)
  useEffect(() => {
    if ((mode === 'normal' || mode === 'detail') && scrollContainerRef.current) {
      setScrollTop(scrollContainerRef.current.scrollTop);
    }
  }, [mode]);

  useEffect(() => {
    const updateSection = () => {
      if (scrollContainerRef.current) setActiveSection(getCurrentSection(scrollContainerRef.current.scrollTop));
    };
    updateSection();
    window.addEventListener('resize', updateSection);
    return () => window.removeEventListener('resize', updateSection);
  }, [getCurrentSection]);

  // Simple hover handlers - block during animation, intro, or scrolling.
  // Read gating state from refs so these callbacks stay referentially stable
  // and don't invalidate memoized TimelineEvent cards on every scroll/hover.
  const canHover = mode !== 'intro' && !isAnimating && !isScrolling;

  const handleHover = useCallback((id: string | null) => {
    if (id !== null && (isAnimatingRef.current || isScrollingRef.current)) return;
    setHoveredId(id);
  }, []);

  const handleLaneHover = useCallback((lane: number | null) => {
    if (lane !== null && (isAnimatingRef.current || isScrollingRef.current)) return;
    setHoveredLane(lane);
  }, []);

  // Track mouse position globally for logic AND spotlight
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [mouseX, mouseY]);

  // Scrolling only clears a border/bookmark highlight; it never opens a card.
  useEffect(() => {
    if (isAnimating || isScrolling) {
      setHoveredId(null);
      setHoveredLane(null);
    }
  }, [isAnimating, isScrolling]);

  // Find currently hovered item object for bookmark logic
  const hoveredItem = useMemo(() => {
    return TIMELINE_DATA.find(item => item.id === hoveredId) || null;
  }, [hoveredId]);

  const totalMonths = getMonthDiff(parseDate(CONFIG.startDate), parseDate(CONFIG.endDate));
  // Reduce total height significantly - logarithmic positioning will compress older items into this space
  const compressionMultiplier = 0.5; // 50% of linear height
  const contentHeight = totalMonths * pixelsPerMonth * compressionMultiplier;
  const totalContainerHeight = contentHeight + 400;



  // Animation Transition Configuration - fast tween for smooth GPU-accelerated animation
  const pageTransition = {
    type: "tween" as const,
    duration: 0.15,
    ease: [0.32, 0.72, 0, 1] // Custom cubic-bezier for smooth feel
  };

  const handleNavigate = (section: PublicNavSection) => {
    trackEvent('section_nav_clicked', {
      section,
      from: activeSection,
      mode,
    });

    const container = scrollContainerRef.current;
    if (!container) return;
    const id = section === 'experiences' ? 'resume' : section;
    smoothScrollTo(container, Math.max(0, getSectionTop(id) - (section === 'profile' ? 0 : 80)));
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-indigo-500/30 relative z-10">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-black focus:font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">Skip to content</a>
      {/* Spotlight Overlay */}
      <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 w-[1200px] h-[1200px] rounded-full"
          style={{
            x: spotlightX,
            y: spotlightY,
            background: 'radial-gradient(circle closest-side, rgba(99, 102, 241, 0.07), transparent 80%)',
            willChange: 'transform',
          }}
        />
      </div>


      {/* Overlays mount/unmount as plain conditionals (no AnimatePresence):
          exit animations would keep a closed dialog mounted as an invisible
          full-viewport pointer-events layer until frames tick — in throttled
          tabs (hidden/backgrounded) that freeze never ends and every click on
          the page dies. Entry animations still play; closes are instant. */}

      {/* --- CASE STUDY MODAL --- */}
      {activeCaseStudy && (
        <CaseStudyModal
          caseStudy={activeCaseStudy}
          onClose={() => setActiveCaseStudy(null)}
        />
      )}

      {/* --- EXPERIENCE DETAIL PAGE --- */}
      {activeProject && (
        <ExperienceDetail
          item={richProject ? { ...activeProject, ...richProject } as TimelineItem : activeProject}
          analyticsSource={activeProjectSource}
          analyticsActive={activeCaseStudy === null}
          onClose={() => setActiveProject(null)}
          onOpenCaseStudy={handleOpenCaseStudy}
        />
      )}

      {/* --- PROFILE MODAL --- */}
      {isProfileOpen && (
        <ProfileModal onClose={() => setIsProfileOpen(false)} />
      )}

      {/* --- TINKERVERSE MODAL --- */}
      {isTinkerVerseOpen && (
        <TinkerVerseModal
          item={TIMELINE_DATA.find(i => i.id === 'tinkerverse')!}
          posts={SOCIAL_POSTS}
          onClose={() => setIsTinkerVerseOpen(false)}
        />
      )}

      {/* Keep fixed navigation opaque: backdrop filters here and inside the tilted
          project grid caused Chrome to drop the mat, images, and dialog backing. */}
      <header
        data-scroll-header
        aria-hidden={activeSection === 'profile'}
        inert={activeSection === 'profile' ? true : undefined}
        className={`fixed left-0 right-0 top-0 z-50 hidden px-6 py-3 pointer-events-none md:block ${activeSection === 'profile' ? 'invisible' : 'visible'}`}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: activeSection === 'profile' ? 0 : 1 }}
          transition={pageTransition}
          className={`absolute inset-0 border-b border-white/15 bg-[#050d0c] ${activeSection === 'profile' ? 'pointer-events-none' : 'pointer-events-auto'}`}
        />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{
            opacity: activeSection === 'profile' ? 0 : 1,
            y: activeSection === 'profile' ? -20 : 0
          }}
          transition={pageTransition}
          className={`relative mx-auto flex max-w-6xl items-center justify-between gap-6 ${activeSection === 'profile' ? 'pointer-events-none' : 'pointer-events-auto'}`}
        >
          {/* Status Badge Header */}
          <button
            type="button"
            data-header-identity
            className="group relative flex min-h-11 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5E55A]"
            onClick={() => handleOpenProfile('header_badge')}
            aria-label="View profile"
          >
            {/* Profile Photo */}
            <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-full border border-white/25 bg-[#10231d] transition-colors duration-300 group-hover:border-white/45">
              <img
                data-header-photo
                src={REAL_USER_IMAGE}
                alt="Adi Agarwal"
                className="h-full w-full object-cover object-[center_32%]"
              />
            </div>

            {/* Name and profile signal */}
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold tracking-tight text-white transition-colors group-hover:text-[#F0F570]">Adi Agarwal</span>

              {/* Practice tag */}
              <div className="relative flex items-center gap-1.5">
                <div className="relative">
                  <div className="absolute inset-0 h-2 w-2 rounded-full bg-[#E5E55A] opacity-40 blur-sm group-hover:opacity-70" />
                  <div className="relative h-2 w-2 rounded-full bg-[#E5E55A] shadow-[0_0_8px_rgba(229,229,90,0.34)]" />
                </div>
                <span className="text-[10px] text-white/62 transition-colors duration-300 group-hover:text-white/80">Tangible AI + Product Systems</span>
              </div>
            </div>

            {/* Hover Tooltip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-black/95 border border-white/20 rounded-lg text-xs text-white/90 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none transform scale-95 group-hover:scale-100 shadow-xl z-50">
              View profile
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[-8px]">
                <div className="border-4 border-transparent border-b-black/95"></div>
              </div>
            </div>
          </button>

          <div
            data-section-indicator
            aria-live="polite"
            className="rounded-full border border-white/15 bg-[#07110f] px-3.5 py-2 text-right shadow-[0_12px_32px_rgba(0,0,0,0.3)]"
          >
            <span className="block text-[9px] font-medium uppercase tracking-[0.18em] text-white/45">Viewing</span>
            <span className="block text-xs font-semibold text-white/86">{SECTION_LABELS[activeSection]}</span>
          </div>

        </motion.div>

      </header>

      {/* --- SECTION NAVIGATION RAIL --- */}


      {/* Hero, experience, and work share one native scroll viewport. */}
      <div className="flex-1 min-h-0 relative w-full">
        {/* Zoom Controls - Desktop only */}
        <div className={`${activeSection === 'experiences' && !hasBlockingOverlay ? 'hidden md:flex' : 'hidden'} fixed top-24 right-6 flex-col gap-2 z-40`}>
          <button
            onClick={() => handleManualZoom('in')}
            className="p-2 rounded-full border transition-all bg-black/40 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => handleManualZoom('out')}
            className="p-2 rounded-full border transition-all bg-black/40 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <Minus size={16} />
          </button>
          <div className="w-full h-[1px] bg-white/10 my-1" />
          {mode !== 'fit' ? (
            <button
              onClick={() => handleZoom('fit', 'zoom_control')}
              className={`p-2 rounded-full border transition-all bg-indigo-500/20 text-indigo-200 border-indigo-500/50 hover:bg-indigo-500/40`}
              title="Fit to Screen"
              aria-label="Fit to Screen"
            >
              <Minimize size={16} />
            </button>
          ) : (
            <button
              onClick={() => handleZoom('normal', 'zoom_control')}
              className={`p-2 rounded-full border transition-all bg-indigo-500 text-white border-indigo-500`}
              title="Reset Zoom"
              aria-label="Reset Zoom"
            >
              <Maximize size={16} />
            </button>
          )}
        </div>

        <div
          ref={scrollContainerRef}
          id="main-content"
          role="main"
          tabIndex={-1}
          onScroll={handleScroll}
          className={`relative h-full overflow-x-hidden no-scrollbar ${hasBlockingOverlay ? 'overflow-y-hidden' : 'overflow-y-auto'}`}
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain', touchAction: 'pan-y' }}
        >
          <section id="profile" className="relative isolate h-[100svh] min-h-[580px] w-full">
            <Hero onOpenProfile={() => handleOpenProfile('hero_avatar')} onViewWork={() => handleNavigate('projects')} active={activeSection === 'profile' && !hasBlockingOverlay} />
            <div className="absolute bottom-8 left-0 right-0 z-40 flex justify-center text-white/60 pointer-events-none">
              <button
                type="button"
                onClick={() => handleNavigate('experiences')}
                className="flex flex-col items-center gap-2 pointer-events-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80"
                style={{ textShadow: '0 6px 18px rgba(0,0,0,0.55)' }}
                aria-label="Explore timeline"
              >
                <MousePointer2 size={16} />
                <span className="text-[10px] uppercase tracking-widest">Scroll to Explore</span>
              </button>
            </div>
          </section>

          <section id="resume" className="relative flow-root pt-20">
          {/* Mobile Layout - Stacked Sections */}
          <div className="block md:hidden pt-6 pb-6">
            <MobileTimeline
              items={TIMELINE_DATA}
              analyticsActive={!hasBlockingOverlay}
              onOpenCaseStudy={handleOpenCaseStudy}
              onOpenProject={(item) => handleOpenTimelineProject(item, 'mobile_timeline')}
              onOpenTinkerVerse={() => handleOpenTinkerVerse('mobile_timeline')}
            />

            {/* Mobile-only Back to Home Button — compact, translucent, and hidden
                while the imagery-heavy Selected Work section is in view so it
                never obscures project media. */}
            <div
              className={`fixed bottom-4 right-4 z-50 transition-opacity duration-300 ${activeSection === 'experiences' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              aria-hidden={activeSection !== 'experiences'}
            >
              <button
                onClick={() => handleNavigate('profile')}
                tabIndex={activeSection === 'experiences' ? 0 : -1}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white/90 shadow-lg shadow-black/40 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80"
                aria-label="Back to top"
              >
                <Home size={18} />
              </button>
            </div>
          </div>

          {/* Desktop Layout - 3 Column Grid (replacing Rail) */}
          {/* Desktop Layout */}
          <LayoutGroup>
            <div
              className="hidden md:block relative w-full max-w-7xl mx-auto pt-6"
              style={{ height: mode === 'fit' ? 'auto' : `${totalContainerHeight + 40}px` }}
            >
              {mode === 'fit' ? (
                /* --- GRID MODE (Collapsed) - Aligned with Timeline Rail --- */
                <div className="flex pb-32">
                  {/* Spacer matching timeline rail width */}
                  <div className="hidden md:block w-28 md:w-36 flex-shrink-0" />

                  <div
                    data-timeline-lanes="education-experience-tinkerverse"
                    className="flex-1 grid grid-cols-3 gap-3 items-start px-4 md:pr-0 md:pl-0"
                  >
                    <div data-timeline-lane="education" className="space-y-3">
                      <h2 className="text-[10px] uppercase tracking-widest font-bold text-rose-400 mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Education
                      </h2>
                      {TIMELINE_DATA
                        .filter(i => i.type === 'education' || i.type === 'foundational')
                        .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
                        .map(item => (
                          <TimelineEvent
                            key={item.id}
                            item={item}
                            isHovered={hoveredId === item.id}
                            onHover={handleHover}
                            onLaneHover={handleLaneHover}
                            isDimmed={hoveredId !== null && hoveredId !== item.id}
                            pixelsPerMonth={pixelsPerMonth}
                            totalHeight={totalContainerHeight}
                            mode={mode}
                            onOpenCaseStudy={handleOpenCaseStudy}
                            onOpenProject={openTimelineProjectFromGrid}
                            onOpenTinkerVerse={openTinkerVerseFromGrid}
                            isScrolling={false}
                            layoutMode="grid"
                            isExpanded={expandedCardId === item.id}
                            onExpand={handleCardExpand}
                          />
                        ))}
                    </div>

                    <div data-timeline-lane="experience" className="space-y-3">
                      <h2 className="text-[10px] uppercase tracking-widest font-bold text-indigo-400 mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        Experience
                      </h2>
                      {TIMELINE_DATA
                        .filter(i => (i.type === 'corporate' || i.type === 'project' || i.type === 'competition') && i.id !== 'tinkerverse')
                        .filter(i => !i.title.toLowerCase().includes('jarvis'))
                        .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
                        .map(item => (
                          <TimelineEvent
                            key={item.id}
                            item={item}
                            isHovered={hoveredId === item.id}
                            onHover={handleHover}
                            onLaneHover={handleLaneHover}
                            isDimmed={hoveredId !== null && hoveredId !== item.id}
                            pixelsPerMonth={pixelsPerMonth}
                            totalHeight={totalContainerHeight}
                            mode={mode}
                            onOpenCaseStudy={handleOpenCaseStudy}
                            onOpenProject={openTimelineProjectFromGrid}
                            onOpenTinkerVerse={openTinkerVerseFromGrid}
                            isScrolling={false}
                            layoutMode="grid"
                            isExpanded={expandedCardId === item.id}
                            onExpand={handleCardExpand}
                          />
                        ))}
                    </div>

                    <div data-timeline-lane="tinkerverse" className="space-y-3">
                      <h2 className="text-[10px] uppercase tracking-widest font-bold text-amber-400 mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        TinkerVerse
                      </h2>
                      {TIMELINE_DATA
                        .filter(i => i.id === 'tinkerverse')
                        .map(item => (
                          <TimelineEvent
                            key={item.id}
                            item={item}
                            isHovered={hoveredId === item.id}
                            onHover={handleHover}
                            onLaneHover={handleLaneHover}
                            isDimmed={hoveredId !== null && hoveredId !== item.id}
                            pixelsPerMonth={pixelsPerMonth}
                            totalHeight={totalContainerHeight}
                            mode={mode}
                            onOpenCaseStudy={handleOpenCaseStudy}
                            onOpenProject={openTimelineProjectFromGrid}
                            onOpenTinkerVerse={openTinkerVerseFromGrid}
                            isScrolling={false}
                            layoutMode="grid"
                            isExpanded={expandedCardId === item.id}
                            onExpand={handleCardExpand}
                          />
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* --- RAIL MODE (Normal/Detail) --- */
                <>
                  <TimelineRail
                    pixelsPerMonth={pixelsPerMonth}
                    totalHeight={totalContainerHeight}
                    onYearClick={(top) => smoothScrollTo(scrollContainerRef.current!, getSectionTop('resume') + 40 + top)}
                    currentScrollTop={Math.max(0, scrollTop - getSectionTop('resume') - 40)}
                    hoveredItem={hoveredItem}
                  />

                  {/* Content & Background Wrapper */}
                  <div className="absolute top-10 left-28 md:left-36 right-4 md:right-0 bottom-0">

                    {/* Column Headers (Timeline Mode) */}
                    <div className="absolute -top-10 left-0 right-0 h-10 z-20 pointer-events-none flex">
                      {/* Education */}
                      <div className="absolute left-0 w-[33%] pl-2">
                        <h2 className="text-[10px] uppercase tracking-widest font-bold text-rose-400 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Education
                        </h2>
                      </div>
                      {/* Experience */}
                      <div className="absolute left-[33.5%] w-[33%] pl-2">
                        <h2 className="text-[10px] uppercase tracking-widest font-bold text-indigo-400 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          Experience
                        </h2>
                      </div>
                      {/* TinkerVerse */}
                      <div className="absolute left-[67%] w-[33%] pl-2">
                        <h2 className="text-[10px] uppercase tracking-widest font-bold text-amber-400 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          TinkerVerse
                        </h2>
                      </div>
                    </div>

                    {/* Hover Background Columns */}
                    <div className="absolute inset-0 flex pointer-events-none z-0">
                      {[0, 1, 2].map((lane) => (
                        <motion.div
                          key={lane}
                          className="h-full transition-colors duration-500"
                          style={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            width: '33%',
                            left: lane === 0 ? '0%' : lane === 1 ? '33.5%' : '67%',
                            background: hoveredLane === lane
                              ? `linear-gradient(to bottom, ${lane === 0 ? 'rgba(244,63,94,0.05)' :
                                lane === 1 ? 'rgba(99,102,241,0.05)' :
                                  'rgba(245,158,11,0.05)'
                              }, transparent)`
                              : 'transparent'
                          }}
                        />
                      ))}
                    </div>

                    {/* Timeline Events (Absolute) */}
                    {TIMELINE_DATA.map((item) => (
                      <TimelineEvent
                        key={item.id}
                        item={item}
                        isHovered={hoveredId === item.id}
                        onHover={handleHover}
                        onLaneHover={handleLaneHover}
                        isDimmed={hoveredId !== null && hoveredId !== item.id}
                        pixelsPerMonth={pixelsPerMonth}
                        totalHeight={totalContainerHeight}
                        mode={mode}
                        onOpenCaseStudy={handleOpenCaseStudy}
                        onOpenProject={openTimelineProjectFromRail}
                        onOpenTinkerVerse={openTinkerVerseFromRail}
                        isScrolling={!canHover}
                      // layoutMode defaults to absolute
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </LayoutGroup>
          </section>

          {/* --- PROJECTS SECTION --- */}
          <ProjectsSection />

          {/* Writings remain available only through the retained direct hash. */}
          {showDirectWritings && <BlogSection />}

        </div>
      </div>

      {/* --- VERTICAL NAVIGATION --- */}
      <VerticalNavbar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        mode={activeSection === 'profile' ? 'intro' : mode}
        isHidden={hasBlockingOverlay}
      />
    </div>
  );
};

const App: React.FC = () => (
  <ProjectsProvider>
    <PortfolioApp />
  </ProjectsProvider>
);

export default App;



import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useMotionTemplate, LayoutGroup } from 'framer-motion';
import { TIMELINE_DATA, CONFIG, SOCIAL_POSTS, REAL_USER_IMAGE } from './constants';
import { getMonthDiff, parseDate, smoothScrollTo } from './utils';
import TimelineEvent from './components/TimelineEvent';
import TimelineRail from './components/TimelineRail';
import Hero from './components/Hero';
import CaseStudyModal from './components/CaseStudyModal';
import ProfileModal from './components/ProfileModal';
import ProjectDetail from './components/ProjectDetail';
import ProjectModal from './components/ProjectModal';
import ExperienceDetail from './components/ExperienceDetail';
import TinkerVerseModal from './components/TinkerVerseModal';
import MobileTimeline from './components/MobileTimeline';
import ProjectsSection from './components/ProjectsSection';
import BlogSection from './components/BlogSection';
import VerticalNavbar from './components/VerticalNavbar'; // Added
import { Maximize, Minimize, MousePointer2, Plus, Minus, Home } from 'lucide-react';
import { TimelineMode, CaseStudy, TimelineItem } from './types';
import { Project } from './types/Project';
import { PROJECTS } from './data/projects';
// Background removed for performance
import { useScrollDetection } from './hooks/useScrollDetection';
import { trackEvent } from './lib/analytics';


const App: React.FC = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredLane, setHoveredLane] = useState<number | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [activeSection, setActiveSection] = useState<'profile' | 'experiences' | 'projects' | 'writings'>('profile'); // Added
  const [isWritingsUnlocked, setIsWritingsUnlocked] = useState(false); // Added


  // Mouse tracking for Spotlight
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);


  // Timeline Logic
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<TimelineMode>('intro');
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

  const richProject = useMemo(() => {
    return activeProject ? PROJECTS.find(p => p.id === activeProject.id) : null;
  }, [activeProject]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isTinkerVerseOpen, setIsTinkerVerseOpen] = useState(false);
  const [isProjectDetailOpen, setIsProjectDetailOpen] = useState(false);
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
    setActiveProject(item);
  }, []);

  const handleOpenTinkerVerse = useCallback((source = 'timeline') => {
    trackEvent('tinkerverse_opened', {
      source,
      posts: SOCIAL_POSTS.length,
    });
    setIsTinkerVerseOpen(true);
  }, []);

  const finishModeTransition = useCallback(() => {
    window.setTimeout(() => {
      setIsAnimating(false);
      isAnimatingRef.current = false;
      // Debug logging removed
    }, 550);
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


    // Reset scroll when going to intro
    if (targetMode === 'intro' && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }

    setMode(targetMode);

    if (targetMode === 'fit') {
      const totalMonths = getMonthDiff(parseDate(CONFIG.startDate), parseDate(CONFIG.endDate));
      setPixelsPerMonth(Math.max((window.innerHeight - 200) / totalMonths, 2));
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    } else if (targetMode === 'normal') {
      setPixelsPerMonth(35);
    } else if (targetMode === 'detail') {
      setPixelsPerMonth(60);
    }

    finishModeTransition();
  }, [finishModeTransition, mode]);

  const dismissIntroForTouchScroll = useCallback((source = 'touch_scroll') => {
    if (mode !== 'intro' || isAnimatingRef.current) return;

    trackEvent('timeline_mode_changed', {
      from: 'intro',
      to: 'fit',
      source,
    });

    isAnimatingRef.current = true;
    setIsAnimating(true);
    setMode('fit');

    const totalMonths = getMonthDiff(parseDate(CONFIG.startDate), parseDate(CONFIG.endDate));
    setPixelsPerMonth(Math.max((window.innerHeight - 200) / totalMonths, 2));

    finishModeTransition();
  }, [finishModeTransition, mode]);

  const scrollTimelineBy = useCallback((deltaY: number, baseScrollTop?: number) => {
    const container = scrollContainerRef.current;
    if (!container || deltaY === 0) return 0;

    const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
    const startScrollTop = baseScrollTop ?? container.scrollTop;
    const nextScrollTop = Math.min(maxScrollTop, Math.max(0, startScrollTop + deltaY));
    container.scrollTop = nextScrollTop;
    return nextScrollTop - startScrollTop;
  }, []);

  const introTouchRef = useRef<{
    startX: number;
    startY: number;
    scrollTop: number;
    dismissedIntro: boolean;
  } | null>(null);
  const timelinePointerRef = useRef<{
    startY: number;
    scrollTop: number;
    hasDragged: boolean;
  } | null>(null);
  const introPointerRef = useRef<{
    startX: number;
    startY: number;
    scrollTop: number;
    dismissedIntro: boolean;
  } | null>(null);

  const handleIntroTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (mode !== 'intro' || isAnimatingRef.current || hasBlockingOverlay) {
      introTouchRef.current = null;
      return;
    }

    const touch = e.touches[0];
    if (!touch) return;

    introTouchRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      scrollTop: scrollContainerRef.current?.scrollTop ?? 0,
      dismissedIntro: false,
    };
  }, [hasBlockingOverlay, mode]);

  const handleIntroTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const gesture = introTouchRef.current;
    if (!gesture || mode !== 'intro' || hasBlockingOverlay) return;

    const touch = e.touches[0];
    if (!touch) return;

    const deltaY = gesture.startY - touch.clientY;
    const deltaX = Math.abs(touch.clientX - gesture.startX);
    const isIntentionalVerticalSwipe = deltaY > SCROLL_THRESHOLD && deltaY > deltaX * 1.1;
    if (!isIntentionalVerticalSwipe) return;

    if (!gesture.dismissedIntro) {
      gesture.dismissedIntro = true;
      dismissIntroForTouchScroll('touch_swipe');
    }

    scrollTimelineBy(deltaY, gesture.scrollTop);
  }, [dismissIntroForTouchScroll, scrollTimelineBy, hasBlockingOverlay, mode]);


  const handleIntroTouchEnd = useCallback(() => {
    introTouchRef.current = null;
  }, []);

  const handleIntroPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || mode !== 'intro' || isAnimatingRef.current || hasBlockingOverlay) {
      introPointerRef.current = null;
      return;
    }

    introPointerRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      scrollTop: scrollContainerRef.current?.scrollTop ?? 0,
      dismissedIntro: false,
    };
  }, [hasBlockingOverlay, mode]);

  const handleIntroPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const gesture = introPointerRef.current;
    if (!gesture || mode !== 'intro' || hasBlockingOverlay) return;

    const deltaY = gesture.startY - e.clientY;
    const deltaX = Math.abs(e.clientX - gesture.startX);
    const isIntentionalVerticalDrag = deltaY > SCROLL_THRESHOLD && deltaY > deltaX * 1.1;
    if (!isIntentionalVerticalDrag) return;

    e.preventDefault();

    if (!gesture.dismissedIntro) {
      gesture.dismissedIntro = true;
      dismissIntroForTouchScroll('pointer_drag');
    }

    scrollTimelineBy(deltaY, gesture.scrollTop);
  }, [dismissIntroForTouchScroll, scrollTimelineBy, hasBlockingOverlay, mode]);

  const handleIntroPointerEnd = useCallback(() => {
    introPointerRef.current = null;
  }, []);

  const handleTimelinePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const isMobileScrollViewport = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
    if (!isMobileScrollViewport || e.pointerType !== 'mouse' || mode === 'intro' || hasBlockingOverlay || isAnimatingRef.current) {
      timelinePointerRef.current = null;
      return;
    }

    timelinePointerRef.current = {
      startY: e.clientY,
      scrollTop: scrollContainerRef.current?.scrollTop ?? 0,
      hasDragged: false,
    };
  }, [hasBlockingOverlay, mode]);

  const handleTimelinePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const gesture = timelinePointerRef.current;
    if (!gesture || mode === 'intro' || hasBlockingOverlay) return;

    const deltaY = gesture.startY - e.clientY;
    if (Math.abs(deltaY) <= SCROLL_THRESHOLD && !gesture.hasDragged) return;

    e.preventDefault();
    gesture.hasDragged = true;

    if (deltaY < -SCROLL_THRESHOLD && gesture.scrollTop <= 10) {
      handleZoom('intro', 'mobile_pointer_drag');
      return;
    }

    scrollTimelineBy(deltaY, gesture.scrollTop);
  }, [handleZoom, hasBlockingOverlay, mode, scrollTimelineBy]);

  const handleTimelinePointerEnd = useCallback(() => {
    timelinePointerRef.current = null;
  }, []);

  // Listen for openProject events from skill cards in Hero
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

      // For projects, scroll to the Selected Work section and click the project card
      // First ensure we're in fit mode so the projects section is visible
      if (mode === 'intro') {
        handleZoom('fit', 'hero_project_link');
      }

      // Wait for mode transition and scroll to the project
      setTimeout(() => {
        const projectCard = document.querySelector(`[data-project-id="${id}"]`);
        const projectsSection = document.getElementById('projects');

        if (projectCard && scrollContainerRef.current) {
          // Scroll to the projects section first
          const container = scrollContainerRef.current;
          if (projectsSection) {
            container.scrollTo({
              top: projectsSection.offsetTop - 100,
              behavior: 'smooth'
            });
          }

          // After scroll completes, highlight and click the card
          setTimeout(() => {
            projectCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Add a brief highlight effect and then click
            setTimeout(() => {
              const clickableCard = projectCard.querySelector('[class*="cursor-pointer"]') as HTMLElement;
              if (clickableCard) {
                clickableCard.click();
              }
            }, 400);
          }, 500);
        }
      }, mode === 'intro' ? 600 : 100);
    };

    window.addEventListener('openProject', handleOpenProject as EventListener);
    return () => window.removeEventListener('openProject', handleOpenProject as EventListener);
  }, [handleOpenTimelineProject, handleZoom, mode]);

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

  // 2. Scroll Snap Logic - Snaps between sections: Profile → Experiences → Projects → Writings
  const snapCooldownRef = useRef(false);
  const SNAP_COOLDOWN_MS = 700; // Prevent rapid snapping
  const SCROLL_THRESHOLD = 25; // Intentional scroll threshold

  // Helper to get section positions
  const getSectionPositions = useCallback(() => {
    const projectsEl = document.getElementById('projects');
    const writingsEl = document.getElementById('writings');
    return {
      experiences: 0,
      projects: projectsEl ? projectsEl.offsetTop - 100 : 0,
      writings: writingsEl ? writingsEl.offsetTop - 100 : 0,
    };
  }, []);

  // Helper to determine current section based on scroll position
  const getCurrentSection = useCallback((scrollTop: number): 'profile' | 'experiences' | 'projects' | 'writings' => {
    if (mode === 'intro') return 'profile';

    const positions = getSectionPositions();
    const viewportBuffer = window.innerHeight * 0.3; // 30% buffer for section detection

    // Check from bottom to top for proper detection
    if (isWritingsUnlocked && scrollTop >= positions.writings - viewportBuffer) return 'writings';
    if (scrollTop >= positions.projects - viewportBuffer) return 'projects';
    return 'experiences';
  }, [mode, getSectionPositions, isWritingsUnlocked]);

  useEffect(() => {
    const isTouchViewport = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;

    const handleGlobalWheel = (e: WheelEvent) => {
      if (isAnimatingRef.current || hasBlockingOverlay) return;
      if (snapCooldownRef.current) {
        e.preventDefault();
        return;
      }

      const container = scrollContainerRef.current;
      const positions = getSectionPositions();
      const currentScrollTop = container?.scrollTop ?? 0;
      const currentSection = getCurrentSection(currentScrollTop);
      const isScrollingDown = e.deltaY > SCROLL_THRESHOLD;
      const isScrollingUp = e.deltaY < -SCROLL_THRESHOLD;

      if (isTouchViewport) {
        if (mode === 'intro' && isScrollingDown) {
          e.preventDefault();
          snapCooldownRef.current = true;
          dismissIntroForTouchScroll('mobile_wheel');
          scrollTimelineBy(Math.min(window.innerHeight * 0.45, Math.max(SCROLL_THRESHOLD + 1, e.deltaY)));
          setTimeout(() => { snapCooldownRef.current = false; }, SNAP_COOLDOWN_MS);
        } else if (mode !== 'intro' && container && (isScrollingDown || isScrollingUp)) {
          e.preventDefault();

          if (isScrollingUp && currentScrollTop <= 10) {
            handleZoom('intro', 'mobile_wheel');
            return;
          }

          scrollTimelineBy(e.deltaY);
        }
        return;
      }

      // --- SCROLL DOWN ---
      if (isScrollingDown) {
        snapCooldownRef.current = true;

        if (mode === 'intro') {
          // Profile → Experiences
          e.preventDefault();
          handleZoom('fit', 'scroll_snap');
        } else if (currentSection === 'experiences' && container) {
          // Experiences → Projects
          e.preventDefault();
          smoothScrollTo(container, positions.projects);
        } else if (currentSection === 'projects' && container) {
          // Projects → Writings (locked)
          if (!isWritingsUnlocked) {
            snapCooldownRef.current = false;
            return;
          }
          // Projects → Writings (unlocked)
          e.preventDefault();
          smoothScrollTo(container, positions.writings);
        } else {
          // Already at bottom, allow natural scroll
          snapCooldownRef.current = false;
          return;
        }

        setTimeout(() => { snapCooldownRef.current = false; }, SNAP_COOLDOWN_MS);
        return;
      }

      // --- SCROLL UP ---
      if (isScrollingUp) {
        snapCooldownRef.current = true;

        if (currentSection === 'writings' && container) {
          // Writings → Projects
          e.preventDefault();
          smoothScrollTo(container, positions.projects);
        } else if (currentSection === 'projects' && container) {
          // Projects → Experiences
          e.preventDefault();
          smoothScrollTo(container, positions.experiences);
        } else if (currentSection === 'experiences' && container && currentScrollTop <= 10) {
          // Experiences (at top) → Profile
          handleZoom('intro', 'scroll_snap');
        } else {
          // Not at section boundary, allow natural scroll
          snapCooldownRef.current = false;
          return;
        }

        setTimeout(() => { snapCooldownRef.current = false; }, SNAP_COOLDOWN_MS);
        return;
      }
    };

    window.addEventListener('wheel', handleGlobalWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleGlobalWheel);
    };
  }, [mode, isAnimating, hasBlockingOverlay, handleZoom, dismissIntroForTouchScroll, scrollTimelineBy, getSectionPositions, getCurrentSection, isWritingsUnlocked]);


  // Scroll-back logic - Keeping enabled for normal->fit manual feel if at top, 
  // but strictly checking boundaries to avoid annoyance.
  const scrollBackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTopRef = useRef<number>(0);
  const scrollStartTimeRef = useRef<number>(0);
  const modeRef = useRef<TimelineMode>(mode);

  // Keep mode ref in sync
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Initialize lastScrollTop to current position
    lastScrollTopRef.current = container.scrollTop;

    const handleScrollBack = () => {
      const currentScrollTop = container.scrollTop;
      const wasScrollingUp = currentScrollTop < lastScrollTopRef.current;
      lastScrollTopRef.current = currentScrollTop;

      // Reset scroll start time if scrolling down
      if (!wasScrollingUp) {
        scrollStartTimeRef.current = 0;
        if (scrollBackTimeoutRef.current) clearTimeout(scrollBackTimeoutRef.current);
        return;
      }

      // If we are in 'fit' mode, we might want to go back to 'intro' if we keep scrolling up? 
      // Handled by global wheel listener mostly, but let's ensure we don't trap.
    };

    // We only restore the basic listeners if needed, but for now the global wheel matches user request best.
    // Leaving this simplified/empty to avoid conflicting logic.
    container.addEventListener('scroll', handleScrollBack, { passive: true });
    return () => container.removeEventListener('scroll', handleScrollBack);
  }, []);



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
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const nextScrollTop = e.currentTarget.scrollTop;
    setScrollTop(nextScrollTop);
    trackScrollDepth(e.currentTarget, nextScrollTop);

    // On touch devices, let a deliberate scroll dismiss the intro hero
    // without snapping the user back to the top of the timeline.
    const isTouchViewport = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
    if (isTouchViewport && mode === 'intro' && nextScrollTop > SCROLL_THRESHOLD) {
      dismissIntroForTouchScroll('touch_scroll');
    }
  }, [dismissIntroForTouchScroll, mode, trackScrollDepth]);

  // Sync activeSection with mode
  useEffect(() => {
    if (mode === 'intro') {
      setActiveSection('profile');
    } else {
      // When switching to timeline from profile, default to experiences
      setActiveSection((prev) => prev === 'profile' ? 'experiences' : prev);
    }
  }, [mode]);

  // Intersection Observer for all sections
  useEffect(() => {
    if (mode === 'intro') return;

    const projectsEl = document.getElementById('projects');
    const writingsEl = document.getElementById('writings');

    // Track which sections are currently intersecting
    let projectsIntersecting = false;
    let writingsIntersecting = false;

    const updateActiveSection = () => {
      if (writingsIntersecting && isWritingsUnlocked) {
        setActiveSection('writings');
      } else if (projectsIntersecting) {
        setActiveSection('projects');
      } else {
        // Neither projects nor writings is in view - we're in experiences
        setActiveSection('experiences');
      }
    };

    const projectsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          projectsIntersecting = entry.isIntersecting;
          updateActiveSection();
        });
      },
      { rootMargin: '-40% 0px -40% 0px' }
    );

    const writingsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          writingsIntersecting = entry.isIntersecting;
          updateActiveSection();
        });
      },
      { rootMargin: '-40% 0px -40% 0px' }
    );

    if (projectsEl) projectsObserver.observe(projectsEl);
    if (writingsEl) writingsObserver.observe(writingsEl);

    return () => {
      projectsObserver.disconnect();
      writingsObserver.disconnect();
    };
  }, [mode]);

  // Simple hover handlers - block during animation, intro, or scrolling
  const canHover = mode !== 'intro' && !isAnimating && !isScrolling;

  const handleHover = useCallback((id: string | null) => {
    // Debug logging removed

    if (mode === 'intro' || isAnimating || isScrolling) {
      // Debug logging removed

      return;
    }
    // Debug logging removed

    setHoveredId(id);
  }, [mode, isAnimating, isScrolling, hoveredId]);

  const handleLaneHover = useCallback((lane: number | null) => {
    if (mode === 'intro' || isAnimating || isScrolling) return;
    setHoveredLane(lane);
  }, [mode, isAnimating, isScrolling]);

  // Track mouse position for hover detection after scroll (tracked globally)
  const mousePositionRef = useRef<{ x: number; y: number } | null>(null);

  // Track mouse position globally for logic AND spotlight
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [mouseX, mouseY]);

  // Clear hover during animation or intro mode only
  // DO NOT clear during scroll - this causes jarring card collapse
  useEffect(() => {
    if (isAnimating || mode === 'intro') {
      // Debug logging removed

      setHoveredId(null);
      setHoveredLane(null);
    }
  }, [isAnimating, mode]);

  // Use all timeline data (no filtering)

  // Helper function to detect and hover item under mouse
  const detectAndHoverItemUnderMouse = useCallback(() => {
    // Debug logging removed

    if (!mousePositionRef.current || !scrollContainerRef.current) return;
    if (mode === 'intro' || isAnimatingRef.current || isScrollingRef.current) {
      // Debug logging removed

      return;
    }

    const container = scrollContainerRef.current;
    const { x, y } = mousePositionRef.current;

    // Use requestAnimationFrame to ensure DOM is settled
    requestAnimationFrame(() => {
      // Double-check scrolling state after frame
      if (isScrollingRef.current) {
        // Debug logging removed

        return;
      }

      // Get element at mouse position
      const elementAtPoint = document.elementFromPoint(x, y);
      if (!elementAtPoint) {
        // Debug logging removed

        return;
      }

      // Find the timeline item element (closest parent with data-item-id)
      let current: HTMLElement | null = elementAtPoint as HTMLElement;
      while (current && current !== container) {
        const itemId = current.getAttribute('data-item-id');
        if (itemId) {
          const item = TIMELINE_DATA.find(i => i.id === itemId);
          if (item) {
            // Debug logging removed

            handleHover(item.id);
            handleLaneHover(item.lane);
            return;
          }
        }
        current = current.parentElement;
      }
    });
  }, [mode, handleHover, handleLaneHover]);

  // When scroll stops, check which item is under the mouse and hover it
  useEffect(() => {
    if (!isScrolling && mode !== 'intro' && !isAnimating) {
      // Delay to ensure scroll momentum has fully settled, DOM is stable, and state updates are complete
      const timer = setTimeout(() => {
        // Double-check we're still not scrolling and not animating
        if (!isScrollingRef.current && !isAnimatingRef.current) {
          detectAndHoverItemUnderMouse();
        }
      }, 150); // Wait for scroll to fully settle and React state to stabilize
      return () => clearTimeout(timer);
    }
  }, [isScrolling, mode, isAnimating, detectAndHoverItemUnderMouse]);

  // When animation completes (isAnimating goes from true to false), check for item under mouse
  const prevIsAnimatingRef = useRef(isAnimating);
  useEffect(() => {
    const wasAnimating = prevIsAnimatingRef.current;
    prevIsAnimatingRef.current = isAnimating;

    // Animation just completed
    if (wasAnimating && !isAnimating && mode !== 'intro') {
      // Give extra time for Framer Motion animations to fully settle
      const timer = setTimeout(() => {
        detectAndHoverItemUnderMouse();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, mode, detectAndHoverItemUnderMouse]);

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
    duration: 0.5,
    ease: [0.32, 0.72, 0, 1] // Custom cubic-bezier for smooth feel
  };

  const handleNavigate = (section: 'profile' | 'experiences' | 'projects' | 'writings') => {
    trackEvent('section_nav_clicked', {
      section,
      from: activeSection,
      mode,
    });

    if (section === 'profile') {
      handleZoom('intro', 'section_nav');
    } else {
      // If currently in intro, switch to fit mode first
      if (mode === 'intro') {
        handleZoom('fit', 'section_nav');
        // Small delay to allow state to settle before scrolling request
        setTimeout(() => {
          if (section === 'experiences') {
            if (scrollContainerRef.current) smoothScrollTo(scrollContainerRef.current, 0);
          } else if (section === 'projects') {
            const projectsEl = document.getElementById('projects');
            if (projectsEl && scrollContainerRef.current) {
              smoothScrollTo(scrollContainerRef.current, projectsEl.offsetTop - 50); // Small buffer
            }
          } else if (section === 'writings' && isWritingsUnlocked) {
            const writingsEl = document.getElementById('writings');
            if (writingsEl && scrollContainerRef.current) {
              smoothScrollTo(scrollContainerRef.current, writingsEl.offsetTop - 50);
            }
          }
        }, 100);
      } else {
        // Already in timeline mode, just scroll
        if (section === 'experiences') {
          if (scrollContainerRef.current) smoothScrollTo(scrollContainerRef.current, 0);
        } else if (section === 'projects') {
          const projectsEl = document.getElementById('projects');
          if (projectsEl && scrollContainerRef.current) {
            smoothScrollTo(scrollContainerRef.current, projectsEl.offsetTop - 50);
          }
        } else if (section === 'writings' && isWritingsUnlocked) {
          const writingsEl = document.getElementById('writings');
          if (writingsEl && scrollContainerRef.current) {
            smoothScrollTo(scrollContainerRef.current, writingsEl.offsetTop - 50);
          }
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-indigo-500/30 relative z-10">
      {/* Spotlight Overlay */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300"
        style={{
          background: useMotionTemplate`radial-gradient(600px circle at ${mouseX}px ${mouseY}px, rgba(99, 102, 241, 0.07), transparent 80%)`,
        }}
      />


      {/* --- CASE STUDY MODAL --- */}
      <AnimatePresence>
        {activeCaseStudy && (
          <CaseStudyModal
            caseStudy={activeCaseStudy}
            onClose={() => setActiveCaseStudy(null)}
          />
        )}
      </AnimatePresence>

      {/* --- EXPERIENCE DETAIL PAGE --- */}
      <AnimatePresence>
        {activeProject && (
          <ExperienceDetail
            item={richProject ? { ...activeProject, ...richProject } as TimelineItem : activeProject}
            onClose={() => setActiveProject(null)}
            onOpenCaseStudy={handleOpenCaseStudy}
          />
        )}
      </AnimatePresence>

      {/* --- PROFILE MODAL --- */}
      <AnimatePresence>
        {isProfileOpen && (
          <ProfileModal onClose={() => setIsProfileOpen(false)} />
        )}
      </AnimatePresence>

      {/* --- TINKERVERSE MODAL --- */}
      <AnimatePresence>
        {isTinkerVerseOpen && (
          <TinkerVerseModal
            item={TIMELINE_DATA.find(i => i.id === 'tinkerverse')!}
            posts={SOCIAL_POSTS}
            onClose={() => setIsTinkerVerseOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 px-6 py-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: mode === 'intro' ? 0 : 1 }}
          transition={{ duration: 0.8 }}
          className={`absolute inset-0 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 ${mode === 'intro' ? 'pointer-events-none' : 'pointer-events-auto'}`}
        />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{
            opacity: mode === 'intro' ? 0 : 1,
            y: mode === 'intro' ? -20 : 0
          }}
          transition={pageTransition}
          className={`relative max-w-6xl mx-auto flex flex-col md:flex-row md:items-start md:justify-between gap-3 ${mode === 'intro' ? 'pointer-events-none' : 'pointer-events-auto'}`}
        >
          {/* Status Badge Header */}
          <div
            className="group flex items-center gap-3 cursor-pointer relative"
            onClick={() => handleOpenProfile('header_badge')}
          >
            {/* Profile Photo */}
            <div className="relative w-10 h-10 flex-shrink-0 rounded-full overflow-hidden border-2 border-white/20 group-hover:border-white/40 transition-colors duration-300">
              <img
                src={REAL_USER_IMAGE}
                alt="Adi Agarwal"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Name and Status */}
            <div className="flex flex-col">
              <span className="text-white font-medium text-sm tracking-tight group-hover:text-indigo-300 transition-colors">Adi Agarwal</span>

              {/* Open for Work with Glowing Dot */}
              <div className="relative flex items-center gap-1.5">
                {/* Glowing Green Dot */}
                <div className="relative">
                  <div className="absolute inset-0 w-2 h-2 bg-emerald-400 rounded-full blur-sm opacity-60 group-hover:opacity-100 animate-pulse" />
                  <div className="relative w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_6px_1px_rgba(52,211,153,0.4)] group-hover:shadow-[0_0_10px_3px_rgba(52,211,153,0.6)] transition-shadow duration-300" />
                </div>
                <span className="text-white/50 text-[10px] group-hover:text-white/70 transition-colors duration-300">Open for work</span>
              </div>
            </div>

            {/* Hover Tooltip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-black/95 backdrop-blur-lg border border-white/20 rounded-lg text-xs text-white/90 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none transform scale-95 group-hover:scale-100 shadow-xl z-50">
              Internships | June to Aug 2026
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[-8px]">
                <div className="border-4 border-transparent border-b-black/95"></div>
              </div>
            </div>
          </div>

        </motion.div>

      </header>

      {/* --- SECTION NAVIGATION RAIL --- */}


      {/* --- HERO SECTION (Parallax Exit) --- */}
      <motion.div
        id="profile"
        className="absolute inset-0 z-40 will-change-transform"
        onTouchStart={handleIntroTouchStart}
        onTouchMove={handleIntroTouchMove}
        onTouchEnd={handleIntroTouchEnd}
        onTouchCancel={handleIntroTouchEnd}
        onPointerDown={handleIntroPointerDown}
        onPointerMove={handleIntroPointerMove}
        onPointerUp={handleIntroPointerEnd}
        onPointerCancel={handleIntroPointerEnd}
        aria-hidden={mode !== 'intro'}
        inert={mode !== 'intro' ? true : undefined}
        style={{ touchAction: mode === 'intro' ? 'pan-y' : 'auto' }}
        animate={{
          opacity: mode === 'intro' ? 1 : 0,
          y: mode === 'intro' ? 0 : -150,
          scale: mode === 'intro' ? 1 : 0.95,
          pointerEvents: mode === 'intro' ? 'auto' : 'none',
          zIndex: mode === 'intro' ? 40 : -1
        }}
        transition={pageTransition}
      >
        <Hero onOpenProfile={() => handleOpenProfile('hero_avatar')} />

        <AnimatePresence>
          {mode === 'intro' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute bottom-8 left-0 right-0 flex justify-center text-white/60 pointer-events-none"
            >
              <div
                className="flex flex-col items-center gap-2 animate-bounce"
                style={{ textShadow: '0 6px 18px rgba(0,0,0,0.55)' }}
              >
                <MousePointer2 size={16} />
                <span className="text-[10px] uppercase tracking-widest">Scroll to Explore</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* --- TIMELINE SECTION (Slide Up Entrance) --- */}
      <motion.div
        id="resume"
        className="flex-1 relative w-full h-full will-change-transform"
        animate={{
          opacity: mode === 'intro' ? 0.3 : 1,
          y: mode === 'intro' ? '80vh' : 0,
          scale: mode === 'intro' ? 0.98 : 1
        }}
        transition={pageTransition}
      >
        {/* Zoom Controls - Desktop only */}
        <div className="hidden md:flex absolute top-24 right-6 flex-col gap-2 z-40">
          <button
            onClick={() => handleManualZoom('in')}
            className="p-2 rounded-full border transition-all bg-black/40 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
            title="Zoom In"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => handleManualZoom('out')}
            className="p-2 rounded-full border transition-all bg-black/40 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
            title="Zoom Out"
          >
            <Minus size={16} />
          </button>
          <div className="w-full h-[1px] bg-white/10 my-1" />
          {mode !== 'fit' ? (
            <button
              onClick={() => handleZoom('fit', 'zoom_control')}
              className={`p-2 rounded-full border transition-all bg-indigo-500/20 text-indigo-200 border-indigo-500/50 hover:bg-indigo-500/40`}
              title="Fit to Screen"
            >
              <Minimize size={16} />
            </button>
          ) : (
            <button
              onClick={() => handleZoom('normal', 'zoom_control')}
              className={`p-2 rounded-full border transition-all bg-indigo-500 text-white border-indigo-500`}
              title="Reset Zoom"
            >
              <Maximize size={16} />
            </button>
          )}
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onPointerDown={handleTimelinePointerDown}
          onPointerMove={handleTimelinePointerMove}
          onPointerUp={handleTimelinePointerEnd}
          onPointerCancel={handleTimelinePointerEnd}
          className="h-full overflow-y-auto overflow-x-hidden relative no-scrollbar"
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain', touchAction: 'pan-y' }}
        >
          {/* Mobile Layout - Stacked Sections */}
          <div className="block md:hidden mt-[150px] pb-6">
            <MobileTimeline
              items={TIMELINE_DATA}
              onOpenCaseStudy={handleOpenCaseStudy}
              onOpenProject={(item) => handleOpenTimelineProject(item, 'mobile_timeline')}
              onOpenTinkerVerse={() => handleOpenTinkerVerse('mobile_timeline')}
            />

            {/* Mobile-only Back to Home Button */}
            <div className="fixed bottom-6 right-6 z-50">
              <button
                onClick={() => {
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop = 0;
                  }
                  handleZoom('intro', 'mobile_home');
                }}
                className="p-3 rounded-full bg-indigo-500/80 text-white shadow-lg shadow-indigo-500/30 active:scale-95 transition-transform"
              >
                <Home size={20} />
              </button>
            </div>
          </div>

          {/* Desktop Layout - 3 Column Grid (replacing Rail) */}
          {/* Desktop Layout */}
          <LayoutGroup>
            <div
              className="hidden md:block relative w-full max-w-7xl mx-auto mt-[160px]"
              style={{ height: mode === 'fit' ? 'auto' : `${totalContainerHeight}px` }}
            >
              {mode === 'fit' ? (
                /* --- GRID MODE (Collapsed) - Aligned with Timeline Rail --- */
                <div className="flex pb-32">
                  {/* Spacer matching timeline rail width */}
                  <div className="hidden md:block w-28 md:w-36 flex-shrink-0" />

                  {/* 3-Column Grid aligned with timeline lanes */}
                  <div className="flex-1 grid grid-cols-3 gap-3 items-start px-4 md:pr-0 md:pl-0">

                    {/* COLUMN 1: EDUCATION */}
                    <div className="space-y-3">
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
                            hoveredId={hoveredId}
                            onHover={handleHover}
                            onLaneHover={handleLaneHover}
                            isDimmed={hoveredId !== null && hoveredId !== item.id}
                            pixelsPerMonth={pixelsPerMonth}
                            totalHeight={totalContainerHeight}
                            mode={mode}
                            onOpenCaseStudy={handleOpenCaseStudy}
                            onOpenProject={(timelineItem) => handleOpenTimelineProject(timelineItem, 'timeline_grid')}
                            onOpenTinkerVerse={() => handleOpenTinkerVerse('timeline_grid')}
                            isScrolling={false}
                            layoutMode="grid"
                            isExpanded={expandedCardId === item.id}
                            onExpand={handleCardExpand}
                          />
                        ))}
                    </div>

                    {/* COLUMN 2: EXPERIENCE */}
                    <div className="space-y-3">
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
                            hoveredId={hoveredId}
                            onHover={handleHover}
                            onLaneHover={handleLaneHover}
                            isDimmed={hoveredId !== null && hoveredId !== item.id}
                            pixelsPerMonth={pixelsPerMonth}
                            totalHeight={totalContainerHeight}
                            mode={mode}
                            onOpenCaseStudy={handleOpenCaseStudy}
                            onOpenProject={(timelineItem) => handleOpenTimelineProject(timelineItem, 'timeline_grid')}
                            onOpenTinkerVerse={() => handleOpenTinkerVerse('timeline_grid')}
                            isScrolling={false}
                            layoutMode="grid"
                            isExpanded={expandedCardId === item.id}
                            onExpand={handleCardExpand}
                          />
                        ))}
                    </div>

                    {/* COLUMN 3: TINKERVERSE / CREATIVE */}
                    <div className="space-y-3">
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
                            hoveredId={hoveredId}
                            onHover={handleHover}
                            onLaneHover={handleLaneHover}
                            isDimmed={hoveredId !== null && hoveredId !== item.id}
                            pixelsPerMonth={pixelsPerMonth}
                            totalHeight={totalContainerHeight}
                            mode={mode}
                            onOpenCaseStudy={handleOpenCaseStudy}
                            onOpenProject={(timelineItem) => handleOpenTimelineProject(timelineItem, 'timeline_grid')}
                            onOpenTinkerVerse={() => handleOpenTinkerVerse('timeline_grid')}
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
                    onYearClick={(top) => smoothScrollTo(scrollContainerRef.current!, top)}
                    currentScrollTop={scrollTop}
                    hoveredItem={hoveredItem}
                  />

                  {/* Content & Background Wrapper */}
                  <div className="absolute top-0 left-28 md:left-36 right-4 md:right-0 bottom-0">

                    {/* Column Headers (Timeline Mode) */}
                    <div className="absolute top-0 left-0 right-0 h-10 z-20 pointer-events-none flex">
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
                        hoveredId={hoveredId}
                        onHover={handleHover}
                        onLaneHover={handleLaneHover}
                        isDimmed={hoveredId !== null && hoveredId !== item.id}
                        pixelsPerMonth={pixelsPerMonth}
                        totalHeight={totalContainerHeight}
                        mode={mode}
                        onOpenCaseStudy={handleOpenCaseStudy}
                        onOpenProject={(timelineItem) => handleOpenTimelineProject(timelineItem, 'timeline_rail')}
                        onOpenTinkerVerse={() => handleOpenTinkerVerse('timeline_rail')}
                        isScrolling={!canHover}
                      // layoutMode defaults to absolute
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </LayoutGroup>

          {/* --- PROJECTS SECTION --- */}
          <ProjectsSection
            isWritingsUnlocked={isWritingsUnlocked}
            onUnlockWritings={() => {
              trackEvent('writings_unlocked', { source: 'hidden_projects_trigger' });
              setIsWritingsUnlocked(true);
              setTimeout(() => {
                const writingsEl = document.getElementById('writings');
                if (writingsEl && scrollContainerRef.current) {
                  import('./utils').then(({ smoothScrollTo }) => {
                    smoothScrollTo(scrollContainerRef.current!, writingsEl.offsetTop - 50);
                  });
                }
              }, 150);
            }}
          />

          {/* --- WRITINGS SECTION --- */}
          <BlogSection isUnlocked={isWritingsUnlocked} />

          <div className="h-32 w-full" />
        </div>
      </motion.div>

      {/* --- VERTICAL NAVIGATION --- */}
      <VerticalNavbar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        mode={mode}
        isWritingsUnlocked={isWritingsUnlocked}
        isHidden={hasBlockingOverlay}
      />
    </div>
  );
};

export default App;

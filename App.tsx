

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useMotionTemplate, LayoutGroup } from 'framer-motion';
import { TIMELINE_DATA, CONFIG, SOCIAL_POSTS } from './constants';
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
import VerticalNavbar from './components/VerticalNavbar'; // Added
import { Maximize, Minimize, MousePointer2, Plus, Minus, Home } from 'lucide-react';
import { TimelineMode, CaseStudy, TimelineItem } from './types';
import { Project } from './types/Project';
import { PROJECTS } from './data/projects';
// Background removed for performance
import { useScrollDetection } from './hooks/useScrollDetection';


const App: React.FC = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredLane, setHoveredLane] = useState<number | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [activeSection, setActiveSection] = useState<'profile' | 'experiences' | 'projects'>('profile'); // Added



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
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const handleCardExpand = useCallback((cardId: string | null) => {
    setExpandedCardId(prev => prev === cardId ? null : cardId);
  }, []);


  // 1. Handle Zoom Transitions - simplified
  const handleZoom = useCallback((targetMode: TimelineMode) => {
    if (isAnimatingRef.current || mode === targetMode) return;

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

    // Re-enable after animation (500ms)
    setTimeout(() => {
      setIsAnimating(false);
      isAnimatingRef.current = false;
      // Debug logging removed

    }, 550);
  }, [isAnimating, mode]);

  // Listen for openProject events from skill cards in Hero
  useEffect(() => {
    const handleOpenProject = (e: CustomEvent<{ id: string; type: 'project' | 'experience' }>) => {
      const { id, type } = e.detail;

      // For experiences, open the timeline modal directly
      if (type === 'experience') {
        const timelineItem = TIMELINE_DATA.find(item => item.id === id);
        if (timelineItem) {
          setActiveProject(timelineItem);
        }
        return;
      }

      // For projects, scroll to the Selected Work section and click the project card
      // First ensure we're in normal mode so the projects section is visible
      if (mode === 'intro') {
        handleZoom('normal');
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
  }, [handleZoom, mode]);

  const handleManualZoom = (direction: 'in' | 'out') => {
    setMode('normal'); // Switch to normal mode on manual zoom
    setPixelsPerMonth(prev => {
      const step = 5;
      const newVal = direction === 'in' ? prev + step : prev - step;
      return Math.min(Math.max(newVal, 2), 150); // Clamp between 2 and 150
    });
  };

  // 2. Scroll Logic - Two-step scroll flow: intro → fit → normal
  useEffect(() => {
    const handleGlobalWheel = (e: WheelEvent) => {
      if (isAnimatingRef.current || isProfileOpen || activeCaseStudy || activeProject || isTinkerVerseOpen) return;

      // Scroll down from intro → go to fit (collapsed view)
      // Balanced threshold (deltaY > 15) - prevents accidental triggers but responsive to intentional scrolls
      if (mode === 'intro' && e.deltaY > 15) {
        handleZoom('fit');
        return;
      }

      // Scroll down from fit → go to normal (expanded timeline)
      // Balanced threshold (deltaY > 15) - prevents accidental triggers but responsive to intentional scrolls
      if (mode === 'fit' && e.deltaY > 15) {
        handleZoom('normal');
        return;
      }

      // Scroll up from fit → go back to intro
      if (mode === 'fit' && e.deltaY < -15) {
        handleZoom('intro');
        return;
      }

      // Scroll up from normal → go back to fit (when at top)
      if (mode === 'normal' && e.deltaY < -10 && scrollContainerRef.current && scrollContainerRef.current.scrollTop <= 5) {
        handleZoom('fit');
        return;
      }
    };

    // Touch support for mobile
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isAnimatingRef.current || isProfileOpen || activeCaseStudy || activeProject || isTinkerVerseOpen) return;
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY; // Positive = swiping up (scrolling down), Negative = swiping down

      // Swipe up from intro → go to fit
      if (mode === 'intro' && deltaY > 30) {
        handleZoom('fit');
        return;
      }

      // Swipe up from fit → go to normal
      if (mode === 'fit' && deltaY > 30) {
        handleZoom('normal');
        return;
      }

      // Swipe down from fit → go back to intro
      if (mode === 'fit' && deltaY < -30) {
        handleZoom('intro');
        return;
      }
    };

    window.addEventListener('wheel', handleGlobalWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleGlobalWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [mode, isAnimating, isProfileOpen, activeCaseStudy, activeProject, isTinkerVerseOpen, handleZoom]);

  // Scroll-back to intro: Hybrid approach - track scroll direction + position with smart debouncing
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
        if (scrollBackTimeoutRef.current) {
          clearTimeout(scrollBackTimeoutRef.current);
          scrollBackTimeoutRef.current = null;
        }
        return;
      }

      // Only proceed if at/near top and conditions are met
      if (currentScrollTop >= 1 || isAnimatingRef.current || (modeRef.current !== 'normal' && modeRef.current !== 'fit')) {
        scrollStartTimeRef.current = 0;
        if (scrollBackTimeoutRef.current) {
          clearTimeout(scrollBackTimeoutRef.current);
          scrollBackTimeoutRef.current = null;
        }
        return;
      }

      // We're scrolling up and at/near top - track when we FIRST reached top
      if (scrollStartTimeRef.current === 0) {
        scrollStartTimeRef.current = Date.now();
      }

      // Clear existing timeout
      if (scrollBackTimeoutRef.current) {
        clearTimeout(scrollBackTimeoutRef.current);
      }

      // Set new timeout - waits for scroll to settle at top
      scrollBackTimeoutRef.current = setTimeout(() => {
        // Final check before triggering
        const finalScrollTop = container.scrollTop;
        const timeAtTop = Date.now() - scrollStartTimeRef.current;

        if (finalScrollTop < 1 && !isAnimatingRef.current && modeRef.current === 'normal') {
          // Require at least 200ms at top to avoid accidental triggers on fast scrolls
          if (timeAtTop >= 200) {
            // Scroll up from normal → go to fit (collapsed view)
            handleZoom('fit');
          }
        }

        // Reset
        scrollBackTimeoutRef.current = null;
        scrollStartTimeRef.current = 0;
      }, 300); // Wait 300ms after last scroll event at top
    };

    container.addEventListener('scroll', handleScrollBack, { passive: true });

    // Also handle gentle wheel scrolls at top for immediate feedback
    const handleWheelAtTop = (e: WheelEvent) => {
      if (isAnimatingRef.current || modeRef.current === 'intro') return;
      if (container.scrollTop > 1) return; // Must be at top
      if (e.deltaY >= -20) return; // Only gentle scroll up (avoid momentum flings)

      // For gentle scrolls at top, allow immediate trigger (normal → fit)
      if (!scrollBackTimeoutRef.current && !isAnimatingRef.current && modeRef.current === 'normal') {
        e.preventDefault();
        handleZoom('fit');
      }
    };

    // Touch support for scroll-back on mobile (normal → fit, fit → intro)
    let touchStartYBack = 0;
    const handleTouchStartBack = (e: TouchEvent) => {
      // Track touch start for both near top (normal mode) and fit mode
      if (container.scrollTop < 5 || modeRef.current === 'fit') {
        touchStartYBack = e.touches[0].clientY;
      }
    };
    const handleTouchMoveBack = (e: TouchEvent) => {
      if (isAnimatingRef.current || modeRef.current === 'intro') return;
      const touchY = e.touches[0].clientY;
      const deltaY = touchY - touchStartYBack; // Positive = swiping down (pulling to go back)

      // From fit mode → go back to intro
      if (modeRef.current === 'fit' && deltaY > 50) {
        handleZoom('intro');
        return;
      }

      // From normal mode at top → go back to fit
      if (modeRef.current === 'normal' && container.scrollTop < 5 && deltaY > 50) {
        handleZoom('fit');
        return;
      }
    };

    container.addEventListener('wheel', handleWheelAtTop, { passive: false });
    container.addEventListener('touchstart', handleTouchStartBack, { passive: true });
    container.addEventListener('touchmove', handleTouchMoveBack, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScrollBack);
      container.removeEventListener('wheel', handleWheelAtTop);
      container.removeEventListener('touchstart', handleTouchStartBack);
      container.removeEventListener('touchmove', handleTouchMoveBack);
      if (scrollBackTimeoutRef.current) {
        clearTimeout(scrollBackTimeoutRef.current);
      }
    };
  }, [handleZoom]); // Only depend on handleZoom, use ref for mode


  // Throttled scroll handler for better performance
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Sync activeSection with mode
  useEffect(() => {
    if (mode === 'intro') {
      setActiveSection('profile');
    } else {
      // When switching to timeline from profile, default to experiences
      setActiveSection((prev) => prev === 'profile' ? 'experiences' : prev);
    }
  }, [mode]);

  // Intersection Observer for Projects Section
  useEffect(() => {
    if (mode === 'intro') return;

    let observer: IntersectionObserver | null = null;
    const projectsEl = document.getElementById('projects');

    if (projectsEl) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection('projects');
            } else {
              // If the projects section is below the viewport (top > 0), means we are above it
              if (entry.boundingClientRect.top > 0) {
                setActiveSection('experiences');
              }
            }
          });
        },
        {
          // Trigger when the element hits the middle of the viewport
          rootMargin: '-50% 0px -50% 0px'
        }
      );

      observer.observe(projectsEl);
    }

    return () => {
      if (observer) observer.disconnect();
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

  const handleNavigate = (section: 'profile' | 'experiences' | 'projects') => {
    if (section === 'profile') {
      handleZoom('intro');
    } else {
      // If currently in intro, switch to normal first
      if (mode === 'intro') {
        handleZoom('normal');
        // Small delay to allow state to settle before scrolling request
        setTimeout(() => {
          if (section === 'experiences') {
            if (scrollContainerRef.current) smoothScrollTo(scrollContainerRef.current, 0);
          } else if (section === 'projects') {
            const projectsEl = document.getElementById('projects');
            if (projectsEl && scrollContainerRef.current) {
              smoothScrollTo(scrollContainerRef.current, projectsEl.offsetTop - 50); // Small buffer
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
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-indigo-500/30 relative z-10">

      {/* Background removed for performance - keeping it clean and minimal */}

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
            onOpenCaseStudy={setActiveCaseStudy}
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
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: mode === 'intro' ? 0 : 1 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 pointer-events-auto"
        />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{
            opacity: mode === 'intro' ? 0 : 1,
            y: mode === 'intro' ? -20 : 0
          }}
          transition={pageTransition}
          className="relative max-w-6xl mx-auto flex flex-col md:flex-row md:items-start md:justify-between gap-3 pointer-events-auto"
        >
          <div className="cursor-pointer group" onClick={() => handleZoom('intro')}>
            <h1 className="text-xl font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors">
              Adi <span className="font-normal text-white/60 group-hover:text-indigo-300">Agarwal</span>
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5 group-hover:text-white/60 transition-colors">
              Product | Engineering | Data | Design
            </p>
          </div>


        </motion.div>
      </header>

      {/* --- SECTION NAVIGATION RAIL --- */}


      {/* --- HERO SECTION (Parallax Exit) --- */}
      <motion.div
        id="profile"
        className="absolute inset-0 z-40 will-change-transform"
        animate={{
          opacity: mode === 'intro' ? 1 : 0,
          y: mode === 'intro' ? 0 : -150,
          scale: mode === 'intro' ? 1 : 0.95,
          pointerEvents: mode === 'intro' ? 'auto' : 'none',
          zIndex: mode === 'intro' ? 40 : -1
        }}
        transition={pageTransition}
      >
        <Hero onOpenProfile={() => setIsProfileOpen(true)} />

        <AnimatePresence>
          {mode === 'intro' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute bottom-8 left-0 right-0 flex justify-center text-white/30 pointer-events-none"
            >
              <div className="flex flex-col items-center gap-2 animate-bounce">
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
              onClick={() => handleZoom('fit')}
              className={`p-2 rounded-full border transition-all bg-indigo-500/20 text-indigo-200 border-indigo-500/50 hover:bg-indigo-500/40`}
              title="Fit to Screen"
            >
              <Minimize size={16} />
            </button>
          ) : (
            <button
              onClick={() => handleZoom('normal')}
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
          className="h-full overflow-y-auto overflow-x-hidden relative no-scrollbar"
        >
          {/* Mobile Layout - Stacked Sections */}
          <div className="block md:hidden mt-[150px] pb-6">
            <MobileTimeline
              items={TIMELINE_DATA}
              onOpenCaseStudy={setActiveCaseStudy}
              onOpenProject={setActiveProject}
              onOpenTinkerVerse={() => setIsTinkerVerseOpen(true)}
            />

            {/* Mobile-only Back to Home Button */}
            <div className="fixed bottom-6 right-6 z-50">
              <button
                onClick={() => {
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop = 0;
                  }
                  handleZoom('intro');
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
                            onOpenCaseStudy={setActiveCaseStudy}
                            onOpenProject={setActiveProject}
                            onOpenTinkerVerse={() => setIsTinkerVerseOpen(true)}
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
                            onOpenCaseStudy={setActiveCaseStudy}
                            onOpenProject={setActiveProject}
                            onOpenTinkerVerse={() => setIsTinkerVerseOpen(true)}
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
                            onOpenCaseStudy={setActiveCaseStudy}
                            onOpenProject={setActiveProject}
                            onOpenTinkerVerse={() => setIsTinkerVerseOpen(true)}
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
                        onOpenCaseStudy={setActiveCaseStudy}
                        onOpenProject={setActiveProject}
                        onOpenTinkerVerse={() => setIsTinkerVerseOpen(true)}
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
          <ProjectsSection />

          <div className="h-32 w-full" />
        </div>
      </motion.div>

      {/* --- VERTICAL NAVIGATION --- */}
      <VerticalNavbar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        mode={mode}
      />
    </div>
  );
};

export default App;
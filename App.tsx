

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TIMELINE_DATA, CONFIG } from './constants';
import { getMonthDiff, parseDate, smoothScrollTo } from './utils';
import TimelineEvent from './components/TimelineEvent';
import TimelineRail from './components/TimelineRail';
import Hero from './components/Hero';
import CaseStudyModal from './components/CaseStudyModal';
import ProfileModal from './components/ProfileModal';
import ProjectModal from './components/ProjectModal';
import { Filter, Maximize, Minimize, MousePointer2, Plus, Minus } from 'lucide-react';
import { TimelineMode, CaseStudy, TimelineItem } from './types';
import { useScrollDetection } from './hooks/useScrollDetection';

const App: React.FC = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredLane, setHoveredLane] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'corporate' | 'education' | 'personal'>('all');
  const [scrollTop, setScrollTop] = useState(0);
  
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6fde9818-753e-4df5-be34-d19024eb2017',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H4',location:'App.tsx:hoveredId-state',message:'hoveredId state changed',data:{hoveredId,isScrolling,mode,isAnimating},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log
  }, [hoveredId, isScrolling, mode, isAnimating]);

  // Modal State
  const [activeCaseStudy, setActiveCaseStudy] = useState<CaseStudy | null>(null);
  const [activeProject, setActiveProject] = useState<TimelineItem | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // 1. Handle Zoom Transitions - simplified
  const handleZoom = useCallback((targetMode: TimelineMode) => {
    if (isAnimatingRef.current || mode === targetMode) return;
    
    isAnimatingRef.current = true;
    setIsAnimating(true);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6fde9818-753e-4df5-be34-d19024eb2017',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H1',location:'App.tsx:handleZoom',message:'enter handleZoom',data:{targetMode,mode,scrollTop:scrollContainerRef.current?.scrollTop ?? null,isAnimating},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log

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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6fde9818-753e-4df5-be34-d19024eb2017',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H1',location:'App.tsx:handleZoom',message:'exit handleZoom',data:{targetMode,modeAfter:mode,isAnimating:false},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
    }, 550);
  }, [isAnimating, mode]);

  const handleManualZoom = (direction: 'in' | 'out') => {
    setMode('normal'); // Switch to normal mode on manual zoom
    setPixelsPerMonth(prev => {
      const step = 5;
      const newVal = direction === 'in' ? prev + step : prev - step;
      return Math.min(Math.max(newVal, 2), 150); // Clamp between 2 and 150
    });
  };

  // 2. Scroll Logic - scroll down from intro triggers timeline
  useEffect(() => {
    const handleGlobalWheel = (e: WheelEvent) => {
      if (isAnimatingRef.current || isProfileOpen || activeCaseStudy || activeProject) return;
      if (mode !== 'intro') return;
      if (mode === 'intro' && e.deltaY > 5) {
        handleZoom('normal');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6fde9818-753e-4df5-be34-d19024eb2017',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H2',location:'App.tsx:handleGlobalWheel',message:'intro->normal triggered',data:{deltaY:e.deltaY,mode},timestamp:Date.now()})}).catch(()=>{});
        // #endregion agent log
      }
    };
    window.addEventListener('wheel', handleGlobalWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleGlobalWheel);
  }, [mode, isAnimating, isProfileOpen, activeCaseStudy, activeProject, handleZoom]);

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
        
        if (finalScrollTop < 1 && !isAnimatingRef.current && (modeRef.current === 'normal' || modeRef.current === 'fit')) {
          // Require at least 200ms at top to avoid accidental triggers on fast scrolls
          if (timeAtTop >= 200) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/6fde9818-753e-4df5-be34-d19024eb2017',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H2',location:'App.tsx:handleScrollBack',message:'scroll->intro triggered',data:{scrollTop:finalScrollTop,mode:modeRef.current,timeAtTop},timestamp:Date.now()})}).catch(()=>{});
            // #endregion agent log
            handleZoom('intro');
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
      
      // For gentle scrolls at top, allow immediate trigger
      if (!scrollBackTimeoutRef.current && !isAnimatingRef.current) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6fde9818-753e-4df5-be34-d19024eb2017',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H2',location:'App.tsx:handleWheelAtTop',message:'gentle wheel->intro triggered',data:{deltaY:e.deltaY,scrollTop:container.scrollTop,mode:modeRef.current},timestamp:Date.now()})}).catch(()=>{});
        // #endregion agent log
        e.preventDefault();
        handleZoom('intro');
      }
    };
    
    container.addEventListener('wheel', handleWheelAtTop, { passive: false });
    
    return () => {
      container.removeEventListener('scroll', handleScrollBack);
      container.removeEventListener('wheel', handleWheelAtTop);
      if (scrollBackTimeoutRef.current) {
        clearTimeout(scrollBackTimeoutRef.current);
      }
    };
  }, [handleZoom]); // Only depend on handleZoom, use ref for mode


  // Throttled scroll handler for better performance
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Simple hover handlers - block during animation, intro, or scrolling
  const canHover = mode !== 'intro' && !isAnimating && !isScrolling;
  
  const handleHover = useCallback((id: string | null) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6fde9818-753e-4df5-be34-d19024eb2017',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H2',location:'App.tsx:handleHover',message:'handleHover called',data:{id,mode,isAnimating,isScrolling,currentHoveredId:hoveredId},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log
    if (mode === 'intro' || isAnimating || isScrolling) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6fde9818-753e-4df5-be34-d19024eb2017',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H2',location:'App.tsx:handleHover',message:'handleHover BLOCKED',data:{blockedBy:mode==='intro'?'intro':isAnimating?'animating':'scrolling'},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
      return;
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6fde9818-753e-4df5-be34-d19024eb2017',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H2',location:'App.tsx:handleHover',message:'handleHover SETTING hoveredId',data:{id,previousId:hoveredId},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log
    setHoveredId(id);
  }, [mode, isAnimating, isScrolling, hoveredId]);

  const handleLaneHover = useCallback((lane: number | null) => {
    if (mode === 'intro' || isAnimating || isScrolling) return;
    setHoveredLane(lane);
  }, [mode, isAnimating, isScrolling]);

  // Track mouse position for hover detection after scroll (tracked globally)
  const mousePositionRef = useRef<{ x: number; y: number } | null>(null);

  // Track mouse position globally so we capture it even when over intro/hero
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);

  // Clear hover during animation, intro, or when scrolling STARTS (not when it stops)
  const prevIsScrollingRef = useRef(isScrolling);
  useEffect(() => {
    const wasScrolling = prevIsScrollingRef.current;
    prevIsScrollingRef.current = isScrolling;
    
    // Only clear if scrolling just started (transitioned from false to true)
    // or if in intro/animation mode
    if (isAnimating || mode === 'intro' || (isScrolling && !wasScrolling)) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6fde9818-753e-4df5-be34-d19024eb2017',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H3',location:'App.tsx:clearHover',message:'CLEARING hover',data:{isAnimating,mode,isScrolling,wasScrolling,currentHoveredId:hoveredId},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
      setHoveredId(null);
      setHoveredLane(null);
    }
  }, [isAnimating, mode, isScrolling, hoveredId]);

  const filteredData = useMemo(() => {
    if (filter === 'all') return TIMELINE_DATA;
    return TIMELINE_DATA.filter(item => item.type === filter || (item.type === 'foundational' && filter === 'corporate')); 
  }, [filter]);

  // Helper function to detect and hover item under mouse
  const detectAndHoverItemUnderMouse = useCallback(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6fde9818-753e-4df5-be34-d19024eb2017',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H5',location:'App.tsx:detectAndHoverItemUnderMouse',message:'detectAndHoverItemUnderMouse called',data:{hasMousePos:!!mousePositionRef.current,hasContainer:!!scrollContainerRef.current,mode,isAnimating:isAnimatingRef.current,isScrolling:isScrollingRef.current},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log
    if (!mousePositionRef.current || !scrollContainerRef.current) return;
    if (mode === 'intro' || isAnimatingRef.current || isScrollingRef.current) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6fde9818-753e-4df5-be34-d19024eb2017',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H5',location:'App.tsx:detectAndHoverItemUnderMouse',message:'detect blocked early',data:{blockedBy:mode==='intro'?'intro':isAnimatingRef.current?'animating':'scrolling'},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
      return;
    }
    
    const container = scrollContainerRef.current;
    const { x, y } = mousePositionRef.current;
    
      // Use requestAnimationFrame to ensure DOM is settled
    requestAnimationFrame(() => {
      // Double-check scrolling state after frame
      if (isScrollingRef.current) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6fde9818-753e-4df5-be34-d19024eb2017',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H5',location:'App.tsx:detectAndHoverItemUnderMouse',message:'detect blocked by scrolling after RAF',data:{isScrolling:isScrollingRef.current},timestamp:Date.now()})}).catch(()=>{});
        // #endregion agent log
        return;
      }
      
      // Get element at mouse position
      const elementAtPoint = document.elementFromPoint(x, y);
      if (!elementAtPoint) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6fde9818-753e-4df5-be34-d19024eb2017',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H5',location:'App.tsx:detectAndHoverItemUnderMouse',message:'no element at point',data:{x,y},timestamp:Date.now()})}).catch(()=>{});
        // #endregion agent log
        return;
      }

      // Find the timeline item element (closest parent with data-item-id)
      let current: HTMLElement | null = elementAtPoint as HTMLElement;
      while (current && current !== container) {
        const itemId = current.getAttribute('data-item-id');
        if (itemId) {
          const item = filteredData.find(i => i.id === itemId);
          if (item) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/6fde9818-753e-4df5-be34-d19024eb2017',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H5',location:'App.tsx:detectAndHoverItemUnderMouse',message:'found item, calling handleHover',data:{itemId:item.id,itemTitle:item.title},timestamp:Date.now()})}).catch(()=>{});
            // #endregion agent log
            handleHover(item.id);
            handleLaneHover(item.lane);
            return;
          }
        }
        current = current.parentElement;
      }
    });
  }, [mode, filteredData, handleHover, handleLaneHover]);

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
    return filteredData.find(item => item.id === hoveredId) || null;
  }, [filteredData, hoveredId]);

  const totalMonths = getMonthDiff(parseDate(CONFIG.startDate), parseDate(CONFIG.endDate));
  const contentHeight = totalMonths * pixelsPerMonth;
  const totalContainerHeight = contentHeight + 400; 

  // Animation Transition Configuration - fast tween for smooth GPU-accelerated animation
  const pageTransition = {
    type: "tween" as const,
    duration: 0.5,
    ease: [0.32, 0.72, 0, 1] // Custom cubic-bezier for smooth feel
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-indigo-500/30 relative z-10">
      
      {/* --- CASE STUDY MODAL --- */}
      <AnimatePresence>
        {activeCaseStudy && (
          <CaseStudyModal 
            caseStudy={activeCaseStudy} 
            onClose={() => setActiveCaseStudy(null)} 
          />
        )}
      </AnimatePresence>

      {/* --- PROJECT MODAL --- */}
      <AnimatePresence>
        {activeProject && (
          <ProjectModal 
            project={activeProject} 
            onClose={() => setActiveProject(null)} 
          />
        )}
      </AnimatePresence>

      {/* --- PROFILE MODAL --- */}
      <AnimatePresence>
        {isProfileOpen && (
          <ProfileModal onClose={() => setIsProfileOpen(false)} />
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
          className="relative max-w-6xl mx-auto flex items-start justify-between pointer-events-auto"
        >
          <div className="cursor-pointer group" onClick={() => handleZoom('intro')}>
             <h1 className="text-xl font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors">
               Adi <span className="font-normal text-white/60 group-hover:text-indigo-300">Agarwal</span>
             </h1>
             <p className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5 group-hover:text-white/60 transition-colors">
               Product | Engineering | Data | Design
             </p>
          </div>

          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-sm">
             <Filter size={14} className="text-white/40 ml-2 mr-1" />
             {(['all', 'education', 'corporate', 'personal'] as const).map((f) => (
               <button
                 key={f}
                 onClick={() => setFilter(f)}
                 className={`
                   px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all
                   ${filter === f 
                     ? 'bg-white text-black shadow-lg shadow-white/10' 
                     : 'text-white/50 hover:text-white hover:bg-white/5'}
                 `}
               >
                 {f === 'personal' ? 'TinkerVerse' : f}
               </button>
             ))}
          </div>
        </motion.div>
      </header>
      
      {/* --- HERO SECTION (Parallax Exit) --- */}
      <motion.div
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
        className="flex-1 relative w-full h-full will-change-transform"
        animate={{ 
          opacity: mode === 'intro' ? 0.3 : 1, 
          y: mode === 'intro' ? '80vh' : 0, 
          scale: mode === 'intro' ? 0.98 : 1
        }}
        transition={pageTransition}
      >
        {/* Zoom Controls */}
        <div className="absolute top-24 right-6 flex flex-col gap-2 z-40">
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
          <div 
            className="relative w-full max-w-6xl mx-auto mt-[160px]"
            style={{ height: `${totalContainerHeight}px` }}
          >
            <TimelineRail 
              pixelsPerMonth={pixelsPerMonth} 
              onYearClick={(top) => smoothScrollTo(scrollContainerRef.current!, top)}
              currentScrollTop={scrollTop}
              hoveredItem={hoveredItem}
            />

            {/* Content & Background Wrapper - Offset by Rail Width */}
            <div className="absolute top-0 left-20 md:left-24 right-4 md:right-0 bottom-0">
               
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
                        width: '30%',
                        // Aligned with TimelineEvent logic: 0%, 35%, 70%
                        left: lane === 0 ? '0%' : lane === 1 ? '35%' : '70%', 
                        background: hoveredLane === lane 
                          ? `linear-gradient(to bottom, ${
                              lane === 0 ? 'rgba(244,63,94,0.05)' : 
                              lane === 1 ? 'rgba(99,102,241,0.05)' : 
                              'rgba(245,158,11,0.05)'
                            }, transparent)` 
                          : 'transparent'
                      }}
                    />
                  ))}
               </div>
               
               {/* Timeline Events */}
               {filteredData.map((item) => (
                 <TimelineEvent 
                   key={item.id}
                   item={item}
                   hoveredId={hoveredId}
                   onHover={handleHover}
                   onLaneHover={handleLaneHover}
                   isDimmed={hoveredId !== null && hoveredId !== item.id}
                   pixelsPerMonth={pixelsPerMonth}
                   mode={mode}
                   onOpenCaseStudy={setActiveCaseStudy}
                   onOpenProject={setActiveProject}
                   isScrolling={!canHover}
                 />
               ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default App;
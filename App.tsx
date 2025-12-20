

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
  const [scrollCooldown, setScrollCooldown] = useState(false);
  const [isInitialTransitionComplete, setIsInitialTransitionComplete] = useState(false);

  // Scroll Detection - disable hover during scrolling
  const isScrolling = useScrollDetection(scrollContainerRef, 200);

  // Modal State
  const [activeCaseStudy, setActiveCaseStudy] = useState<CaseStudy | null>(null);
  const [activeProject, setActiveProject] = useState<TimelineItem | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // 1. Handle Zoom Transitions
  const handleZoom = (targetMode: TimelineMode) => {
    if (scrollCooldown) return;

    const wasIntro = mode === 'intro';
    const isTransitioningToNormal = wasIntro && targetMode === 'normal';
    
    // If transitioning from intro to normal, disable hover until transition completes
    if (isTransitioningToNormal) {
      setIsInitialTransitionComplete(false);
    }
    
    // If going back to intro, reset the flag
    if (targetMode === 'intro') {
      setIsInitialTransitionComplete(false);
    }

    setScrollCooldown(true);
    
    setMode(targetMode);

    if (targetMode === 'fit') {
      const totalMonths = getMonthDiff(parseDate(CONFIG.startDate), parseDate(CONFIG.endDate));
      setPixelsPerMonth(Math.max((window.innerHeight - 200) / totalMonths, 2));
      if (scrollContainerRef.current) smoothScrollTo(scrollContainerRef.current, 0);
    } else if (targetMode === 'normal') {
      setPixelsPerMonth(35);
    } else if (targetMode === 'detail') {
      setPixelsPerMonth(60);
    }
    
    // Enable hover after transition completes
    // pageTransition uses spring physics, but we wait for scrollCooldown (800ms) + buffer
    setTimeout(() => {
      setScrollCooldown(false);
      if (isTransitioningToNormal) {
        // Wait a bit more for the spring animation to fully settle
        setTimeout(() => {
          setIsInitialTransitionComplete(true);
        }, 300);
      }
    }, 800);
  };

  const handleManualZoom = (direction: 'in' | 'out') => {
    setMode('normal'); // Switch to normal mode on manual zoom
    setPixelsPerMonth(prev => {
      const step = 5;
      const newVal = direction === 'in' ? prev + step : prev - step;
      return Math.min(Math.max(newVal, 2), 150); // Clamp between 2 and 150
    });
  };

  // 2. Scroll Logic
  useEffect(() => {
    const handleGlobalWheel = (e: WheelEvent) => {
      if (scrollCooldown || isProfileOpen || activeCaseStudy || activeProject) return; // Disable scroll zoom if modals are open
      if (mode === 'intro' && e.deltaY > 5) {
        handleZoom('normal');
      }
    };
    window.addEventListener('wheel', handleGlobalWheel);
    return () => window.removeEventListener('wheel', handleGlobalWheel);
  }, [mode, scrollCooldown, isProfileOpen, activeCaseStudy, activeProject]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleContainerWheel = (e: WheelEvent) => {
      if (scrollCooldown || isProfileOpen || activeCaseStudy || activeProject) return;
      if (mode === 'normal' && container.scrollTop <= 10 && e.deltaY < -5) {
        handleZoom('intro');
      }
      if (mode === 'fit' && e.deltaY < -5) {
        handleZoom('intro');
      }
    };
    container.addEventListener('wheel', handleContainerWheel);
    return () => container.removeEventListener('wheel', handleContainerWheel);
  }, [mode, scrollCooldown, isProfileOpen, activeCaseStudy, activeProject]);


  // Throttled scroll handler for better performance
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Debounced hover handlers to prevent jitter during scroll
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleHover = useCallback((id: string | null) => {
    // Clear existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    // Don't allow hover if:
    // 1. Currently scrolling
    // 2. Initial transition from intro hasn't completed
    // 3. In intro mode
    if (isScrolling || !isInitialTransitionComplete || mode === 'intro') {
      return;
    }
    
    // Small delay before activating hover to prevent jitter
    hoverTimeoutRef.current = setTimeout(() => {
      if (!isScrolling && isInitialTransitionComplete && mode !== 'intro') {
        setHoveredId(id);
      }
    }, 50);
  }, [isScrolling, isInitialTransitionComplete, mode]);

  const handleLaneHover = useCallback((lane: number | null) => {
    if (!isScrolling && isInitialTransitionComplete && mode !== 'intro') {
      setHoveredLane(lane);
    }
  }, [isScrolling, isInitialTransitionComplete, mode]);

  // Clear hover when scrolling starts or during initial transition
  useEffect(() => {
    if (isScrolling || !isInitialTransitionComplete || mode === 'intro') {
      setHoveredId(null);
      setHoveredLane(null);
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    }
  }, [isScrolling, isInitialTransitionComplete, mode]);

  const filteredData = useMemo(() => {
    if (filter === 'all') return TIMELINE_DATA;
    return TIMELINE_DATA.filter(item => item.type === filter || (item.type === 'foundational' && filter === 'corporate')); 
  }, [filter]);

  // Find currently hovered item object for bookmark logic
  const hoveredItem = useMemo(() => {
    return filteredData.find(item => item.id === hoveredId) || null;
  }, [filteredData, hoveredId]);

  const totalMonths = getMonthDiff(parseDate(CONFIG.startDate), parseDate(CONFIG.endDate));
  const contentHeight = totalMonths * pixelsPerMonth;
  const totalContainerHeight = contentHeight + 400; 

  // Animation Transition Configuration
  const pageTransition = {
    type: "spring" as const,
    stiffness: 50,
    damping: 20,
    mass: 1
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
         className="absolute inset-0 z-40"
         animate={{ 
           opacity: mode === 'intro' ? 1 : 0,
           y: mode === 'intro' ? 0 : -200, 
           scale: mode === 'intro' ? 1 : 0.9,
           pointerEvents: mode === 'intro' ? 'auto' : 'none',
           filter: mode === 'intro' ? 'blur(0px)' : 'blur(12px)',
           zIndex: mode === 'intro' ? 40 : -1 // Ensure hero is behind when inactive
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
        className="flex-1 relative w-full h-full"
        animate={{ 
          opacity: mode === 'intro' ? 0.4 : 1, 
          y: mode === 'intro' ? '85vh' : 0, 
          scale: mode === 'intro' ? 0.95 : 1,
          filter: mode === 'intro' ? 'blur(8px)' : 'blur(0px)'
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
          className="h-full overflow-y-auto overflow-x-hidden relative scroll-smooth no-scrollbar"
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
               
               {/* Permanent Competition/Project/Vignette Glow (Render behind cards) */}
               {filteredData.map((item) => {
                 if (item.type !== 'competition' && item.type !== 'project' && item.type !== 'vignette') return null;
                 const isHovered = hoveredId === item.id;
                 // Match exact positioning logic from TimelineEvent
                 const startDate = parseDate(item.start);
                 const endDate = parseDate(item.end);
                 const timelineEnd = parseDate(CONFIG.endDate);
                 const monthsFromTop = getMonthDiff(endDate, timelineEnd);
                 const top = monthsFromTop * pixelsPerMonth;
                 const durationMonths = getMonthDiff(startDate, endDate);
                 const height = Math.max(durationMonths * pixelsPerMonth, 60);

                 // Determine color
                 let glowColor = 'from-purple-600/50 via-purple-500/30';
                 if (item.type === 'project') glowColor = 'from-cyan-600/50 via-teal-500/30';
                 if (item.type === 'vignette') glowColor = 'from-white/30 via-gray-100/10';

                 return (
                   <motion.div 
                     key={`glow-${item.id}`}
                     animate={{ 
                       opacity: isHovered ? 0.6 : 0.15, // Always visible (0.15), Stronger on hover (0.6)
                       scaleX: 1
                     }}
                     transition={{ duration: 0.4 }}
                     style={{ top, height }}
                     className={`absolute left-0 right-0 bg-gradient-to-r ${glowColor} to-transparent blur-3xl pointer-events-none z-[5] origin-left`}
                   />
                 );
               })}

               {/* Timeline Events */}
               <AnimatePresence>
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
                     isScrolling={isScrolling || !isInitialTransitionComplete || mode === 'intro'}
                   />
                 ))}
               </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default App;
import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MousePointer2 } from 'lucide-react';
import { parseDate, getMonthDiff } from './utils';
import { CONFIG } from './constants';

// Hooks
import { useZoom } from './hooks/useZoom';
import { useFilter } from './hooks/useFilter';
import { useModals } from './hooks/useModals';
import { useTimeline } from './hooks/useTimeline';
import { useScroll } from './hooks/useScroll';

// Components
import TimelineEvent from './components/TimelineEvent';
import TimelineRail from './components/TimelineRail';
import Hero from './components/Hero';
import Header from './components/Header';
import ZoomControls from './components/ZoomControls';
import CaseStudyModal from './components/CaseStudyModal';
import ProfileModal from './components/ProfileModal';
import ProjectModal from './components/ProjectModal';

// Services
import { timelineService } from './services/timelineService';

const App: React.FC = () => {
  // Hover state (could be moved to context later)
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const [hoveredLane, setHoveredLane] = React.useState<number | null>(null);

  // Custom hooks
  const { mode, pixelsPerMonth, scrollCooldown, handleZoom, handleManualZoom } = useZoom();
  const { filter, filteredData, updateFilter } = useFilter();
  const {
    activeCaseStudy,
    activeProject,
    isProfileOpen,
    openCaseStudy,
    closeCaseStudy,
    openProject,
    closeProject,
    openProfile,
    closeProfile,
  } = useModals();
  const { totalContainerHeight } = useTimeline(filteredData, pixelsPerMonth);
  const {
    scrollTop,
    scrollContainerRef,
    handleScroll,
    scrollToPosition,
  } = useScroll(
    mode,
    scrollCooldown,
    () => handleZoom('intro', scrollContainerRef.current),
    () => handleZoom('normal', scrollContainerRef.current),
    isProfileOpen || !!activeCaseStudy || !!activeProject
  );

  // Memoized hovered item
  const hoveredItem = useMemo(() => {
    return filteredData.find(item => item.id === hoveredId) || null;
  }, [filteredData, hoveredId]);

  // Handlers
  const handleZoomToIntro = useCallback(() => {
    handleZoom('intro', scrollContainerRef.current);
  }, [handleZoom]);

  const handleZoomToNormal = useCallback(() => {
    handleZoom('normal', scrollContainerRef.current);
  }, [handleZoom]);

  const handleZoomToFit = useCallback(() => {
    handleZoom('fit', scrollContainerRef.current);
  }, [handleZoom]);

  const handleZoomReset = useCallback(() => {
    handleZoom('normal', scrollContainerRef.current);
  }, [handleZoom]);

  // Animation transition configuration
  const pageTransition = {
    type: "spring" as const,
    stiffness: 50,
    damping: 20,
    mass: 1
  };

  // Calculate glow positions for competition/project/vignette items
  const glowItems = useMemo(() => {
    return filteredData
      .filter(item => ['competition', 'project', 'vignette'].includes(item.type))
      .map(item => {
        const position = timelineService.calculateItemPosition(item, pixelsPerMonth, 60);
        let glowColor = 'from-purple-600/50 via-purple-500/30';
        if (item.type === 'project') glowColor = 'from-cyan-600/50 via-teal-500/30';
        if (item.type === 'vignette') glowColor = 'from-white/30 via-gray-100/10';
        
        return {
          ...item,
          position,
          glowColor,
          isHovered: hoveredId === item.id,
        };
      });
  }, [filteredData, pixelsPerMonth, hoveredId]);

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-indigo-500/30 relative">
      {/* Modals */}
      <AnimatePresence>
        {activeCaseStudy && (
          <CaseStudyModal caseStudy={activeCaseStudy} onClose={closeCaseStudy} />
        )}
        {activeProject && (
          <ProjectModal project={activeProject} onClose={closeProject} />
        )}
        {isProfileOpen && (
          <ProfileModal onClose={closeProfile} />
        )}
      </AnimatePresence>

      {/* Header */}
      <Header
        mode={mode}
        filter={filter}
        onFilterChange={updateFilter}
        onLogoClick={handleZoomToIntro}
      />

      {/* Hero Section */}
      <motion.div
        className="absolute inset-0 z-40"
        animate={{
          opacity: mode === 'intro' ? 1 : 0,
          y: mode === 'intro' ? 0 : -200,
          scale: mode === 'intro' ? 1 : 0.9,
          pointerEvents: mode === 'intro' ? 'auto' : 'none',
          filter: mode === 'intro' ? 'blur(0px)' : 'blur(12px)',
          zIndex: mode === 'intro' ? 40 : -1
        }}
        transition={pageTransition}
      >
        <Hero onOpenProfile={openProfile} />
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

      {/* Timeline Section */}
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
        <ZoomControls
          mode={mode}
          onZoomIn={() => handleManualZoom('in')}
          onZoomOut={() => handleManualZoom('out')}
          onFitToScreen={handleZoomToFit}
          onResetZoom={handleZoomReset}
        />

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
              onYearClick={scrollToPosition}
              currentScrollTop={scrollTop}
              hoveredItem={hoveredItem}
            />

            {/* Content & Background Wrapper */}
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

              {/* Competition/Project/Vignette Glow Effects */}
              {glowItems.map(({ id, position, glowColor, isHovered }) => (
                <motion.div
                  key={`glow-${id}`}
                  animate={{
                    opacity: isHovered ? 0.6 : 0.15,
                    scaleX: 1
                  }}
                  transition={{ duration: 0.4 }}
                  style={{ top: position.top, height: position.height }}
                  className={`absolute left-0 right-0 bg-gradient-to-r ${glowColor} to-transparent blur-3xl pointer-events-none z-[5] origin-left`}
                />
              ))}

              {/* Timeline Events */}
              <AnimatePresence>
                {filteredData.map((item) => (
                  <TimelineEvent
                    key={item.id}
                    item={item}
                    hoveredId={hoveredId}
                    onHover={setHoveredId}
                    onLaneHover={setHoveredLane}
                    isDimmed={hoveredId !== null && hoveredId !== item.id}
                    pixelsPerMonth={pixelsPerMonth}
                    mode={mode}
                    onOpenCaseStudy={openCaseStudy}
                    onOpenProject={openProject}
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


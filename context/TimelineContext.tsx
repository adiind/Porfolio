import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { TimelineItem, TimelineMode } from '../types';

interface TimelineContextValue {
  // Hover state
  hoveredId: string | null;
  hoveredLane: number | null;
  setHoveredId: (id: string | null) => void;
  setHoveredLane: (lane: number | null) => void;
  hoveredItem: TimelineItem | null;
}

const TimelineContext = createContext<TimelineContextValue | undefined>(undefined);

export const TimelineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredLane, setHoveredLane] = useState<number | null>(null);

  const hoveredItem = useMemo(() => {
    // This will be set by the component using the context
    // For now, return null - can be enhanced with data lookup
    return null;
  }, []);

  const value = useMemo(() => ({
    hoveredId,
    hoveredLane,
    setHoveredId,
    setHoveredLane,
    hoveredItem,
  }), [hoveredId, hoveredLane, hoveredItem]);

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
};

export const useTimelineContext = () => {
  const context = useContext(TimelineContext);
  if (context === undefined) {
    throw new Error('useTimelineContext must be used within a TimelineProvider');
  }
  return context;
};




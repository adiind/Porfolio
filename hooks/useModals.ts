import { useState, useCallback } from 'react';
import { CaseStudy, TimelineItem } from '../types';

export const useModals = () => {
  const [activeCaseStudy, setActiveCaseStudy] = useState<CaseStudy | null>(null);
  const [activeProject, setActiveProject] = useState<TimelineItem | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const openCaseStudy = useCallback((study: CaseStudy) => {
    setActiveCaseStudy(study);
  }, []);

  const closeCaseStudy = useCallback(() => {
    setActiveCaseStudy(null);
  }, []);

  const openProject = useCallback((project: TimelineItem) => {
    setActiveProject(project);
  }, []);

  const closeProject = useCallback(() => {
    setActiveProject(null);
  }, []);

  const openProfile = useCallback(() => {
    setIsProfileOpen(true);
  }, []);

  const closeProfile = useCallback(() => {
    setIsProfileOpen(false);
  }, []);

  const closeAll = useCallback(() => {
    setActiveCaseStudy(null);
    setActiveProject(null);
    setIsProfileOpen(false);
  }, []);

  return {
    activeCaseStudy,
    activeProject,
    isProfileOpen,
    openCaseStudy,
    closeCaseStudy,
    openProject,
    closeProject,
    openProfile,
    closeProfile,
    closeAll,
  };
};




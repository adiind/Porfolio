/**
 * A case study (/work/<id>) or a timeline page (/experience/<id>) as its own page.
 *
 * The 3D mat is the site's only home (Adi, 2026-11-24: "this new 3d mat is everything and branches to everything"). These
 * pages used to be drawn as pop-ups on top of the old home, so every one of them first downloaded and drew that whole
 * home underneath (about 3 MB that nobody saw). Here only the page itself is mounted: the same detail components, with
 * the same providers the old home gave them, and nothing else.
 *
 * Leaving works exactly as it did, because the pieces that did it are unchanged: the detail owns one history entry
 * (hooks/useDialogA11y), so Close, Escape and the browser's Back all end at "/" with nothing open, and lib/ship/returnHome
 * then takes the visitor to the home they came from (a step back to the mat as they left it, or the front door).
 */
import React, { useCallback, useRef, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import ProjectDetail from '../../components/ProjectDetail';
import ExperienceDetail from '../../components/ExperienceDetail';
import TinkerVerseModal from '../../components/TinkerVerseModal';
import CaseStudyModal from '../../components/CaseStudyModal';
import { ProjectsProvider, useProjects } from '../../context/ProjectsContext';
import { PROJECTS_BY_ID } from '../../data/projects';
import { SOCIAL_POSTS, TIMELINE_DATA } from '../../constants';
import type { CaseStudy, TimelineItem } from '../../types';
import { trackEvent } from '../analytics';
import { INITIAL_EXPERIENCE_ID, INITIAL_WORK_PROJECT_ID } from '../workRoutes';
import { armReturnHome, landHome } from './returnHome';

const known = Boolean(INITIAL_WORK_PROJECT_ID || INITIAL_EXPERIENCE_ID);
// an address that names no project or stop opens nothing: straight to the home
const leaving = known ? false : landHome();
if (known) armReturnHome();

/** The room the mat starts in: shown for the moment between this page closing and the home arriving. */
const DARK_ROOM = '#02070f';

const Branch: React.FC = () => {
  const { projects } = useProjects();
  const [open, setOpen] = useState(true);
  const [caseStudy, setCaseStudy] = useState<CaseStudy | null>(null);
  // Escape reaches every open dialog's listener, the page's own first: while a case study lies on top, that key is the
  // case study's to answer, and the page stays. (On the old home one Escape closed both and left the old home showing.)
  const caseStudyOpen = useRef(false);
  caseStudyOpen.current = caseStudy !== null;
  const close = useCallback(() => {
    if (caseStudyOpen.current) return;
    document.documentElement.style.background = DARK_ROOM;
    document.body.style.background = DARK_ROOM;
    setOpen(false);
  }, []);
  const openCaseStudy = useCallback((study: CaseStudy) => {
    trackEvent('case_study_opened', { title: study.title, theme: study.themeColor ?? 'none' });
    setCaseStudy(study);
  }, []);
  if (!open) return null;

  if (INITIAL_WORK_PROJECT_ID) {
    const project = projects.find((p) => p.id === INITIAL_WORK_PROJECT_ID) ?? PROJECTS_BY_ID.get(INITIAL_WORK_PROJECT_ID);
    return project ? <ProjectDetail project={project} analyticsSource="deep_link" onClose={close} /> : null;
  }
  if (INITIAL_EXPERIENCE_ID === 'tinkerverse') {
    return <TinkerVerseModal item={TIMELINE_DATA.find((item) => item.id === 'tinkerverse')!} posts={SOCIAL_POSTS} onClose={close} />;
  }
  const stop = TIMELINE_DATA.find((item) => item.id === INITIAL_EXPERIENCE_ID);
  if (!stop) return null;
  // (a stop that is also a project carries the project's fuller record, as the old home merged it)
  const rich = projects.find((p) => p.id === stop.id);
  return (
    <>
      <ExperienceDetail
        item={rich ? ({ ...stop, ...rich } as TimelineItem) : stop}
        analyticsSource="deep_link"
        analyticsActive={caseStudy === null}
        onClose={close}
        onOpenCaseStudy={openCaseStudy}
      />
      {caseStudy && <CaseStudyModal caseStudy={caseStudy} onClose={() => setCaseStudy(null)} />}
    </>
  );
};

const BranchPage: React.FC = () => (leaving ? null : (
  <MotionConfig reducedMotion="user">
    <ProjectsProvider>
      <Branch />
    </ProjectsProvider>
  </MotionConfig>
));

export default BranchPage;

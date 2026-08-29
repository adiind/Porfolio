import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '../types/Project';
import ProjectCard from './ProjectCard';
import ProjectDetail from './ProjectDetail';
import { trackEvent } from '../lib/analytics';
import { useProjects } from '../context/ProjectsContext';
import { INITIAL_WORK_PROJECT_ID } from '../lib/workRoutes';
import CuttingMatSurface from './ui/CuttingMatSurface';
import { useContentEngagement } from '../hooks/useContentEngagement';

type ProjectIntent = 'all' | 'tangible-ai' | 'product-thinking' | 'physical-craft';

const PROJECT_INTENTS: Array<{
    id: ProjectIntent;
    label: string;
    shortLabel: string;
    cue: string;
    projectIds?: string[];
}> = [
    {
        id: 'all',
        label: 'Works across disciplines',
        shortLabel: 'Range',
        cue: 'One person connecting research, interfaces, code, hardware, and physical craft.',
    },
    {
        id: 'tangible-ai',
        label: 'Makes AI tangible',
        shortLabel: 'AI',
        cue: 'Turning invisible intelligence into interactions people can see, understand, and control.',
        projectIds: ['glyph', 'zero-my-ai', 'jarvis', 'portfolio-website'],
    },
    {
        id: 'product-thinking',
        label: 'Shapes the product',
        shortLabel: 'Product',
        cue: 'Finding the right problem, mapping the system, and making clear product decisions.',
        projectIds: ['familysync-jpmorgan', 'mcdonalds-interaction-design', 'zero-my-ai', 'glyph', 'portfolio-website'],
    },
    {
        id: 'physical-craft',
        label: 'Builds the system',
        shortLabel: 'Build',
        cue: 'Carrying ideas into software, electronics, mechanics, and working prototypes.',
        projectIds: ['glyph', 'surya', 'plotter', 'jarvis', 'helios', 'solopump'],
    },
];

const ProjectsSection: React.FC = () => {
    const { projects } = useProjects();
    // Deep link (/work/<id>): mount with the matching detail already open so a
    // fresh page load of e.g. /work/glyph goes straight to the case study.
    const [activeProject, setActiveProject] = useState<Project | null>(
        () => (INITIAL_WORK_PROJECT_ID ? projects.find((p) => p.id === INITIAL_WORK_PROJECT_ID) ?? null : null)
    );
    const [activeProjectSource, setActiveProjectSource] = useState(
        INITIAL_WORK_PROJECT_ID ? 'deep_link' : 'selected_work'
    );
    const [activeIntent, setActiveIntent] = useState<ProjectIntent>('all');
    const matContentRef = useRef<HTMLDivElement>(null);
    const [matHeight, setMatHeight] = useState(720);
    const engagementRef = useContentEngagement<HTMLElement>({
        contentType: 'section',
        contentId: 'projects',
        active: activeProject === null,
        observeVisibility: true,
    });
    const activeIntentConfig = PROJECT_INTENTS.find((intent) => intent.id === activeIntent) ?? PROJECT_INTENTS[0];
    const visibleProjects = useMemo(() => {
        if (!activeIntentConfig.projectIds) return projects;
        const projectsById = new Map(projects.map((project) => [project.id, project] as const));
        return activeIntentConfig.projectIds
            .map((projectId) => projectsById.get(projectId))
            .filter((project): project is Project => Boolean(project));
    }, [activeIntentConfig, projects]);

    // Balance the grid for filtered result counts so the last row never strands
    // a single orphan card (e.g. 4 results become a 2x2 grid instead of 3+1).
    const gridColumnsClass = useMemo(() => {
        const count = visibleProjects.length;
        if (count === 1) return 'grid-cols-1 md:max-w-xl';
        if (count === 2 || count === 4) return 'grid-cols-1 md:grid-cols-2';
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }, [visibleProjects.length]);

    const selectIntent = (intent: ProjectIntent) => {
        setActiveIntent(intent);
        trackEvent('project_intent_filter_clicked', { intent });
    };

    const openProject = (project: Project) => {
        setActiveProjectSource('selected_work');
        setActiveProject(project);
    };

    // Listen for closeAllModals event (e.g., from navbar navigation)
    useEffect(() => {
        const handleCloseAll = () => setActiveProject(null);
        window.addEventListener('closeAllModals', handleCloseAll);
        return () => window.removeEventListener('closeAllModals', handleCloseAll);
    }, []);

    // Notify App.tsx when this modal opens/closes so global scroll-snap is blocked
    useEffect(() => {
        window.dispatchEvent(new CustomEvent(activeProject ? 'projectDetailOpen' : 'projectDetailClose'));
    }, [activeProject]);

    // CuttingMatSurface intentionally fills its parent. Measure this variable-
    // height section locally so the grid can grow/shrink without clipping the
    // mat, its lower ruler, or the final project row.
    useEffect(() => {
        const content = matContentRef.current;
        if (!content) return;
        const syncHeight = () => {
            const nextHeight = Math.max(720, Math.ceil(content.scrollHeight));
            setMatHeight((current) => current === nextHeight ? current : nextHeight);
        };
        const observer = new ResizeObserver(syncHeight);
        observer.observe(content);
        syncHeight();
        return () => observer.disconnect();
    }, []);

    return (
        <>
            <section ref={engagementRef} id="projects" className="relative mx-auto mt-6 w-full max-w-7xl px-2 py-12 sm:px-4 md:mt-20 md:py-24">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.6 }}
                >
                    <div data-selected-work-frame style={{ height: `${matHeight}px` }}>
                        <CuttingMatSurface active density="comfortable">
                        <div ref={matContentRef} data-selected-work-mat className="min-w-0 p-5 pt-8 sm:p-8 sm:pt-10 md:p-12 lg:p-14">
                            <div className="rounded-2xl border border-white/[0.16] bg-[#04110f]/[0.88] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.38)] backdrop-blur-lg sm:p-6 md:p-7">
                                <motion.h2
                                    initial={{ opacity: 0, y: 18 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.45 }}
                                    className="text-[1.7rem] font-bold leading-tight text-white sm:text-3xl md:text-4xl lg:text-5xl"
                                >
                                    I want to see how Adi…
                                </motion.h2>

                                <div className="mt-5 grid grid-cols-2 gap-2 lg:flex lg:flex-wrap" role="group" aria-label="Choose what you want to evaluate">
                                    {PROJECT_INTENTS.map((intent) => {
                                        const isActive = activeIntent === intent.id;
                                        return (
                                            <button
                                                key={intent.id}
                                                type="button"
                                                data-project-intent={intent.id}
                                                aria-label={intent.label}
                                                aria-pressed={isActive}
                                                aria-controls="selected-work-grid"
                                                onClick={() => selectIntent(intent.id)}
                                                className={`group relative flex min-h-12 min-w-0 items-center justify-center rounded-xl border px-3 py-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0f18a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#04110f] lg:flex-none lg:rounded-full lg:px-5 ${isActive ? 'border-[#e5e55a]/70 text-[#07110f]' : 'border-white/15 bg-white/[0.06] text-white/70 hover:border-white/30 hover:text-white'}`}
                                            >
                                                {isActive && (
                                                    <motion.span
                                                        layoutId="selected-work-intent-marker"
                                                        className="absolute inset-0 rounded-[inherit] bg-[#e5e55a] shadow-[0_0_24px_rgba(229,229,90,0.22)]"
                                                        transition={{ type: 'tween', duration: 0.25, ease: 'circOut' }}
                                                    />
                                                )}
                                                <span className="relative z-10 text-[11px] font-semibold leading-tight sm:text-xs md:text-sm">
                                                    {intent.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-4 flex min-h-10 items-start justify-between gap-4 border-t border-white/10 pt-4 md:items-center">
                                    <AnimatePresence mode="wait" initial={false}>
                                        <motion.p
                                            key={activeIntentConfig.id}
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -3 }}
                                            transition={{ duration: 0.18 }}
                                            className="max-w-2xl text-xs leading-relaxed text-white/70 md:text-sm"
                                        >
                                            {activeIntentConfig.cue}
                                        </motion.p>
                                    </AnimatePresence>
                                    <span
                                        data-visible-project-count={visibleProjects.length}
                                        className="shrink-0 rounded-full border border-white/15 bg-black/25 px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-white/65 sm:text-[10px]"
                                        aria-live="polite"
                                    >
                                        {visibleProjects.length} {visibleProjects.length === 1 ? 'project' : 'projects'}
                                    </span>
                                </div>
                            </div>

                            <div id="selected-work-grid" className={`mt-5 grid items-start ${gridColumnsClass} gap-4 sm:mt-6 sm:gap-5 md:gap-6`} aria-live="polite">
                                <AnimatePresence mode="popLayout" initial={false}>
                                    {visibleProjects.map((project, index) => (
                                        <motion.div
                                            layout
                                            key={project.id}
                                            data-project-id={project.id}
                                            initial={{ opacity: 0, y: 18, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -12, scale: 0.98 }}
                                            transition={{ duration: 0.24, delay: Math.min(index * 0.035, 0.14) }}
                                            className={`min-w-0 ${activeIntent === 'all' && visibleProjects.length === 10 && index === 9 ? 'lg:col-start-2' : ''}`}
                                        >
                                            <ProjectCard
                                                project={project}
                                                index={index}
                                                onClick={() => openProject(project)}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                        </CuttingMatSurface>
                    </div>
                </motion.div>
            </section>

            {/* Project Detail Modal — plain conditional: an AnimatePresence exit
                would keep the closed dialog as an invisible click-eating layer
                whenever frames are throttled (see App.tsx overlay note). */}
            {activeProject && ReactDOM.createPortal(
                <ProjectDetail
                    project={activeProject}
                    analyticsSource={activeProjectSource}
                    onClose={() => setActiveProject(null)}
                />,
                document.body,
            )}
        </>
    );
};

export default ProjectsSection;

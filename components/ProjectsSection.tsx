import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '../types/Project';
import ProjectCard from './ProjectCard';
import ProjectDetail from './ProjectDetail';
import { trackEvent } from '../lib/analytics';
import { useProjects } from '../context/ProjectsContext';

interface ProjectsSectionProps {
    isWritingsUnlocked?: boolean;
    onUnlockWritings?: () => void;
}

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

const ProjectsSection: React.FC<ProjectsSectionProps> = ({ isWritingsUnlocked = false, onUnlockWritings }) => {
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [activeIntent, setActiveIntent] = useState<ProjectIntent>('all');
    const { projects } = useProjects();
    const activeIntentConfig = PROJECT_INTENTS.find((intent) => intent.id === activeIntent) ?? PROJECT_INTENTS[0];
    const visibleProjects = useMemo(() => {
        if (!activeIntentConfig.projectIds) return projects;
        const projectsById = new Map(projects.map((project) => [project.id, project] as const));
        return activeIntentConfig.projectIds
            .map((projectId) => projectsById.get(projectId))
            .filter((project): project is Project => Boolean(project));
    }, [activeIntentConfig, projects]);

    const selectIntent = (intent: ProjectIntent) => {
        setActiveIntent(intent);
        trackEvent('project_intent_filter_clicked', { intent });
    };

    const openProject = (project: Project) => {
        trackEvent('project_opened', {
            id: project.id,
            title: project.hero.title,
            status: project.outcome.status,
            source: 'selected_work',
        });
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

    return (
        <>
            <section id="projects" className="relative w-full max-w-6xl mx-auto px-6 py-12 md:py-24 border-t border-white/5 mt-6 md:mt-20">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Section Header */}
                    <div className="mb-12 md:mb-16">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="text-3xl md:text-5xl font-bold text-white mb-4"
                        >
                            Selected Work
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="text-white/50 text-lg md:text-xl max-w-xl"
                        >
                            Start with the capability you need to see.
                        </motion.p>
                    </div>

                    <div className="mb-10 md:mb-12">
                        <p className="mb-2 ml-2 text-xs text-white/45">I want to see how Adi…</p>
                        <div className="inline-flex w-full rounded-full border border-white/5 bg-white/[0.08] p-1 shadow-2xl shadow-black/40 backdrop-blur-md sm:w-auto">
                            <div className="flex w-full items-center gap-1" role="group" aria-label="Choose what you want to evaluate">
                                {PROJECT_INTENTS.map((intent) => {
                                    const isActive = activeIntent === intent.id;
                                    return (
                                        <button
                                            key={intent.id}
                                            type="button"
                                            aria-label={intent.label}
                                            aria-pressed={isActive}
                                            aria-controls="selected-work-grid"
                                            onClick={() => selectIntent(intent.id)}
                                            className={`group relative flex min-h-10 min-w-0 flex-1 items-center justify-center rounded-full px-2.5 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80 sm:flex-none sm:px-4 ${isActive ? 'text-white' : 'text-white/55 hover:text-white/85'}`}
                                        >
                                            {isActive && (
                                                <motion.span
                                                    layoutId="selected-work-intent-marker"
                                                    className="absolute inset-0 rounded-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.45)]"
                                                    transition={{ type: 'tween', duration: 0.25, ease: 'circOut' }}
                                                />
                                            )}
                                            <span className="relative z-10 truncate text-[11px] font-medium transition-colors sm:text-sm">
                                                <span className="sm:hidden">{intent.shortLabel}</span>
                                                <span className="hidden sm:inline">{intent.label}</span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-3 flex min-h-7 items-start justify-between gap-4 px-2 md:items-center">
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.p
                                    key={activeIntentConfig.id}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -3 }}
                                    transition={{ duration: 0.18 }}
                                    className="max-w-2xl text-xs leading-relaxed text-white/50 md:text-sm"
                                >
                                    {activeIntentConfig.cue}
                                </motion.p>
                            </AnimatePresence>
                            <span className="hidden shrink-0 text-xs text-white/45 sm:block" aria-live="polite">
                                {visibleProjects.length} {visibleProjects.length === 1 ? 'project' : 'projects'}
                            </span>
                        </div>
                    </div>

                    {/* Projects Grid */}
                    <div id="selected-work-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-live="polite">
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

                    {/* Hidden Unlock Trigger */}
                    {!isWritingsUnlocked && onUnlockWritings && (
                        <div className="mt-24 pt-12 flex justify-center">
                            <button
                                onClick={() => {
                                    trackEvent('writings_unlock_clicked', { source: 'selected_work' });
                                    onUnlockWritings();
                                }}
                                aria-label="Read my writings"
                                className="group relative flex items-center gap-2 px-5 py-2.5 text-xs font-mono bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 rounded-lg transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80"
                            >
                                {/* Always faintly visible blinking cursor as a breadcrumb */}
                                <span className="text-white/20 group-hover:text-indigo-400 transition-all duration-300 animate-pulse">{'>_'}</span>
                                {/* Label expands on hover */}
                                <span className="tracking-widest uppercase ml-1 max-w-0 overflow-hidden group-hover:max-w-[200px] group-focus:max-w-[200px] group-focus-within:max-w-[200px] transition-[max-width,opacity] duration-500 whitespace-nowrap text-white/50 opacity-0 group-hover:opacity-100 group-focus:opacity-100 group-focus-within:opacity-100">
                                    cat /var/log/thoughts.md
                                </span>
                            </button>
                        </div>
                    )}
                </motion.div>
            </section>

            {/* Project Detail Modal */}
            <AnimatePresence>
                {activeProject && (
                    <ProjectDetail
                        project={activeProject}
                        onClose={() => setActiveProject(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default ProjectsSection;

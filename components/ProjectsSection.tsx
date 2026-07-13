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
    cue: string;
    projectIds?: string[];
}> = [
    { id: 'all', label: 'All work', cue: 'See the full range' },
    {
        id: 'tangible-ai',
        label: 'AI systems',
        cue: 'Make intelligence legible',
        projectIds: ['glyph', 'zero-my-ai', 'jarvis', 'portfolio-website'],
    },
    {
        id: 'product-thinking',
        label: 'Product thinking',
        cue: 'Frame, test, and decide',
        projectIds: ['glyph', 'zero-my-ai', 'familysync-jpmorgan', 'mcdonalds-interaction-design', 'portfolio-website'],
    },
    {
        id: 'physical-craft',
        label: 'Physical craft',
        cue: 'Build what you can touch',
        projectIds: ['glyph', 'surya', 'solopump', 'helios', 'jarvis', 'plotter'],
    },
];

const ProjectsSection: React.FC<ProjectsSectionProps> = ({ isWritingsUnlocked = false, onUnlockWritings }) => {
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [activeIntent, setActiveIntent] = useState<ProjectIntent>('all');
    const { projects } = useProjects();
    const visibleProjects = useMemo(() => {
        const selectedIntent = PROJECT_INTENTS.find((intent) => intent.id === activeIntent);
        if (!selectedIntent?.projectIds) return projects;
        const projectIds = new Set(selectedIntent.projectIds);
        return projects.filter((project) => projectIds.has(project.id));
    }, [activeIntent, projects]);

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
                            Choose the signal you are looking for. The strongest work often lives between categories.
                        </motion.p>
                    </div>

                    <div className="mb-9 border-y border-white/10 bg-white/[0.015] py-3 md:mb-12 md:py-4">
                        <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d8ff4e]/75">
                            What are you here to evaluate?
                        </p>
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-4" role="group" aria-label="Filter selected work by visitor intent">
                            {PROJECT_INTENTS.map((intent, index) => {
                                const isActive = activeIntent === intent.id;
                                return (
                                    <button
                                        key={intent.id}
                                        type="button"
                                        aria-pressed={isActive}
                                        aria-controls="selected-work-grid"
                                        onClick={() => selectIntent(intent.id)}
                                        className={`group relative min-h-[72px] overflow-hidden border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8ff4e] ${isActive
                                            ? 'border-[#d8ff4e]/70 bg-[#d8ff4e]/10 text-white'
                                            : 'border-white/10 bg-black/30 text-white/60 hover:border-white/25 hover:bg-white/[0.04] hover:text-white'
                                            }`}
                                    >
                                        <span className={`absolute right-2 top-1 font-mono text-[9px] ${isActive ? 'text-[#d8ff4e]/75' : 'text-white/20'}`}>0{index + 1}</span>
                                        <span className="block text-sm font-semibold tracking-tight">{intent.label}</span>
                                        <span className={`mt-1 block text-[10px] leading-tight ${isActive ? 'text-[#d8ff4e]/75' : 'text-white/45 group-hover:text-white/60'}`}>{intent.cue}</span>
                                    </button>
                                );
                            })}
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

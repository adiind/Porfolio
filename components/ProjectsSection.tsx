import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '../types/Project';
import ProjectCard from './ProjectCard';
import ProjectDetail from './ProjectDetail';
import { trackEvent } from '../lib/analytics';
import { useProjects } from '../context/ProjectsContext';
import ProjectStudio from './ProjectStudio';

interface ProjectsSectionProps {
    isWritingsUnlocked?: boolean;
    onUnlockWritings?: () => void;
}

const ProjectsSection: React.FC<ProjectsSectionProps> = ({ isWritingsUnlocked = false, onUnlockWritings }) => {
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [isStudioOpen, setIsStudioOpen] = useState(false);
    const { projects } = useProjects();

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
                        <div className="flex flex-wrap items-start justify-between gap-5">
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="text-3xl md:text-5xl font-bold text-white mb-4"
                            >
                                Selected Work
                            </motion.h2>
                            <button
                                onClick={() => setIsStudioOpen(true)}
                                className="group inline-flex items-center gap-2 border border-white/15 bg-white/[0.03] px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-white/65 transition hover:border-[#d8ff4e]/70 hover:bg-[#d8ff4e]/10 hover:text-[#d8ff4e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8ff4e]"
                            >
                                Edit projects <span className="text-[#d8ff4e] transition-transform group-hover:translate-x-0.5">↗</span>
                            </button>
                        </div>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="text-white/50 text-lg md:text-xl max-w-xl"
                        >
                            Systems and experiments built outside job titles.
                        </motion.p>
                    </div>

                    {/* Projects Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project, index) => (
                            <div key={project.id} data-project-id={project.id}>
                                <ProjectCard
                                    project={project}
                                    index={index}
                                    onClick={() => openProject(project)}
                                />
                            </div>
                        ))}

                        {/* Coming Soon Placeholder Cards */}
                        {projects.length < 3 && Array.from({ length: 3 - projects.length }).map((_, i) => (
                            <motion.div
                                key={`placeholder-${i}`}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-50px' }}
                                transition={{
                                    duration: 0.6,
                                    delay: (projects.length + i) * 0.1,
                                }}
                                className="
                  relative cursor-default
                  bg-white/[0.02]
                  border border-dashed border-white/10
                  rounded-2xl p-6 md:p-8
                  flex items-center justify-center
                  min-h-[200px]
                "
                            >
                                <div className="text-center">
                                    <p className="text-white/55 text-sm font-medium mb-1">More Projects</p>
                                    <p className="text-white/55 text-xs">Coming Soon</p>
                                </div>
                            </motion.div>
                        ))}
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
            <AnimatePresence>
                {isStudioOpen && <ProjectStudio onClose={() => setIsStudioOpen(false)} />}
            </AnimatePresence>
        </>
    );
};

export default ProjectsSection;

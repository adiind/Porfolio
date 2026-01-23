import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '../types/Project';
import ProjectCard from './ProjectCard';
import ProjectDetail from './ProjectDetail';
import { PROJECTS } from '../data/projects';

const ProjectsSection: React.FC = () => {
    const [activeProject, setActiveProject] = useState<Project | null>(null);

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
                            Systems and experiments built outside job titles.
                        </motion.p>
                    </div>

                    {/* Projects Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {PROJECTS.map((project, index) => (
                            <div key={project.id} data-project-id={project.id}>
                                <ProjectCard
                                    project={project}
                                    index={index}
                                    onClick={() => setActiveProject(project)}
                                />
                            </div>
                        ))}

                        {/* Coming Soon Placeholder Cards */}
                        {PROJECTS.length < 3 && Array.from({ length: 3 - PROJECTS.length }).map((_, i) => (
                            <motion.div
                                key={`placeholder-${i}`}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-50px' }}
                                transition={{
                                    duration: 0.6,
                                    delay: (PROJECTS.length + i) * 0.1,
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
                                    <p className="text-white/30 text-sm font-medium mb-1">More Projects</p>
                                    <p className="text-white/20 text-xs">Coming Soon</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
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

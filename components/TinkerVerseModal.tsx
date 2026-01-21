import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { X, ExternalLink, PlayCircle, Heart, MessageCircle, Github, ArrowUpRight, Zap, PenTool, Bot, Cpu, Layers, Box, Music, Camera } from 'lucide-react';
import { TimelineItem, SocialPost, TinkerProject } from '../types';
import { TINKERVERSE_LOGO } from '../constants';
import { formatDate } from '../utils';
import { PROJECTS } from '../data/projects';
import { Project } from '../types/Project';
import ProjectCard from './ProjectCard';
import ProjectDetail from './ProjectDetail';



interface Props {
    item: TimelineItem;
    posts: SocialPost[];
    onClose: () => void;
}

// Projects section component for TinkerVerse modal
const ProjectsInModal: React.FC<{
    activeProject: Project | null;
    setActiveProject: (project: Project | null) => void;
}> = ({ activeProject, setActiveProject }) => {
    return (
        <section>
            <div className="flex items-end gap-4 mb-8">
                <h3 className="text-3xl font-bold text-white">Projects</h3>
                <p className="hidden md:block text-sm text-gray-500 pb-1.5 font-mono">// Systems and experiments</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {PROJECTS.map((project, index) => (
                    <ProjectCard
                        key={project.id}
                        project={project}
                        index={index}
                        onClick={() => setActiveProject(project)}
                    />
                ))}
            </div>

            {/* Project Detail Modal */}
            <AnimatePresence>
                {activeProject && (
                    <ProjectDetail
                        project={activeProject}
                        onClose={() => setActiveProject(null)}
                    />
                )}
            </AnimatePresence>
        </section>
    );
};

const TinkerVerseModal: React.FC<Props> = ({ item, posts, onClose }) => {
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />

            {/* Modal Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-7xl h-full max-h-[90vh] bg-[#050505] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#050505] z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-amber-500/20 blur-lg rounded-full" />
                            <img src={TINKERVERSE_LOGO} alt="TV" className="relative w-10 h-10 rounded-lg bg-black object-cover border border-white/10" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">TinkerVerse</h2>
                            <p className="text-xs text-amber-500/80 uppercase tracking-widest font-mono">The Lab & Playground</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors border border-transparent hover:border-white/10"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-10 space-y-16 custom-scrollbar">

                    {/* Section 1: Projects */}
                    <ProjectsInModal activeProject={activeProject} setActiveProject={setActiveProject} />


                    {/* Section 2: The Archive (Marquee Feed) */}
                    <section className="relative">
                        <div className="flex items-end gap-4 mb-8">
                            <h3 className="text-3xl font-bold text-white">The Archive</h3>
                            <p className="hidden md:block text-sm text-gray-500 pb-1.5 font-mono">// Experiments & process notes</p>
                        </div>

                        {/* Social Grid (Restored) */}
                        <SocialGrid posts={posts} />
                    </section>
                </div>
            </motion.div>
        </div>
    );
};


const SocialGrid: React.FC<{ posts: SocialPost[] }> = ({ posts }) => {
    const maxLikes = Math.max(...posts.map(p => p.likes));

    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {posts.map((post) => {
                const fillHeight = Math.max(15, (post.likes / maxLikes) * 100);

                return (
                    <a
                        key={post.id}
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a] hover:border-amber-500/50 hover:scale-105 hover:z-10 transition-all duration-200 ease-out"
                    >
                        {/* Liquid fill - pure CSS */}
                        <div
                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-500/30 to-amber-400/10 transition-all duration-300"
                            style={{ height: `${fillHeight}%` }}
                        />

                        {/* Content */}
                        <div className="relative z-10 h-full p-2.5 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <span className="text-[8px] font-mono text-white/30">{post.date}</span>
                                <ExternalLink size={8} className="text-white/20 group-hover:text-white/60 transition-colors" />
                            </div>

                            <div>
                                <p className="text-[9px] text-gray-400 line-clamp-2 mb-2 group-hover:text-gray-200 transition-colors">
                                    {post.caption}
                                </p>
                                <div className="flex gap-2 text-[9px] font-mono">
                                    <span className={`flex items-center gap-1 ${post.likes > 100 ? 'text-amber-400' : 'text-gray-500'}`}>
                                        <Heart size={9} /> {post.likes}
                                    </span>
                                    <span className="flex items-center gap-1 text-gray-600">
                                        <MessageCircle size={9} /> {post.comments}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </a>
                );
            })}
        </div>
    );
}

export default TinkerVerseModal;

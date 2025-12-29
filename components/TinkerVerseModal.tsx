import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { X, ExternalLink, PlayCircle, Heart, MessageCircle, Github, ArrowUpRight } from 'lucide-react';
import { TimelineItem, SocialPost, TinkerProject } from '../types';
import { TINKERVERSE_LOGO } from '../constants';
import { formatDate } from '../utils';
import { BentoGrid, BentoCard } from './ui/bento-grid';



interface Props {
    item: TimelineItem;
    posts: SocialPost[];
    onClose: () => void;
}

const TinkerVerseModal: React.FC<Props> = ({ item, posts, onClose }) => {
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

                    {/* Section 1: Featured Projects (Bento Grid) */}
                    <section>
                        <div className="flex items-end gap-4 mb-8">
                            <h3 className="text-3xl font-bold text-white">Featured Projects</h3>
                            <p className="hidden md:block text-sm text-gray-500 pb-1.5 font-mono">// Major builds & installations</p>
                        </div>

                        <BentoGrid className="lg:grid-rows-3">
                            {item.projects?.map((project, i) => {
                                // Determine span based on index for interesting layout
                                // First item = large square (2x2), others regular
                                let className = "";
                                if (i === 0) className = "lg:row-span-2 lg:col-span-2";
                                else className = "lg:col-span-1 lg:row-span-1";

                                return (
                                    <BentoCard
                                        key={project.id}
                                        name={project.title}
                                        className={className}
                                        background={
                                            <div className="absolute inset-0 z-0 transition-opacity duration-300 opacity-60 group-hover:opacity-40">
                                                {project.videoUrl ? (
                                                    // For now just use image if available, or a gradient if not
                                                    project.imageUrl ? <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
                                                        : <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800" />
                                                ) : (
                                                    project.imageUrl ? <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
                                                        : <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800" />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                            </div>
                                        }
                                        Icon={() => null}
                                        description={project.description}
                                        href={project.link || "#"}
                                        cta="View Project"
                                    />
                                )
                            })}
                        </BentoGrid>
                    </section>


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
    // Calculate max metrics for scaling
    const maxLikes = Math.max(...posts.map(p => p.likes));

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6 p-4">
            {posts.map((post) => (
                <LiquidCard key={post.id} post={post} maxLikes={maxLikes} />
            ))}
        </div>
    );
}

const LiquidCard: React.FC<{ post: SocialPost; maxLikes: number }> = ({ post, maxLikes }) => {
    // 3D Tilt Logic - 30 degree range
    const tiltX = useMotionValue(0.5);
    const tiltY = useMotionValue(0.5);
    const springX = useSpring(tiltX, { stiffness: 150, damping: 15 }); // Bouncier spring for shaky effect
    const springY = useSpring(tiltY, { stiffness: 150, damping: 15 });
    const rotateX = useTransform(springY, [0, 1], [30, -30]); // 30 degree tilt
    const rotateY = useTransform(springX, [0, 1], [-30, 30]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        tiltX.set(x);
        tiltY.set(y);
    };

    const handleMouseLeave = () => {
        tiltX.set(0.5);
        tiltY.set(0.5);
    };

    const fillHeight = `${Math.max(15, (post.likes / maxLikes) * 100)}%`;

    return (
        <motion.a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative w-full aspect-[3/4] rounded-xl overflow-hidden backdrop-blur-sm border border-white/10 bg-white/5 group"
            style={{
                perspective: 1000,
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
            }}
            whileHover={{
                scale: 1.3, // 30% expansion
                zIndex: 20,
                transition: {
                    type: 'spring',
                    stiffness: 200,
                    damping: 12 // Bouncy/shaky effect
                }
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* Liquid Fill Container */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: fillHeight }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className="absolute bottom-0 left-0 right-0"
                >
                    {/* Liquid body */}
                    <div className="absolute inset-0 bg-gradient-to-t from-amber-500/40 via-amber-400/25 to-amber-300/15 backdrop-blur-[2px]" />

                    {/* Animated Wave surface */}
                    <motion.div
                        className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-amber-300/60 to-transparent"
                        animate={{
                            y: [0, -2, 0, 2, 0],
                            scaleX: [1, 1.02, 1, 0.98, 1],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />

                    {/* Bubbles */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute bottom-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-[float_3s_infinite_ease-in-out]" />
                        <div className="absolute bottom-1/3 right-1/3 w-1.5 h-1.5 bg-white/15 rounded-full animate-[float_4s_0.5s_infinite_ease-in-out]" />
                        <div className="absolute bottom-1/2 left-1/2 w-1 h-1 bg-white/10 rounded-full animate-[float_3.5s_1s_infinite_ease-in-out]" />
                    </div>

                    {/* Glow at top of liquid */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400/80 blur-sm shadow-[0_0_15px_rgba(251,191,36,0.6)]" />
                </motion.div>
            </div>

            {/* Glass Reflection/Sheen */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent opacity-70 pointer-events-none z-20" />
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-20" />

            {/* Content */}
            <div className="relative z-30 h-full p-4 flex flex-col justify-between">
                <div className="flex justify-between items-start opacity-60 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] font-mono text-white/50">{post.date}</span>
                    <ExternalLink size={10} className="text-white/30" />
                </div>

                <div className="space-y-4">
                    <p className="text-xs text-gray-300 line-clamp-3 font-light leading-relaxed group-hover:text-white transition-colors shadow-black drop-shadow-md">
                        {post.caption}
                    </p>

                    <div className="flex gap-4 text-xs font-mono">
                        <span className={`flex items-center gap-1.5 ${post.likes > 100 ? 'text-amber-300' : 'text-gray-400'} drop-shadow-md`}>
                            <Heart size={12} className={post.likes > 100 ? "fill-amber-500/50" : ""} /> {post.likes}
                        </span>
                        <span className="flex items-center gap-1.5 text-gray-500 group-hover:text-blue-300 drop-shadow-md transition-colors">
                            <MessageCircle size={12} /> {post.comments}
                        </span>
                    </div>
                </div>
            </div>
        </motion.a>
    );
}

export default TinkerVerseModal;

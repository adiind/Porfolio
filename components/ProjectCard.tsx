import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Zap, PenTool, Bot, Cpu, Layers, Box, Music, Camera, ArrowRight } from 'lucide-react';
import { Project } from '../types/Project';

interface Props {
    project: Project;
    index: number;
    onClick: () => void;
}

const iconMap = {
    'zap': Zap,
    'pen-tool': PenTool,
    'bot': Bot,
    'cpu': Cpu,
    'layers': Layers,
    'box': Box,
    'music': Music,
    'camera': Camera,
};

const colorMap = {
    'amber': {
        bg: 'from-amber-500/20 to-amber-600/5',
        border: 'border-amber-500/30 hover:border-amber-400/50',
        icon: 'bg-amber-500/20 text-amber-400',
        glow: 'group-hover:shadow-amber-500/20',
        text: 'group-hover:text-amber-200',
        status: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    'teal': {
        bg: 'from-teal-500/20 to-teal-600/5',
        border: 'border-teal-500/30 hover:border-teal-400/50',
        icon: 'bg-teal-500/20 text-teal-400',
        glow: 'group-hover:shadow-teal-500/20',
        text: 'group-hover:text-teal-200',
        status: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    },
    'indigo': {
        bg: 'from-indigo-500/20 to-indigo-600/5',
        border: 'border-indigo-500/30 hover:border-indigo-400/50',
        icon: 'bg-indigo-500/20 text-indigo-400',
        glow: 'group-hover:shadow-indigo-500/20',
        text: 'group-hover:text-indigo-200',
        status: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    'rose': {
        bg: 'from-rose-500/20 to-rose-600/5',
        border: 'border-rose-500/30 hover:border-rose-400/50',
        icon: 'bg-rose-500/20 text-rose-400',
        glow: 'group-hover:shadow-rose-500/20',
        text: 'group-hover:text-rose-200',
        status: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    'emerald': {
        bg: 'from-emerald-500/20 to-emerald-600/5',
        border: 'border-emerald-500/30 hover:border-emerald-400/50',
        icon: 'bg-emerald-500/20 text-emerald-400',
        glow: 'group-hover:shadow-emerald-500/20',
        text: 'group-hover:text-emerald-200',
        status: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    'violet': {
        bg: 'from-violet-500/20 to-violet-600/5',
        border: 'border-violet-500/30 hover:border-violet-400/50',
        icon: 'bg-violet-500/20 text-violet-400',
        glow: 'group-hover:shadow-violet-500/20',
        text: 'group-hover:text-violet-200',
        status: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    },
};

const ProjectCard: React.FC<Props> = ({ project, index, onClick }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Motion values for 3D tilt
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth spring animation
    const springConfig = { stiffness: 150, damping: 15 };
    const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [15, -15]), springConfig);
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-15, 15]), springConfig);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const normalX = (e.clientX - rect.left) / rect.width - 0.5;
        const normalY = (e.clientY - rect.top) / rect.height - 0.5;
        x.set(normalX);
        y.set(normalY);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        x.set(0);
        y.set(0);
    };

    const Icon = iconMap[project.icon || 'zap'];
    const colors = colorMap[project.themeColor || 'amber'];

    const statusLabels: Record<string, string> = {
        'shipped': 'Shipped',
        'in-progress': 'In Progress',
        'archived': 'Archived',
        'concept': 'Concept',
    };

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: [0.21, 0.47, 0.32, 0.98]
            }}
            style={{
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            className={`
        group relative cursor-pointer
        bg-gradient-to-br ${colors.bg}
        border ${colors.border}
        rounded-2xl p-6 md:p-8
        transition-all duration-300
        hover:scale-[1.02]
        shadow-lg ${colors.glow} group-hover:shadow-2xl
      `}
        >
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 rounded-2xl bg-white/[0.02] backdrop-blur-sm pointer-events-none" />

            {/* Animated gradient border */}
            <motion.div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                    background: `linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)`,
                    backgroundSize: '200% 200%',
                }}
                animate={isHovered ? {
                    backgroundPosition: ['0% 0%', '100% 100%'],
                } : {}}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
            />

            {/* Content */}
            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <motion.div
                            className={`p-2.5 rounded-xl ${colors.icon}`}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ type: 'spring', stiffness: 400 }}
                        >
                            <Icon size={22} />
                        </motion.div>
                        <div>
                            <h3 className={`text-lg md:text-xl font-semibold text-white ${colors.text} transition-colors`}>
                                {project.hero.title.split('–')[0].trim()}
                            </h3>
                            {project.hero.title.includes('–') && (
                                <p className="text-xs text-white/40 font-medium">
                                    {project.hero.title.split('–')[1].trim()}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${colors.status}`}>
                        {statusLabels[project.outcome.status]}
                    </span>
                </div>

                {/* One-liner */}
                <p className="text-white/60 text-sm md:text-base leading-relaxed mb-6 line-clamp-3">
                    {project.hero.oneLiner}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/30 text-xs">
                        <span>{project.build.bullets.length} components</span>
                        <span>•</span>
                        <span>{project.decisions.length} key decisions</span>
                    </div>

                    <motion.div
                        className="flex items-center gap-1 text-white/40 group-hover:text-white/80 transition-colors"
                        whileHover={{ x: 5 }}
                    >
                        <span className="text-xs font-medium">View Details</span>
                        <ArrowRight size={14} />
                    </motion.div>
                </div>
            </div>

            {/* 3D depth shadow */}
            <motion.div
                className="absolute inset-0 rounded-2xl bg-black/20 blur-xl -z-10"
                style={{
                    transform: 'translateZ(-50px) scale(0.95)',
                }}
                animate={{
                    opacity: isHovered ? 0.8 : 0.3,
                }}
            />
        </motion.div>
    );
};

export default ProjectCard;

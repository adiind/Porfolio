import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Zap, PenTool, Bot, Cpu, Layers, Box, Music, Camera, ChevronDown, Trophy, Code } from 'lucide-react';

interface Props {
    project: Project;
    index: number;
    onClick: () => void;
}

const iconMap = {
    'zap': Zap,
    'pen-tool': PenTool,
    'bot': Bot,
    'code': Code,
    'cpu': Cpu,
    'layers': Layers,
    'box': Box,
    'music': Music,
    'camera': Camera,
};

const colorMap = {
    'amber': {
        bg: 'from-amber-900/40',
        border: 'border-amber-500/20',
        borderHover: 'border-amber-400/50',
        icon: 'bg-amber-500/20 text-amber-400',
        glow: 'shadow-amber-500/20',
        text: 'text-amber-200',
        status: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        pill: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    },
    'teal': {
        bg: 'from-teal-900/40',
        border: 'border-teal-500/20',
        borderHover: 'border-teal-400/50',
        icon: 'bg-teal-500/20 text-teal-400',
        glow: 'shadow-teal-500/20',
        text: 'text-teal-200',
        status: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
        pill: 'bg-teal-500/10 border-teal-500/30 text-teal-300',
    },
    'indigo': {
        bg: 'from-indigo-900/40',
        border: 'border-indigo-500/20',
        borderHover: 'border-indigo-400/50',
        icon: 'bg-indigo-500/20 text-indigo-400',
        glow: 'shadow-indigo-500/20',
        text: 'text-indigo-200',
        status: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        pill: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
    },
    'rose': {
        bg: 'from-rose-900/40',
        border: 'border-rose-500/20',
        borderHover: 'border-rose-400/50',
        icon: 'bg-rose-500/20 text-rose-400',
        glow: 'shadow-rose-500/20',
        text: 'text-rose-200',
        status: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        pill: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    },
    'emerald': {
        bg: 'from-emerald-900/40',
        border: 'border-emerald-500/20',
        borderHover: 'border-emerald-400/50',
        icon: 'bg-emerald-500/20 text-emerald-400',
        glow: 'shadow-emerald-500/20',
        text: 'text-emerald-200',
        status: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        pill: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    },
    'violet': {
        bg: 'from-violet-900/40',
        border: 'border-violet-500/20',
        borderHover: 'border-violet-400/50',
        icon: 'bg-violet-500/20 text-violet-400',
        glow: 'shadow-violet-500/20',
        text: 'text-violet-200',
        status: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
        pill: 'bg-violet-500/10 border-violet-500/30 text-violet-300',
    },
};

// Splash colors for skill pills
const splashColors = [
    'bg-indigo-500/10 border-indigo-500/30 text-indigo-200',
    'bg-rose-500/10 border-rose-500/30 text-rose-200',
    'bg-amber-500/10 border-amber-500/30 text-amber-200',
    'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
    'bg-cyan-500/10 border-cyan-500/30 text-cyan-200',
    'bg-purple-500/10 border-purple-500/30 text-purple-200',
];

const ProjectCard: React.FC<Props> = ({ project, index, onClick }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Motion values for 3D tilt
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth spring animation
    const springConfig = { stiffness: 150, damping: 15 };
    const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), springConfig);
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), springConfig);

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
    const hasImage = !!project.heroImage;

    const statusLabels: Record<string, string> = {
        'shipped': 'Shipped',
        'in-progress': 'In Progress',
        'archived': 'Archived',
        'concept': 'Concept',
    };

    return (
        <motion.div
            ref={cardRef}
            layout
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{
                duration: 0.5,
                delay: index * 0.08,
                ease: [0.32, 0.72, 0, 1],
                layout: { duration: 0.4, ease: [0.32, 0.72, 0, 1] }
            }}
            style={{
                rotateX: isHovered ? rotateX : 0,
                rotateY: isHovered ? rotateY : 0,
                transformStyle: 'preserve-3d',
                perspective: 1000,
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            className={`
                group relative cursor-pointer overflow-hidden
                border ${isHovered ? colors.borderHover : colors.border}
                rounded-xl
                transition-all duration-500
                ${isHovered ? `shadow-[0_0_40px_rgba(255,255,255,0.1)] ${colors.glow}` : 'shadow-lg'}
            `}
        >
            {/* Solid Black Backing for Expanded State */}
            {isHovered && <div className="absolute inset-0 bg-[#0a0a0a] z-0" />}

            {/* Background Image */}
            {hasImage && (
                <>
                    <motion.div
                        className="absolute overflow-hidden z-0"
                        animate={{
                            top: 0,
                            right: isHovered ? 0 : 'auto',
                            left: isHovered ? 'auto' : 0,
                            width: isHovered ? '50%' : '100%',
                            height: isHovered ? '100%' : '192px',
                        }}
                        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                    >
                        <img
                            src={project.heroImage}
                            alt={project.hero.title}
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{
                                opacity: isHovered ? 0.7 : 0.6,
                                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                                transition: 'opacity 0.5s, transform 0.7s',
                            }}
                        />
                        {/* Gradient overlays */}
                        <div
                            className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                            style={{ opacity: isHovered ? 0 : 0.9 }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
                        </div>
                        <div
                            className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                            style={{ opacity: isHovered ? 1 : 0 }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                        </div>
                    </motion.div>
                </>
            )}

            {/* Fallback gradient background for cards without images */}
            {!hasImage && (
                <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} via-black to-black opacity-80`} />
            )}

            {/* Status Badge (Top Right) */}
            <div className="absolute top-3 right-3 z-20">
                <motion.span
                    layout
                    className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border backdrop-blur-sm ${colors.status}`}
                >
                    <Trophy size={10} />
                    {statusLabels[project.outcome.status]}
                </motion.span>
            </div>

            {/* Icon Badge (Top Left) */}
            <div className="absolute top-3 left-3 z-20">
                <motion.div
                    layout
                    className={`p-2 rounded-lg ${colors.icon} backdrop-blur-sm`}
                    animate={{ scale: isHovered ? 1.1 : 1, rotate: isHovered ? 5 : 0 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                >
                    <Icon size={isHovered ? 20 : 18} />
                </motion.div>
            </div>

            {/* Content Container */}
            <motion.div
                layout
                className="relative z-10 flex flex-col p-4"
                animate={{
                    minHeight: isHovered ? '280px' : '192px',
                }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            >
                {/* Spacer to push content down when collapsed, align top when expanded */}
                <motion.div
                    className="flex-1"
                    animate={{ minHeight: isHovered ? '0px' : '100px' }}
                    transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                />

                {/* Title Section - Always at bottom when collapsed, top when expanded */}
                <motion.div
                    layout="position"
                    className={isHovered ? 'mt-10' : 'mt-auto'}
                >
                    <h3 className={`text-sm font-bold text-white leading-tight mb-0.5 line-clamp-1 transition-colors duration-300 ${isHovered ? colors.text : ''}`}>
                        {project.hero.title.split('–')[0].trim()}
                    </h3>
                    {project.hero.title.includes('–') && (
                        <p className="text-[10px] text-white/60 font-medium uppercase tracking-wide truncate">
                            {project.hero.title.split('–')[1].trim()}
                        </p>
                    )}
                </motion.div>

                {/* Expanded Content - Only visible on hover */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                            className="overflow-hidden"
                        >
                            {/* One-liner description */}
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ delay: 0.05, duration: 0.25 }}
                                className="mt-3 text-sm text-white/70 leading-relaxed line-clamp-2"
                            >
                                {project.hero.oneLiner}
                            </motion.p>

                            {/* Skills Pills */}
                            {project.skills && project.skills.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ delay: 0.1, duration: 0.25 }}
                                    className="mt-4 flex flex-wrap gap-1.5"
                                >
                                    {project.skills.slice(0, 4).map((skill, i) => (
                                        <span
                                            key={i}
                                            className={`px-2 py-1 text-[10px] font-medium rounded-full border ${splashColors[i % splashColors.length]}`}
                                        >
                                            {skill.label}
                                        </span>
                                    ))}
                                    {project.skills.length > 4 && (
                                        <span className="px-2 py-1 text-[10px] font-medium rounded-full border border-white/20 text-white/40">
                                            +{project.skills.length - 4}
                                        </span>
                                    )}
                                </motion.div>
                            )}

                            {/* Click indicator */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: 0.15, duration: 0.2 }}
                                className="mt-4 flex items-center gap-2 text-white/30"
                            >
                                <ChevronDown size={14} className="animate-bounce" />
                                <span className="text-[10px] uppercase tracking-widest">Click to explore</span>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* 3D depth shadow */}
            <motion.div
                className="absolute inset-0 rounded-xl bg-black/20 blur-xl -z-10"
                style={{ transform: 'translateZ(-50px) scale(0.95)' }}
                animate={{ opacity: isHovered ? 0.8 : 0.3 }}
            />
        </motion.div>
    );
};

export default ProjectCard;

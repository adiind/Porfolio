import React from 'react';
import { motion } from 'framer-motion';
import {
    X, ExternalLink, Check, AlertTriangle, ArrowRight,
    Lightbulb, Wrench, Scale, MessageSquare, Trophy, Sparkles,
    ChevronDown, Image as ImageIcon
} from 'lucide-react';
import { Project } from '../types/Project';

interface Props {
    project: Project;
    onClose: () => void;
}

const colorMap = {
    'amber': {
        accent: 'bg-amber-500',
        accentLight: 'bg-amber-500/20',
        accentText: 'text-amber-400',
        accentBorder: 'border-amber-500/30',
        glow: 'shadow-amber-500/30',
        pillBg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    },
    'teal': {
        accent: 'bg-teal-500',
        accentLight: 'bg-teal-500/20',
        accentText: 'text-teal-400',
        accentBorder: 'border-teal-500/30',
        glow: 'shadow-teal-500/30',
        pillBg: 'bg-teal-500/10 border-teal-500/30 text-teal-300',
    },
    'indigo': {
        accent: 'bg-indigo-500',
        accentLight: 'bg-indigo-500/20',
        accentText: 'text-indigo-400',
        accentBorder: 'border-indigo-500/30',
        glow: 'shadow-indigo-500/30',
        pillBg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
    },
    'rose': {
        accent: 'bg-rose-500',
        accentLight: 'bg-rose-500/20',
        accentText: 'text-rose-400',
        accentBorder: 'border-rose-500/30',
        glow: 'shadow-rose-500/30',
        pillBg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    },
    'emerald': {
        accent: 'bg-emerald-500',
        accentLight: 'bg-emerald-500/20',
        accentText: 'text-emerald-400',
        accentBorder: 'border-emerald-500/30',
        glow: 'shadow-emerald-500/30',
        pillBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    },
    'violet': {
        accent: 'bg-violet-500',
        accentLight: 'bg-violet-500/20',
        accentText: 'text-violet-400',
        accentBorder: 'border-violet-500/30',
        glow: 'shadow-violet-500/30',
        pillBg: 'bg-violet-500/10 border-violet-500/30 text-violet-300',
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

const ProjectDetail: React.FC<Props> = ({ project, onClose }) => {
    const colors = colorMap[project.themeColor || 'amber'];

    const statusLabels: Record<string, string> = {
        'shipped': 'Shipped',
        'in-progress': 'In Progress',
        'archived': 'Archived',
        'concept': 'Concept',
    };

    // Animation variants for staggered reveals - FAST
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.03 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.25 } }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl overflow-hidden"
            onClick={onClose}
        >
            {/* Background Ambience */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-[-30%] left-[-20%] w-[70%] h-[70%] ${colors.accentLight} blur-[150px] rounded-full opacity-40`} />
                <div className="absolute bottom-[-30%] right-[-20%] w-[60%] h-[60%] bg-indigo-600/20 blur-[150px] rounded-full" />
            </div>

            {/* Close Button - Fixed Top Right - VERY PROMINENT */}
            <motion.button
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0, duration: 0.2 }}
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="fixed top-4 right-4 md:top-6 md:right-6 z-[200] flex items-center gap-2 px-5 py-3 rounded-full bg-white text-black font-semibold transition-all hover:bg-gray-100 shadow-2xl shadow-black/50"
            >
                <X size={20} strokeWidth={2.5} />
                <span className="text-sm">Close</span>
            </motion.button>

            {/* Floating Bottom Close Button - Always Visible */}
            <motion.button
                initial={{ opacity: 0, y: 20, x: "-50%" }}
                animate={{ opacity: 1, y: 0, x: "-50%" }}
                transition={{ delay: 0.1, duration: 0.2 }}
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="fixed bottom-6 left-1/2 z-[200] flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md text-white font-medium transition-all hover:bg-white/20 border border-white/20"
            >
                <X size={18} />
                <span className="text-sm">Back to Projects</span>
            </motion.button>

            {/* Main Content - Full Screen Scrollable */}
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 30, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                className="relative z-10 h-full overflow-y-auto custom-scrollbar"
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="max-w-5xl mx-auto px-6 md:px-12 py-12 md:py-20 min-h-full"
                >

                    {/* Hero Section */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="mb-16"
                    >
                        {/* Status Badge */}
                        <motion.div variants={itemVariants} className="mb-6">
                            <span className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-full ${colors.accentLight} ${colors.accentText} border ${colors.accentBorder}`}>
                                <Trophy size={16} />
                                {statusLabels[project.outcome.status]}
                            </span>
                        </motion.div>

                        {/* Title */}
                        <motion.h1
                            variants={itemVariants}
                            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-tight"
                        >
                            {project.hero.title}
                        </motion.h1>

                        {/* One-liner */}
                        <motion.p
                            variants={itemVariants}
                            className="text-xl md:text-2xl text-white/60 max-w-3xl leading-relaxed"
                        >
                            {project.hero.oneLiner}
                        </motion.p>

                        {/* Skills Pills */}
                        {project.skills && project.skills.length > 0 && (
                            <motion.div variants={itemVariants} className="mt-8 flex flex-wrap gap-2">
                                {project.skills.map((skill, i) => (
                                    <span
                                        key={i}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors cursor-default ${splashColors[i % splashColors.length]}`}
                                        title={skill.description}
                                    >
                                        {skill.label}
                                    </span>
                                ))}
                            </motion.div>
                        )}

                        {/* Scroll Indicator */}
                        <motion.div
                            variants={itemVariants}
                            className="mt-12 flex items-center gap-2 text-white/30"
                        >
                            <ChevronDown size={20} className="animate-bounce" />
                            <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
                        </motion.div>
                    </motion.div>

                    {/* Hero Image */}
                    {project.heroImage && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ duration: 0.3 }}
                            className="mb-20 rounded-2xl overflow-hidden shadow-2xl"
                        >
                            <img
                                src={project.heroImage}
                                alt={project.hero.title}
                                className="w-full h-auto object-cover"
                            />
                        </motion.div>
                    )}

                    {/* Context / Story */}
                    <motion.section
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.25 }}
                        className="mb-20"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`p-3 rounded-xl ${colors.accentLight} ${colors.accentText}`}>
                                <Lightbulb size={24} />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white">The Story</h2>
                        </div>
                        <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-4xl">
                            {project.context.text}
                        </p>
                    </motion.section>

                    {/* Build Section */}
                    <motion.section
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.25 }}
                        className="mb-20"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className={`p-3 rounded-xl ${colors.accentLight} ${colors.accentText}`}>
                                <Wrench size={24} />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white">What I Built</h2>
                        </div>
                        <div className="grid gap-4">
                            {project.build.bullets.map((bullet, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: '-50px' }}
                                    transition={{ delay: i * 0.02, duration: 0.2 }}
                                    className="flex items-start gap-4 p-5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
                                >
                                    <div className={`w-10 h-10 rounded-lg ${colors.accentLight} flex items-center justify-center shrink-0`}>
                                        <span className={`text-sm font-bold ${colors.accentText}`}>{i + 1}</span>
                                    </div>
                                    <p className="text-white/70 leading-relaxed text-base md:text-lg">{bullet}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.section>

                    {/* Gallery Section - Only if images exist */}
                    {project.gallery && project.gallery.length > 0 && (
                        <motion.section
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ duration: 0.25 }}
                            className="mb-20"
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <div className={`p-3 rounded-xl ${colors.accentLight} ${colors.accentText}`}>
                                    <ImageIcon size={24} />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-white">Gallery</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {project.gallery.map((img, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.05, duration: 0.3 }}
                                        className="rounded-xl overflow-hidden shadow-lg border border-white/5 bg-white/5"
                                    >
                                        <img
                                            src={img}
                                            alt={`${project.hero.title} gallery ${i + 1}`}
                                            className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </motion.section>
                    )}

                    {/* Decisions Section */}
                    <motion.section
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.25 }}
                        className="mb-20"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className={`p-3 rounded-xl ${colors.accentLight} ${colors.accentText}`}>
                                <Scale size={24} />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white">Key Decisions</h2>
                        </div>
                        <div className="space-y-6">
                            {project.decisions.map((decision, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-50px' }}
                                    transition={{ delay: i * 0.03, duration: 0.2 }}
                                    className="p-6 rounded-2xl bg-white/[0.03] border border-white/5"
                                >
                                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                        <ArrowRight size={18} className={colors.accentText} />
                                        {decision.decision}
                                    </h3>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Check size={18} className="text-emerald-400" />
                                                <span className="text-sm font-bold uppercase tracking-wider text-emerald-400">Why</span>
                                            </div>
                                            <p className="text-white/70 leading-relaxed">{decision.why}</p>
                                        </div>

                                        <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                            <div className="flex items-center gap-2 mb-3">
                                                <AlertTriangle size={18} className="text-amber-400" />
                                                <span className="text-sm font-bold uppercase tracking-wider text-amber-400">Trade-off</span>
                                            </div>
                                            <p className="text-white/70 leading-relaxed">{decision.tradeoff}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.section>

                    {/* Review Section */}
                    <motion.section
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.25 }}
                        className="mb-20"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className={`p-3 rounded-xl ${colors.accentLight} ${colors.accentText}`}>
                                <MessageSquare size={24} />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white">What I Learned</h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* What Worked */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 rounded-lg bg-emerald-500/20">
                                        <Check size={20} className="text-emerald-400" />
                                    </div>
                                    <span className="font-semibold text-emerald-400 text-lg">What Worked</span>
                                </div>
                                {project.review.worked.map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -5 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true, margin: '-50px' }}
                                        transition={{ delay: i * 0.02, duration: 0.15 }}
                                        className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/20"
                                    >
                                        <p className="text-white/70 leading-relaxed">{item}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Challenges */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 rounded-lg bg-rose-500/20">
                                        <AlertTriangle size={20} className="text-rose-400" />
                                    </div>
                                    <span className="font-semibold text-rose-400 text-lg">Challenges</span>
                                </div>
                                {project.review.didnt.filter(Boolean).map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: 5 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true, margin: '-50px' }}
                                        transition={{ delay: i * 0.02, duration: 0.15 }}
                                        className="p-5 rounded-xl bg-rose-500/5 border border-rose-500/20"
                                    >
                                        <p className="text-white/70 leading-relaxed">{item}</p>
                                    </motion.div>
                                ))}
                                {project.review.didnt.filter(Boolean).length === 0 && (
                                    <p className="text-white/30 italic p-5">No significant challenges documented.</p>
                                )}
                            </div>
                        </div>
                    </motion.section>

                    {/* Outcome Section */}
                    <motion.section
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.25 }}
                        className="mb-20"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className={`p-3 rounded-xl ${colors.accentLight} ${colors.accentText}`}>
                                <Trophy size={24} />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white">Outcome</h2>
                        </div>

                        <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 mb-8">
                            <p className="text-lg md:text-xl text-white/80 leading-relaxed">
                                {project.outcome.text}
                            </p>
                        </div>

                        {/* Proof Link */}
                        {project.outcome.proof && (
                            <a
                                href={project.outcome.proof}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`
                  inline-flex items-center gap-3 px-6 py-4 rounded-xl
                  ${colors.accentLight} ${colors.accentText}
                  border ${colors.accentBorder}
                  hover:scale-105 transition-transform
                  font-semibold text-lg
                `}
                            >
                                <ExternalLink size={20} />
                                View Project
                            </a>
                        )}
                    </motion.section>

                    {/* Reflection Section */}
                    <motion.section
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.25 }}
                        className="mb-20 pb-20 border-t border-white/10 pt-16"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className={`p-3 rounded-xl ${colors.accentLight} ${colors.accentText}`}>
                                <Sparkles size={24} />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white">Reflection</h2>
                        </div>

                        <blockquote className="text-xl md:text-2xl text-white/60 leading-relaxed italic pl-6 border-l-4 border-white/20">
                            "{project.reflection.text}"
                        </blockquote>
                    </motion.section>

                </div>
            </motion.div>
        </motion.div>
    );
};

export default ProjectDetail;

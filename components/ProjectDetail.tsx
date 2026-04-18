import React, { useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Check, AlertTriangle, ArrowRight,
    Lightbulb, Wrench, Scale, Trophy, Sparkles,
    ChevronLeft, ChevronRight, Cpu, Zap, Code2, Globe
} from 'lucide-react';
import { Project } from '../types/Project';
import ScrollTracker, { projectDetailSections } from './ui/ScrollTracker';
import GitHubActivity from './GitHubActivity';

interface Props {
    project: Project;
    onClose: () => void;
}

const colorMap = {
    'amber': { accentLight: 'bg-amber-500/20', accentText: 'text-amber-400', accentBorder: 'border-amber-500/30', glow: 'rgba(245,158,11,0.15)' },
    'teal': { accentLight: 'bg-teal-500/20', accentText: 'text-teal-400', accentBorder: 'border-teal-500/30', glow: 'rgba(20,184,166,0.15)' },
    'indigo': { accentLight: 'bg-indigo-500/20', accentText: 'text-indigo-400', accentBorder: 'border-indigo-500/30', glow: 'rgba(99,102,241,0.15)' },
    'rose': { accentLight: 'bg-rose-500/20', accentText: 'text-rose-400', accentBorder: 'border-rose-500/30', glow: 'rgba(244,63,94,0.15)' },
    'emerald': { accentLight: 'bg-emerald-500/20', accentText: 'text-emerald-400', accentBorder: 'border-emerald-500/30', glow: 'rgba(16,185,129,0.15)' },
    'violet': { accentLight: 'bg-violet-500/20', accentText: 'text-violet-400', accentBorder: 'border-violet-500/30', glow: 'rgba(139,92,246,0.15)' },
};

const splashColors = [
    'bg-indigo-500/10 border-indigo-500/30 text-indigo-200',
    'bg-rose-500/10 border-rose-500/30 text-rose-200',
    'bg-amber-500/10 border-amber-500/30 text-amber-200',
    'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
];

// Feature carousel for Zero's rich feature screenshots
const FeatureCarousel: React.FC<{ features: NonNullable<Project['features']>; colors: typeof colorMap[keyof typeof colorMap] }> = ({ features, colors }) => {
    const [active, setActive] = useState(0);
    const current = features[active];

    return (
        <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg ${colors.accentLight}`}>
                    <Sparkles size={20} className={colors.accentText} />
                </div>
                <h2 className="text-xl font-bold text-white">Feature Walkthrough</h2>
            </div>

            {/* Main Feature Image */}
            <motion.div
                key={active}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl mb-6 relative"
            >
                <img
                    src={current.image}
                    alt={current.title}
                    className="w-full h-auto object-cover max-h-[480px] object-top"
                />
                {/* Overlay gradient at bottom */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent flex items-end p-5">
                    <div>
                        <h3 className="text-white font-bold text-lg">{current.title}</h3>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {current.tags.map((tag, i) => (
                                <span key={i} className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${splashColors[i % splashColors.length]}`}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Description */}
            <p className="text-white/70 text-sm leading-relaxed mb-6 max-w-3xl">{current.description}</p>

            {/* Thumbnail Nav */}
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {features.map((f, i) => (
                    <button
                        key={i}
                        onClick={() => setActive(i)}
                        className={`relative flex-shrink-0 rounded-xl overflow-hidden w-32 h-20 border-2 transition-all duration-200 ${
                            i === active ? `${colors.accentBorder} scale-105 shadow-lg` : 'border-white/10 opacity-50 hover:opacity-80'
                        }`}
                    >
                        <img src={f.image} alt={f.title} className="w-full h-full object-cover object-top" />
                        {i === active && (
                            <div className={`absolute inset-0 ${colors.accentLight} opacity-30`} />
                        )}
                    </button>
                ))}
            </div>

            {/* Arrow controls */}
            <div className="flex items-center gap-3 mt-4">
                <button
                    onClick={() => setActive(a => Math.max(0, a - 1))}
                    disabled={active === 0}
                    className="p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all"
                >
                    <ChevronLeft size={16} />
                </button>
                <span className="text-white/40 text-xs font-mono">{active + 1} / {features.length}</span>
                <button
                    onClick={() => setActive(a => Math.min(features.length - 1, a + 1))}
                    disabled={active === features.length - 1}
                    className="p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

// Stats grid for Zero
const StatsGrid: React.FC<{ stats: NonNullable<Project['stats']>; colors: typeof colorMap[keyof typeof colorMap] }> = ({ stats, colors }) => (
    <div className={`grid grid-cols-3 md:grid-cols-6 gap-3 p-5 rounded-2xl border ${colors.accentBorder} ${colors.accentLight} mb-10`}>
        {stats.map((stat, i) => (
            <div key={i} className="text-center">
                <div className={`text-2xl font-bold ${colors.accentText} font-mono`}>{stat.value}</div>
                <div className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">{stat.label}</div>
            </div>
        ))}
    </div>
);

// Tech Stack grid
const TechStackSection: React.FC<{ techStack: NonNullable<Project['techStack']>; colors: typeof colorMap[keyof typeof colorMap] }> = ({ techStack, colors }) => {
    const sections = [
        { label: 'Backend', items: techStack.backend, icon: <Cpu size={14} /> },
        { label: 'AI / LLM', items: techStack.ai, icon: <Sparkles size={14} /> },
        { label: 'Frontend', items: techStack.frontend, icon: <Code2 size={14} /> },
        { label: 'Integrations', items: techStack.integrations, icon: <Globe size={14} /> },
    ].filter(s => s.items && s.items.length > 0);

    return (
        <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
                <div className={`p-2 rounded-lg ${colors.accentLight}`}>
                    <Cpu size={20} className={colors.accentText} />
                </div>
                <h2 className="text-xl font-bold text-white">Technical Stack</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {sections.map((section, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                        <div className={`flex items-center gap-2 ${colors.accentText} text-xs font-bold uppercase tracking-wider mb-3`}>
                            {section.icon}
                            {section.label}
                        </div>
                        <ul className="space-y-1.5">
                            {section.items!.map((item, j) => (
                                <li key={j} className="text-white/60 text-xs leading-snug">{item}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ProjectDetail: React.FC<Props> = ({ project, onClose }) => {
    const colors = colorMap[project.themeColor || 'amber'];
    const statusLabels: Record<string, string> = { 'shipped': 'Shipped', 'in-progress': 'In Progress', 'archived': 'Archived', 'concept': 'Concept' };
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const isZero = project.id === 'zero-my-ai';
    const storyHeading = isZero ? 'Why It Exists' : 'The Story';
    const buildHeading = isZero ? 'What\'s Inside' : 'What I Built';
    const decisionsHeading = isZero ? 'Architecture Calls' : 'Key Decisions';

    // 1. History Management for Browser Back Button
    React.useEffect(() => {
        // Push a new state when the modal opens
        window.history.pushState({ modal: 'project' }, '', window.location.href);

        const handlePopState = (event: PopStateEvent) => {
            // When user clicks back, close the modal
            onClose();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                window.history.back();
            }
        };

        window.addEventListener('popstate', handlePopState);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    // 2. Manual Close Handler
    const handleManualClose = () => {
        window.history.back();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl overflow-hidden"
            onClick={handleManualClose} // Backdrop click closes
        >
            {/* Background Ambience */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-[-30%] left-[-20%] w-[70%] h-[70%] ${colors.accentLight} blur-[150px] rounded-full opacity-40`} />
                <div className="absolute bottom-[-30%] right-[-20%] w-[60%] h-[60%] bg-indigo-600/20 blur-[150px] rounded-full" />
            </div>

            {/* Close Button */}
            {ReactDOM.createPortal(
                <button
                    onClick={(e) => { e.stopPropagation(); handleManualClose(); }}
                    className="fixed top-4 right-4 md:top-6 md:right-6 z-[9999] flex items-center gap-2 px-5 py-3 rounded-full bg-white text-black font-semibold hover:bg-gray-100 shadow-2xl"
                >
                    <X size={20} strokeWidth={2.5} />
                    <span className="text-sm">Close</span>
                </button>,
                document.body
            )}

            {/* Scroll Tracker */}
            <ScrollTracker
                sections={projectDetailSections}
                containerRef={scrollContainerRef}
                accentColor={project.themeColor || 'amber'}
            />

            {/* Main Content - Regular Scroll */}
            <div
                ref={scrollContainerRef}
                className="relative z-10 h-full overflow-y-auto"
            >
                <div
                    className="max-w-5xl mx-auto px-6 md:px-12 lg:px-16 lg:pl-24 pt-14 md:pt-16 pb-16"
                    onClick={(e) => e.stopPropagation()}
                >

                    {/* ===== HERO SECTION ===== */}
                    <section id="section-hero" className="mb-16">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-full ${colors.accentLight} ${colors.accentText} border ${colors.accentBorder} w-fit mb-6`}>
                            <Trophy size={16} />
                            {statusLabels[project.outcome.status]}
                        </span>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight leading-tight">
                            {project.hero.title}
                        </h1>

                        <p className="text-lg md:text-xl text-white/60 max-w-3xl leading-relaxed mb-6">
                            {project.hero.oneLiner}
                        </p>

                        {project.skills && project.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-8">
                                {project.skills.slice(0, 6).map((skill, i) => (
                                    <span key={i} className={`px-3 py-1.5 text-xs font-medium rounded-full border ${splashColors[i % splashColors.length]}`}>
                                        {skill.label}
                                    </span>
                                ))}
                            </div>
                        )}

                        {project.heroImage && (
                            <div className="rounded-2xl overflow-hidden shadow-2xl">
                                <img src={project.heroImage} alt={project.hero.title} className="w-full h-auto object-cover" />
                            </div>
                        )}

                        {/* === GITHUB STATS - Inline chips for Portfolio project === */}
                        {project.id === 'portfolio-website' && (
                            <div className="mb-6">
                                <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Build Stats</p>
                                <GitHubActivity variant="inline" />
                            </div>
                        )}

                        {/* === STATS GRID for Zero === */}
                        {isZero && project.stats && project.stats.length > 0 && (
                            <div className="mt-8">
                                <StatsGrid stats={project.stats} colors={colors} />
                            </div>
                        )}
                    </section>

                    {/* ===== FEATURE CAROUSEL (Zero only) ===== */}
                    {isZero && project.features && project.features.length > 0 && (
                        <FeatureCarousel features={project.features} colors={colors} />
                    )}

                    {/* ===== STORY + BUILD SECTION ===== */}
                    <section className="mb-16">
                        <div className="grid md:grid-cols-2 gap-8 mb-10">
                            {/* Story */}
                            <div id="section-story">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-2 rounded-lg ${colors.accentLight}`}>
                                        <Lightbulb size={20} className={colors.accentText} />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">{storyHeading}</h2>
                                </div>
                                <p className="text-white/70 text-base leading-relaxed">
                                    {project.context.text}
                                </p>
                            </div>

                            {/* Build */}
                            <div id="section-build">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-2 rounded-lg ${colors.accentLight}`}>
                                        <Wrench size={20} className={colors.accentText} />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">{buildHeading}</h2>
                                </div>
                                <ul className="space-y-2">
                                    {project.build.bullets.map((bullet, i) => (
                                        <li key={i} className="flex items-start gap-3 text-white/70 text-sm">
                                            <span className={`w-6 h-6 rounded ${colors.accentLight} flex items-center justify-center shrink-0 mt-0.5`}>
                                                <span className={`text-xs font-semibold ${colors.accentText}`}>{i + 1}</span>
                                            </span>
                                            <span className="leading-relaxed">{bullet}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Decisions */}
                        <div id="section-decisions">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-lg ${colors.accentLight}`}>
                                    <Scale size={20} className={colors.accentText} />
                                </div>
                                <h2 className="text-xl font-bold text-white">{decisionsHeading}</h2>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                {project.decisions.map((decision, i) => (
                                    <div key={i}>
                                        <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-1">
                                            <ArrowRight size={14} className={colors.accentText} />
                                            {decision.decision}
                                        </h3>
                                        <div className="pl-6 text-sm text-white/60">
                                            <span className="text-emerald-400 font-medium">Why:</span> {decision.why}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ===== TECH STACK (Zero only) ===== */}
                    {isZero && project.techStack && (
                        <TechStackSection techStack={project.techStack} colors={colors} />
                    )}

                    {/* ===== LEARNINGS + OUTCOME SECTION ===== */}
                    <section className="mb-16">
                        {/* Learnings */}
                        <div id="section-learnings" className="grid md:grid-cols-2 gap-8 mb-10">
                            <div>
                                <h3 className="flex items-center gap-2 text-emerald-400 font-bold mb-4 text-lg">
                                    <Check size={18} />
                                    What Worked
                                </h3>
                                <ul className="space-y-2">
                                    {project.review.worked.map((item, i) => (
                                        <li key={i} className="text-white/70 text-sm leading-relaxed pl-4 border-l-2 border-emerald-500/40">
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="flex items-center gap-2 text-rose-400 font-bold mb-4 text-lg">
                                    <AlertTriangle size={18} />
                                    Challenges
                                </h3>
                                <ul className="space-y-2">
                                    {project.review.didnt.filter(Boolean).map((item, i) => (
                                        <li key={i} className="text-white/70 text-sm leading-relaxed pl-4 border-l-2 border-rose-500/40">
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Outcome */}
                        <div id="section-outcome" className="mb-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-lg ${colors.accentLight}`}>
                                    <Trophy size={20} className={colors.accentText} />
                                </div>
                                <h2 className="text-xl font-bold text-white">Outcome</h2>
                            </div>
                            <p className="text-white/70 text-base leading-relaxed max-w-3xl">
                                {project.outcome.text}
                            </p>
                        </div>

                        {/* Reflection */}
                        <div id="section-reflection" className="pt-8 border-t border-white/10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-lg ${colors.accentLight}`}>
                                    <Sparkles size={20} className={colors.accentText} />
                                </div>
                                <h2 className="text-xl font-bold text-white">Reflection</h2>
                            </div>
                            <blockquote className="text-lg md:text-xl text-white/60 leading-relaxed italic pl-5 border-l-4 border-white/20">
                                "{project.reflection.text}"
                            </blockquote>
                        </div>
                    </section>

                    {/* Bottom padding */}
                    <div className="h-16" />
                </div>
            </div>
        </motion.div>
    );
};

export default ProjectDetail;

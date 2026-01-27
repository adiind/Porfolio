import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import {
    X, Check, AlertTriangle, ArrowRight,
    Lightbulb, Wrench, Scale, Trophy, Sparkles
} from 'lucide-react';
import { Project } from '../types/Project';
import ScrollTracker, { projectDetailSections } from './ui/ScrollTracker';

interface Props {
    project: Project;
    onClose: () => void;
}

const colorMap = {
    'amber': { accentLight: 'bg-amber-500/20', accentText: 'text-amber-400', accentBorder: 'border-amber-500/30' },
    'teal': { accentLight: 'bg-teal-500/20', accentText: 'text-teal-400', accentBorder: 'border-teal-500/30' },
    'indigo': { accentLight: 'bg-indigo-500/20', accentText: 'text-indigo-400', accentBorder: 'border-indigo-500/30' },
    'rose': { accentLight: 'bg-rose-500/20', accentText: 'text-rose-400', accentBorder: 'border-rose-500/30' },
    'emerald': { accentLight: 'bg-emerald-500/20', accentText: 'text-emerald-400', accentBorder: 'border-emerald-500/30' },
    'violet': { accentLight: 'bg-violet-500/20', accentText: 'text-violet-400', accentBorder: 'border-violet-500/30' },
};

const splashColors = [
    'bg-indigo-500/10 border-indigo-500/30 text-indigo-200',
    'bg-rose-500/10 border-rose-500/30 text-rose-200',
    'bg-amber-500/10 border-amber-500/30 text-amber-200',
    'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
];

const ProjectDetail: React.FC<Props> = ({ project, onClose }) => {
    const colors = colorMap[project.themeColor || 'amber'];
    const statusLabels: Record<string, string> = { 'shipped': 'Shipped', 'in-progress': 'In Progress', 'archived': 'Archived', 'concept': 'Concept' };
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // 1. History Management for Browser Back Button
    React.useEffect(() => {
        // Push a new state when the modal opens
        window.history.pushState({ modal: 'project' }, '', window.location.href);

        const handlePopState = (event: PopStateEvent) => {
            // When user clicks back, close the modal
            onClose();
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
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
                    className="max-w-5xl mx-auto px-6 md:px-12 lg:px-16 lg:pl-24 pt-24 md:pt-32 pb-16"
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
                    </section>

                    {/* ===== STORY + BUILD SECTION ===== */}
                    <section className="mb-16">
                        <div className="grid md:grid-cols-2 gap-8 mb-10">
                            {/* Story */}
                            <div id="section-story">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-2 rounded-lg ${colors.accentLight}`}>
                                        <Lightbulb size={20} className={colors.accentText} />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">The Story</h2>
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
                                    <h2 className="text-xl font-bold text-white">What I Built</h2>
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
                                <h2 className="text-xl font-bold text-white">Key Decisions</h2>
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

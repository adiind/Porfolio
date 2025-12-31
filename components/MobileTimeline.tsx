import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimelineItem, CaseStudy } from '../types';
import { Briefcase, GraduationCap, Sparkles, ChevronRight, ChevronDown } from 'lucide-react';
import { formatDate } from '../utils';
import { TINKERVERSE_LOGO, SOCIAL_POSTS } from '../constants';

interface Props {
    items: TimelineItem[];
    onOpenCaseStudy: (study: CaseStudy) => void;
    onOpenProject: (project: TimelineItem) => void;
    onOpenTinkerVerse: () => void;
}

const MobileTimeline: React.FC<Props> = ({
    items,
    onOpenCaseStudy,
    onOpenProject,
    onOpenTinkerVerse
}) => {
    // Track expanded card and feature card
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [expandedFeatureId, setExpandedFeatureId] = useState<string | null>(null);

    // Separate items by type - exclude competitions and projects
    const tinkerverse = items.find(i => i.id === 'tinkerverse');
    const education = items.filter(i => i.type === 'education');
    const corporate = items.filter(i => i.type === 'corporate' || i.type === 'foundational');

    // Sort by date (newest first)
    const sortByDate = (a: TimelineItem, b: TimelineItem) => {
        return new Date(b.start).getTime() - new Date(a.start).getTime();
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'education': return <GraduationCap size={14} className="text-rose-400" />;
            case 'foundational': return <Sparkles size={14} className="text-emerald-400" />;
            default: return <Briefcase size={14} className="text-indigo-400" />;
        }
    };

    const getCardStyle = (type: string) => {
        switch (type) {
            case 'education':
                return 'bg-rose-500/20 border-rose-500/30';
            case 'foundational':
                return 'bg-emerald-500/20 border-emerald-500/30';
            default:
                return 'bg-indigo-500/20 border-indigo-500/30';
        }
    };

    const handleCardTap = (item: TimelineItem) => {
        // Toggle expansion
        if (expandedId === item.id) {
            setExpandedId(null);
        } else {
            setExpandedId(item.id);
        }
    };

    const renderCard = (item: TimelineItem) => {
        const isExpanded = expandedId === item.id;

        return (
            <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`w-full p-4 rounded-xl border ${getCardStyle(item.type)} shadow-[0_4px_16px_rgba(0,0,0,0.3)] cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden group`}
                onClick={() => handleCardTap(item)}
            >
                {/* Visual "Interactive" Highlight on Tap */}
                <div className="absolute inset-0 bg-white/5 opacity-0 active:opacity-100 transition-opacity pointer-events-none" />

                {/* Header with icon and type */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg bg-black/40 border border-white/10 ${isExpanded ? 'scale-110 text-white' : 'text-white/70'} transition-all`}>
                            {getIcon(item.type)}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-white/50">
                                {item.type}
                            </span>
                            <span className="text-[10px] text-white/80 font-mono">
                                {formatDate(item.start)} - {formatDate(item.end)}
                            </span>
                        </div>
                    </div>

                    {/* Explicit Chevron for Interactivity */}
                    <div className={`p-1 rounded-full bg-white/5 border border-white/5 text-white/50 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-white/10 text-white' : ''}`}>
                        <ChevronDown size={14} />
                    </div>
                </div>

                {/* Title and Company */}
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <h3 className="font-bold text-white text-base leading-tight">{item.title}</h3>
                        <p className="text-xs text-white/60 mt-0.5">{item.company}</p>
                    </div>
                    {/* Optional Logo */}
                    {item.logoUrl && (
                        <img
                            src={item.logoUrl}
                            alt="Logo"
                            className={`w-8 h-8 object-contain ${item.id === 'ms-edi' ? 'filter brightness-0 invert opacity-60' : 'opacity-80'}`}
                        />
                    )}
                </div>


                {/* Expanded Content */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-4 pt-3 border-t border-white/10">
                                {item.summary && (
                                    <p className="text-sm text-white/90 mb-4 leading-relaxed font-light">{item.summary}</p>
                                )}
                                {item.bullets && item.bullets.length > 0 && (
                                    <ul className="space-y-2.5 mb-4">
                                        {item.bullets.map((bullet, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-xs text-white/70 leading-relaxed">
                                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
                                                <span>{bullet}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {item.skills && item.skills.length > 0 && (
                                    <div className="mt-4 mb-2 flex flex-wrap gap-1.5">
                                        {item.skills.map((skill, idx) => (
                                            <span key={idx} className="px-2.5 py-1 text-[10px] bg-white/5 border border-white/5 rounded-md text-white/60">
                                                {skill.label}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Feature Cards / Projects */}
                                {item.featureCards && item.featureCards.length > 0 && (
                                    <div className="mt-5 pt-3 border-t border-white/10">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="h-px flex-1 bg-white/10"></div>
                                            <div className="text-[10px] uppercase tracking-widest font-bold text-white/40">Key Projects</div>
                                            <div className="h-px flex-1 bg-white/10"></div>
                                        </div>

                                        <div className="space-y-3">
                                            {item.featureCards.map((card, idx) => {
                                                const featureKey = `${item.id}-${idx}`;
                                                const isFeatureExpanded = expandedFeatureId === featureKey;
                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`p-3 rounded-lg border transition-all ${isFeatureExpanded ? 'bg-indigo-500/20 border-indigo-500/40 shadow-lg' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setExpandedFeatureId(isFeatureExpanded ? null : featureKey);
                                                        }}
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="flex-1">
                                                                <div className={`text-xs font-bold ${isFeatureExpanded ? 'text-indigo-200' : 'text-white/80'}`}>{card.title}</div>
                                                                {!isFeatureExpanded && <div className="text-[10px] text-white/50 mt-0.5">{card.subtitle}</div>}
                                                            </div>
                                                            <div className={`p-1 rounded-full ${isFeatureExpanded ? 'bg-indigo-500/20 text-indigo-300' : 'bg-transparent text-white/30'}`}>
                                                                {isFeatureExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                            </div>
                                                        </div>
                                                        <AnimatePresence>
                                                            {isFeatureExpanded && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: 'auto' }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="text-[11px] text-indigo-100/70 mt-2 mb-1">{card.subtitle}</div>
                                                                    <p className="text-[11px] text-white/80 mt-2 leading-relaxed border-t border-white/5 pt-2">{card.expandedSummary || card.summary}</p>
                                                                    {card.details && card.details.length > 0 && (
                                                                        <ul className="mt-2 space-y-1.5">
                                                                            {card.details.map((d, i) => (
                                                                                <li key={i} className="flex items-start gap-2 text-[10px] text-white/60">
                                                                                    <span className="mt-1 w-1 h-1 rounded-full bg-indigo-400/50 shrink-0" />
                                                                                    <span>{d}</span>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    )}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-center">
                                    <button
                                        className="text-[10px] uppercase tracking-wider text-white/30 flex items-center gap-1 px-3 py-1 rounded-full bg-white/5"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedId(null);
                                        }}
                                    >
                                        Collapse <ChevronDown size={10} className="rotate-180" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    };

    const renderSection = (title: string, sectionItems: TimelineItem[], colorClass: string) => (
        <div className="mb-8">
            <h2 className={`text-xs uppercase tracking-widest font-bold mb-4 ${colorClass}`}>
                {title}
            </h2>
            <div className="flex flex-col gap-3">
                {sectionItems.sort(sortByDate).map(renderCard)}
            </div>
        </div>
    );

    return (
        <div className="px-4 py-6 space-y-6">
            {/* TinkerVerse Box at Top */}
            {tinkerverse && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="w-full p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 cursor-pointer active:scale-[0.98] transition-transform"
                    onClick={onOpenTinkerVerse}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <img src={TINKERVERSE_LOGO} alt="TinkerVerse" className="w-8 h-8 rounded-md bg-white p-0.5 object-cover" />
                        <div className="flex-1">
                            <h3 className="font-bold text-amber-100 text-sm">TinkerVerse</h3>
                            <p className="text-[10px] text-amber-200/60">{SOCIAL_POSTS.length} projects documented</p>
                        </div>
                        <div className="text-amber-400 text-xs font-medium">View →</div>
                    </div>
                    <p className="text-[11px] text-amber-100/70 leading-relaxed">
                        A sandbox for physical computing and creative tech — from 3D printing to IoT prototypes, all documented on Instagram.
                    </p>
                </motion.div>
            )}

            {/* Education Section */}
            {education.length > 0 && renderSection('Education', education, 'text-rose-400')}

            {/* Corporate Section */}
            {corporate.length > 0 && renderSection('Experience', corporate, 'text-indigo-400')}
        </div>
    );
};

export default MobileTimeline;

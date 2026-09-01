import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TimelineItem, CaseStudy } from '../types';
import { Briefcase, GraduationCap, Sparkles, ChevronRight, ChevronDown } from 'lucide-react';
import { formatDate } from '../utils';
import { TINKERVERSE_JOURNAL, TINKERVERSE_LOGO } from '../constants';
import { trackEvent } from '../lib/analytics';
import { Project } from '../types/Project';
import { useProjects } from '../context/ProjectsContext';
import ProjectDetail from './ProjectDetail';
import { useContentEngagement } from '../hooks/useContentEngagement';

interface Props {
    items: TimelineItem[];
    onOpenCaseStudy: (study: CaseStudy) => void;
    onOpenProject: (project: TimelineItem) => void;
    onOpenTinkerVerse: () => void;
    analyticsActive?: boolean;
}


const MobileTimeline: React.FC<Props> = ({
    items,
    onOpenCaseStudy,
    onOpenProject,
    onOpenTinkerVerse,
    analyticsActive = true,
}) => {
    const { getProjectsByIds } = useProjects();
    // Track expanded card and feature card
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [expandedFeatureId, setExpandedFeatureId] = useState<string | null>(null);
    const [activeLinkedProject, setActiveLinkedProject] = useState<Project | null>(null);
    const expandedItem = items.find((item) => item.id === expandedId) ?? null;

    useContentEngagement({
        contentType: 'experience',
        contentId: expandedItem?.id ?? 'mobile-none',
        section: 'detail',
        active: analyticsActive && expandedItem !== null && activeLinkedProject === null,
    });

    useEffect(() => {
        if (!activeLinkedProject) return;
        window.dispatchEvent(new CustomEvent('projectDetailOpen'));
        return () => {
            window.dispatchEvent(new CustomEvent('projectDetailClose'));
        };
    }, [activeLinkedProject]);

    const openLinkedProject = (projectId: string): boolean => {
        const [project] = getProjectsByIds([projectId]);
        if (!project) return false;
        setActiveLinkedProject(project);
        return true;
    };

    // Separate items by type
    const tinkerverse = items.find(i => i.id === 'tinkerverse');

    // Ensure BITS (education) and MS EDI (education) are caught.
    // Also catch 'foundational' just in case.
    const education = items.filter(i => i.type === 'education' || i.type === 'foundational');

    // Corporate/Experience
    // Filter out duplicates if found in education (just in case)
    const corporate = items.filter(i =>
        (i.type === 'corporate' || i.type === 'role') &&
        !education.some(e => e.id === i.id)
    );

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
        // Added backdrop-blur for frosted glass effect
        const glassBase = "backdrop-blur-md bg-opacity-10";
        switch (type) {
            case 'education':
                return `${glassBase} bg-rose-900/40 border-rose-500/30 hover:border-rose-500/50`;
            case 'foundational':
                return `${glassBase} bg-emerald-900/40 border-emerald-500/30 hover:border-emerald-500/50`;
            default:
                return `${glassBase} bg-indigo-900/40 border-indigo-500/30 hover:border-indigo-500/50`;
        }
    };

    const handleCardTap = (item: TimelineItem) => {
        // Toggle expansion
        if (expandedId === item.id) {
            trackEvent('mobile_timeline_card_collapsed', {
                id: item.id,
                title: item.title,
                type: item.type,
            });
            setExpandedId(null);
        } else {
            trackEvent('mobile_timeline_card_expanded', {
                id: item.id,
                title: item.title,
                type: item.type,
            });
            trackEvent('experience_opened', {
                id: item.id,
                type: item.type,
                source: 'mobile_timeline',
                surface: 'inline',
            });
            setExpandedId(item.id);
        }
    };

    const renderCard = (item: TimelineItem) => {
        const isExpanded = expandedId === item.id;

        return (
            <motion.div
                key={item.id}
                data-mobile-experience-id={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`w-full rounded-2xl border ${getCardStyle(item.type)} shadow-lg cursor-pointer active:scale-[0.99] transition-all relative overflow-hidden group mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80`}
                onClick={() => handleCardTap(item)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardTap(item);
                    }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Open ${item.title}`}
            >
                {/* 1. Image Header (Always Visible if exists) */}
                {item.imageUrl && (
                    <div className="relative w-full aspect-video overflow-hidden">
                        <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    </div>
                )}

                {/* Content Container */}
                <div className="p-5 relative">

                    {/* Header with icon and type */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg bg-black/60 border border-white/10 ${isExpanded ? 'scale-110 text-white' : 'text-white/70'} transition-all`}>
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

                        {/* Chevron */}
                        <div className={`p-1 rounded-full bg-white/5 border border-white/5 text-white/50 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-white/10 text-white' : ''}`}>
                            <ChevronDown size={14} />
                        </div>
                    </div>

                    {/* Title and Company */}
                    <div className="mb-2">
                        <div className="flex items-start justify-between gap-2">
                            <h3 data-full-timeline-title className="font-bold text-white text-lg leading-tight">{item.title}</h3>
                            {/* Logo */}
                            {item.logoUrl && (
                                <div className={`shrink-0 flex items-center justify-center ${item.id === 'ms-edi' ? 'min-w-[56px] pl-2' : 'w-8 h-8 rounded bg-white/5 p-0.5'}`}>
                                    <img
                                        src={item.logoUrl}
                                        alt={`${item.company} logo`}
                                        className={item.id === 'ms-edi'
                                            ? 'h-5 w-auto max-w-[56px] object-contain opacity-90'
                                            : 'w-full h-full object-contain opacity-90'
                                        }
                                    />
                                </div>
                            )}
                        </div>

                        <p className="text-sm text-white/70 mt-1 font-medium">{item.company}</p>
                    </div>

                    {/* Summary (Always show brief) */}
                    {!isExpanded && item.headline && (
                        <p className="text-xs text-white/50 line-clamp-2 mt-2 leading-relaxed">
                            {item.headline}
                        </p>
                    )}

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
                                                <div className="text-[10px] uppercase tracking-widest font-bold text-white/55">Key Projects</div>
                                                <div className="h-px flex-1 bg-white/10"></div>
                                            </div>

                                            <div className="space-y-3">
                                                {item.featureCards.map((card, idx) => {
                                                    const featureKey = `${item.id}-${idx}`;
                                                    const isFeatureExpanded = expandedFeatureId === featureKey;
                                                    return (
                                                        <div
                                                            key={idx}
                                                            data-feature-card
                                                            data-linked-project-id={card.projectId}
                                                            className={`p-3 rounded-xl border transition-all ${isFeatureExpanded ? 'bg-indigo-500/20 border-indigo-500/40 shadow-lg' : 'bg-white/5 border-white/5 hover:bg-white/10'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (card.projectId && openLinkedProject(card.projectId)) return;
                                                                trackEvent(isFeatureExpanded ? 'mobile_feature_card_collapsed' : 'mobile_feature_card_expanded', {
                                                                    parent_id: item.id,
                                                                    title: card.title,
                                                                });
                                                                setExpandedFeatureId(isFeatureExpanded ? null : featureKey);
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    if (card.projectId && openLinkedProject(card.projectId)) return;
                                                                    trackEvent(isFeatureExpanded ? 'mobile_feature_card_collapsed' : 'mobile_feature_card_expanded', {
                                                                        parent_id: item.id,
                                                                        title: card.title,
                                                                    });
                                                                    setExpandedFeatureId(isFeatureExpanded ? null : featureKey);
                                                                }
                                                            }}
                                                            role="button"
                                                            tabIndex={0}
                                                            aria-expanded={card.projectId ? undefined : isFeatureExpanded}
                                                            aria-haspopup={card.projectId ? 'dialog' : undefined}
                                                            aria-label={card.projectId ? `Open project ${card.title}` : card.title}
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="flex-1">
                                                                    <div data-mobile-feature-title className={`text-xs font-bold leading-snug ${isFeatureExpanded ? 'text-indigo-200' : 'text-white/80'}`}>{card.title}</div>
                                                                    {!isFeatureExpanded && <div className="text-[10px] text-white/50 mt-0.5">{card.subtitle}</div>}
                                                                </div>
                                                                <div className={`p-1 rounded-full ${isFeatureExpanded ? 'bg-indigo-500/20 text-indigo-300' : 'bg-transparent text-white/55'}`}>
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
                                                                        {card.media && card.media.length > 0 && (
                                                                            <div data-feature-media className="mt-3 grid grid-cols-1 gap-3">
                                                                                {card.media.map((media) => (
                                                                                    <figure key={media.url} className="overflow-hidden rounded-lg border border-white/10 bg-black/20">
                                                                                        <img
                                                                                            src={media.url}
                                                                                            alt={media.alt}
                                                                                            loading="lazy"
                                                                                            decoding="async"
                                                                                            className="block h-auto max-h-[55vh] w-full object-contain"
                                                                                        />
                                                                                        <figcaption className="border-t border-white/10 px-2.5 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-white/60">
                                                                                            {media.label}
                                                                                        </figcaption>
                                                                                    </figure>
                                                                                ))}
                                                                            </div>
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
                                            className="text-[10px] uppercase tracking-wider text-white/55 flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
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
                </div>
            </motion.div>
        );
    };

    const renderSection = (title: string, sectionItems: TimelineItem[], colorClass: string) => (
        <div className="mb-10">
            <h2 className={`text-sm uppercase tracking-widest font-bold mb-6 pl-1 flex items-center gap-3 ${colorClass}`}>
                <span className="w-8 h-[1px] bg-current opacity-50"></span>
                {title}
            </h2>
            <div className="flex flex-col gap-5">
                {sectionItems.sort(sortByDate).map(renderCard)}
            </div>
        </div>
    );

    return (
        <>
        <div className="px-5 py-8 space-y-10 pb-32">
            {/* TinkerVerse is a primary timeline story, not a supporting footer module. */}
            {tinkerverse && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    data-tinkerverse-preview
                    className="group relative w-full min-h-[250px] overflow-hidden rounded-2xl border border-[#e5e55a]/20 bg-[#06231d] cursor-pointer active:scale-[0.98] transition-transform shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5e55a]"
                    onClick={onOpenTinkerVerse}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onOpenTinkerVerse();
                        }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label="Open TinkerVerse"
                >
                    {TINKERVERSE_JOURNAL[0] && (
                        <img
                            src={TINKERVERSE_JOURNAL[0].localMediaUrl}
                            alt={TINKERVERSE_JOURNAL[0].alt}
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 h-full w-full object-contain opacity-90 transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                    )}
                    <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#03110e] via-[#03110e]/55 to-black/15" />
                    <div className="relative z-10 flex min-h-[250px] flex-col p-4 text-left">
                        <div className="flex items-center gap-3">
                            <img src={TINKERVERSE_LOGO} alt="" className="h-9 w-9 rounded-lg border border-white/15 bg-black object-cover" />
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-white text-base">TinkerVerse</h3>
                                <p className="mt-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#f0f18a]">{tinkerverse.title}</p>
                            </div>
                            <div className="rounded-full border border-[#e5e55a]/30 bg-black/[0.45] px-3 py-1 text-[10px] font-bold tracking-wider text-[#f0f18a] backdrop-blur-sm">OPEN</div>
                        </div>
                        <div className="mt-auto">
                            <p className="text-lg font-bold leading-tight text-white">{tinkerverse.headline}</p>
                            <p className="mt-2 text-sm leading-relaxed text-white/[0.72]">
                                {tinkerverse.summary}
                            </p>
                            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.13em] text-white/60">
                                {TINKERVERSE_JOURNAL.length} posts
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Education Section */}
            {education.length > 0 && renderSection('Education', education, 'text-rose-400')}

            {/* Experience Section */}
            {corporate.length > 0 && renderSection('Experience', corporate, 'text-indigo-400')}
        </div>
        {activeLinkedProject && ReactDOM.createPortal(
            <ProjectDetail
                project={activeLinkedProject}
                analyticsSource="mobile_feature"
                onClose={() => setActiveLinkedProject(null)}
            />,
            document.body
        )}
        </>
    );
};

export default MobileTimeline;

import React, { useRef, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, ScrollText, ChevronLeft, ChevronRight } from 'lucide-react';
import { TimelineItem, CaseStudy, FeatureCard } from '../types';
import { formatDate } from '../utils';

interface Props {
    item: TimelineItem;
    onClose: () => void;
    onOpenCaseStudy: (study: CaseStudy) => void;
}

const ExperienceDetail: React.FC<Props> = ({ item, onClose, onOpenCaseStudy }) => {
    const carouselRef = useRef<HTMLDivElement>(null);

    const scrollCarousel = (direction: 'left' | 'right') => {
        if (carouselRef.current) {
            const scrollAmount = carouselRef.current.offsetWidth / 2;
            carouselRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Carousel manual scroll (for navigation buttons)
    // Infinite scroll is handled by CSS animation with hover-to-pause
    const [isMarqueePaused, setIsMarqueePaused] = useState(false);

    // State for Feature Card Modal
    const [selectedFeatureCard, setSelectedFeatureCard] = useState<FeatureCard | null>(null);

    const handleCaseStudyClick = () => {
        if (item.caseStudy) {
            onOpenCaseStudy(item.caseStudy);
        }
    };

    // Theme colors based on item type
    const getAccentColor = () => {
        if (item.themeColor === 'red') return 'rose';
        if (item.type === 'education') return 'rose';
        if (item.type === 'foundational') return 'emerald';
        return 'indigo';
    };
    const accent = getAccentColor();

    // 1. History Management for Browser Back Button
    useEffect(() => {
        // Push a new state when the modal opens
        window.history.pushState({ modal: 'experience' }, '', window.location.href);

        const handlePopState = (event: PopStateEvent) => {
            // When user clicks back, close the modal
            onClose();
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            // We rely on the user's action to pop the state (by clicking back)
            // Or if we close manually, we pop it ourselves in handleManualClose
        };
    }, [onClose]);

    // 2. Manual Close Handler (Close Button or Backdrop)
    const handleManualClose = () => {
        window.history.back();
        // The popstate listener will trigger onClose
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[45] bg-black/95 backdrop-blur-xl overflow-hidden"
            onClick={handleManualClose} // Backdrop click closes
        >
            {/* Background Ambience */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-${accent}-600/20 blur-[150px] rounded-full`} />
                <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/15 blur-[120px] rounded-full" />
            </div>

            {/* Close Button */}
            {ReactDOM.createPortal(
                <motion.button
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={(e) => { e.stopPropagation(); handleManualClose(); }}
                    className="fixed top-4 right-4 md:top-6 md:right-6 z-[9999] flex items-center gap-2 px-5 py-3 rounded-full bg-white text-black font-semibold transition-all hover:bg-gray-100 shadow-2xl"
                >
                    <X size={20} strokeWidth={2.5} />
                    <span className="text-sm">Close</span>
                </motion.button>,
                document.body
            )}

            {/* Main Content */}
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 30, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative z-10 h-full overflow-y-auto custom-scrollbar"
            // No onClick listener here that stops propagation generically
            // We want creating a specific container for the content that stops propagation
            >
                <div
                    className="max-w-6xl mx-auto px-6 md:px-12 py-12 md:py-16"
                    onClick={(e) => e.stopPropagation()} // Stop clicks on content from closing modal
                >

                    {/* Hero Section: Compact Layout with Image on Right */}
                    <div className="relative mb-8 -mx-6 md:-mx-12 px-6 md:px-12 rounded-t-3xl overflow-hidden">
                        {/* Image positioned top-right with fade to left & bottom */}
                        {item.imageUrl && (
                            <div className="absolute top-0 right-0 w-[60%] h-full overflow-hidden rounded-tr-3xl">
                                <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover object-center"
                                />
                                {/* Fade to left */}
                                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
                                {/* Fade to bottom */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                                {/* Top fade for blending */}
                                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
                            </div>
                        )}

                        {/* Content - Two Column Layout */}
                        <div className="relative z-10 py-8 md:py-12">
                            <div className="flex flex-col lg:flex-row lg:gap-8 lg:items-start">
                                {/* Left Column: Title & Meta */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="flex-1 min-w-0"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        {item.logoUrl && (
                                            <img
                                                src={item.logoUrl}
                                                alt={item.company}
                                                className={`w-8 h-8 object-contain ${item.id === 'ms-edi' ? 'invert' : ''}`}
                                            />
                                        )}
                                        <div className="flex items-center gap-2 text-white/60 text-sm">
                                            <span className="font-medium">{item.company}</span>
                                            <span className="text-white/30">•</span>
                                            <span className="font-mono text-xs">
                                                {formatDate(item.start)} — {formatDate(item.end)}
                                            </span>
                                        </div>
                                    </div>
                                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 tracking-tight">
                                        {item.title}
                                    </h1>
                                    {item.headline && (
                                        <p className="text-base md:text-lg text-white/60 leading-relaxed max-w-2xl mb-4">
                                            {item.headline}
                                        </p>
                                    )}

                                    {/* Skills Pills with Tooltips */}
                                    {item.skills && item.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {item.skills.map((skill, i) => (
                                                <SkillPill key={i} label={skill.label} description={skill.description} />
                                            ))}
                                        </div>
                                    )}
                                </motion.div>


                            </div>
                        </div>
                    </div>

                    {/* Projects + Case Study - Horizontal Layout */}
                    {(item.featureCards?.length || item.caseStudy) && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="mb-12 flex flex-col lg:flex-row gap-6"
                        >
                            {/* Projects Carousel - Left Side */}
                            {item.featureCards && item.featureCards.length > 0 && (
                                <div className={`${item.caseStudy ? 'lg:flex-1' : 'w-full'} min-w-0 overflow-hidden`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full bg-${accent}-500`} />
                                            Projects
                                        </h2>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => scrollCarousel('left')}
                                                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                                            >
                                                <ChevronLeft size={16} className="text-white/70" />
                                            </button>
                                            <button
                                                onClick={() => scrollCarousel('right')}
                                                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                                            >
                                                <ChevronRight size={16} className="text-white/70" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Infinite Scroll Marquee - Pauses on hover */}
                                    <div
                                        className="overflow-hidden"
                                        onMouseEnter={() => setIsMarqueePaused(true)}
                                        onMouseLeave={() => setIsMarqueePaused(false)}
                                    >
                                        <div
                                            ref={carouselRef}
                                            className="flex gap-3"
                                            style={{
                                                animation: `marquee ${item.featureCards.length * 5}s linear infinite`,
                                                animationPlayState: isMarqueePaused ? 'paused' : 'running',
                                            }}
                                        >
                                            {/* Duplicate cards for seamless loop */}
                                            {[...item.featureCards, ...item.featureCards].map((card, i) => (
                                                <FeatureCardItem
                                                    key={i}
                                                    card={card}
                                                    index={i % item.featureCards.length}
                                                    accent={accent}
                                                    onClick={() => {
                                                        setSelectedFeatureCard(card);
                                                        setIsMarqueePaused(true); // Pause when clicking
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <style>{`
                                        @keyframes marquee {
                                            0% { transform: translateX(0); }
                                            100% { transform: translateX(-50%); }
                                        }
                                    `}</style>
                                </div>
                            )}

                            {/* Case Study - Right Side */}
                            {item.caseStudy && (
                                <div className="lg:w-80 shrink-0">
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                                        <div className={`w-1.5 h-1.5 rounded-full bg-${accent}-500`} />
                                        Case Study
                                    </h2>

                                    <div
                                        onClick={handleCaseStudyClick}
                                        className="group cursor-pointer p-5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all hover:bg-white/[0.08] h-[calc(100%-2rem)]"
                                    >
                                        <div className="flex flex-col h-full">
                                            {item.caseStudy.thumbnailUrl && (
                                                <img
                                                    src={item.caseStudy.thumbnailUrl}
                                                    alt={item.caseStudy.title}
                                                    className="w-12 h-12 object-contain mb-3"
                                                />
                                            )}
                                            <h3 className="text-base font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                                                {item.caseStudy.title}
                                            </h3>
                                            <p className="text-xs text-white/60 line-clamp-3 flex-1">
                                                {item.caseStudy.summary}
                                            </p>
                                            <div className="flex items-center gap-2 mt-4 text-indigo-400 text-sm font-medium group-hover:text-indigo-300 transition-colors">
                                                <ScrollText size={14} />
                                                View Case Study
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Bullets / Key Highlights */}
                    {item.bullets && item.bullets.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="mb-16"
                        >
                            <h2 className="text-xl font-bold text-white flex items-center gap-3 mb-6">
                                <div className={`w-2 h-2 rounded-full bg-${accent}-500`} />
                                Key Highlights
                            </h2>
                            <ul className="space-y-3">
                                {item.bullets.map((bullet, i) => (
                                    <li key={i} className="flex items-start gap-4 text-white/70">
                                        <div className={`w-1.5 h-1.5 rounded-full bg-${accent}-500/60 mt-2 shrink-0`} />
                                        <span className="leading-relaxed">{bullet}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}

                    {/* Differentiator Quote */}
                    {item.differentiator && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 }}
                            className="pt-8 border-t border-white/10"
                        >
                            <blockquote className="text-lg text-white/50 italic leading-relaxed pl-6 border-l-4 border-white/20">
                                "{item.differentiator}"
                            </blockquote>
                        </motion.div>
                    )}

                    {/* Bottom Spacer */}
                    <div className="h-20" />
                </div>
            </motion.div>

            {/* Feature Card Modal */}
            <AnimatePresence>
                {selectedFeatureCard && (
                    <FeatureCardModal
                        card={selectedFeatureCard}
                        onClose={() => setSelectedFeatureCard(null)}
                        accent={accent}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Sub-component for Skill Pills with Tooltip
const SkillPill: React.FC<{ label: string; description?: string }> = ({ label, description }) => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <div className="relative inline-block">
            <span
                className="px-3 py-1.5 text-sm font-medium rounded-full bg-white/10 border border-white/20 text-white/90 backdrop-blur-sm cursor-pointer transition-all duration-200 hover:bg-white/20 hover:border-white/40 hover:scale-105 hover:shadow-lg inline-block"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {label}
            </span>
            {/* Tooltip popover */}
            {isHovered && description && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 backdrop-blur-md border border-white/20 rounded-lg text-xs text-white/80 whitespace-nowrap z-50 shadow-xl animate-fade-in">
                    {description}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-black/90 border-r border-b border-white/20 rotate-45" />
                </div>
            )}
        </div>
    );
};

// Sub-component for Feature Cards (Compact in Marquee)
const FeatureCardItem: React.FC<{ card: FeatureCard; index: number; accent: string; onClick: () => void }> = ({ card, index, accent, onClick }) => {
    return (
        <div
            className="group w-[300px] flex-shrink-0 snap-start rounded-xl overflow-hidden bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer hover:bg-white/[0.08] hover:scale-[1.02]"
            onClick={onClick}
        >
            {/* Card Header with gradient or image */}
            <div className={`relative h-32 p-4 flex flex-col justify-end overflow-hidden`}>
                {card.imageUrl ? (
                    <>
                        <img
                            src={card.imageUrl}
                            alt={card.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                    </>
                ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br from-${accent}-600/30 to-indigo-600/20`} />
                )}

                <div className="relative z-10">
                    <h3 className="text-base font-bold text-white leading-tight line-clamp-1 drop-shadow-md">
                        {card.title}
                    </h3>
                    <span className="text-[10px] text-white/70 font-medium mt-0.5 drop-shadow-md">{card.subtitle}</span>
                </div>
            </div>

            {/* Card Body */}
            <div className="p-3">
                <p className="text-xs text-white/70 line-clamp-2 mb-3">
                    {card.summary}
                </p>

                {/* Pills Preview */}
                {card.pills && card.pills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {card.pills.slice(0, 2).map((pill, i) => (
                            <span
                                key={i}
                                className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-white/5 text-white/60"
                            >
                                {pill.label}
                            </span>
                        ))}
                        {card.pills.length > 2 && (
                            <span className="px-1.5 py-0.5 text-[9px] text-white/30">
                                +{card.pills.length - 2}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Feature Card Modal (Detailed View)
const FeatureCardModal: React.FC<{ card: FeatureCard; onClose: () => void; accent: string }> = ({ card, onClose, accent }) => {
    return (
        <div
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={(e) => {
                e.stopPropagation();
                onClose();
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/70 hover:text-white transition-colors backdrop-blur-sm z-50"
                >
                    <X size={20} />
                </button>

                <div className="overflow-y-auto custom-scrollbar flex-1">
                    {/* Header with visual flare or Image */}
                    <div className="relative h-[450px] flex items-end px-6 pt-6 pb-2 md:px-8 md:pt-8 md:pb-2 overflow-hidden">
                        {card.imageUrl ? (
                            <>
                                <img
                                    src={card.imageUrl}
                                    alt={card.title}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
                            </>
                        ) : (
                            <div className={`absolute inset-0 bg-gradient-to-r from-${accent}-900/50 to-indigo-900/50`}>
                                <div className="absolute inset-0 bg-grid-white/[0.05]" />
                            </div>
                        )}

                        <div className="relative z-10 w-full">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-1 drop-shadow-lg">{card.title}</h2>
                                    <p className={`text-${accent}-300 font-medium text-sm md:text-base drop-shadow-md`}>{card.subtitle}</p>
                                </div>
                                {!card.imageUrl && (
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${accent}-500 to-indigo-500 opacity-20 hidden md:block`} />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 md:p-8">
                        {/* Summary */}
                        <div className="mb-8">
                            <p className="text-lg text-white/80 leading-relaxed font-light">
                                {card.expandedSummary || card.summary}
                            </p>
                        </div>

                        {/* Pills */}
                        {card.pills && card.pills.length > 0 && (
                            <div className="mb-8">
                                <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Technologies & Skills</h4>
                                <div className="flex flex-wrap gap-2">
                                    {card.pills.map((pill, i) => (
                                        <SkillPill key={i} label={pill.label} description={pill.description} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Key Details / Bullets */}
                        {card.details && card.details.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Key Responsibilities & Impact</h4>
                                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                                    {card.details.map((detail, i) => (
                                        <div key={i} className="p-4 border-b border-white/5 last:border-0 flex items-start gap-3 hover:bg-white/[0.02] transition-colors">
                                            <div className={`w-1.5 h-1.5 rounded-full bg-${accent}-500 mt-2 shrink-0`} />
                                            <p className="text-sm text-white/70 leading-relaxed">{detail}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Project Links */}
                        {card.projectLinks && card.projectLinks.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-white/10">
                                <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Project Links</h4>
                                <div className="flex flex-col gap-3">
                                    {card.projectLinks.map((link, i) => (
                                        <a
                                            key={i}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-${accent}-500/50 hover:bg-white/[0.08] transition-all group/link`}
                                        >
                                            <span className="text-sm font-medium text-white/80 group-hover/link:text-white transition-colors">
                                                {link.label}
                                            </span>
                                            <ExternalLink size={16} className={`text-white/40 group-hover/link:text-${accent}-400 transition-colors`} />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div >
        </div >
    );
};

export default ExperienceDetail;

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Lightbulb, Wrench, Scale,
    Check, Trophy, Quote
} from 'lucide-react';

interface Section {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

interface ScrollTrackerProps {
    sections: Section[];
    containerRef: React.RefObject<HTMLElement>;
    accentColor?: 'amber' | 'teal' | 'indigo' | 'rose' | 'emerald' | 'violet';
}

const colorClasses = {
    amber: {
        active: 'bg-amber-400',
        activeShadow: 'shadow-[0_0_20px_rgba(251,191,35,0.6)]',
        past: 'bg-amber-400/70',
        line: 'bg-gradient-to-b from-amber-400 via-amber-500/60 to-amber-600/20',
        lineGlow: 'bg-amber-400/30',
        text: 'text-amber-400',
        textMuted: 'text-amber-400/80',
        border: 'border-amber-400/40',
    },
    teal: {
        active: 'bg-teal-400',
        activeShadow: 'shadow-[0_0_20px_rgba(45,212,191,0.6)]',
        past: 'bg-teal-400/70',
        line: 'bg-gradient-to-b from-teal-400 via-teal-500/60 to-teal-600/20',
        lineGlow: 'bg-teal-400/30',
        text: 'text-teal-400',
        textMuted: 'text-teal-400/80',
        border: 'border-teal-400/40',
    },
    indigo: {
        active: 'bg-indigo-400',
        activeShadow: 'shadow-[0_0_20px_rgba(129,140,248,0.6)]',
        past: 'bg-indigo-400/70',
        line: 'bg-gradient-to-b from-indigo-400 via-indigo-500/60 to-indigo-600/20',
        lineGlow: 'bg-indigo-400/30',
        text: 'text-indigo-400',
        textMuted: 'text-indigo-400/80',
        border: 'border-indigo-400/40',
    },
    rose: {
        active: 'bg-rose-400',
        activeShadow: 'shadow-[0_0_20px_rgba(251,113,133,0.6)]',
        past: 'bg-rose-400/70',
        line: 'bg-gradient-to-b from-rose-400 via-rose-500/60 to-rose-600/20',
        lineGlow: 'bg-rose-400/30',
        text: 'text-rose-400',
        textMuted: 'text-rose-400/80',
        border: 'border-rose-400/40',
    },
    emerald: {
        active: 'bg-emerald-400',
        activeShadow: 'shadow-[0_0_20px_rgba(52,211,153,0.6)]',
        past: 'bg-emerald-400/70',
        line: 'bg-gradient-to-b from-emerald-400 via-emerald-500/60 to-emerald-600/20',
        lineGlow: 'bg-emerald-400/30',
        text: 'text-emerald-400',
        textMuted: 'text-emerald-400/80',
        border: 'border-emerald-400/40',
    },
    violet: {
        active: 'bg-violet-400',
        activeShadow: 'shadow-[0_0_20px_rgba(167,139,250,0.6)]',
        past: 'bg-violet-400/70',
        line: 'bg-gradient-to-b from-violet-400 via-violet-500/60 to-violet-600/20',
        lineGlow: 'bg-violet-400/30',
        text: 'text-violet-400',
        textMuted: 'text-violet-400/80',
        border: 'border-violet-400/40',
    },
};

const ScrollTracker: React.FC<ScrollTrackerProps> = ({
    sections,
    containerRef,
    accentColor = 'amber'
}) => {
    const [activeSection, setActiveSection] = useState(0);
    const [scrollProgress, setScrollProgress] = useState(0);
    const trackerRef = useRef<HTMLDivElement>(null);

    // Cache for element references - avoids querySelector on every scroll
    const elementsRef = useRef<(HTMLElement | null)[]>([]);
    const rafRef = useRef<number | null>(null);
    const lastValuesRef = useRef({ progress: 0, section: 0 });

    const colors = colorClasses[accentColor];

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Cache element references once
        const cacheElements = () => {
            elementsRef.current = sections.map(
                section => container.querySelector(`#${section.id}`) as HTMLElement | null
            );
        };

        const handleScroll = () => {
            // Cancel any pending frame to avoid stacking
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }

            // Use requestAnimationFrame for smooth, batched updates
            rafRef.current = requestAnimationFrame(() => {
                const scrollTop = container.scrollTop;
                const scrollHeight = container.scrollHeight - container.clientHeight;
                const progress = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;
                const clampedProgress = Math.min(100, Math.max(0, progress));

                const containerRect = container.getBoundingClientRect();
                const viewportTop = containerRect.top;
                const viewportBottom = containerRect.bottom;
                // Trigger at 40% from top - closer to natural reading position
                const triggerY = viewportTop + containerRect.height * 0.4;

                let lastPassedIndex = 0;
                let lastVisibleIndex = 0;

                // Use cached elements - no DOM queries during scroll
                const elements = elementsRef.current;
                for (let i = 0; i < elements.length; i++) {
                    const el = elements[i];
                    if (!el) continue;

                    const rect = el.getBoundingClientRect();

                    if (rect.top <= triggerY) {
                        lastPassedIndex = i;
                    }

                    if (rect.top < viewportBottom && rect.bottom > viewportTop) {
                        lastVisibleIndex = i;
                    }
                }

                const newSection = clampedProgress >= 95 ? lastVisibleIndex : lastPassedIndex;

                // Only update state if values actually changed
                if (clampedProgress !== lastValuesRef.current.progress) {
                    lastValuesRef.current.progress = clampedProgress;
                    setScrollProgress(clampedProgress);
                }
                if (newSection !== lastValuesRef.current.section) {
                    lastValuesRef.current.section = newSection;
                    setActiveSection(newSection);
                }
            });
        };

        // Initial cache and run
        cacheElements();
        handleScroll();

        // Re-cache after images load (they can change layout)
        const timer = setTimeout(() => {
            cacheElements();
            handleScroll();
        }, 100);

        container.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            container.removeEventListener('scroll', handleScroll);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            clearTimeout(timer);
        };
    }, [containerRef, sections]);

    const scrollToSection = (sectionId: string) => {
        const container = containerRef.current;
        if (!container) return;

        const element = container.querySelector(`#${sectionId}`) as HTMLElement;
        if (element) {
            const containerRect = container.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            const offset = elementRect.top - containerRect.top + container.scrollTop - 80;

            container.scrollTo({
                top: offset,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div
            ref={trackerRef}
            className="fixed left-8 top-1/2 -translate-y-1/2 z-[101] hidden lg:block"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Container with glass effect */}
            <div className="relative px-4 py-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10">
                {/* Ambient glow behind */}
                <div className={`absolute inset-0 -z-10 blur-2xl opacity-30 rounded-2xl ${colors.lineGlow}`} />

                {/* Progress track */}
                <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-white/10 rounded-full" />

                {/* Progress fill - animated line */}
                <motion.div
                    className={`absolute left-4 top-6 w-0.5 ${colors.line} rounded-full origin-top`}
                    animate={{ height: `${scrollProgress * 0.88}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />

                {/* Section nodes */}
                <div className="relative flex flex-col gap-6 ml-4">
                    {sections.map((section, index) => {
                        const isActive = activeSection === index;
                        const isPast = index < activeSection;

                        return (
                            <motion.div
                                key={section.id}
                                className="flex items-center gap-3 cursor-pointer group"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    scrollToSection(section.id);
                                }}
                                whileHover={{ x: 2 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            >
                                {/* Node */}
                                <motion.div
                                    className={`relative flex items-center justify-center rounded-full transition-all duration-300
                                        ${isActive
                                            ? `w-4 h-4 ${colors.active} ${colors.activeShadow}`
                                            : isPast
                                                ? `w-3 h-3 ${colors.past}`
                                                : 'w-2.5 h-2.5 bg-white/25 group-hover:bg-white/40'
                                        }
                                    `}
                                >
                                    {/* Pulsing ring for active */}
                                    <AnimatePresence>
                                        {isActive && (
                                            <motion.span
                                                className={`absolute inset-0 rounded-full ${colors.active}`}
                                                initial={{ scale: 1, opacity: 0.6 }}
                                                animate={{
                                                    scale: [1, 1.8, 1],
                                                    opacity: [0.6, 0, 0.6]
                                                }}
                                                transition={{
                                                    duration: 1.5,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                            />
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                {/* Label - always visible */}
                                <div className="flex items-center gap-2">
                                    {section.icon && (
                                        <span className={`transition-colors duration-200
                                            ${isActive ? colors.text : isPast ? colors.textMuted : 'text-white/40 group-hover:text-white/60'}`}
                                        >
                                            {section.icon}
                                        </span>
                                    )}
                                    <span className={`text-sm font-medium transition-all duration-200
                                        ${isActive
                                            ? `${colors.text}`
                                            : isPast
                                                ? 'text-white/60'
                                                : 'text-white/35 group-hover:text-white/55'
                                        }`}
                                    >
                                        {section.label}
                                    </span>
                                </div>

                                {/* Active indicator line */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeIndicator"
                                        className={`absolute -left-1 w-1 h-6 ${colors.active} rounded-full`}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Progress percentage at bottom */}
                <motion.div
                    className={`mt-5 ml-4 text-xs font-mono ${colors.textMuted} tabular-nums`}
                    animate={{ opacity: 1 }}
                >
                    {Math.round(scrollProgress)}% read
                </motion.div>
            </div>
        </div>
    );
};

// Default sections for Project Detail
export const projectDetailSections: Section[] = [
    { id: 'section-hero', label: 'Overview', icon: <Sparkles size={14} /> },
    { id: 'section-story', label: 'The Story', icon: <Lightbulb size={14} /> },
    { id: 'section-build', label: 'What I Built', icon: <Wrench size={14} /> },
    { id: 'section-decisions', label: 'Key Decisions', icon: <Scale size={14} /> },
    { id: 'section-learnings', label: 'Learnings', icon: <Check size={14} /> },
    { id: 'section-outcome', label: 'Outcome', icon: <Trophy size={14} /> },
    { id: 'section-reflection', label: 'Reflection', icon: <Quote size={14} /> },
];

export default ScrollTracker;

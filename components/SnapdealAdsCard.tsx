import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { FeatureCard } from '../types';

interface Props {
    data: FeatureCard;
    isExpanded: boolean;
    onToggle: () => void;
}

const SnapdealAdsCard: React.FC<Props> = ({ data, isExpanded, onToggle }) => {
    const [hoveredPill, setHoveredPill] = useState<string | null>(null);
    const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

    return (
        <motion.div
            layout
            onClick={(e) => {
                e.stopPropagation(); // Prevent parent click handlers
                onToggle();
            }}
            className={`
        mt-4 relative rounded-xl overflow-hidden cursor-pointer group
        border border-yellow-500/30
        bg-gradient-to-br from-[#0c0c0c] to-[#121212]
        shadow-[0_0_15px_rgba(234,179,8,0.1)]
        hover:shadow-[0_0_30px_rgba(234,179,8,0.2)]
        hover:border-yellow-500/60
        transition-all duration-500
      `}
        >
            {/* Background ambient glow */}
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(234,179,8,0.05)_0%,transparent_50%)] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Shimmer Effect Overlay (on hover) */}
            <div className="absolute inset-0 z-0 overflow-hidden rounded-xl pointer-events-none">
                <div className="w-[200%] h-full absolute top-0 left-[-100%] bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            </div>

            <div className="relative z-10 p-5">
                {/* Header: Subtitle & Title */}
                <div className="mb-3">
                    <div className="flex justify-between items-start">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-yellow-500/10 text-yellow-500 mb-2 border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                            {data.subtitle}
                        </span>
                        <span className={`text-[10px] uppercase font-bold tracking-widest text-gray-500 transition-opacity ${isExpanded ? 'opacity-0' : 'opacity-100'}`}>
                            Click to Expand
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-yellow-100 transition-colors flex items-center gap-2">
                        {data.title}
                        <ArrowRight size={18} className={`text-yellow-500 transition-transform duration-500 ${isExpanded ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                    </h3>
                </div>

                {/* Content Switch */}
                <AnimatePresence mode="wait">
                    {!isExpanded ? (
                        <motion.div
                            key="collapsed"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <p className="text-xs text-gray-400 leading-relaxed mb-4">
                                {data.summary}
                            </p>

                            {/* Interactive Pills (also in collapsed state) */}
                            <div className="flex flex-wrap items-center gap-2">
                                {data.pills.map((pill, i) => (
                                    <div
                                        key={i}
                                        className="relative"
                                        onMouseEnter={(e) => {
                                            e.stopPropagation();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setTooltipPos({
                                                top: rect.top + window.scrollY,
                                                left: rect.left + rect.width / 2 + window.scrollX
                                            });
                                            setHoveredPill(pill.label);
                                        }}
                                        onMouseLeave={(e) => {
                                            e.stopPropagation();
                                            setHoveredPill(null);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <span className={`
                                            cursor-help px-3 py-1 rounded-full border text-[10px] uppercase tracking-wide font-medium transition-all duration-300
                                            ${hoveredPill === pill.label
                                                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                                                : 'border-white/10 bg-white/5 text-gray-300 hover:border-yellow-500/30 hover:text-yellow-200'
                                            }
                                        `}>
                                            {pill.label}
                                        </span>
                                    </div>
                                ))}
                                <span className="ml-auto flex items-center gap-1 text-[10px] text-yellow-500 uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 duration-300">
                                    Deep Dive <ArrowRight size={12} />
                                </span>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="expanded"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            {/* Expanded Summary */}
                            <p className="text-sm text-gray-200 leading-relaxed mb-6 font-medium border-l-2 border-yellow-500 pl-3 shadow-[inset_10px_0_20px_-10px_rgba(234,179,8,0.1)] py-1">
                                {data.expandedSummary}
                            </p>

                            {/* Detail Bullets */}
                            <ul className="space-y-3 mb-6">
                                {data.details.map((point, i) => (
                                    <motion.li
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 + 0.2 }}
                                        className="flex items-start gap-3 text-xs text-gray-300/80"
                                    >
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0 shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
                                        {point}
                                    </motion.li>
                                ))}
                            </ul>

                            {/* Interactive Pills */}
                            <div className="border-t border-white/10 pt-4 relative">
                                <div className="flex flex-wrap gap-3">
                                    {data.pills.map((pill, i) => (
                                        <div
                                            key={i}
                                            className="relative group/pill"
                                            onMouseEnter={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setTooltipPos({
                                                    top: rect.top + window.scrollY,
                                                    left: rect.left + rect.width / 2 + window.scrollX
                                                });
                                                setHoveredPill(pill.label);
                                            }}
                                            onMouseLeave={() => setHoveredPill(null)}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <span className={`
                          cursor-help px-4 py-1.5 rounded-full text-[10px] uppercase font-bold border transition-all duration-300
                          ${hoveredPill === pill.label
                                                    ? 'bg-yellow-500 text-black border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]'
                                                    : 'bg-black border-yellow-500/30 text-yellow-500 hover:border-yellow-500 hover:bg-yellow-500/10'
                                                }
                      `}>
                                                {pill.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Skills Section - Visually Distinct with Hover Effects */}
                            {data.skills && data.skills.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="mt-5 pt-4 border-t border-white/5"
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-400/80">Skills Applied</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {data.skills.map((skill, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.35 + i * 0.05 }}
                                                onMouseEnter={(e) => {
                                                    e.stopPropagation();
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setTooltipPos({
                                                        top: rect.top + window.scrollY,
                                                        left: rect.left + rect.width / 2 + window.scrollX
                                                    });
                                                    setHoveredSkill(skill.label);
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.stopPropagation();
                                                    setHoveredSkill(null);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                whileHover={{
                                                    scale: 1.05,
                                                    boxShadow: '0 0 15px rgba(16,185,129,0.4)',
                                                    backgroundColor: 'rgba(16,185,129,0.2)'
                                                }}
                                                className={`px-3 py-1 rounded-md text-[10px] font-medium border shadow-[0_0_8px_rgba(16,185,129,0.1)] cursor-help transition-colors duration-200 ${hoveredSkill === skill.label
                                                    ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400/50'
                                                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:text-emerald-100 hover:border-emerald-400/40'
                                                    }`}
                                            >
                                                {skill.label}
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Global Portal for Pill Tooltip */}
                {hoveredPill && (
                    <Portal
                        pill={data.pills.find((p) => p.label === hoveredPill)!}
                        position={tooltipPos}
                    />
                )}

                {/* Global Portal for Skill Tooltip */}
                {hoveredSkill && data.skills && (
                    <SkillPortal
                        skill={data.skills.find((s) => s.label === hoveredSkill)!}
                        position={tooltipPos}
                    />
                )}
            </div>
        </motion.div>
    );
};

const Portal: React.FC<{ pill: { label: string; description: string }; position: { top: number; left: number } }> = ({ pill, position }) => {
    return ReactDOM.createPortal(
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
                position: 'absolute',
                top: position.top - 15, // Gap
                left: position.left,
                zIndex: 99999, // Ensure it's on top of everything
                transform: 'translate(-50%, -100%)' // Center horizontally, place above
            }}
            className="w-56 p-4 rounded-xl bg-[#0a0a0a] border border-yellow-500/40 shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden pointer-events-none"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-600 to-yellow-300" />
            <div className="text-[9px] uppercase text-yellow-500 font-bold mb-1.5 tracking-wider flex items-center gap-2">
                {pill.label} meaning
            </div>
            <div className="text-xs text-gray-200 leading-snug font-medium">
                {pill.description}
            </div>
            {/* Arrow */}
            <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0a0a0a] border-r border-b border-yellow-500/40 rotate-45" />
        </motion.div>,
        document.body
    );
};

const SkillPortal: React.FC<{ skill: { label: string; description: string }; position: { top: number; left: number } }> = ({ skill, position }) => {
    return ReactDOM.createPortal(
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
                position: 'absolute',
                top: position.top - 15,
                left: position.left,
                zIndex: 99999,
                transform: 'translate(-50%, -100%)'
            }}
            className="w-56 p-4 rounded-xl bg-[#0a0a0a] border border-emerald-500/40 shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden pointer-events-none"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-emerald-300" />
            <div className="text-[9px] uppercase text-emerald-400 font-bold mb-1.5 tracking-wider flex items-center gap-2">
                {skill.label}
            </div>
            <div className="text-xs text-gray-200 leading-snug font-medium">
                {skill.description}
            </div>
            {/* Arrow */}
            <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0a0a0a] border-r border-b border-emerald-500/40 rotate-45" />
        </motion.div>,
        document.body
    );
};

export default SnapdealAdsCard;

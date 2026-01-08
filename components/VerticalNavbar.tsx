import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Briefcase, Grid } from 'lucide-react';

interface VerticalNavbarProps {
    activeSection: 'profile' | 'experiences' | 'projects';
    onNavigate: (section: 'profile' | 'experiences' | 'projects') => void;
}

const navItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'experiences', label: 'Experiences', icon: Briefcase },
    { id: 'projects', label: 'Projects', icon: Grid },
] as const;

const VerticalNavbar: React.FC<VerticalNavbarProps> = ({ activeSection, onNavigate }) => {
    const [hoveredTab, setHoveredTab] = useState<string | null>(null);

    const handleNavClick = (id: 'profile' | 'experiences' | 'projects') => {
        // Prevent redundant updates if already active (optional, but good for perf)
        // if (activeSection === id) return;
        onNavigate(id);
    };

    return (
        <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center">
            {/* Background Pill */}
            <div className="flex flex-col gap-6 items-center bg-white/10 backdrop-blur-md border border-white/5 rounded-full py-6 px-3 shadow-2xl shadow-black/50">
                {navItems.map((item) => {
                    const isActive = activeSection === item.id;
                    const isHovered = hoveredTab === item.id;
                    const Icon = item.icon;

                    return (
                        <div
                            key={item.id}
                            className="relative flex items-center justify-end group pointer-events-auto"
                            onMouseEnter={() => setHoveredTab(item.id)}
                            onMouseLeave={() => setHoveredTab(null)}
                            onClick={() => handleNavClick(item.id)}
                            role="button"
                            aria-label={`Navigate to ${item.label}`}
                        >
                            {/* Label (Tooltip) */}
                            <AnimatePresence>
                                {(isHovered) && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20, scale: 0.9 }}
                                        animate={{ opacity: 1, x: -20, scale: 1 }} // Improved positioning relative to pill
                                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-full mr-4 px-3 py-1.5 rounded-md bg-white/10 backdrop-blur-md border border-white/10 shadow-xl whitespace-nowrap"
                                    >
                                        <span className="text-sm font-medium text-white/90">
                                            {item.label}
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Indicator / Icon Container */}
                            <div
                                className={`
                    relative flex items-center justify-center 
                    w-10 h-10 rounded-full transition-all duration-300 z-10
                    ${isActive ? 'text-white scale-110' : 'text-white/40 hover:text-white/80 hover:scale-105'}
                  `}
                            >
                                <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                            </div>

                            {/* Active Bubble Background */}
                            {isActive && (
                                <motion.div
                                    layoutId="active-nav-bubble"
                                    className="absolute right-0 w-10 h-10 rounded-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] z-0"
                                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default VerticalNavbar;

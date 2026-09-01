import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Briefcase, Sparkles, User } from 'lucide-react';
import { REAL_USER_IMAGE, USER_IMAGE_URL } from '../constants';
import { TimelineMode } from '../types';
import GlassSurface from './ui/GlassSurface';

type PublicNavSection = 'profile' | 'experiences' | 'projects';
type ActiveSection = PublicNavSection | 'writings';

interface VerticalNavbarProps {
    activeSection: ActiveSection;
    onNavigate: (section: PublicNavSection) => void;
    mode: TimelineMode;
    isHidden?: boolean;
}

const navItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'experiences', label: 'Experiences', icon: Briefcase },
    { id: 'projects', label: 'Projects', icon: Sparkles },
] as const;

const VerticalNavbar: React.FC<VerticalNavbarProps> = ({ activeSection, onNavigate, mode, isHidden = false }) => {
    const [hoveredTab, setHoveredTab] = useState<string | null>(null);

    const handleNavClick = (id: PublicNavSection) => {
        window.dispatchEvent(new CustomEvent('closeAllModals'));
        onNavigate(id);
    };

    return (
        <div className={isHidden ? 'hidden' : undefined} data-navigation-mode={mode}>
            <div className="fixed right-6 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-center md:flex">
                <GlassSurface
                    as="nav"
                    data-nav-glass
                    aria-label="Sections"
                    strength="strong"
                    blur="strong"
                    className="flex flex-col items-center gap-5 rounded-full px-3 py-5"
                >
                    {navItems.map((item) => {
                        const isActive = activeSection === item.id;
                        const isHovered = hoveredTab === item.id;
                        const Icon = item.icon;

                        return (
                            <motion.button
                                key={item.id}
                                type="button"
                                className="group relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5E55A]"
                                onMouseEnter={() => setHoveredTab(item.id)}
                                onMouseLeave={() => setHoveredTab(null)}
                                onClick={() => handleNavClick(item.id)}
                                aria-label={`Navigate to ${item.label}`}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <AnimatePresence>
                                    {isHovered && (
                                        <motion.span
                                            initial={{ opacity: 0, x: 12, scale: 0.96 }}
                                            animate={{ opacity: 1, x: -12, scale: 1 }}
                                            exit={{ opacity: 0, x: 12, scale: 0.96 }}
                                            transition={{ duration: 0.16 }}
                                            className="absolute right-full mr-3 whitespace-nowrap rounded-lg border border-white/15 bg-[#06100e]/92 px-3 py-1.5 text-xs font-medium text-white/90 shadow-xl backdrop-blur-xl"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>

                                <span className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full transition-all ${isActive ? 'scale-105 text-[#171900]' : 'text-white/62 group-hover:text-white'}`}>
                                    <Icon size={18} strokeWidth={isActive ? 2.2 : 1.6} aria-hidden="true" />
                                </span>
                                {isActive && (
                                    <motion.span
                                        layoutId="active-nav-bubble"
                                        className="absolute inset-0 rounded-full bg-[#E5E55A] shadow-[0_0_24px_rgba(229,229,90,0.24)]"
                                        transition={{ type: 'tween', duration: 0.22, ease: 'circOut' }}
                                        aria-hidden="true"
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </GlassSurface>
            </div>

            <div className="fixed inset-x-0 top-0 z-[60] flex py-2 pl-2 pr-[4.5rem] pointer-events-auto md:hidden">
                <GlassSurface
                    as="nav"
                    data-nav-glass
                    aria-label="Sections"
                    strength="strong"
                    blur="strong"
                    className="flex w-full items-center justify-between rounded-2xl px-1.5 py-1"
                >
                    <button
                        type="button"
                        data-mobile-identity
                        onClick={() => handleNavClick('profile')}
                        className="flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5E55A]"
                        aria-label="Navigate to Profile"
                        aria-current={activeSection === 'profile' ? 'page' : undefined}
                    >
                        <span
                            data-header-photo-fallback
                            className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/20 bg-[#10231d] bg-cover bg-center"
                            style={{ backgroundImage: `url(${USER_IMAGE_URL})` }}
                        >
                            <img
                                data-header-photo
                                src={REAL_USER_IMAGE}
                                alt=""
                                decoding="async"
                                fetchPriority="high"
                                className="h-full w-full object-cover object-[center_32%]"
                            />
                        </span>
                        <span className="min-w-0">
                            <span className="block truncate text-[11px] font-semibold leading-tight text-white">Adi Agarwal</span>
                            <span className="block max-w-[76px] truncate text-[8px] leading-tight text-white/58">Tangible AI + Product Systems</span>
                        </span>
                    </button>

                    <span className="flex shrink-0 items-center gap-0.5">
                        {navItems.filter((item) => item.id !== 'profile').map((item) => {
                            const isActive = activeSection === item.id;
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5E55A] ${isActive ? 'text-[#E5E55A]' : 'text-white/55'}`}
                                    onClick={() => handleNavClick(item.id)}
                                    aria-label={`Navigate to ${item.label}`}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    <Icon size={18} aria-hidden="true" />
                                    {isActive && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#E5E55A]" aria-hidden="true" />}
                                </button>
                            );
                        })}
                    </span>
                </GlassSurface>
            </div>
        </div>
    );
};

export default VerticalNavbar;

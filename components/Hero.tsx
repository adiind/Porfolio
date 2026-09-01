
import React, { useCallback, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { USER_IMAGE_URL, SOCIAL_LINKS } from '../constants';
import { ArrowRight, FileText, Linkedin } from 'lucide-react';
import GitHubActivity from './GitHubActivity';
import { trackEvent } from '../lib/analytics';
import CuttingMatSurface from './ui/CuttingMatSurface';
import { useProjects } from '../context/ProjectsContext';
import ProjectWheel from './project-wheel/ProjectWheel';
import type { ProjectWheelItem } from './project-wheel/projectWheelTypes';
import { useContentEngagement } from '../hooks/useContentEngagement';

const PROJECT_WHEEL_LOCAL_IMAGES: Record<string, string> = {
  jarvis: '/images/tinkerverse/jarvis-project-fallback.webp',
  plotter: '/images/tinkerverse/plotter-project-fallback.webp',
  surya: '/images/tinkerverse/surya-project-fallback.webp',
};

interface Props {
  onOpenProfile?: () => void;
  /** Navigates to the Selected Work section (wired to App's section nav). */
  onViewWork?: () => void;
  /** False when the hero is hidden behind the timeline — pauses its ambient
   *  animations so they don't steal frame budget from the visible sections. */
  active?: boolean;
}

const Hero: React.FC<Props> = ({ onOpenProfile, onViewWork, active = true }) => {
  const { projects } = useProjects();
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion() === true;
  useContentEngagement({
    contentType: 'section',
    contentId: 'intro',
    active,
  });

  const projectWheelItems = useMemo<ProjectWheelItem[]>(() => projects.map((project) => ({
    id: project.id,
    title: project.hero.title,
    oneLiner: project.hero.oneLiner,
    imageUrl: PROJECT_WHEEL_LOCAL_IMAGES[project.id] ?? project.heroImage ?? project.gallery?.[0] ?? '/images/portfolio_hero.png',
    status: project.id === 'glyph' ? 'Prototype' : project.outcome.status.replace('-', ' '),
  })), [projects]);

  const openProject = useCallback((project: ProjectWheelItem) => {
    window.dispatchEvent(new CustomEvent('openProject', { detail: { id: project.id, type: 'project' } }));
  }, []);

  const handleViewWork = () => {
    trackEvent('hero_cta_clicked', { cta: 'selected_work' });
    onViewWork?.();
    // Rescue hatch: App drives intro→projects with a smooth scroll that can
    // stall on mobile (the app's own section nav hits the same path). If the
    // Selected Work section hasn't moved shortly after the handoff and is
    // still below the fold, jump there instantly instead of leaving the
    // visitor stranded at the top of the timeline.
    window.setTimeout(() => {
      const projects = document.getElementById('projects');
      if (!projects) return;
      const firstTop = projects.getBoundingClientRect().top;
      window.setTimeout(() => {
        const secondTop = projects.getBoundingClientRect().top;
        const stalled = Math.abs(secondTop - firstTop) < 4;
        if (stalled && secondTop > window.innerHeight) {
          projects.scrollIntoView({ block: 'start' });
        }
      }, 350);
    }, 900);
  };

  return (
    <div className="relative flex flex-col items-center justify-between h-full w-full pointer-events-none pt-20 pb-12 md:py-16">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#030504]" />
        <div
          className="absolute inset-0 opacity-[0.24]"
          style={{
            backgroundImage: 'radial-gradient(rgba(229,229,90,0.28) 0.7px, transparent 0.7px)',
            backgroundSize: '8px 8px',
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(229,229,90,0.09),transparent_38%),radial-gradient(circle_at_50%_70%,rgba(0,51,42,0.36),transparent_46%),linear-gradient(180deg,rgba(0,0,0,0.08)_0%,#020302_100%)]" />

        <div className="absolute left-1/2 top-[59%] h-[82vh] min-h-[580px] w-[101vw] max-w-[1380px] -translate-x-1/2 -translate-y-1/2 px-3 sm:px-0">
          <CuttingMatSurface active={active} />
        </div>
      </div>

      {/* HERO HEADLINE BLOCK — name + positioning statement + primary actions.
          This is deliberately the loudest thing in the first viewport. */}
      <div className="relative z-50 w-full max-w-[820px] px-4 pointer-events-none sm:px-6">
        <div className="absolute inset-x-2 -top-12 -bottom-8 rounded-[3rem] bg-black/55 blur-3xl -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-[224px] text-left sm:max-w-[245px] lg:max-w-none lg:text-center"
        >
          <h1
            className="text-2xl md:text-3xl font-normal tracking-tight text-white/95 mb-2 md:mb-3"
            style={{ textShadow: '0 10px 26px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.55)' }}
          >
            Adi Agarwal
          </h1>
          <p
            className="text-[2.35rem] leading-[1.04] sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight text-white"
            style={{ textShadow: '0 18px 42px rgba(0,0,0,0.62), 0 3px 10px rgba(0,0,0,0.6)' }}
          >
            I make AI <span className="font-normal">tangible</span>.
          </p>
          <p
            className="mt-3 max-w-[36rem] text-xs leading-relaxed text-white/72 sm:text-sm md:mt-4 md:text-base lg:mx-auto"
            style={{ textShadow: '0 6px 18px rgba(0,0,0,0.55)' }}
          >
            Product designer &amp; engineer — I turn invisible models into interfaces, devices, and services people can see, feel, and trust.
          </p>

          <div className="pointer-events-auto mt-4 flex max-w-[224px] flex-wrap items-center justify-start gap-2 sm:max-w-[245px] md:mt-7 md:gap-3 lg:max-w-none lg:justify-center">
            <button
              type="button"
              onClick={handleViewWork}
              className="group inline-flex items-center gap-2 rounded-full bg-[#E5E55A] px-4 py-2.5 md:px-6 md:py-3 text-sm md:text-base font-semibold text-[#141600] shadow-[0_14px_40px_rgba(229,229,90,0.26)] transition-all duration-300 hover:bg-[#f0f570] hover:shadow-[0_18px_48px_rgba(229,229,90,0.38)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80"
            >
              View selected work
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
            <a
              href={SOCIAL_LINKS.resume}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('hero_cta_clicked', { cta: 'resume' })}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/45 px-4 py-2.5 md:px-5 md:py-3 text-sm md:text-base font-medium text-white/90 backdrop-blur-md transition-all duration-300 hover:border-white/55 hover:bg-black/65 hover:text-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80"
            >
              <FileText size={15} aria-hidden="true" />
              Resume
            </a>
            <a
              href={SOCIAL_LINKS.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('hero_cta_clicked', { cta: 'linkedin' })}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/45 px-4 py-2.5 md:px-5 md:py-3 text-sm md:text-base font-medium text-white/90 backdrop-blur-md transition-all duration-300 hover:border-white/55 hover:bg-black/65 hover:text-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80"
            >
              <Linkedin size={15} aria-hidden="true" />
              LinkedIn
            </a>
          </div>
        </motion.div>
      </div>

      {/* BUILD EVIDENCE — the exact count and contribution history remain the
          main source receipt; the repository CTA is supporting evidence. */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.6, ease: "easeOut" }}
        className="absolute bottom-[6.5rem] left-[10px] z-[70] flex pointer-events-auto sm:bottom-[4.5rem] sm:left-5 lg:bottom-9 lg:left-8 xl:left-12"
      >
        <GitHubActivity variant="compact" />
      </motion.div>

      {/* PROJECT-ONLY WEBGL WHEEL — full cards share one signed-distance
          field so they melt together, stretch threads, react to the cursor,
          and refract through the stage edges. */}
      <ProjectWheel items={projectWheelItems} active={active} onOpen={openProject} />

      {/* VISUAL ELEMENT - Secondary */}
      <div className="hidden absolute left-5 top-[47%] z-50 h-[140px] w-[140px] max-w-none opacity-95 sm:left-9 sm:h-[170px] sm:w-[170px] lg:relative lg:left-auto lg:top-auto lg:flex lg:h-[440px] lg:w-[440px] lg:max-w-[56vw] lg:items-center lg:justify-center">

        <motion.div
          className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
          animate={{ x: 0, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="absolute left-1/2 top-[5%] md:top-[10%] z-30 -translate-x-1/2 pointer-events-none">
            <motion.div
              className="flex items-center justify-center gap-1.5 md:gap-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 0.6, y: 0 }}
              transition={{ delay: 0.65, duration: 0.5, ease: "easeOut" }}
            >
              <span className="h-px w-3 md:w-5 bg-white/22" />
              <span
                className="whitespace-nowrap text-[9px] sm:text-[10px] md:text-xs uppercase tracking-[0.14em] sm:tracking-[0.18em] text-white/70 font-medium"
                style={{ textShadow: '0 8px 18px rgba(0,0,0,0.55)' }}
              >
                Double diamond enthusiast
              </span>
              <span className="h-px w-3 md:w-5 bg-white/22" />
            </motion.div>
          </div>

          {/* Avatar - Clear Clickable Affordance */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: 1,
              rotate: 0,
              opacity: 0.98,
            }}
            transition={{
              scale: { duration: 0.4, ease: "easeOut" },
              rotate: { duration: 0.4, ease: "easeOut" },
              opacity: { duration: 0.6, delay: 0.1 }
            }}
            className="group relative z-20 w-[64%] h-[64%] cursor-pointer pointer-events-auto transition-all duration-300 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80"
            onClick={onOpenProfile}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenProfile?.();
              }
            }}
            onMouseEnter={() => setIsAvatarHovered(true)}
            onMouseLeave={() => setIsAvatarHovered(false)}
            whileHover={{ scale: 1.06, y: -8, rotate: 1.2 }}
            whileTap={{ scale: 0.97 }}
            role="button"
            tabIndex={0}
            aria-label="View profile"
          >
            <motion.div
              className="absolute left-1/2 top-[72%] h-[15%] w-[44%] -translate-x-1/2 rounded-full bg-black/55 blur-2xl"
              animate={{
                scaleX: isAvatarHovered ? 0.88 : 1,
                scaleY: isAvatarHovered ? 0.76 : 0.94,
                opacity: isAvatarHovered ? 0.78 : 0.62,
              }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
            />
            <div className="absolute inset-[-18px] rounded-full bg-black/36 blur-2xl" />
            {/* Colored gradient glow ring on hover */}
            <div className="absolute inset-[-6px] rounded-full bg-gradient-to-r from-purple-500/0 via-white/0 to-blue-500/0 group-hover:from-purple-500/40 group-hover:via-white/30 group-hover:to-blue-500/40 transition-all duration-500 blur-md" />

            {/* Subtle outer glow - always visible */}
            <div className="absolute inset-[-8px] rounded-full bg-gradient-to-b from-white/12 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Border ring that appears on hover */}
            <div className="absolute inset-0 rounded-full border-2 border-white/10 group-hover:border-white/30 transition-all duration-300" />

            <img
              src={USER_IMAGE_URL}
              alt="Adi Agarwal"
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-contain relative z-10 opacity-100 saturate-[1.02] group-hover:brightness-110 transition-all duration-300"
              style={{ filter: 'drop-shadow(0 28px 36px rgba(0,0,0,0.54))' }}
            />

            {/* View Profile CTA - Always visible, enhanced on hover */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 z-20">
              <div className="bg-black/50 group-hover:bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 group-hover:border-white/40 flex items-center gap-2 transition-all duration-300">
                <span className="text-xs md:text-sm text-white/80 group-hover:text-white font-medium">View Profile</span>
                <ArrowRight size={14} className="text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-300" />
              </div>
            </div>
          </motion.div>
        </motion.div>

      </div>

      {/* Desktop spacer so justify-between keeps the avatar off the bottom edge */}
      <div className="hidden md:block h-8" aria-hidden="true" />
    </div>
  );
};

export default Hero;

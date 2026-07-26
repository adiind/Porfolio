
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { USER_IMAGE_URL, SOCIAL_LINKS } from '../constants';
import { BarChart3, Code, Palette, Cpu, Printer, X, ArrowRight, FileText, Linkedin } from 'lucide-react';
import GitHubActivity from './GitHubActivity';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { trackEvent } from '../lib/analytics';

const skillsTimelineData = [
  {
    id: 1,
    title: "Analytics",
    date: "Core Skill",
    content: "Data analysis, insights generation, and metrics-driven decision making.",
    category: "Data",
    icon: BarChart3,
    relatedIds: [2, 3],
    status: "completed" as const,
    energy: 95,
  },
  {
    id: 2,
    title: "Development",
    date: "Core Skill",
    content: "Full-stack software engineering, from prototypes to production systems.",
    category: "Engineering",
    icon: Code,
    relatedIds: [1, 3, 4],
    status: "completed" as const,
    energy: 90,
  },
  {
    id: 3,
    title: "Design",
    date: "Core Skill",
    content: "UI/UX design, user research, and creating delightful experiences.",
    category: "Creative",
    icon: Palette,
    relatedIds: [1, 2],
    status: "completed" as const,
    energy: 85,
  },
  {
    id: 4,
    title: "Electronics",
    date: "Core Skill",
    content: "Hardware design, circuit prototyping, and embedded systems.",
    category: "Hardware",
    icon: Cpu,
    relatedIds: [2, 5],
    status: "in-progress" as const,
    energy: 80,
  },
  {
    id: 5,
    title: "3D Printing",
    date: "Core Skill",
    content: "Additive manufacturing, CAD modeling, and rapid prototyping.",
    category: "Making",
    icon: Printer,
    relatedIds: [4],
    status: "in-progress" as const,
    energy: 75,
  },
];

// Skill to Project mapping - connects skills to related projects
const skillProjectMapping: Record<number, {
  description: string;
  projects: {
    id: string;
    title: string;
    tagline: string;
    imageUrl: string;
    type: 'project' | 'experience';
  }[];
}> = {
  1: { // Analytics
    description: "Data analysis, insights generation, and metrics-driven decision making.",
    projects: [
      { id: 'zomato', title: 'Zomato Homepage', tagline: 'Analyzed homepage behavior for 10M daily users, optimizing UI and ranking models.', imageUrl: '/images/zomato_eternal.jpg', type: 'experience' },
      { id: 'zomato', title: 'Food Rescue', tagline: 'Built pricing analytics and elasticity testing for surplus inventory reduction.', imageUrl: '/images/food_rescue.png', type: 'experience' },
      { id: 'udaan', title: 'Udaan Supply Chain', tagline: 'Built real-time supply chain analytics powering national procurement decisions.', imageUrl: '/images/udaan_id.jpg', type: 'experience' },
      { id: 'snapdeal', title: 'Snapdeal Ads', tagline: 'Owned ads revenue analytics and attribution, driving 14% revenue uplift.', imageUrl: '/images/snapdeal_id.jpg', type: 'experience' },
      { id: 'schmooze', title: 'Schmooze', tagline: 'Pre-PMF analytics for a meme-based dating app, set up V0 dashboards.', imageUrl: '/images/schmooze_team.jpg', type: 'experience' },
    ]
  },
  2: { // Development
    description: "Full-stack software engineering, from prototypes to production systems.",
    projects: [
      { id: 'jarvis', title: 'Jarvis', tagline: 'Built firmware for voice recognition, MQTT integration, and sensor control.', imageUrl: 'https://img.youtube.com/vi/3aCWb3PsAQs/maxresdefault.jpg', type: 'project' },
      { id: 'plotter', title: 'Voice Plotter', tagline: 'Developed ESP32 firmware handling motor control, timing, and real-time coordination.', imageUrl: 'https://i.ibb.co/v6nVSTw9/IMG-8392-2.jpg', type: 'project' },
      { id: 'portfolio-website', title: 'This Portfolio', tagline: 'Built this interactive portfolio with React, Framer Motion, and TypeScript.', imageUrl: '/images/portfolio_hero.png', type: 'project' },
    ]
  },
  3: { // Design
    description: "UI/UX design, user research, and creating delightful experiences.",
    projects: [
      { id: 'helios', title: 'Helios', tagline: 'Designed a mechanical kinetic lamp where tactile interaction shapes light.', imageUrl: '/images/helios.jpg', type: 'project' },
      { id: 'surya', title: 'Surya', tagline: 'Created a kinetic timepiece that makes family presence visible across time zones.', imageUrl: 'https://i.ibb.co/5gWPHd62/IMG-1438.jpg', type: 'project' },
      { id: 'zomato', title: 'Zomato Homepage', tagline: 'Redesigned homepage for 10M daily users, optimizing IA and visual hierarchy.', imageUrl: '/images/zomato_eternal.jpg', type: 'experience' },
      { id: 'pg-project', title: 'P&G Design', tagline: 'Explored innovation in a habit-driven hair-care category through user research.', imageUrl: '/images/pg-design-project.jpg', type: 'experience' },
    ]
  },
  4: { // Electronics
    description: "Designing and integrating electronics for functional physical devices.",
    projects: [
      { id: 'plotter', title: 'Plotter', tagline: 'Made a custom ESP32-based 2D plotter with motor control and real-time coordination.', imageUrl: 'https://i.ibb.co/v6nVSTw9/IMG-8392-2.jpg', type: 'project' },
      { id: 'surya', title: 'Surya', tagline: 'Designed custom PCB powering an interactive kinetic display with LEDs and actuation.', imageUrl: 'https://i.ibb.co/5gWPHd62/IMG-1438.jpg', type: 'project' },
      { id: 'jarvis', title: 'Jarvis', tagline: 'Built embedded hardware for a voice-controlled assistant with sensors and LEDs.', imageUrl: 'https://img.youtube.com/vi/3aCWb3PsAQs/maxresdefault.jpg', type: 'project' },
      { id: 'solopump', title: 'SoloPump', tagline: 'Integrated motors, drivers, and power management into a compact dispenser.', imageUrl: '/images/solopump.png', type: 'project' },
    ]
  },
  5: { // 3D Printing
    description: "Additive manufacturing, CAD modeling, and rapid prototyping.",
    projects: [
      { id: 'helios', title: 'Helios', tagline: 'Fully 3D-printed mechanical lamp with ring gear and eight interlinked spur gears.', imageUrl: '/images/helios.jpg', type: 'project' },
      { id: 'surya', title: 'Surya', tagline: 'Custom jigs and mounting hardware for kinetic flower mechanisms.', imageUrl: 'https://i.ibb.co/5gWPHd62/IMG-1438.jpg', type: 'project' },
      { id: 'jarvis', title: 'Jarvis', tagline: 'Designed and printed custom enclosure for the voice assistant hardware.', imageUrl: 'https://img.youtube.com/vi/3aCWb3PsAQs/maxresdefault.jpg', type: 'project' },
      { id: 'solopump', title: 'SoloPump', tagline: '3D-printed housing and mechanical components for the dispensing mechanism.', imageUrl: '/images/solopump.png', type: 'project' },
      { id: 'plotter', title: 'Plotter', tagline: 'Printed custom mounts, guides, and structural components for the 2D plotter.', imageUrl: 'https://i.ibb.co/v6nVSTw9/IMG-8392-2.jpg', type: 'project' },
      { id: 'pg-project', title: 'P&G Design', tagline: 'Rapid prototyped physical concepts for hair-care innovation.', imageUrl: '/images/pg-design-project.jpg', type: 'experience' },
    ]
  },
};

// Palette and layout are adapted from the Classic preset at cutting-mat-generator.vercel.app.
// The mat draws in measured pixel space (ResizeObserver + matching viewBox): the old
// fixed 1100x760 viewBox with preserveAspectRatio="none" stretched with the container,
// turning grid squares into wide rectangles and smearing every label on the mat.
const matAngles = [15, 30, 45, 60] as const;
const matRadii = [180, 320, 500] as const;
// Decorative cut scratches, as fractions of the ruled area.
const matCutMarks = [
  { x1: 0.155, y1: 0.36, x2: 0.303, y2: 0.323 },
  { x1: 0.642, y1: 0.398, x2: 0.8, y2: 0.435 },
  { x1: 0.195, y1: 0.618, x2: 0.364, y2: 0.578 },
  { x1: 0.604, y1: 0.752, x2: 0.79, y2: 0.73 },
] as const;

const CuttingMatSurface: React.FC<{ active?: boolean }> = ({ active = true }) => {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 1100, h: 760 });

  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setDims(prev => (Math.abs(prev.w - width) < 1 && Math.abs(prev.h - height) < 1)
          ? prev
          : { w: Math.round(width), h: Math.round(height) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geo = useMemo(() => {
    const { w, h } = dims;
    const compact = w < 640;
    const unit = compact ? 16 : 22;      // square grid cell, px
    const margin = compact ? 38 : 58;    // ruler band around the ruled area
    const cols = Math.max(10, Math.floor((w - margin * 2) / unit));
    const rows = Math.max(10, Math.floor((h - margin * 2) / unit));
    const x0 = Math.round((w - cols * unit) / 2);
    const y0 = Math.round((h - rows * unit) / 2);
    return {
      w, h, unit, cols, rows, x0, y0,
      x1: x0 + cols * unit,
      y1: y0 + rows * unit,
      xUnits: Array.from({ length: cols + 1 }, (_, i) => i),
      yUnits: Array.from({ length: rows + 1 }, (_, i) => i),
    };
  }, [dims]);

  const originX = geo.x0;
  const originY = geo.y1;
  const guideLength = Math.min(geo.x1 - geo.x0, geo.y1 - geo.y0) * 0.95;

  return (
    <motion.div
      ref={surfaceRef}
      initial={{ opacity: 0, scale: 0.96, y: 24 }}
      animate={active
        ? { opacity: 1, scale: 1, y: [0, -6, 0], rotate: [-0.72, -0.38, -0.72] }
        : { opacity: 1, scale: 1, y: 0, rotate: -0.72 }}
      transition={{
        opacity: { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] },
        scale: { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] },
        y: { duration: 12, repeat: Infinity, ease: 'easeInOut' },
        rotate: { duration: 12, repeat: Infinity, ease: 'easeInOut' },
      }}
      className="relative h-full w-full overflow-hidden rounded-[1.7rem] md:rounded-[2.15rem]"
      style={{
        background: '#00332A',
        boxShadow: '0 44px 150px rgba(0, 0, 0, 0.62), 0 10px 42px rgba(207, 232, 84, 0.08), inset 0 -36px 70px rgba(0, 0, 0, 0.36), inset 0 1px 0 rgba(245, 255, 178, 0.2)',
      }}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${geo.w} ${geo.h}`}
        role="presentation"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="matFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#064a3c" />
            <stop offset="42%" stopColor="#00332A" />
            <stop offset="100%" stopColor="#01241f" />
          </linearGradient>
          <radialGradient id="matLight" cx="36%" cy="22%" r="72%">
            <stop offset="0%" stopColor="rgba(255,255,212,0.2)" />
            <stop offset="48%" stopColor="rgba(255,255,212,0.06)" />
            <stop offset="100%" stopColor="rgba(255,255,212,0)" />
          </radialGradient>
        </defs>

        <rect width={geo.w} height={geo.h} rx="34" fill="url(#matFill)" />
        <rect width={geo.w} height={geo.h} rx="34" fill="url(#matLight)" />
        <rect x="22" y="22" width={geo.w - 44} height={geo.h - 44} rx="27" fill="none" stroke="rgba(229,229,90,0.34)" strokeWidth="1.15" />
        <rect x="38" y="38" width={geo.w - 76} height={geo.h - 76} rx="19" fill="none" stroke="rgba(229,229,90,0.18)" strokeWidth="0.8" />

        <g>
          {geo.xUnits.map((unit) => {
            const x = geo.x0 + unit * geo.unit;
            const isMajor = unit % 5 === 0;
            return (
              <line
                key={`mat-v-${unit}`}
                x1={x}
                y1={geo.y0}
                x2={x}
                y2={geo.y1}
                stroke={isMajor ? 'rgba(229,229,90,0.46)' : 'rgba(229,229,90,0.16)'}
                strokeWidth={isMajor ? 1 : 0.55}
              />
            );
          })}

          {geo.yUnits.map((unit) => {
            const y = geo.y0 + unit * geo.unit;
            const isMajor = unit % 5 === 0;
            return (
              <line
                key={`mat-h-${unit}`}
                x1={geo.x0}
                y1={y}
                x2={geo.x1}
                y2={y}
                stroke={isMajor ? 'rgba(229,229,90,0.46)' : 'rgba(229,229,90,0.16)'}
                strokeWidth={isMajor ? 1 : 0.55}
              />
            );
          })}
        </g>

        <g stroke="rgba(229,229,90,0.38)" strokeLinecap="round">
          {geo.xUnits.map((unit) => {
            const x = geo.x0 + unit * geo.unit;
            const tick = unit % 5 === 0 ? 13 : 8;
            return (
              <React.Fragment key={`mat-x-tick-${unit}`}>
                <line x1={x} y1={geo.y0 - 22} x2={x} y2={geo.y0 - 22 + tick} strokeWidth={unit % 5 === 0 ? 1 : 0.7} />
                <line x1={x} y1={geo.y1 + 22} x2={x} y2={geo.y1 + 22 - tick} strokeWidth={unit % 5 === 0 ? 1 : 0.7} />
              </React.Fragment>
            );
          })}
          {geo.yUnits.map((unit) => {
            const y = geo.y0 + unit * geo.unit;
            const tick = unit % 5 === 0 ? 13 : 8;
            return (
              <React.Fragment key={`mat-y-tick-${unit}`}>
                <line x1={geo.x0 - 22} y1={y} x2={geo.x0 - 22 + tick} y2={y} strokeWidth={unit % 5 === 0 ? 1 : 0.7} />
                <line x1={geo.x1 + 22} y1={y} x2={geo.x1 + 22 - tick} y2={y} strokeWidth={unit % 5 === 0 ? 1 : 0.7} />
              </React.Fragment>
            );
          })}
        </g>

        <g fill="rgba(237,241,116,0.72)" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="9" fontWeight="700">
          {geo.xUnits.filter(unit => unit % 5 === 0).map((unit) => {
            const x = geo.x0 + unit * geo.unit;
            return (
              <React.Fragment key={`mat-x-label-${unit}`}>
                <text x={x} y={geo.y0 - 30} textAnchor="middle">{unit}</text>
                <text x={x} y={geo.y1 + 42} textAnchor="middle">{unit}</text>
              </React.Fragment>
            );
          })}
          {geo.yUnits.filter(unit => unit % 5 === 0).map((unit) => {
            const y = geo.y0 + unit * geo.unit + 3;
            return (
              <React.Fragment key={`mat-y-label-${unit}`}>
                <text x={geo.x0 - 32} y={y} textAnchor="middle">{unit}</text>
                <text x={geo.x1 + 32} y={y} textAnchor="middle">{unit}</text>
              </React.Fragment>
            );
          })}
        </g>

        <g stroke="rgba(229,229,90,0.34)" strokeWidth="0.85" strokeDasharray="3 5" fill="none">
          {matAngles.map((angle) => {
            const radians = angle * Math.PI / 180;
            const endX = originX + Math.cos(radians) * guideLength;
            const endY = originY - Math.sin(radians) * guideLength;
            const labelX = originX + Math.cos(radians) * 148;
            const labelY = originY - Math.sin(radians) * 148;
            return (
              <React.Fragment key={`mat-angle-${angle}`}>
                <line x1={originX} y1={originY} x2={endX} y2={endY} />
                <text
                  x={labelX + 6}
                  y={labelY - 6}
                  fill="rgba(237,241,116,0.78)"
                  stroke="none"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontSize="10"
                  fontWeight="700"
                >
                  {angle}°
                </text>
              </React.Fragment>
            );
          })}

          {matRadii.filter(radius => radius <= guideLength).map(radius => (
            <path
              key={`mat-radius-${radius}`}
              d={`M ${originX + radius} ${originY} A ${radius} ${radius} 0 0 0 ${originX} ${originY - radius}`}
              stroke="rgba(229,229,90,0.28)"
              strokeDasharray="none"
            />
          ))}
        </g>

        <g stroke="rgba(0,0,0,0.28)" strokeWidth="1" strokeLinecap="round">
          {matCutMarks.map((mark, index) => (
            <line
              key={`mat-cut-${index}`}
              x1={geo.x0 + mark.x1 * (geo.x1 - geo.x0)}
              y1={geo.y0 + mark.y1 * (geo.y1 - geo.y0)}
              x2={geo.x0 + mark.x2 * (geo.x1 - geo.x0)}
              y2={geo.y0 + mark.y2 * (geo.y1 - geo.y0)}
            />
          ))}
        </g>

        <g fill="rgba(237,241,116,0.62)" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontWeight="800" letterSpacing="3">
          <text x={geo.x0 + 6} y={geo.y1 - 20} fontSize="10">SELF-HEALING CUTTING MAT</text>
          <text x={geo.x0 + 6} y={geo.y1 - 2} fontSize="8" fill="rgba(237,241,116,0.46)">A2 GRID / 10 MM / 15-60 DEGREE GUIDES</text>
          <text x={geo.x1 - 20} y={geo.y0 + 25} fontSize="8" textAnchor="end" fill="rgba(237,241,116,0.46)">ADI AGARWAL / WORKSHOP GRID</text>
        </g>
      </svg>

      <div
        className="absolute inset-0 rounded-[1.7rem] md:rounded-[2.15rem] opacity-40 mix-blend-soft-light"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.18) 0.65px, transparent 0.65px)',
          backgroundSize: '5px 5px',
        }}
      />
      <div className="absolute inset-x-0 top-0 h-[32%] bg-gradient-to-b from-black/28 via-black/8 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-black/34 via-black/10 to-transparent" />
      <div className="absolute inset-y-0 left-0 w-[16%] bg-gradient-to-r from-black/22 via-black/8 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-[16%] bg-gradient-to-l from-black/22 via-black/8 to-transparent" />
      <div className="absolute left-1/2 top-[51%] h-[50%] w-[48%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#001c18]/40 blur-3xl" />
    </motion.div>
  );
};

interface Props {
  onOpenProfile?: () => void;
  /** Navigates to the Selected Work section (wired to App's section nav). */
  onViewWork?: () => void;
  /** False when the hero is hidden behind the timeline — pauses its ambient
   *  animations so they don't steal frame budget from the visible sections. */
  active?: boolean;
}

const SkillOverlay: React.FC<{ activeSkillId: number; onClose: () => void }> = ({ activeSkillId, onClose }) => {
  const dialogRef = useDialogA11y(onClose, { historyTag: 'skill' });

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[99999] flex items-start justify-center pt-8 md:pt-16 pointer-events-auto bg-black/80 backdrop-blur-md overflow-y-auto pb-8"
        onClick={onClose}
      >
        <div
          ref={dialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="skill-overlay-title"
          className="relative w-[90%] md:w-[700px] max-w-[700px] focus:outline-none"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="bg-gradient-to-b from-neutral-900 to-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Skill Header */}
            <div className="p-6 md:p-8 border-b border-white/10">
              <div className="flex items-center gap-3 mb-3">
                {(() => {
                  const skill = skillsTimelineData.find(i => i.id === activeSkillId);
                  const Icon = skill?.icon;
                  return Icon ? (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <Icon size={24} className="text-white" />
                    </div>
                  ) : null;
                })()}
                <div>
                  <h2 id="skill-overlay-title" className="text-2xl md:text-3xl font-semibold text-white">
                    {skillsTimelineData.find(i => i.id === activeSkillId)?.title}
                  </h2>
                  <span className="text-xs text-white/55 uppercase tracking-wider">
                    {skillsTimelineData.find(i => i.id === activeSkillId)?.category}
                  </span>
                </div>
              </div>
              <p className="text-sm md:text-base text-white/60 leading-relaxed">
                {skillProjectMapping[activeSkillId]?.description}
              </p>
            </div>

            {/* Related Projects */}
            <div className="p-6 md:p-8">
              <h3 className="text-xs uppercase tracking-widest text-white/55 mb-4">Related Projects</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skillProjectMapping[activeSkillId]?.projects.map((project) => (
                  <motion.button
                    key={project.id}
                    className="group relative overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-white/30 transition-all duration-300 text-left"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Close skill modal and navigate to project
                      onClose();
                      // Dispatch custom event to open project after giving history time to update
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('openProject', { detail: { id: project.id, type: project.type } }));
                      }, 10);
                    }}
                  >
                    {/* Project Image */}
                    <div className="relative h-32 md:h-36 overflow-hidden">
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    </div>

                    {/* Project Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h4 className="text-lg font-semibold text-white mb-1 group-hover:text-purple-300 transition-colors">
                        {project.title}
                      </h4>
                      <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                        {project.tagline}
                      </p>
                    </div>

                    {/* Arrow indicator */}
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight size={14} className="text-white" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          <button
            className="absolute -top-3 -right-3 z-[999999] p-2.5 bg-white/10 hover:bg-white rounded-full border border-white/20 text-white hover:text-black transition-all cursor-pointer outline-none pointer-events-auto active:scale-95 backdrop-blur-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            type="button"
            aria-label="Close"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

const Hero: React.FC<Props> = ({ onOpenProfile, onViewWork, active = true }) => {

  const [activeSkillId, setActiveSkillId] = useState<number | null>(null);
  const [autoActiveSkillId, setAutoActiveSkillId] = useState<number | null>(null);
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
  // The skills rail only surfaces its related-project thumbnails while the
  // visitor is hovering or keyboard-focusing it — keeps ambient noise away
  // from the headline without deleting the interaction.
  const [railEngaged, setRailEngaged] = useState(false);

  const marqueeContainerRef = useRef<HTMLDivElement>(null);
  const autoActiveRef = useRef<number | null>(null);
  const railLeaveTimeoutRef = useRef<number | null>(null);

  const engageRail = () => {
    if (railLeaveTimeoutRef.current) {
      window.clearTimeout(railLeaveTimeoutRef.current);
      railLeaveTimeoutRef.current = null;
    }
    setRailEngaged(true);
  };

  // Small delay so the thumbnails survive the mouse travelling between the
  // rail and the thumbnail column (they are separate absolute containers).
  const disengageRail = () => {
    if (railLeaveTimeoutRef.current) window.clearTimeout(railLeaveTimeoutRef.current);
    railLeaveTimeoutRef.current = window.setTimeout(() => setRailEngaged(false), 180);
  };

  useEffect(() => () => {
    if (railLeaveTimeoutRef.current) window.clearTimeout(railLeaveTimeoutRef.current);
  }, []);

  // Track which marquee pill is centered. The marquee drifts on a 30s CSS
  // animation, so polling a few times a second is plenty — a per-frame rAF
  // loop here forced layout reads (getBoundingClientRect) at 60fps for the
  // whole session, including while the hero was hidden. Only runs while the
  // rail is engaged, since that's the only time the result is visible.
  useEffect(() => {
    if (!active || activeSkillId || !railEngaged) return;

    const updateAutoActive = () => {
      if (!marqueeContainerRef.current) return;
      const containerRect = marqueeContainerRef.current.getBoundingClientRect();
      const containerCenterY = containerRect.top + containerRect.height / 2;

      const pills = marqueeContainerRef.current.querySelectorAll('.skill-pill');
      let closestId: number | null = null;
      let minDistance = Infinity;

      pills.forEach((pill) => {
        const rect = pill.getBoundingClientRect();
        const pillCenterY = rect.top + rect.height / 2;
        const distance = Math.abs(pillCenterY - containerCenterY);

        if (distance < minDistance) {
          minDistance = distance;
          closestId = Number(pill.getAttribute('data-skill-id'));
        }
      });

      if (closestId !== null && closestId !== autoActiveRef.current && minDistance < 100) {
        autoActiveRef.current = closestId;
        setAutoActiveSkillId(closestId);
      }
    };

    updateAutoActive();
    const intervalId = window.setInterval(updateAutoActive, 200);
    return () => window.clearInterval(intervalId);
  }, [activeSkillId, active, railEngaged]);

  // Computed property for easy access
  const skillExpanded = activeSkillId !== null;

  const handleManualClose = () => {
    setActiveSkillId(null);
  };

  const handleActiveNodeChange = (nodeId: number | null) => {
    setActiveSkillId(nodeId);
  };

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
      <div className={`relative z-50 w-full max-w-[820px] px-6 transition-all duration-500 ${skillExpanded ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 pointer-events-auto'}`}>
        <div className="absolute inset-x-2 -top-12 -bottom-8 rounded-[3rem] bg-black/55 blur-3xl -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center"
        >
          <h1
            className="text-2xl md:text-3xl font-normal tracking-tight text-white/95 mb-2 md:mb-3"
            style={{ textShadow: '0 10px 26px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.55)' }}
          >
            Adi Agarwal
          </h1>
          <p
            className="text-[2.65rem] leading-[1.04] sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight text-white"
            style={{ textShadow: '0 18px 42px rgba(0,0,0,0.62), 0 3px 10px rgba(0,0,0,0.6)' }}
          >
            I make AI <span className="font-normal">tangible</span>.
          </p>
          <p
            className="mx-auto mt-3 md:mt-4 max-w-[36rem] text-sm md:text-base text-white/72 leading-relaxed"
            style={{ textShadow: '0 6px 18px rgba(0,0,0,0.55)' }}
          >
            Product designer &amp; engineer — I turn invisible models into interfaces, devices, and services people can see, feel, and trust.
          </p>

          <div className="mt-5 md:mt-7 flex flex-wrap items-center justify-center gap-2.5 md:gap-3">
            <button
              type="button"
              onClick={handleViewWork}
              className="group inline-flex items-center gap-2 rounded-full bg-[#E5E55A] px-5 py-2.5 md:px-6 md:py-3 text-sm md:text-base font-semibold text-[#141600] shadow-[0_14px_40px_rgba(229,229,90,0.26)] transition-all duration-300 hover:bg-[#f0f570] hover:shadow-[0_18px_48px_rgba(229,229,90,0.38)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80"
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

      {/* BUILD RECEIPTS — demoted from a full widget stack to two quiet chips
          in the corner. The full story lives on the GitHub repo it links to. */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.6, ease: "easeOut" }}
        className="hidden lg:flex absolute left-8 xl:left-12 bottom-10 z-40 pointer-events-auto"
      >
        <GitHubActivity variant="inline" />
      </motion.div>

      {/* HIGHLIGHTED SKILL PROJECTS PREVIEW — reveal-on-engagement only, so the
          thumbnails don't cycle next to the headline while nobody is looking. */}
      <div
        onMouseEnter={engageRail}
        onMouseLeave={disengageRail}
        className="hidden md:flex flex-col absolute right-[18rem] lg:right-[19rem] xl:right-[22rem] top-1/2 -translate-y-1/2 z-30 h-[260px] lg:h-[340px] w-48 lg:w-56 overflow-hidden pointer-events-none pr-4 justify-center scale-90 origin-right transition-all duration-300"
        style={{
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
          maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
        }}
      >
        <div className="relative w-full flex flex-col justify-center items-end">
          <AnimatePresence>
            {railEngaged && autoActiveSkillId && !activeSkillId && (
              <motion.div
                key={autoActiveSkillId}
                initial={{ opacity: 0, y: 30, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -30, filter: 'blur(4px)' }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="flex flex-col gap-3 items-end absolute w-full"
              >
                {skillProjectMapping[autoActiveSkillId]?.projects.slice(0, 3).map((project, idx) => (
                  <button
                    key={project.id + idx}
                    onClick={() => {
                      if (!activeSkillId) {
                        window.dispatchEvent(new CustomEvent('openProject', { detail: { id: project.id, type: project.type } }));
                      }
                    }}
                    className="flex items-center gap-3 justify-end opacity-70 hover:opacity-100 transition-opacity cursor-pointer pointer-events-auto group w-full text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80"
                  >
                    <div className="text-right">
                      <p
                        className="text-xs lg:text-sm text-white font-medium whitespace-nowrap group-hover:text-purple-300 transition-colors"
                        style={{ textShadow: '0 4px 14px rgba(0,0,0,0.65)' }}
                      >
                        {project.title}
                      </p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg overflow-hidden border border-white/10 shrink-0 shadow-lg bg-neutral-900 group-hover:border-white/30 transition-colors">
                      <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT WING - Vertical Skills List Desktop. Shrunk + dimmed until
          hovered/focused so it reads as texture, not a competing menu. */}
      <div
        onMouseEnter={engageRail}
        onMouseLeave={disengageRail}
        onFocus={engageRail}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) disengageRail();
        }}
        className="hidden md:flex absolute right-16 xl:right-24 top-1/2 -translate-y-1/2 z-40 h-[260px] lg:h-[340px] w-56 lg:w-64 md:scale-[0.85] lg:scale-90 origin-right opacity-90 transition-opacity duration-300 hover:opacity-100 focus-within:opacity-100"
      >

        <motion.div
          ref={marqueeContainerRef}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
          className={`relative flex flex-col items-end w-full h-full overflow-hidden pointer-events-none ${(skillExpanded || !active) ? 'skills-paused' : ''}`}
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
            maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
          }}
        >
          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes verticalMarquee {
              0% { transform: translateY(0); }
              100% { transform: translateY(calc(-50% - 12px)); }
            }
            .animate-vertical-marquee {
              animation: verticalMarquee 30s linear infinite;
            }
            .animate-vertical-marquee:hover, .animate-vertical-marquee:focus-within, .skills-paused .animate-vertical-marquee {
              animation-play-state: paused;
            }
            @media (prefers-reduced-motion: reduce) {
              .animate-vertical-marquee { animation: none; }
            }
          `}} />
          <div className="flex flex-col gap-4 lg:gap-5 items-end w-full animate-vertical-marquee pointer-events-auto py-4 pr-8">
            {[...skillsTimelineData, ...skillsTimelineData].map((skill, index) => {
              const isActive = activeSkillId === skill.id || (!activeSkillId && railEngaged && autoActiveSkillId === skill.id);
              return (
                <motion.div
                  key={`${skill.id}-${index}`}
                  className="skill-pill flex"
                  data-skill-id={skill.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + (index % 5) * 0.1, duration: 0.5 }}
                >
                  <button
                    onClick={() => handleActiveNodeChange(skill.id)}
                    aria-expanded={activeSkillId === skill.id}
                    className="group flex items-center gap-3 text-right pointer-events-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80"
                  >
                    <span
                      className={`text-xs lg:text-sm font-medium tracking-wider transition-all duration-300 ${isActive ? "text-white" : "text-white/70 group-hover:text-white"}`}
                      style={{ textShadow: '0 4px 14px rgba(0,0,0,0.6)' }}
                    >
                      {skill.title}
                    </span>
                    <div className={`relative w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center transition-all duration-300 border backdrop-blur-md shadow-xl ${isActive ? "bg-white text-black border-white shadow-white/30 scale-110" : "bg-black/40 text-white/60 border-white/15 hover:border-white/50 hover:bg-black/60 hover:text-white hover:scale-105"}`}>
                      <skill.icon size={17} className={isActive ? "" : "opacity-70 group-hover:opacity-100"} />
                      {isActive && (
                        <div className="absolute inset-0 rounded-full bg-white/20 blur-md pointer-events-none" />
                      )}
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* VISUAL ELEMENT - Secondary */}
      <div className={`relative w-[260px] h-[260px] md:w-[340px] md:h-[340px] lg:w-[440px] lg:h-[440px] flex items-center justify-center transition-all duration-500 max-w-[56vw] ${skillExpanded ? 'opacity-100' : 'opacity-90'}`}>

        {/* Avatar Orbit Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Orbit ring */}
          <motion.div
            className="absolute rounded-full border border-white/10"
            initial={false}
            animate={{
              width: isAvatarHovered ? '95%' : '75%',
              height: isAvatarHovered ? '95%' : '75%'
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />

          {/* Second orbit ring for depth */}
          <motion.div
            className="absolute rounded-full border border-white/5"
            initial={false}
            animate={{
              width: isAvatarHovered ? '100%' : '80%',
              height: isAvatarHovered ? '100%' : '80%'
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>

        <motion.div
          className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
          animate={active ? {
            x: [0, 5, 1, -4, 0],
            y: [0, -12, -7, -14, 0],
          } : { x: 0, y: 0 }}
          transition={{
            x: { duration: 4.6, repeat: Infinity, ease: "easeInOut" },
            y: { duration: 4.6, repeat: Infinity, ease: "easeInOut" },
          }}
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
              scale: active ? [1, 1.028, 1.014, 1] : 1,
              rotate: active ? [0, 0.9, 0.25, -0.7, 0] : 0,
              opacity: skillExpanded ? 1 : 0.98,
            }}
            transition={{
              scale: { duration: 4.6, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 4.6, repeat: Infinity, ease: "easeInOut" },
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

        {/* EXPANDED SKILL CARD - PORTAL FIX */}
        {activeSkillId && typeof document !== 'undefined' && (
          <SkillOverlay activeSkillId={activeSkillId} onClose={handleManualClose} />
        )}

      </div>

      {/* MOBILE SKILLS ROW — demoted to a quiet footer strip below the avatar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" }}
        className="flex md:hidden flex-wrap justify-center gap-1.5 w-full px-6 relative z-40 pointer-events-auto mb-8"
      >
        {skillsTimelineData.map((skill) => (
          <button
            key={skill.id}
            onClick={() => handleActiveNodeChange(skill.id)}
            aria-expanded={activeSkillId === skill.id}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-md transition-all duration-300 ${activeSkillId === skill.id ? "bg-white text-black border-white shadow-lg shadow-white/30" : "bg-black/35 text-white/60 border-white/15"}`}
          >
            <skill.icon size={12} />
            <span className="text-[11px] font-medium tracking-wide">{skill.title}</span>
          </button>
        ))}
      </motion.div>

      {/* Desktop spacer so justify-between keeps the avatar off the bottom edge */}
      <div className="hidden md:block h-8" aria-hidden="true" />
    </div>
  );
};

export default Hero;

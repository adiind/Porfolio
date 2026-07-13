
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { USER_IMAGE_URL } from '../constants';
import { Mail, Copy, Check, BarChart3, Code, Palette, Cpu, Printer, X, Zap, Link, ArrowRight } from 'lucide-react';
import GitHubActivity from './GitHubActivity';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDialogA11y } from '../hooks/useDialogA11y';

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
const matBounds = {
  x: 58,
  y: 58,
  width: 984,
  height: 644,
  unitX: 984 / 50,
  unitY: 644 / 35,
} as const;

const matHorizontalUnits = Array.from({ length: 51 }, (_, index) => index);
const matVerticalUnits = Array.from({ length: 36 }, (_, index) => index);
const matMajorXUnits = matHorizontalUnits.filter(unit => unit % 5 === 0);
const matMajorYUnits = matVerticalUnits.filter(unit => unit % 5 === 0);
const matAngles = [15, 30, 45, 60] as const;
const matRadii = [180, 320, 500] as const;
const matCutMarks = [
  { x1: 210, y1: 290, x2: 356, y2: 266 },
  { x1: 690, y1: 314, x2: 845, y2: 338 },
  { x1: 250, y1: 456, x2: 416, y2: 430 },
  { x1: 652, y1: 542, x2: 835, y2: 528 },
] as const;

const CuttingMatSurface: React.FC<{ active?: boolean }> = ({ active = true }) => {
  const originX = matBounds.x;
  const originY = matBounds.y + matBounds.height;

  return (
    <motion.div
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
        viewBox="0 0 1100 760"
        preserveAspectRatio="none"
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

        <rect width="1100" height="760" rx="34" fill="url(#matFill)" />
        <rect width="1100" height="760" rx="34" fill="url(#matLight)" />
        <rect x="22" y="22" width="1056" height="716" rx="27" fill="none" stroke="rgba(229,229,90,0.34)" strokeWidth="1.15" vectorEffect="non-scaling-stroke" />
        <rect x="38" y="38" width="1024" height="684" rx="19" fill="none" stroke="rgba(229,229,90,0.18)" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />

        <g>
          {matHorizontalUnits.map((unit) => {
            const x = matBounds.x + unit * matBounds.unitX;
            const isMajor = unit % 5 === 0;
            return (
              <line
                key={`mat-v-${unit}`}
                x1={x}
                y1={matBounds.y}
                x2={x}
                y2={matBounds.y + matBounds.height}
                stroke={isMajor ? 'rgba(229,229,90,0.46)' : 'rgba(229,229,90,0.16)'}
                strokeWidth={isMajor ? 1 : 0.55}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {matVerticalUnits.map((unit) => {
            const y = matBounds.y + unit * matBounds.unitY;
            const isMajor = unit % 5 === 0;
            return (
              <line
                key={`mat-h-${unit}`}
                x1={matBounds.x}
                y1={y}
                x2={matBounds.x + matBounds.width}
                y2={y}
                stroke={isMajor ? 'rgba(229,229,90,0.46)' : 'rgba(229,229,90,0.16)'}
                strokeWidth={isMajor ? 1 : 0.55}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </g>

        <g stroke="rgba(229,229,90,0.38)" strokeLinecap="round" vectorEffect="non-scaling-stroke">
          {matHorizontalUnits.map((unit) => {
            const x = matBounds.x + unit * matBounds.unitX;
            const tick = unit % 5 === 0 ? 13 : 8;
            return (
              <React.Fragment key={`mat-x-tick-${unit}`}>
                <line x1={x} y1="36" x2={x} y2={36 + tick} strokeWidth={unit % 5 === 0 ? 1 : 0.7} />
                <line x1={x} y1="724" x2={x} y2={724 - tick} strokeWidth={unit % 5 === 0 ? 1 : 0.7} />
              </React.Fragment>
            );
          })}
          {matVerticalUnits.map((unit) => {
            const y = matBounds.y + unit * matBounds.unitY;
            const tick = unit % 5 === 0 ? 13 : 8;
            return (
              <React.Fragment key={`mat-y-tick-${unit}`}>
                <line x1="36" y1={y} x2={36 + tick} y2={y} strokeWidth={unit % 5 === 0 ? 1 : 0.7} />
                <line x1="1064" y1={y} x2={1064 - tick} y2={y} strokeWidth={unit % 5 === 0 ? 1 : 0.7} />
              </React.Fragment>
            );
          })}
        </g>

        <g fill="rgba(237,241,116,0.6)" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="9" fontWeight="700">
          {matMajorXUnits.map((unit) => {
            const x = matBounds.x + unit * matBounds.unitX;
            return (
              <React.Fragment key={`mat-x-label-${unit}`}>
                <text x={x} y="28" textAnchor="middle">{unit}</text>
                <text x={x} y="744" textAnchor="middle">{unit}</text>
              </React.Fragment>
            );
          })}
          {matMajorYUnits.map((unit) => {
            const y = matBounds.y + unit * matBounds.unitY + 3;
            return (
              <React.Fragment key={`mat-y-label-${unit}`}>
                <text x="26" y={y} textAnchor="middle">{unit}</text>
                <text x="1074" y={y} textAnchor="middle">{unit}</text>
              </React.Fragment>
            );
          })}
        </g>

        <g stroke="rgba(229,229,90,0.34)" strokeWidth="0.85" strokeDasharray="3 5" fill="none" vectorEffect="non-scaling-stroke">
          {matAngles.map((angle) => {
            const radians = angle * Math.PI / 180;
            const length = 675;
            const endX = originX + Math.cos(radians) * length;
            const endY = originY - Math.sin(radians) * length;
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

          {matRadii.map(radius => (
            <path
              key={`mat-radius-${radius}`}
              d={`M ${originX + radius} ${originY} A ${radius} ${radius} 0 0 0 ${originX} ${originY - radius}`}
              stroke="rgba(229,229,90,0.28)"
              strokeDasharray="none"
            />
          ))}
        </g>

        <g stroke="rgba(0,0,0,0.28)" strokeWidth="1" strokeLinecap="round" vectorEffect="non-scaling-stroke">
          {matCutMarks.map((mark, index) => (
            <line key={`mat-cut-${index}`} x1={mark.x1} y1={mark.y1} x2={mark.x2} y2={mark.y2} />
          ))}
        </g>

        <g fill="rgba(237,241,116,0.5)" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontWeight="800" letterSpacing="3">
          <text x="64" y="682" fontSize="10">SELF-HEALING CUTTING MAT</text>
          <text x="64" y="700" fontSize="8" fill="rgba(237,241,116,0.34)">A2 GRID / 10 MM / 15-60 DEGREE GUIDES</text>
          <text x="914" y="83" fontSize="8" textAnchor="middle" fill="rgba(237,241,116,0.34)">ADI AGARWAL / WORKSHOP GRID</text>
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
  /** False when the hero is hidden behind the timeline — pauses its ambient
   *  animations so they don't steal frame budget from the visible sections. */
  active?: boolean;
}

// Inline chip component for sentence-integrated keywords
const InlineChip: React.FC<{
  label: string;
  description: string;
  color: 'indigo' | 'emerald' | 'amber' | 'rose';
  delay: number;
}> = ({ label, description, color, delay }) => {
  const colorStyles = {
    indigo: 'bg-indigo-500/20 text-indigo-200 border-indigo-500/40 hover:bg-indigo-500/40 hover:border-indigo-400/60',
    emerald: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40 hover:bg-emerald-500/40 hover:border-emerald-400/60',
    amber: 'bg-amber-500/20 text-amber-200 border-amber-500/40 hover:bg-amber-500/40 hover:border-amber-400/60',
    rose: 'bg-rose-500/20 text-rose-200 border-rose-500/40 hover:bg-rose-500/40 hover:border-rose-400/60',
  };

  return (
    <motion.span
      className="group relative inline-block"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <span
        className={`px-2.5 py-1 rounded-full border text-sm md:text-base lg:text-lg font-semibold cursor-default transition-all duration-300 inline-block ${colorStyles[color]}`}
      >
        {label}
      </span>

      {/* Hover tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/95 backdrop-blur-lg border border-white/20 rounded-lg text-xs text-white/80 w-52 text-center opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none transform scale-95 group-hover:scale-100 shadow-xl z-50">
        {description}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
          <div className="border-4 border-transparent border-t-black/95"></div>
        </div>
      </div>
    </motion.span>
  );
};

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

const Hero: React.FC<Props> = ({ onOpenProfile, active = true }) => {

  const [activeSkillId, setActiveSkillId] = useState<number | null>(null);
  const [autoActiveSkillId, setAutoActiveSkillId] = useState<number | null>(null);
  const [hoveredKeyword, setHoveredKeyword] = useState<string | null>(null);
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);

  const marqueeContainerRef = useRef<HTMLDivElement>(null);
  const autoActiveRef = useRef<number | null>(null);

  // Track which marquee pill is centered. The marquee drifts on a 30s CSS
  // animation, so polling a few times a second is plenty — a per-frame rAF
  // loop here forced layout reads (getBoundingClientRect) at 60fps for the
  // whole session, including while the hero was hidden.
  useEffect(() => {
    if (!active || activeSkillId) return;

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
  }, [activeSkillId, active]);

  // Computed property for easy access
  const skillExpanded = activeSkillId !== null;

  const handleManualClose = () => {
    setActiveSkillId(null);
  };

  const handleActiveNodeChange = (nodeId: number | null) => {
    setActiveSkillId(nodeId);
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "completed":
        return "text-white bg-black border-white";
      case "in-progress":
        return "text-black bg-white border-black";
      case "pending":
        return "text-white bg-black/40 border-white/50";
      default:
        return "text-white bg-black/40 border-white/50";
    }
  };



  // Keyword definitions for hover explanations
  const keywords = [
    { id: 'human-centered', label: 'Human-centered', description: 'I design for real people, not personas. Every decision starts with understanding user needs.' },
    { id: 'data-driven', label: 'Data-driven', description: 'I validate ideas with research and measure outcomes to inform design decisions.' },
    { id: 'design-thinking', label: 'Design thinking', description: 'I use iterative cycles of research, ideation, prototyping, and testing.' },
    { id: 'development', label: 'Hands-on development', description: 'I build what I design — from code to hardware to physical prototypes.' },
  ];


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

      {/* HERO TEXT BLOCK - Compact, one thought */}
      <div className={`relative z-50 w-full max-w-[760px] px-6 transition-all duration-500 ${skillExpanded ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 pointer-events-auto'}`}>
        <div className="absolute inset-x-6 -top-10 h-40 md:h-48 rounded-full bg-black/52 blur-3xl -z-10" />
        <div className="absolute inset-x-20 -top-4 h-20 md:h-24 rounded-full border border-white/10 bg-white/[0.04] blur-xl -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center"
        >
          <h1
            className="text-5xl md:text-7xl font-light tracking-tight text-white mb-1"
            style={{ textShadow: '0 18px 42px rgba(0,0,0,0.62), 0 3px 10px rgba(0,0,0,0.6)' }}
          >
            Adi <span className="font-normal">Agarwal</span>
          </h1>
          <p
            className="text-[10px] md:text-xs text-white/70 uppercase tracking-[0.25em] font-normal mb-0"
            style={{ textShadow: '0 6px 18px rgba(0,0,0,0.5)' }}
          >
            Tangible AI · Product Design · Creative Technology
          </p>
        </motion.div>
      </div>

      {/* FLOATING GITHUB WIDGET - Left wing on desktop, hidden on mobile */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
        className="hidden md:flex md:w-auto absolute left-4 lg:left-12 xl:left-24 top-1/2 -translate-y-1/2 z-40 justify-start scale-90 md:scale-100 origin-top"
      >
        <motion.div
          animate={active ? { y: [0, -5, 0] } : { y: 0 }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <GitHubActivity variant="compact" />
        </motion.div>
      </motion.div>

      {/* HIGHLIGHTED SKILL PROJECTS PREVIEW */}
      <div
        className="hidden md:flex flex-col absolute right-[15rem] lg:right-[18rem] xl:right-[22rem] top-1/2 -translate-y-1/2 z-30 h-[280px] lg:h-[400px] w-48 lg:w-56 overflow-hidden pointer-events-none pr-4 justify-center scale-85 md:scale-90 lg:scale-100 origin-right transition-all duration-300"
        style={{
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
          maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
        }}
      >
        <div className="relative w-full flex flex-col justify-center items-end">
          <AnimatePresence>
            {autoActiveSkillId && !activeSkillId && (
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

      {/* RIGHT WING - Vertical Skills List Desktop */}
      <div className="hidden md:flex absolute right-0 lg:right-8 xl:right-16 top-1/2 -translate-y-1/2 z-40 h-[280px] lg:h-[400px] w-60 lg:w-72 scale-85 md:scale-90 lg:scale-100 origin-right">

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
          <div className="flex flex-col gap-5 lg:gap-6 items-end w-full animate-vertical-marquee pointer-events-auto py-4 pr-8">
            {[...skillsTimelineData, ...skillsTimelineData].map((skill, index) => {
              const isActive = activeSkillId === skill.id || (!activeSkillId && autoActiveSkillId === skill.id);
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
                    className="group flex items-center gap-4 text-right pointer-events-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80"
                  >
                    <span
                      className={`text-sm lg:text-base font-medium tracking-wider transition-all duration-300 ${isActive ? "text-white" : "text-white/55 group-hover:text-white/85"}`}
                      style={{ textShadow: '0 4px 14px rgba(0,0,0,0.6)' }}
                    >
                      {skill.title}
                    </span>
                    <div className={`relative w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center transition-all duration-300 border backdrop-blur-md shadow-xl ${isActive ? "bg-white text-black border-white shadow-white/30 scale-110" : "bg-black/40 text-white/70 border-white/20 hover:border-white/50 hover:bg-black/60 hover:text-white hover:scale-105"}`}>
                      <skill.icon size={20} className={isActive ? "" : "opacity-70 group-hover:opacity-100"} />
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

      {/* MOBILE SKILLS ROW - Visible only on small screens */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
        className="flex md:hidden flex-wrap justify-center gap-2 w-full px-4 relative z-40 pointer-events-auto mt-4 mb-2"
      >
        {skillsTimelineData.map((skill) => (
          <button
            key={skill.id}
            onClick={() => handleActiveNodeChange(skill.id)}
            aria-expanded={activeSkillId === skill.id}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md transition-all duration-300 ${activeSkillId === skill.id ? "bg-white text-black border-white shadow-lg shadow-white/30" : "bg-black/40 text-white/70 border-white/20"}`}
          >
            <skill.icon size={14} />
            <span className="text-xs font-medium tracking-wider">{skill.title}</span>
          </button>
        ))}
      </motion.div>

      {/* VISUAL ELEMENT - Secondary */}
      <div className={`relative w-[300px] h-[300px] md:w-[390px] md:h-[390px] lg:w-[520px] lg:h-[520px] flex items-center justify-center transition-all duration-500 max-w-[56vw] ${skillExpanded ? 'opacity-100' : 'opacity-90'}`}>

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
              animate={{ opacity: 0.9, y: 0 }}
              transition={{ delay: 0.65, duration: 0.5, ease: "easeOut" }}
            >
              <span className="h-px w-3 md:w-5 bg-white/28" />
              <span
                className="whitespace-nowrap text-[9px] sm:text-[10px] md:text-xs uppercase tracking-[0.14em] sm:tracking-[0.18em] text-white/82 font-semibold"
                style={{ textShadow: '0 8px 18px rgba(0,0,0,0.55)' }}
              >
                Double diamond enthusiast
              </span>
              <span className="h-px w-3 md:w-5 bg-white/28" />
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

      {/* Name Display - Now the introduction, hits harder after headline */}
      <motion.div
        className="text-center relative z-20 pointer-events-auto max-w-[700px] px-5 md:px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <div className="absolute inset-x-0 top-1/2 h-28 md:h-36 -translate-y-1/2 rounded-full bg-black/38 blur-3xl -z-10" />
        <p
          className="text-sm sm:text-base md:text-xl lg:text-2xl font-normal text-white leading-snug tracking-tight mb-2 md:whitespace-nowrap"
          style={{ textShadow: '0 10px 26px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.5)' }}
        >
          I make AI tangible.
        </p>


        <span
          className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-white/72 font-normal block mb-6"
          style={{ textShadow: '0 6px 18px rgba(0,0,0,0.5)' }}
        >
          Design fluency for technologists · Technical fluency for designers
        </span>
      </motion.div>
    </div>
  );
};

export default Hero;

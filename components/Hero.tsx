
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { USER_IMAGE_URL } from '../constants';
import { Mail, Copy, Check, BarChart3, Code, Palette, Cpu, Printer, X, Zap, Link, ArrowRight } from 'lucide-react';
import GitHubActivity from './GitHubActivity';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

const matCutMarks = [
  { top: '29%', left: '18%', width: '12%', rotate: '-9deg', opacity: 0.18 },
  { top: '39%', left: '62%', width: '10%', rotate: '12deg', opacity: 0.12 },
  { top: '56%', left: '24%', width: '14%', rotate: '-5deg', opacity: 0.16 },
  { top: '66%', left: '61%', width: '17%', rotate: '7deg', opacity: 0.14 },
  { top: '78%', left: '39%', width: '13%', rotate: '-4deg', opacity: 0.11 },
] as const;

const matDiagonalGuides = [
  { top: '22%', left: '18%', width: '30%', rotate: '-45deg' },
  { top: '24%', left: '57%', width: '22%', rotate: '45deg' },
  { top: '67%', left: '21%', width: '24%', rotate: '45deg' },
  { top: '69%', left: '56%', width: '24%', rotate: '-45deg' },
] as const;

const matRegistrationMarks = [
  { top: '17%', left: '16%' },
  { top: '17%', left: '84%' },
  { top: '83%', left: '16%' },
  { top: '83%', left: '84%' },
] as const;

interface Props {
  onOpenProfile?: () => void;
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

const Hero: React.FC<Props> = ({ onOpenProfile }) => {

  const [activeSkillId, setActiveSkillId] = useState<number | null>(null);
  const [autoActiveSkillId, setAutoActiveSkillId] = useState<number | null>(null);
  const [hoveredKeyword, setHoveredKeyword] = useState<string | null>(null);
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);

  const marqueeContainerRef = useRef<HTMLDivElement>(null);
  const autoActiveRef = useRef<number | null>(null);

  useEffect(() => {
    let frameId: number;
    const updateAutoActive = () => {
      if (marqueeContainerRef.current && !activeSkillId) {
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
      }
      frameId = requestAnimationFrame(updateAutoActive);
    };

    frameId = requestAnimationFrame(updateAutoActive);
    return () => cancelAnimationFrame(frameId);
  }, [activeSkillId]);

  // Computed property for easy access
  const skillExpanded = activeSkillId !== null;

  // History and Escape Key Management
  React.useEffect(() => {
    if (activeSkillId !== null) {
      window.history.pushState({ modal: 'skill' }, '', window.location.href);
    }

    const handlePopState = () => {
      setActiveSkillId(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeSkillId !== null) {
        window.history.back();
      }
    };

    window.addEventListener('popstate', handlePopState);
    if (activeSkillId !== null) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (activeSkillId !== null) {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [activeSkillId]);

  const handleManualClose = () => {
    window.history.back();
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(92,139,86,0.12),transparent_38%),linear-gradient(180deg,#040504_0%,#050505_38%,#020302_100%)]" />

        <div className="absolute left-1/2 top-[55%] h-[82vh] min-h-[580px] w-[101vw] max-w-[1360px] -translate-x-1/2 -translate-y-1/2">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: [0, -6, 0], rotate: [-0.95, -0.58, -0.95] }}
            transition={{
              opacity: { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] },
              scale: { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] },
              y: { duration: 12, repeat: Infinity, ease: 'easeInOut' },
              rotate: { duration: 12, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="relative h-full w-full rounded-[1.85rem] md:rounded-[2.35rem]"
            style={{
              background: `
                linear-gradient(180deg, rgba(28,53,31,0.28) 0%, transparent 12%, transparent 86%, rgba(18,34,21,0.28) 100%),
                radial-gradient(circle at 18% 16%, rgba(255,255,255,0.13), transparent 22%),
                radial-gradient(circle at 82% 24%, rgba(255,255,255,0.07), transparent 20%),
                linear-gradient(146deg, rgba(102,139,93,0.98) 0%, rgba(83,121,76,0.985) 28%, rgba(70,105,66,0.985) 58%, rgba(54,82,52,0.99) 100%)
              `,
              boxShadow: '0 42px 140px rgba(0, 0, 0, 0.5), inset 0 -30px 54px rgba(11, 24, 13, 0.34), inset 0 0 0 1px rgba(15, 27, 16, 0.46)',
            }}
          >
            <div
              className="absolute inset-[10px] md:inset-4 rounded-[1.5rem] md:rounded-[2.05rem] border border-black/16"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.03), transparent 18%, transparent 82%, rgba(0,0,0,0.08))',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.015), inset 0 18px 32px rgba(255,255,255,0.015), inset 0 -28px 52px rgba(0,0,0,0.2)',
              }}
            />

            <div
              className="absolute inset-0 opacity-[0.2] mix-blend-screen"
              style={{
                backgroundImage: `
                  radial-gradient(rgba(255,255,255,0.08) 0.7px, transparent 0.7px),
                  radial-gradient(rgba(0,0,0,0.08) 0.7px, transparent 0.7px),
                  linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px),
                  linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px)
                `,
                backgroundSize: '6px 6px, 6px 6px, 24px 24px, 24px 24px, 120px 120px, 120px 120px',
                backgroundPosition: '0 0, 3px 3px, 0 0, 0 0, 0 0, 0 0',
              }}
            />

            <div className="absolute inset-x-0 top-0 h-[24%] rounded-t-[1.85rem] md:rounded-t-[2.35rem] bg-gradient-to-b from-black/30 via-black/12 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-[28%] rounded-b-[1.85rem] md:rounded-b-[2.35rem] bg-gradient-to-t from-black/34 via-black/14 to-transparent" />
            <div className="absolute inset-y-0 left-0 w-[13%] rounded-l-[1.85rem] md:rounded-l-[2.35rem] bg-gradient-to-r from-black/16 via-black/6 to-transparent" />
            <div className="absolute inset-y-0 right-0 w-[13%] rounded-r-[1.85rem] md:rounded-r-[2.35rem] bg-gradient-to-l from-black/16 via-black/6 to-transparent" />
            <div className="absolute inset-y-[20%] left-[18%] right-[18%] rounded-full bg-black/10 blur-3xl" />

            <div className="absolute inset-8 md:inset-12 rounded-[1.1rem] md:rounded-[1.55rem] border border-white/6 opacity-40" />
            <div className="absolute inset-x-8 md:inset-x-12 top-8 md:top-12 h-7 md:h-8 rounded-full border-y border-white/5 bg-gradient-to-b from-black/18 via-black/[0.07] to-transparent" />
            <div className="absolute inset-x-8 md:inset-x-12 bottom-8 md:bottom-12 h-9 md:h-10 rounded-full border-y border-black/15 bg-gradient-to-t from-black/18 via-black/[0.06] to-transparent" />
            <div className="absolute inset-y-8 md:inset-y-12 left-8 md:left-12 w-8 md:w-9 rounded-full border-x border-white/5 bg-gradient-to-r from-black/18 via-black/[0.06] to-transparent" />
            <div className="absolute inset-y-8 md:inset-y-12 right-8 md:right-12 w-8 md:w-9 rounded-full border-x border-black/15 bg-gradient-to-l from-black/18 via-black/[0.06] to-transparent" />

            <div className="absolute left-12 md:left-16 right-12 md:right-16 top-8 md:top-12 flex justify-between opacity-[0.35]">
              {Array.from({ length: 11 }).map((_, index) => (
                <div key={`top-${index}`} className="flex flex-col items-center gap-1">
                  <div className={`w-px bg-white/35 ${index % 5 === 0 ? 'h-3 md:h-4' : 'h-2 md:h-3'}`} />
                  <span className="text-[7px] md:text-[8px] font-medium tracking-[0.16em] opacity-0">{index}</span>
                </div>
              ))}
            </div>

            <div className="absolute left-12 md:left-16 right-12 md:right-16 bottom-6 md:bottom-8 flex justify-between opacity-50">
              {Array.from({ length: 11 }).map((_, index) => (
                <div key={`bottom-${index}`} className="flex flex-col items-center gap-1">
                  <div className={`w-px bg-black/50 ${index % 5 === 0 ? 'h-3 md:h-4' : 'h-2 md:h-3'}`} />
                  <span className="text-[8px] md:text-[9px] font-medium tracking-[0.16em] text-black/42">{index}</span>
                </div>
              ))}
            </div>

            <div className="absolute top-12 md:top-16 bottom-12 md:bottom-16 right-4 md:right-6 flex flex-col justify-between opacity-[0.38]">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={`right-${index}`} className="flex items-center justify-end gap-1.5">
                  <div className={`bg-black/40 ${index % 3 === 0 ? 'w-3 md:w-4 h-px' : 'w-2.5 md:w-3 h-px'}`} />
                </div>
              ))}
            </div>

            <div className="absolute top-12 md:top-16 bottom-12 md:bottom-16 left-4 md:left-6 flex flex-col justify-between opacity-50">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <div className={`bg-white/26 ${index % 3 === 0 ? 'w-3 md:w-4 h-px' : 'w-2.5 md:w-3 h-px'}`} />
                  <span className="text-[8px] md:text-[9px] font-medium tracking-[0.12em] text-white/32">{index * 5}</span>
                </div>
              ))}
            </div>

            {matRegistrationMarks.map((mark, index) => (
              <div
                key={`registration-${index}`}
                className="absolute h-4 w-4 md:h-5 md:w-5 -translate-x-1/2 -translate-y-1/2 opacity-[0.45]"
                style={{ top: mark.top, left: mark.left }}
              >
                <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-white/25" />
                <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-white/25" />
                <div className="absolute inset-[3px] rounded-full border border-white/18" />
              </div>
            ))}

            {matDiagonalGuides.map((line, index) => (
              <div
                key={`guide-${index}`}
                className="absolute h-px rounded-full bg-white/18"
                style={{
                  top: line.top,
                  left: line.left,
                  width: line.width,
                  transform: `rotate(${line.rotate})`,
                }}
              />
            ))}

            {matCutMarks.map((scratch, index) => (
              <div
                key={index}
                className="absolute h-px rounded-full"
                style={{
                  top: scratch.top,
                  left: scratch.left,
                  width: scratch.width,
                  transform: `rotate(${scratch.rotate})`,
                  background: `rgba(0, 0, 0, ${scratch.opacity})`,
                  boxShadow: '0 1px 0 rgba(255,255,255,0.05)',
                }}
              />
            ))}

            <div className="absolute left-8 bottom-[3.9rem] hidden max-w-[44%] md:left-12 md:bottom-12 md:block md:max-w-none">
              <div className="text-[10px] uppercase tracking-[0.32em] text-black/38">
                Self-Healing Cutting Mat
              </div>
              <div className="mt-1 text-[9px] uppercase tracking-[0.24em] text-black/30">
                A2 Grid · 10 mm · 45° / 60° Guides
              </div>
            </div>

            <div className="absolute right-8 top-8 hidden text-[8px] md:block md:right-12 md:top-12 md:text-[9px] uppercase tracking-[0.3em] text-white/22">
              Shop Surface 01
            </div>
          </motion.div>
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
          <h2
            className="text-5xl md:text-7xl font-light tracking-tight text-white mb-1"
            style={{ textShadow: '0 18px 42px rgba(0,0,0,0.62), 0 3px 10px rgba(0,0,0,0.6)' }}
          >
            Adi <span className="font-normal">Agarwal</span>
          </h2>
          <p
            className="text-[10px] md:text-xs text-white/70 uppercase tracking-[0.25em] font-normal mb-0"
            style={{ textShadow: '0 6px 18px rgba(0,0,0,0.5)' }}
          >
            Product · Engineering · Data · Design
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
          animate={{ y: [0, -5, 0] }}
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
                    className="flex items-center gap-3 justify-end opacity-70 hover:opacity-100 transition-opacity cursor-pointer pointer-events-auto group w-full text-right outline-none"
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
          className={`relative flex flex-col items-end w-full h-full overflow-hidden pointer-events-none ${skillExpanded ? 'skills-paused' : ''}`}
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
            .animate-vertical-marquee:hover, .skills-paused .animate-vertical-marquee {
              animation-play-state: paused;
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
                    className="group flex items-center gap-4 text-right pointer-events-auto"
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

        {/* Avatar - Clear Clickable Affordance */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: [1, 1.028, 1.014, 1],
            x: [0, 5, 1, -4, 0],
            y: [0, -12, -7, -14, 0],
            rotate: [0, 0.9, 0.25, -0.7, 0],
            opacity: skillExpanded ? 1 : 0.98,
          }}
          transition={{
            scale: { duration: 4.6, repeat: Infinity, ease: "easeInOut" },
            x: { duration: 4.6, repeat: Infinity, ease: "easeInOut" },
            y: { duration: 4.6, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 4.6, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 0.6, delay: 0.1 }
          }}
          className="group relative z-20 w-[64%] h-[64%] cursor-pointer pointer-events-auto transition-all duration-300"
          onClick={onOpenProfile}
          onMouseEnter={() => setIsAvatarHovered(true)}
          onMouseLeave={() => setIsAvatarHovered(false)}
          whileHover={{ scale: 1.06, y: -8, rotate: 1.2 }}
          whileTap={{ scale: 0.97 }}
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
            alt="Profile"
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

        {/* EXPANDED SKILL CARD - PORTAL FIX */}
        {activeSkillId && typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            <div
              className="fixed inset-0 z-[99999] flex items-start justify-center pt-8 md:pt-16 pointer-events-auto bg-black/80 backdrop-blur-md overflow-y-auto pb-8"
              onClick={handleManualClose}
            >
              <div
                className="relative w-[90%] md:w-[700px] max-w-[700px]"
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
                        <h2 className="text-2xl md:text-3xl font-semibold text-white">
                          {skillsTimelineData.find(i => i.id === activeSkillId)?.title}
                        </h2>
                        <span className="text-xs text-white/40 uppercase tracking-wider">
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
                    <h3 className="text-xs uppercase tracking-widest text-white/40 mb-4">Related Projects</h3>
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
                            handleManualClose();
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
                    handleManualClose();
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleManualClose();
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
        )}

      </div>

      {/* Name Display - Now the introduction, hits harder after headline */}
      <motion.div
        className="text-center relative z-20 pointer-events-auto max-w-[700px] px-2 md:px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <div className="absolute inset-x-0 top-1/2 h-28 md:h-36 -translate-y-1/2 rounded-full bg-black/38 blur-3xl -z-10" />
        <h1
          className="whitespace-nowrap text-[3vw] sm:text-[3.2vw] md:text-xl lg:text-2xl font-normal text-white leading-snug tracking-tighter md:tracking-tight mb-2"
          style={{ textShadow: '0 10px 26px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.5)' }}
        >
          A human-centered, data-driven, design-first product innovator.
        </h1>


        <span
          className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-white/72 font-normal block mb-6"
          style={{ textShadow: '0 6px 18px rgba(0,0,0,0.5)' }}
        >
          Open for Summer 2026 Internships
        </span>
      </motion.div>
    </div>
  );
};

export default Hero;

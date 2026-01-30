
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { USER_IMAGE_URL } from '../constants';
import { Mail, Copy, Check, BarChart3, Code, Palette, Cpu, Printer, X, Zap, Link, ArrowRight } from 'lucide-react';
import RadialOrbitalTimeline from './ui/radial-orbital-timeline';
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
  const [hoveredKeyword, setHoveredKeyword] = useState<string | null>(null);
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);

  // Computed property for easy access
  const skillExpanded = activeSkillId !== null;

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
    <div className="relative flex flex-col items-center justify-between h-full w-full pointer-events-none py-12 md:py-16">

      {/* HERO TEXT BLOCK - Compact, one thought */}
      <div className={`relative z-50 w-full max-w-[700px] px-6 transition-all duration-500 ${skillExpanded ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 pointer-events-auto'}`}>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center"
        >
          <h2 className="text-5xl md:text-7xl font-light tracking-tight text-white/95 mb-1">
            Adi <span className="font-normal">Agarwal</span>
          </h2>
          <p className="text-[10px] md:text-xs text-white/35 uppercase tracking-[0.25em] font-normal mb-0">
            Product · Engineering · Data · Design
          </p>
        </motion.div>
      </div>

      {/* VISUAL ELEMENT - Secondary */}
      <div className={`relative w-[360px] h-[360px] md:w-[480px] md:h-[480px] flex items-center justify-center transition-all duration-500 ${skillExpanded ? 'opacity-100' : 'opacity-75'}`}>

        {/* Radial Orbital Timeline with Skills */}
        <RadialOrbitalTimeline
          timelineData={skillsTimelineData}
          activeNodeId={activeSkillId}
          onActiveNodeChange={handleActiveNodeChange}
          isExpanded={isAvatarHovered}
        >
          {/* Avatar - Clear Clickable Affordance */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: [1, 1.02, 1],
              opacity: 1,
            }}
            transition={{
              scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 0.6, delay: 0.1 }
            }}
            className="group relative z-20 w-[240px] h-[240px] md:w-[320px] md:h-[320px] cursor-pointer pointer-events-auto transition-all duration-300"
            onClick={onOpenProfile}
            onMouseEnter={() => setIsAvatarHovered(true)}
            onMouseLeave={() => setIsAvatarHovered(false)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            {/* Colored gradient glow ring on hover */}
            <div className="absolute inset-[-6px] rounded-full bg-gradient-to-r from-purple-500/0 via-white/0 to-blue-500/0 group-hover:from-purple-500/40 group-hover:via-white/30 group-hover:to-blue-500/40 transition-all duration-500 blur-md" />

            {/* Subtle outer glow - always visible */}
            <div className="absolute inset-[-8px] rounded-full bg-gradient-to-b from-white/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Border ring that appears on hover */}
            <div className="absolute inset-0 rounded-full border-2 border-white/10 group-hover:border-white/30 transition-all duration-300" />

            <img
              src={USER_IMAGE_URL}
              alt="Profile"
              className="w-full h-full object-contain relative z-10 group-hover:brightness-110 transition-all duration-300"
            />

            {/* View Profile CTA - Always visible, enhanced on hover */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 z-20">
              <div className="bg-black/50 group-hover:bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 group-hover:border-white/40 flex items-center gap-2 transition-all duration-300">
                <span className="text-xs md:text-sm text-white/80 group-hover:text-white font-medium">View Profile</span>
                <ArrowRight size={14} className="text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-300" />
              </div>
            </div>
          </motion.div>
        </RadialOrbitalTimeline>

        {/* EXPANDED SKILL CARD - PORTAL FIX */}
        {activeSkillId && typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            <div
              className="fixed inset-0 z-[99999] flex items-start justify-center pt-8 md:pt-16 pointer-events-auto bg-black/80 backdrop-blur-md overflow-y-auto pb-8"
              onClick={() => setActiveSkillId(null)}
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
                            setActiveSkillId(null);
                            // Dispatch custom event to open project
                            window.dispatchEvent(new CustomEvent('openProject', { detail: { id: project.id, type: project.type } }));
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
                    setActiveSkillId(null);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveSkillId(null);
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
        <h1 className="whitespace-nowrap text-[3vw] sm:text-[3.2vw] md:text-xl lg:text-2xl font-normal text-white/95 leading-snug tracking-tighter md:tracking-tight mb-2">
          A human-centered, data-driven, design-first product innovator.
        </h1>


        <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-white/25 font-normal block mb-6">
          Open for Summer 2026 Internships
        </span>
      </motion.div>
    </div>
  );
};

export default Hero;

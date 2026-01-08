
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { USER_IMAGE_URL, SOCIAL_LINKS } from '../constants';
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
  const [copied, setCopied] = useState(false);
  const [activeSkillId, setActiveSkillId] = useState<number | null>(null);
  const [hoveredKeyword, setHoveredKeyword] = useState<string | null>(null);

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

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const email = SOCIAL_LINKS.email.replace('mailto:', '');
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Keyword definitions for hover explanations
  const keywords = [
    { id: 'human-centered', label: 'Human-centered', description: 'I design for real people, not personas. Every decision starts with understanding user needs.' },
    { id: 'data-driven', label: 'Data-driven', description: 'I validate ideas with research and measure outcomes to inform design decisions.' },
    { id: 'design-thinking', label: 'Design thinking', description: 'I use iterative cycles of research, ideation, prototyping, and testing.' },
    { id: 'development', label: 'Hands-on development', description: 'I build what I design — from code to hardware to physical prototypes.' },
  ];


  return (
    <div className="relative flex flex-col items-center justify-start h-full w-full pointer-events-none pt-24 md:pt-20">

      {/* HERO TEXT BLOCK - Compact, one thought */}
      <div className={`relative z-50 w-full max-w-[700px] px-6 transition-all duration-500 ${skillExpanded ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 pointer-events-auto'}`}>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center"
        >
          {/* Primary Headline - No "Hi I'm Adi", name comes below */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-normal text-white/95 leading-snug tracking-tight mb-2">
            A human-centered, data-driven product designer and maker.
          </h1>

          {/* Secondary Descriptor - Tighter gap */}
          <p className="text-base md:text-lg text-white/45 font-light mb-3">
            Blending design thinking with hands-on development.
          </p>

          {/* Keyword Chips - Demoted to annotations, almost invisible */}
          <div className="flex flex-wrap justify-center gap-1.5 mb-2">
            {keywords.map((keyword) => (
              <div
                key={keyword.id}
                className="relative group"
                onMouseEnter={() => setHoveredKeyword(keyword.id)}
                onMouseLeave={() => setHoveredKeyword(null)}
              >
                <span className="px-2 py-0.5 text-[10px] md:text-xs text-white/35 font-normal cursor-default transition-all duration-200 hover:text-white/70 inline-block">
                  {keyword.label}
                </span>

                {/* Tooltip */}
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-neutral-900 border border-white/10 rounded text-[11px] text-white/60 w-52 text-center transition-all duration-200 pointer-events-none z-50 ${hoveredKeyword === keyword.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
                  {keyword.description}
                </div>
              </div>
            ))}
          </div>

          {/* Status only - CTA moved below avatar */}
          <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-white/25 font-normal">
            Open for Summer 2026 Internships
          </span>
        </motion.div>
      </div>

      {/* VISUAL ELEMENT - Secondary */}
      <div className={`relative mt-6 md:mt-8 w-[280px] h-[280px] md:w-[380px] md:h-[380px] flex items-center justify-center transition-all duration-500 ${skillExpanded ? 'opacity-100' : 'opacity-75'}`}>

        {/* Radial Orbital Timeline with Skills */}
        <RadialOrbitalTimeline
          timelineData={skillsTimelineData}
          activeNodeId={activeSkillId}
          onActiveNodeChange={handleActiveNodeChange}
        >
          {/* Avatar - Reduced prominence */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative z-20 w-[180px] h-[180px] md:w-[220px] md:h-[220px] cursor-pointer pointer-events-auto opacity-85 hover:opacity-100 transition-opacity duration-300"
            onClick={onOpenProfile}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <img
              src={USER_IMAGE_URL}
              alt="Profile"
              className="w-full h-full object-contain"
            />
          </motion.div>
        </RadialOrbitalTimeline>

        {/* EXPANDED SKILL CARD - PORTAL FIX */}
        {activeSkillId && typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            <div
              className="fixed inset-0 z-[99999] flex items-start justify-center pt-4 md:pt-10 pointer-events-auto bg-black/60 backdrop-blur-sm"
              onClick={() => setActiveSkillId(null)}
            >
              <div
                className="relative w-[85%] md:w-[600px]"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }} // Keep exit animation
                  transition={{ duration: 0.3 }}
                >
                  <Card className="w-full bg-black/90 backdrop-blur-lg border-white/30 shadow-xl shadow-white/10 overflow-visible">
                    <CardHeader className="pb-1 p-4">
                      <div className="flex justify-between items-center">
                        <Badge
                          className={`px-2 py-0 h-5 text-[10px] ${getStatusStyles(skillsTimelineData.find(i => i.id === activeSkillId)?.status || 'pending')}`}
                        >
                          {skillsTimelineData.find(i => i.id === activeSkillId)?.status === "completed" ? "COMPLETE" : skillsTimelineData.find(i => i.id === activeSkillId)?.status === "in-progress" ? "IN PROGRESS" : "PENDING"}
                        </Badge>
                        <span className="text-[10px] font-mono text-white/50">
                          {skillsTimelineData.find(i => i.id === activeSkillId)?.date}
                        </span>
                      </div>
                      <CardTitle className="text-sm mt-1 text-white">
                        {skillsTimelineData.find(i => i.id === activeSkillId)?.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-white/80 p-4 pt-0">
                      <p className="line-clamp-2 md:line-clamp-none leading-relaxed">{skillsTimelineData.find(i => i.id === activeSkillId)?.content}</p>

                      <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-3">
                        <span className="flex items-center text-white/60 shrink-0 text-[10px] uppercase tracking-wider">
                          <Zap size={10} className="mr-1" />
                          Proficiency
                        </span>
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            style={{ width: `${skillsTimelineData.find(i => i.id === activeSkillId)?.energy || 0}%` }}
                          ></div>
                        </div>
                        <span className="font-mono text-white/80 text-[10px] shrink-0">{skillsTimelineData.find(i => i.id === activeSkillId)?.energy}%</span>
                      </div>

                      {(skillsTimelineData.find(i => i.id === activeSkillId)?.relatedIds.length || 0) > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2">
                          <Link size={10} className="text-white/50 shrink-0" />
                          <div className="flex flex-wrap gap-1">
                            {skillsTimelineData.find(i => i.id === activeSkillId)?.relatedIds.map((relatedId) => {
                              const relatedItem = skillsTimelineData.find(i => i.id === relatedId);
                              return (
                                <button
                                  key={relatedId}
                                  className="flex items-center h-5 px-2 py-0 text-[10px] rounded-sm border border-white/20 bg-transparent hover:bg-white/10 text-white/80 hover:text-white transition-all cursor-pointer pointer-events-auto"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveSkillId(relatedId);
                                  }}
                                >
                                  {relatedItem?.title}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* CLOSE BUTTON - PORTAL VERSION */}
                <button
                  className="absolute -top-5 -right-5 z-[999999] p-2 bg-black rounded-full border border-white/20 text-white shadow-[0_0_15px_rgba(0,0,0,1)] hover:bg-white hover:text-black transition-all cursor-pointer outline-none pointer-events-auto active:scale-95"
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
                  <X size={20} strokeWidth={3} />
                </button>
              </div>
            </div>
          </AnimatePresence>,
          document.body
        )}

      </div>

      {/* Name Display - Now the introduction, hits harder after headline */}
      <motion.div
        className="mt-4 text-center relative z-20 pointer-events-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <h2 className="text-5xl md:text-7xl font-light tracking-tight text-white/95 mb-1">
          Adi <span className="font-normal">Agarwal</span>
        </h2>
        <p className="text-[10px] md:text-xs text-white/35 uppercase tracking-[0.25em] font-normal mb-6">
          Product · Engineering · Data · Design
        </p>

        {/* Terminal CTA - After the story */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-white/40 font-light">Interested in working together?</span>
          <a
            href={SOCIAL_LINKS.email}
            className="px-4 py-1.5 text-sm text-white/60 font-normal transition-all duration-200 hover:text-white/90"
          >
            Let's Chat →
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default Hero;

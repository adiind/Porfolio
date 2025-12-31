
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



const Hero: React.FC<Props> = ({ onOpenProfile }) => {
  const [copied, setCopied] = useState(false);
  const [activeSkillId, setActiveSkillId] = useState<number | null>(null);

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

  /* Removed old handler */

  const pillColors = [
    'bg-indigo-500/20 text-indigo-200 border-indigo-500/30 hover:bg-indigo-500/30',
    'bg-rose-500/20 text-rose-200 border-rose-500/30 hover:bg-rose-500/30',
    'bg-teal-500/20 text-teal-200 border-teal-500/30 hover:bg-teal-500/30',
  ];

  return (
    <div className="relative flex flex-col items-center justify-start h-full w-full pointer-events-none perspective-[1200px] pt-44 md:pt-40">

      {/* Central Interactive Composition */}
      <div className="relative w-[320px] h-[320px] md:w-[480px] md:h-[480px] flex items-center justify-center group/hero">

        {/* SPEECH BUBBLE - centered above head */}
        <div className={`absolute -top-[160px] md:-top-[140px] left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${skillExpanded ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 pointer-events-auto'}`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: { delay: 1.5, type: 'spring' }
            }}
            className="pointer-events-auto cursor-pointer"
            onClick={onOpenProfile}
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              {/* Main bubble */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-[280px] md:w-[360px]">
                <p className="text-white text-sm md:text-base font-medium leading-relaxed mb-3 text-center md:text-left">
                  <span className="text-2xl mr-1">👋</span>
                  Hey I am <span className="font-bold text-white">Adi</span>, welcome to my <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-bold">vibe coded</span> portfolio!
                </p>

                <div className="space-y-3">
                  <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                    Open for Summer 2026 Internships
                  </div>
                  <div className="flex flex-nowrap gap-1">
                    {['Product Management', 'Design', 'Development'].map((role, i) => (
                      <span
                        key={i}
                        className={`px-1.5 py-0.5 rounded-md border text-[8px] md:text-xs transition-colors cursor-default whitespace-nowrap ${pillColors[i % pillColors.length]}`}
                      >
                        {role}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <a
                      href={SOCIAL_LINKS.email}
                      className="flex items-center gap-2 text-xs font-bold text-white/80 hover:text-white transition-colors group"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-1.5 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
                        <Mail size={12} />
                      </div>
                      <span>Let's Chat</span>
                    </a>

                    <button
                      onClick={handleCopyEmail}
                      className="group/copy relative p-1.5 text-white/40 hover:text-white transition-colors"
                    >
                      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black px-2 py-1 rounded text-[10px] opacity-0 group-hover/copy:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">
                        {copied ? 'Copied!' : 'Copy Email'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Speech bubble tail - pointing down towards head */}
              <div className="absolute left-1/2 -bottom-[18px] -translate-x-1/2 drop-shadow-lg">
                <svg width="24" height="20" viewBox="0 0 24 20" fill="none">
                  <path
                    d="M0 0 L24 0 L12 20 Z"
                    fill="rgba(255,255,255,0.1)"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="1"
                  />
                </svg>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Radial Orbital Timeline with Skills */}
        <RadialOrbitalTimeline
          timelineData={skillsTimelineData}
          activeNodeId={activeSkillId}
          onActiveNodeChange={handleActiveNodeChange}
        >
          {/* Main Character (Front) */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "backOut" }}
            className="relative z-20 w-[230px] h-[230px] md:w-[280px] md:h-[280px] filter drop-shadow-[0_30px_60px_rgba(0,0,0,0.5)] cursor-pointer pointer-events-auto"
            onClick={onOpenProfile}
            whileHover={{ scale: 1.2, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Hover Glow Ring */}
            <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl opacity-0 group-hover/hero:opacity-100 transition-opacity duration-500" />

            {/* Gentle Float Animation */}
            <motion.div
              animate={{ y: [-8, 8, -8] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="w-full h-full"
            >
              <img
                src={USER_IMAGE_URL}
                alt="Profile"
                className="w-full h-full object-contain"
              />
            </motion.div>

            {/* Click Hint */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/hero:opacity-100 transition-opacity duration-300 text-[10px] uppercase tracking-widest text-white/50 whitespace-nowrap bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm border border-white/5">
              Click to View Profile
            </div>
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

      {/* Intro Text - moved up closer to character */}
      {/* Intro Text - Staggered Reveal */}
      <div className="mt-16 md:-mt-8 text-center relative z-20 overflow-hidden">
        <motion.h1
          className="text-5xl md:text-8xl font-normal tracking-tight mb-3 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 filter drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)] flex items-center justify-center gap-4"
          initial="hidden"
          animate="visible"
        >
          {/* Adi */}
          <div className="flex">
            {Array.from("Adi").map((char, i) => (
              <motion.span
                key={`adi-${i}`}
                custom={i}
                variants={{
                  hidden: { opacity: 0, y: 50 },
                  visible: (i) => ({
                    opacity: 1,
                    y: 0,
                    transition: {
                      delay: 0.1 + (i * 0.1),
                      duration: 0.8,
                      ease: [0.2, 0.65, 0.3, 0.9],
                    }
                  })
                }}
              >
                {char}
              </motion.span>
            ))}
          </div>

          {/* Agarwal */}
          <div className="flex font-bold">
            {Array.from("Agarwal").map((char, i) => (
              <motion.span
                key={`agarwal-${i}`}
                custom={i + 3} // Offset index
                variants={{
                  hidden: { opacity: 0, y: 50 },
                  visible: (i) => ({
                    opacity: 1,
                    y: 0,
                    transition: {
                      delay: 0.1 + (i * 0.1),
                      duration: 0.8,
                      ease: [0.2, 0.65, 0.3, 0.9],
                    }
                  })
                }}
              >
                {char}
              </motion.span>
            ))}
          </div>
        </motion.h1>

        <motion.p
          className="text-sm md:text-lg text-white/60 uppercase tracking-[0.3em] font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
        >
          Product | Engineering | Data | Design
        </motion.p>
      </div>
    </div>
  );
};

export default Hero;

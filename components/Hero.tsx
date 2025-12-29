
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { USER_IMAGE_URL, SOCIAL_LINKS } from '../constants';
import { Mail, Copy, Check, BarChart3, Code, Palette, Cpu, Printer } from 'lucide-react';
import RadialOrbitalTimeline from './ui/radial-orbital-timeline';

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

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const email = SOCIAL_LINKS.email.replace('mailto:', '');
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pillColors = [
    'bg-indigo-500/20 text-indigo-200 border-indigo-500/30 hover:bg-indigo-500/30',
    'bg-rose-500/20 text-rose-200 border-rose-500/30 hover:bg-rose-500/30',
    'bg-teal-500/20 text-teal-200 border-teal-500/30 hover:bg-teal-500/30',
    'bg-amber-500/20 text-amber-200 border-amber-500/30 hover:bg-amber-500/30',
  ];

  return (
    <div className="relative flex flex-col items-center justify-start h-full w-full pointer-events-none perspective-[1200px] pt-24 md:pt-32">

      {/* Central Interactive Composition */}
      <div className="relative w-[320px] h-[320px] md:w-[480px] md:h-[480px] flex items-center justify-center group/hero">

        {/* SPEECH BUBBLE - positioned to right of head with tail pointing to head */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: 50 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: 0,
            transition: { delay: 1.5, type: 'spring' }
          }}
          className="absolute -top-8 md:-top-4 right-[-280px] md:right-[-340px] z-50 pointer-events-auto cursor-pointer"
          onClick={onOpenProfile}
          whileHover={{ scale: 1.05 }}
        >
          <motion.div
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            {/* Main bubble */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-[320px] md:max-w-md">
              <p className="text-white text-sm md:text-base font-medium leading-relaxed mb-3 whitespace-nowrap">
                <span className="text-2xl mr-1">👋</span>
                Hey I am <span className="font-bold text-white">Adi</span>, welcome to my <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-bold">vibe coded</span> portfolio!
              </p>

              <div className="space-y-3">
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold whitespace-nowrap">
                  Open for Summer 2026 Internships
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['Product Management', 'Design', 'Development', 'Research'].map((role, i) => (
                    <span
                      key={i}
                      className={`px-2 py-1 rounded-md border text-[10px] md:text-xs transition-colors cursor-default ${pillColors[i % pillColors.length]}`}
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

            {/* Speech bubble tail - pointing left towards head */}
            <div className="absolute left-0 top-8 -translate-x-full">
              <svg width="24" height="20" viewBox="0 0 24 20" fill="none" className="drop-shadow-lg">
                <path
                  d="M24 0 L24 20 L0 10 Z"
                  fill="rgba(255,255,255,0.1)"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="1"
                />
              </svg>
            </div>
          </motion.div>
        </motion.div>

        {/* Radial Orbital Timeline with Skills */}
        <RadialOrbitalTimeline timelineData={skillsTimelineData}>
          {/* Main Character (Front) */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "backOut" }}
            className="relative z-20 w-[200px] h-[200px] md:w-[280px] md:h-[280px] filter drop-shadow-[0_30px_60px_rgba(0,0,0,0.5)] cursor-pointer pointer-events-auto"
            onClick={onOpenProfile}
            whileHover={{ scale: 1.05 }}
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


      </div>

      {/* Intro Text - moved up closer to character */}
      {/* Intro Text - Staggered Reveal */}
      <div className="-mt-4 md:-mt-8 text-center relative z-20 overflow-hidden">
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

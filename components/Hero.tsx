
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { USER_IMAGE_URL, SOCIAL_LINKS } from '../constants';
import { Mail, Copy, Check } from 'lucide-react';

interface Props {
  onOpenProfile?: () => void;
}

// 3D Fluent Emoji Assets (High quality, clay/3D style)
const ASSETS = {
  code: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Laptop.png",
  design: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Artist%20Palette.png",
  data: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Chart%20Increasing.png",
  // New 3D Microcontroller/Board Icon for better "Electronics" representation
  electronics: "https://cdn3d.iconscout.com/3d/premium/thumb/microcontroller-5654959-4712959.png", 
  print: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Gear.png"
};

// Expanded orbit layout
const skills = [
  // Top - Adjusted Y to avoid nav bar overlap while maintaining height
  { id: 'code', img: ASSETS.code, label: 'Code', x: 0, y: -290, color: '#6366f1', delay: 0 }, 
  // Sides - Pushed out significantly on X axis
  { id: 'design', img: ASSETS.design, label: 'Design', x: 380, y: -80, color: '#f43f5e', delay: 1 }, 
  { id: 'data', img: ASSETS.data, label: 'Data', x: -380, y: -80, color: '#10b981', delay: 4 }, 
  // Bottom - Pushed down and out
  { id: 'print', img: ASSETS.print, label: '3D Printing', x: 250, y: 260, color: '#f97316', delay: 2 }, 
  { id: 'electronics', img: ASSETS.electronics, label: 'Electronics', x: -250, y: 260, color: '#eab308', delay: 3 }, 
];

const Hero: React.FC<Props> = ({ onOpenProfile }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // Assuming SOCIAL_LINKS.email is "mailto:..."
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
    // Heavily increased pt to push everything down below the nav bar
    <div className="relative flex flex-col items-center justify-center h-full w-full pointer-events-none perspective-[1200px] pt-48 md:pt-64">
      
      {/* Central Interactive Composition */}
      <div className="relative w-[320px] h-[320px] md:w-[480px] md:h-[480px] flex items-center justify-center group/hero">
        
        {/* HELLO MESSAGE BUBBLE */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: 50, y: -50 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            x: 0, 
            y: 0,
            transition: { delay: 1.5, type: 'spring' }
          }}
          className="absolute -top-16 -right-8 md:-right-24 z-50 pointer-events-auto cursor-pointer"
          onClick={onOpenProfile}
          whileHover={{ scale: 1.05 }}
        >
          <motion.div
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-2xl rounded-bl-none shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-[280px] md:max-w-xs relative"
          >
            {/* Arrow */}
            <div className="absolute -bottom-2 left-0 w-4 h-4 bg-white/10 border-b border-l border-white/20 transform -rotate-45 backdrop-blur-xl" />
            
            <p className="text-white text-sm md:text-base font-medium leading-relaxed mb-3">
              <span className="text-2xl mr-1">👋</span> 
              Hey I am <span className="font-bold text-white">Adi</span>, welcome to my <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-bold">vibe coded</span> portfolio!
            </p>
            
            <div className="space-y-3">
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
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

                {/* Hoverable Copy Button */}
                <button
                  onClick={handleCopyEmail}
                  className="group/copy relative p-1.5 text-white/40 hover:text-white transition-colors"
                >
                  {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  
                  {/* Tooltip */}
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black px-2 py-1 rounded text-[10px] opacity-0 group-hover/copy:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">
                    {copied ? 'Copied!' : 'Copy Email'}
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Character (Front) */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "backOut" }}
          className="relative z-20 w-full h-full filter drop-shadow-[0_30px_60px_rgba(0,0,0,0.5)] cursor-pointer pointer-events-auto"
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

        {/* Floating 3D Icons */}
        {skills.map((skill, i) => (
          <motion.div
            key={skill.id}
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              x: skill.x, 
              y: skill.y 
            }}
            transition={{ 
              type: "spring", 
              stiffness: 40, 
              damping: 15,
              delay: 0.2 + i * 0.1,
              duration: 1.5
            }}
            className="absolute z-30 flex flex-col items-center gap-2"
          >
            {/* 3D Asset Image with Hover Growth */}
            <motion.div
              whileHover={{ scale: 1.4 }}
              animate={{ 
                y: [0, -15, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                y: { duration: 4 + i, repeat: Infinity, delay: skill.delay, ease: "easeInOut" },
                rotate: { duration: 6 + i, repeat: Infinity, delay: skill.delay, ease: "easeInOut" }
              }}
              className="cursor-pointer pointer-events-auto filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.3)]"
            >
              <img 
                src={skill.img} 
                alt={skill.label}
                className="w-20 h-20 md:w-28 md:h-28 object-contain"
              />
            </motion.div>
            
            {/* Minimal Label */}
            <div 
              className="opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 
              text-[10px] md:text-[11px] font-black tracking-widest uppercase text-white/90 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md shadow-xl border border-white/10"
              style={{ color: skill.color }}
            >
              {skill.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Intro Text */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="mt-20 md:mt-28 text-center relative z-20"
      >
        <h1 
          className="text-4xl md:text-7xl font-normal tracking-tight mb-3 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 filter drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]"
        >
          <span className="font-bold">Adi</span> Agarwal
        </h1>
        <p className="text-xs md:text-base text-white/60 uppercase tracking-[0.3em] font-bold">
          Product | Engineering | Data | Design
        </p>
      </motion.div>
    </div>
  );
};

export default Hero;

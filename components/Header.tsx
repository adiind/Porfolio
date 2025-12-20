import React from 'react';
import { motion } from 'framer-motion';
import { Filter } from 'lucide-react';
import { FilterType } from '../hooks/useFilter';

interface HeaderProps {
  mode: 'intro' | 'normal' | 'detail' | 'fit';
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onLogoClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ mode, filter, onFilterChange, onLogoClick }) => {
  const pageTransition = {
    type: "spring" as const,
    stiffness: 50,
    damping: 20,
    mass: 1
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 pointer-events-none">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: mode === 'intro' ? 0 : 1 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 pointer-events-auto" 
      />
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ 
          opacity: mode === 'intro' ? 0 : 1, 
          y: mode === 'intro' ? -20 : 0 
        }}
        transition={pageTransition}
        className="relative max-w-6xl mx-auto flex items-start justify-between pointer-events-auto"
      >
        <div className="cursor-pointer group" onClick={onLogoClick}>
          <h1 className="text-xl font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors">
            Adi <span className="font-normal text-white/60 group-hover:text-indigo-300">Agarwal</span>
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5 group-hover:text-white/60 transition-colors">
            Product | Engineering | Data | Design
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-sm">
          <Filter size={14} className="text-white/40 ml-2 mr-1" />
          {(['all', 'education', 'corporate', 'personal'] as const).map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`
                px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all
                ${filter === f 
                  ? 'bg-white text-black shadow-lg shadow-white/10' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'}
              `}
            >
              {f === 'personal' ? 'TinkerVerse' : f}
            </button>
          ))}
        </div>
      </motion.div>
    </header>
  );
};

export default Header;




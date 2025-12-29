
import React from 'react';
import { motion } from 'framer-motion';
import { X, Linkedin, FileText, ExternalLink } from 'lucide-react';
import { REAL_USER_IMAGE, PROFILE_BIO, PROFILE_SKILLS, SOCIAL_LINKS } from '../constants';

interface Props {
  onClose: () => void;
}

const ProfileModal: React.FC<Props> = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] scale-90 origin-center"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors z-20"
        >
          <X size={20} />
        </button>

        {/* Left Column: Image */}
        <div className="w-full md:w-2/5 relative h-64 md:h-auto overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#0a0a0a] z-10 opacity-80" />
          <img
            src={REAL_USER_IMAGE}
            alt="Adi Agarwal"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right Column: Content */}
        <div className="flex-1 p-6 md:p-8 flex flex-col overflow-y-auto custom-scrollbar">
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Hello, I'm Adi.</h2>
            <p className="text-rose-400 font-medium tracking-wide uppercase text-sm">Design Engineer & Product Thinker</p>
          </div>

          <div className="space-y-4 text-gray-300 text-sm leading-relaxed mb-6 font-light">
            {PROFILE_BIO.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Core Toolkit</h3>
            <div className="flex flex-wrap gap-2">
              {PROFILE_SKILLS.map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300 hover:bg-white/10 hover:border-rose-500/30 transition-colors cursor-default"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-white/5 flex flex-wrap gap-4">
            <a
              href={SOCIAL_LINKS.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0077b5] hover:bg-[#006396] text-white rounded-lg transition-all shadow-lg hover:shadow-blue-500/20 font-medium text-sm"
            >
              <Linkedin size={16} />
              <span>Connect on LinkedIn</span>
            </a>
            <a
              href={SOCIAL_LINKS.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all border border-white/10 font-medium text-sm group"
            >
              <FileText size={16} className="text-rose-400 group-hover:text-rose-300" />
              <span>View Resume</span>
              <ExternalLink size={12} className="opacity-50 ml-1" />
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProfileModal;

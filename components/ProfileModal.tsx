import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Linkedin, FileText, ExternalLink } from 'lucide-react';
import { REAL_USER_IMAGE, PROFILE_BIO, PROFILE_SKILLS, SOCIAL_LINKS } from '../constants';
import { trackEvent } from '../lib/analytics';
import { useDialogA11y } from '../hooks/useDialogA11y';
import GlassSurface from './ui/GlassSurface';
import { useContentEngagement } from '../hooks/useContentEngagement';

interface Props {
  onClose: () => void;
}

const ProfileModal: React.FC<Props> = ({ onClose }) => {
  const dialogRef = useDialogA11y(onClose, { historyTag: 'profile' });
  useContentEngagement({
    contentType: 'profile',
    contentId: 'profile',
    section: 'detail',
  });

  const handleManualClose = () => {
    onClose();
  };

  // Rendered twice: near the top on mobile (so the actions are reachable
  // without scrolling past the bio) and pinned to the bottom on desktop.
  const actionLinks = (
    <>
      <a
        href={SOCIAL_LINKS.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent('linkedin_clicked', { source: 'profile_modal' })}
        className="flex min-h-11 items-center gap-2 px-5 py-2.5 bg-[#0077b5] hover:bg-[#006396] text-white rounded-lg transition-all shadow-lg hover:shadow-blue-500/20 font-medium text-sm"
      >
        <Linkedin size={16} />
        <span>Connect on LinkedIn</span>
      </a>
      <a
        href={SOCIAL_LINKS.resume}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent('resume_viewed', { source: 'profile_modal' })}
        className="flex min-h-11 items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all border border-white/10 font-medium text-sm group"
      >
        <FileText size={16} className="text-rose-400 group-hover:text-rose-300" />
        <span>View Resume</span>
        <ExternalLink size={12} className="opacity-50 ml-1" />
      </a>
    </>
  );

  return (
    <motion.div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      data-profile-backdrop
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020706]/45 p-3 backdrop-blur-sm focus:outline-none sm:p-5 md:p-8"
      onClick={handleManualClose}
    >
      <GlassSurface
        as={motion.div}
        data-profile-glass
        strength="strong"
        blur="strong"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[92vh] w-full max-w-5xl origin-center flex-col overflow-hidden rounded-[1.75rem] md:max-h-[88vh] md:flex-row"
      >
        <button
          onClick={handleManualClose}
          aria-label="Close profile"
          className="absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-[#06100e]/75 text-white/70 transition-colors hover:border-white/35 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5E55A] md:right-4 md:top-4"
        >
          <X size={20} />
        </button>

        {/* Left Column: Image */}
        <div className="relative h-64 w-full overflow-hidden bg-[#071411]/70 sm:h-72 md:h-auto md:w-[38%]">
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#06100e]/95 via-transparent to-transparent opacity-80 md:bg-gradient-to-r md:from-transparent md:to-[#06100e]/90" />
          <img
            src={REAL_USER_IMAGE}
            alt="Adi Agarwal"
            className="h-full w-full object-cover object-[center_28%]"
          />
        </div>

        {/* Right Column: Content */}
        <div className="custom-scrollbar flex flex-1 flex-col overflow-y-auto p-6 md:p-9">
          <div className="mb-6">
            <h2 id="profile-modal-title" className="text-2xl md:text-3xl font-bold text-white mb-2">Hello, I'm Adi.</h2>
            <p className="text-[#F0F570] font-medium tracking-[0.12em] uppercase text-xs">Tangible AI · Product Design · Creative Technology</p>
          </div>

          {/* Mobile: actions surfaced above the bio so they're reachable without scrolling */}
          <div className="flex md:hidden flex-wrap gap-3 mb-6">
            {actionLinks}
          </div>

          <div className="mb-6 space-y-4 text-sm font-light leading-relaxed text-white/78">
            {PROFILE_BIO.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <div className="mb-6">
            <h3 className="text-xs font-bold text-white/55 uppercase tracking-widest mb-3">Core Toolkit</h3>
            <div className="flex flex-wrap gap-2">
              {PROFILE_SKILLS.map((skill, i) => (
                <span
                  key={i}
                  className="cursor-default rounded-full border border-white/15 bg-white/[0.07] px-3 py-1 text-xs text-white/76 transition-colors hover:border-[#E5E55A]/35 hover:bg-white/10"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Desktop: actions anchored at the bottom of the content column */}
          <div className="mt-auto pt-6 border-t border-white/5 hidden md:flex flex-wrap gap-4">
            {actionLinks}
          </div>
        </div>
      </GlassSurface>
    </motion.div >
  );
};

export default ProfileModal;

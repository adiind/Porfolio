
import React from 'react';
import { motion } from 'framer-motion';
import { X, ExternalLink, Tag } from 'lucide-react';
import { TimelineItem } from '../types';

interface Props {
  project: TimelineItem;
  onClose: () => void;
  layoutId?: string;
}

const ProjectModal: React.FC<Props> = ({ project, onClose, layoutId }) => {
  // Robust ID extraction handling optional query params like &t= or &list=
  const videoId = project.videoUrl ? project.videoUrl.split('v=')[1]?.split('&')[0] : '';
  const imageUrl = project.imageUrl;
  const isVignette = project.type === 'vignette';

  // THEME CONFIGURATION
  const theme = isVignette
    ? {
      overlay: 'bg-white/80 backdrop-blur-xl',
      bg: 'bg-gradient-to-br from-white to-gray-100 border-white/50',
      text: 'text-gray-900',
      subText: 'text-gray-500',
      closeBtn: 'bg-black/5 hover:bg-black/10 text-black/50 hover:text-black',
      tagBg: 'bg-gray-200 text-gray-700',
      accent: 'bg-black text-white',
      bullet: 'bg-gray-400',
      glow: 'shadow-[0_0_100px_rgba(255,255,255,0.8)]'
    }
    : {
      overlay: 'bg-black/90 backdrop-blur-xl',
      bg: 'bg-[#0f0f0f]/90 bg-gradient-to-br from-[#1a1a1a] to-[#050505] border-purple-500/30',
      text: 'text-white',
      subText: 'text-gray-300',
      closeBtn: 'bg-black/50 hover:bg-white/10 text-white/50 hover:text-white',
      tagBg: 'bg-black/40 text-teal-200 border border-white/10',
      accent: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      bullet: 'bg-teal-500',
      glow: 'shadow-2xl'
    };

  // Splash colors for skill pills
  const splashColors = [
    'bg-indigo-500/20 text-indigo-200 border-indigo-500/30',
    'bg-rose-500/20 text-rose-200 border-rose-500/30',
    'bg-amber-500/20 text-amber-200 border-amber-500/30',
    'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
    'bg-cyan-500/20 text-cyan-200 border-cyan-500/30',
    'bg-purple-500/20 text-purple-200 border-purple-500/30',
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 ${theme.overlay}`}
      onClick={onClose}
    >
      {!isVignette && (
        // Dark Mode Background Ambience
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
        </div>
      )}

      <motion.div
        layoutId={layoutId}
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 w-full max-w-4xl border rounded-2xl overflow-hidden flex flex-col max-h-[90vh] ${theme.bg} ${theme.glow}`}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors z-20 backdrop-blur-sm ${theme.closeBtn}`}
        >
          <X size={20} />
        </button>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Header Media */}
          {videoId ? (
            <div className="w-full aspect-video bg-black relative shadow-2xl">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&modestbranding=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={project.title}
              />
            </div>
          ) : imageUrl && (
            <div className="w-full aspect-video bg-black relative shadow-2xl overflow-hidden">
              <img
                src={imageUrl}
                alt={project.title}
                className="w-full h-full object-cover"
              />
              {!isVignette && <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] to-transparent opacity-60" />}
            </div>
          )}

          <div className="p-8 md:p-10 relative">
            <div className={`flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 border-b pb-8 ${isVignette ? 'border-gray-200' : 'border-white/5'}`}>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full border shadow-[0_0_15px_rgba(0,0,0,0.2)] ${project.type === 'competition' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : project.type === 'vignette' ? 'bg-black text-white border-black' : 'bg-teal-500/20 text-teal-300 border-teal-500/30'}`}>
                    {project.type === 'competition' ? 'Competition Winner' : project.type === 'vignette' ? 'Vignette' : project.type === 'education' ? 'Education' : project.type === 'work' ? 'Work Experience' : project.type === 'foundational' ? 'Foundation' : 'Project'}
                  </span>
                  <span className={`${isVignette ? 'text-gray-400' : 'text-gray-500'} text-xs font-mono`}>{project.start}</span>
                </div>
                <h2 className={`text-3xl md:text-5xl font-bold mb-2 tracking-tight ${theme.text}`}>{project.title}</h2>
                <p className={`font-medium text-sm tracking-wide uppercase ${isVignette ? 'text-gray-400' : project.type === 'competition' ? 'text-purple-400' : 'text-teal-400'}`}>{project.company}</p>
              </div>

              {project.projectLinks && (
                <div className="flex flex-wrap gap-3">
                  {project.projectLinks.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-lg hover:-translate-y-0.5 ${isVignette ? 'bg-white border border-gray-200 text-black hover:bg-gray-50' : `bg-white/5 hover:bg-white/10 border border-white/10 ${project.type === 'competition' ? 'hover:border-purple-500/50' : 'hover:border-teal-500/50'}`}`}
                    >
                      {link.label}
                      <ExternalLink size={14} className="opacity-50" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className={`md:col-span-2 space-y-6 leading-relaxed font-light text-base md:text-lg ${theme.subText}`}>
                {project.extendedDescription ? (
                  project.extendedDescription.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))
                ) : (
                  <p>{project.summary}</p>
                )}

                {project.bullets && project.bullets.length > 0 && (
                  <div className={`mt-8 pt-8 border-t ${isVignette ? 'border-gray-200' : 'border-white/10'}`}>
                    <h4 className={`text-xs font-bold mb-6 uppercase tracking-widest opacity-70 ${theme.text}`}>Key Highlights</h4>
                    <ul className="space-y-4">
                      {project.bullets?.map((bullet, i) => (
                        <li key={i} className={`flex items-start gap-4 text-sm ${theme.subText}`}>
                          <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${theme.bullet}`} />
                          <span className="leading-relaxed">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {project.skills && project.skills.length > 0 && (
                <div className="space-y-8">
                  <div className={`p-6 rounded-xl border ${isVignette ? 'bg-gray-50 border-gray-100' : 'bg-white/5 border-white/5'}`}>
                    <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${isVignette ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Tag size={14} /> Technologies
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {project.skills?.map((skill, i) => (
                        <span
                          key={i}
                          className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors cursor-default border ${isVignette ? 'bg-white text-gray-600 border-gray-200' : splashColors[i % splashColors.length]}`}
                        >
                          {typeof skill === 'object' && skill !== null ? (skill as { label: string }).label : String(skill)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProjectModal;

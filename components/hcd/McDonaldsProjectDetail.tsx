import React from 'react';
import { Project } from '../../types/Project';
import { X } from 'lucide-react';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { projectPath } from '../../lib/workRoutes';

const McDonaldsProjectDetail: React.FC<{ project: Project; onClose: () => void }> = ({ project, onClose }) => {
  const dialogRef = useDialogA11y(onClose, {
    historyTag: 'project',
    historyPath: projectPath(project.id),
  });

  return (
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={project.hero.title} className="fixed inset-0 z-[100] bg-[#050505] focus:outline-none">
      <button
        type="button"
        onClick={onClose}
        aria-label={`Close ${project.hero.title}`}
        className="absolute right-3 top-3 z-10 flex h-11 items-center gap-2 rounded-full border border-white/20 bg-black/80 px-4 text-sm font-semibold text-white shadow-2xl backdrop-blur-md transition hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] md:right-6 md:top-6"
      >
        <X aria-hidden="true" size={18} strokeWidth={2.25} />
        <span>Close</span>
      </button>
      <iframe
        src="/work/mcdonalds-interaction-design/index.html"
        title={project.hero.title}
        className="h-full w-full border-0"
      />
    </div>
  );
};

export default McDonaldsProjectDetail;

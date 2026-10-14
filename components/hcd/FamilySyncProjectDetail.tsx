import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Project } from '../../types/Project';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { projectPath } from '../../lib/workRoutes';

// The case study is a standalone document with its own run rail, so this
// dialog only frames it and offers the way back.
const FamilySyncProjectDetail: React.FC<{ project: Project; onClose: () => void }> = ({ project, onClose }) => {
  const dialogRef = useDialogA11y(onClose, {
    historyTag: 'project',
    historyPath: projectPath(project.id),
  });

  return (
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={project.hero.title} className="fixed inset-0 z-[100] bg-white focus:outline-none">
      <button
        type="button"
        onClick={onClose}
        aria-label="Back to portfolio"
        className="absolute right-3 top-3 z-10 flex h-11 items-center justify-center gap-2 rounded-full border border-black/10 bg-white/90 px-4 text-sm font-semibold text-[#0d1b33] shadow-lg backdrop-blur-md transition hover:bg-[#0d1b33] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3e76c2] focus-visible:ring-offset-2 sm:left-6 sm:right-auto sm:justify-start sm:top-6 max-sm:w-11 max-sm:px-0"
      >
        <ArrowLeft aria-hidden="true" size={18} strokeWidth={2.25} />
        <span className="max-sm:hidden">Back to portfolio</span>
      </button>
      <iframe
        src="/work/familysync-assets/story.html"
        title={project.hero.title}
        className="h-full w-full border-0"
      />
    </div>
  );
};

export default FamilySyncProjectDetail;

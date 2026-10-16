import React, { useEffect } from 'react';
import { Project } from '../../types/Project';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { projectPath } from '../../lib/workRoutes';

// The case study is a standalone document with its own run rail, so this
// dialog only frames it and offers the way back.
const FamilySyncProjectDetail: React.FC<{ project: Project; onClose: () => void }> = ({ project, onClose }) => {
  const dialogRef = useDialogA11y(onClose, {
    historyTag: 'project',
    historyPath: projectPath(project.id),
    historyBasePath: '/',
  });

  useEffect(() => {
    const closeFromStory = (event: MessageEvent) => {
      const frame = dialogRef.current?.querySelector('iframe');
      if (event.origin === window.location.origin && event.source === frame?.contentWindow
        && event.data?.type === 'familysync-close') onClose();
      if (event.origin === window.location.origin && event.source === frame?.contentWindow
        && event.data?.type === 'familysync-focus-back') {
        frame?.contentDocument?.querySelector<HTMLButtonElement>('[data-back]')?.focus({ preventScroll: true });
      }
    };
    window.addEventListener('message', closeFromStory);
    return () => window.removeEventListener('message', closeFromStory);
  }, [onClose]);

  return (
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={project.hero.title} className="fixed inset-0 z-[100] flex flex-col bg-white focus:outline-none">
      <iframe
        tabIndex={0}
        src="/work/familysync-assets/story.html"
        title={project.hero.title}
        className="min-h-0 flex-1 w-full border-0"
      />
    </div>
  );
};

export default FamilySyncProjectDetail;

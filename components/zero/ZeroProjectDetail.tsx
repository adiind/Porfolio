import React, { useEffect } from 'react';
import { Project } from '../../types/Project';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { projectPath } from '../../lib/workRoutes';

// The Zero case study is a standalone scroll story with its own chapter
// tracker and back control, so this dialog only frames it and listens for
// the way back.
const ZeroProjectDetail: React.FC<{ project: Project; onClose: () => void }> = ({ project, onClose }) => {
  const dialogRef = useDialogA11y(onClose, {
    historyTag: 'project',
    historyPath: projectPath(project.id),
    historyBasePath: '/',
  });

  useEffect(() => {
    const closeFromStory = (event: MessageEvent) => {
      const frame = dialogRef.current?.querySelector('iframe');
      if (event.origin === window.location.origin && event.source === frame?.contentWindow
        && event.data?.type === 'zero-case-close') onClose();
    };
    window.addEventListener('message', closeFromStory);
    return () => window.removeEventListener('message', closeFromStory);
  }, [onClose]);

  return (
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={project.hero.title} className="fixed inset-0 z-[100] flex flex-col bg-[#0a1510] focus:outline-none">
      <iframe
        tabIndex={0}
        src="/work/zero-assets/story.html"
        title={project.hero.title}
        className="min-h-0 flex-1 w-full border-0"
      />
    </div>
  );
};

export default ZeroProjectDetail;

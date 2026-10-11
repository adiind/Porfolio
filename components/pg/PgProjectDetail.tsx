import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { Project } from '../../types/Project';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { useContentEngagement } from '../../hooks/useContentEngagement';
import { projectPath } from '../../lib/workRoutes';

import './pg-case.css';

const PgProjectDetail: React.FC<{ project: Project; onClose: () => void; analyticsSource?: string }> = ({ project, onClose }) => {
  const dialogRef = useDialogA11y(onClose, { historyTag: 'project', historyPath: projectPath(project.id) });
  const engagementRef = useContentEngagement<HTMLDivElement>({ contentType: 'project', contentId: project.id });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data?.type === 'pg-case-close') onClose();
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onClose]);

  return ReactDOM.createPortal(<motion.div
    ref={dialogRef}
    role="dialog"
    aria-modal="true"
    aria-label="P&G conditioning product packaging case study"
    tabIndex={-1}
    className="pg-case"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: reduceMotion ? 0 : .15 }}
  >
    <button type="button" className="pg-close" onClick={onClose} aria-label="Close P&G case study"><X size={18} /> Close</button>
    <div ref={engagementRef} className="pg-story-frame-wrap">
      <iframe
        className="pg-story-frame"
        src="/pg-haircare-story/index.html"
        title="P&G packaging research scroll story"
      />
    </div>
  </motion.div>, document.body);
};

export default PgProjectDetail;

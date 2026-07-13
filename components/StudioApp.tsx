import React from 'react';
import ProjectStudio from './ProjectStudio';
import { ProjectsProvider } from '../context/ProjectsContext';

const StudioApp: React.FC = () => (
    <ProjectsProvider>
        <ProjectStudio onClose={() => window.location.assign('/')} />
    </ProjectsProvider>
);

export default StudioApp;

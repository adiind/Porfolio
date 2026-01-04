/**
 * Projects Data Loader
 * Imports all project JSON files and exports them as a typed array
 */

import { Project } from '../types/Project';

// Import project JSON files
import suryaData from './projects/surya.json';
import solopumpData from './projects/solopump.json';
import heliosData from './projects/helios.json';
import jarvisData from './projects/jarvis.json';
import plotterData from './projects/plotter.json';

// Combine all projects
export const PROJECTS: Project[] = [
    suryaData as Project,
    solopumpData as Project,
    heliosData as Project,
    jarvisData as Project,
    plotterData as Project,
];

export default PROJECTS;

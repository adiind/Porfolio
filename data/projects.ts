/**
 * Projects Data Loader
 * Imports all project JSON files and exports them as a typed array
 */

import { Project } from '../types/Project';

// Import project JSON files
import suryaData from './projects/surya.json';

// Type assertion and validation
const projects: Project[] = [
    suryaData as Project,
];

export const PROJECTS = projects;

export default projects;

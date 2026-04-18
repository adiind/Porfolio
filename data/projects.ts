/**
 * Projects Data Loader
 * Imports all project JSON files and exports them as a typed array
 */

import { Project } from '../types/Project';

// Import project JSON files
import zeroMyAIData from './projects/zero-my-ai.json';
import familySyncData from './projects/familysync-jpmorgan.json';
import mcdonaldsInteractionData from './projects/mcdonalds-interaction-design.json';
import suryaData from './projects/surya.json';
import solopumpData from './projects/solopump.json';
import heliosData from './projects/helios.json';
import jarvisData from './projects/jarvis.json';
import plotterData from './projects/plotter.json';
import portfolioWebsiteData from './projects/portfolio-website.json';

// Projects shown in Selected Work section
// FamilySync and McDonald's are excluded from this grid (available via getProjectsByIds)
export const PROJECTS: Project[] = [
    zeroMyAIData as Project,
    suryaData as Project,
    solopumpData as Project,
    heliosData as Project,
    jarvisData as Project,
    plotterData as Project,
    portfolioWebsiteData as Project,
];

// All projects (for lookups via getProjectsByIds, e.g. TinkerVerse modal)
const ALL_PROJECTS: Project[] = [
    zeroMyAIData as Project,
    familySyncData as Project,
    mcdonaldsInteractionData as Project,
    suryaData as Project,
    solopumpData as Project,
    heliosData as Project,
    jarvisData as Project,
    plotterData as Project,
    portfolioWebsiteData as Project,
];

export const PROJECTS_BY_ID = new Map(ALL_PROJECTS.map((project) => [project.id, project] as const));

export const getProjectsByIds = (ids: string[]): Project[] =>
    ids
        .map((id) => PROJECTS_BY_ID.get(id))
        .filter((project): project is Project => Boolean(project));

export default PROJECTS;

/**
 * Project Types - Matching the JSON schema for portfolio projects
 */

export interface ProjectHero {
    title: string;
    oneLiner: string;
}

export interface ProjectContext {
    text: string;
}

export interface ProjectBuild {
    bullets: string[];
}

export interface ProjectDecision {
    decision: string;
    why: string;
    tradeoff: string;
}

export interface ProjectReview {
    worked: string[];
    didnt: string[];
}

export interface ProjectOutcome {
    status: 'shipped' | 'in-progress' | 'archived' | 'concept';
    text: string;
    proof?: string;
    blocker?: string;
}

export interface ProjectReflection {
    text: string;
}

export interface Project {
    id: string;
    hero: ProjectHero;
    context: ProjectContext;
    build: ProjectBuild;
    decisions: ProjectDecision[];
    review: ProjectReview;
    outcome: ProjectOutcome;
    reflection: ProjectReflection;
    // Visual customization
    themeColor?: 'amber' | 'teal' | 'indigo' | 'rose' | 'emerald' | 'violet';
    icon?: 'zap' | 'pen-tool' | 'bot' | 'cpu' | 'layers' | 'box' | 'music' | 'camera';
    // Skills
    skills?: { label: string; description: string }[];
    // Media
    heroImage?: string;
    heroVideo?: string;
    gallery?: string[];
}

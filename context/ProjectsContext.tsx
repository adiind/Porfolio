import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PROJECTS as SOURCE_PROJECTS } from '../data/projects';
import { Project } from '../types/Project';
import { clearProjectDraft, loadProjectDraft, saveProjectDraft } from '../lib/projectDraftStorage';

type DraftStatus = 'loading' | 'saved' | 'saving' | 'error';

interface ProjectsContextValue {
    projects: Project[];
    draftStatus: DraftStatus;
    draftError: string | null;
    hasLocalDraft: boolean;
    updateProject: (id: string, updater: (project: Project) => Project) => void;
    createProject: () => string;
    replaceProjects: (projects: Project[]) => void;
    resetProjects: () => Promise<void>;
    getProjectsByIds: (ids: string[]) => Project[];
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null);
const cloneProjects = (projects: Project[]) => JSON.parse(JSON.stringify(projects)) as Project[];

const createEmptyProject = (id: string): Project => ({
    id,
    hero: { title: 'Untitled project', oneLiner: 'A quick line about what this project makes possible.' },
    context: { text: 'Start with the problem, the people involved, and why this project mattered.' },
    build: { bullets: ['Add the first thing you built.'] },
    decisions: [],
    review: { worked: [], didnt: [] },
    outcome: { status: 'in-progress', text: 'What changed, shipped, or was learned?' },
    reflection: { text: 'What would you carry into the next project?' },
    themeColor: 'amber',
    skills: [],
    gallery: [],
});

export const ProjectsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [projects, setProjects] = useState<Project[]>(() => cloneProjects(SOURCE_PROJECTS));
    const [isHydrated, setIsHydrated] = useState(false);
    const [hasLocalDraft, setHasLocalDraft] = useState(false);
    const [draftStatus, setDraftStatus] = useState<DraftStatus>('loading');
    const [draftError, setDraftError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        loadProjectDraft()
            .then((draft) => {
                if (!isMounted) return;
                if (draft?.length) { setProjects(draft); setHasLocalDraft(true); }
                setDraftStatus('saved');
            })
            .catch((error: unknown) => {
                if (!isMounted) return;
                setDraftStatus('error');
                setDraftError(error instanceof Error ? error.message : 'Unable to load the local draft.');
            })
            .finally(() => { if (isMounted) setIsHydrated(true); });
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        if (!isHydrated || !hasLocalDraft) return;
        let isMounted = true;
        setDraftStatus('saving');
        const timer = window.setTimeout(() => {
            saveProjectDraft(projects)
                .then(() => { if (isMounted) { setDraftStatus('saved'); setDraftError(null); } })
                .catch((error: unknown) => {
                    if (isMounted) {
                        setDraftStatus('error');
                        setDraftError(error instanceof Error ? error.message : 'Unable to save the local draft.');
                    }
                });
        }, 350);
        return () => { isMounted = false; window.clearTimeout(timer); };
    }, [hasLocalDraft, isHydrated, projects]);

    const updateProject = useCallback((id: string, updater: (project: Project) => Project) => {
        setHasLocalDraft(true);
        setProjects((current) => current.map((project) => project.id === id ? updater(project) : project));
    }, []);

    const createProject = useCallback(() => {
        const id = `project-${Date.now().toString(36)}`;
        setHasLocalDraft(true);
        setProjects((current) => [...current, createEmptyProject(id)]);
        return id;
    }, []);

    const replaceProjects = useCallback((nextProjects: Project[]) => {
        setHasLocalDraft(true);
        setProjects(cloneProjects(nextProjects));
    }, []);

    const resetProjects = useCallback(async () => {
        setProjects(cloneProjects(SOURCE_PROJECTS));
        setHasLocalDraft(false);
        setDraftError(null);
        setDraftStatus('saved');
        await clearProjectDraft();
    }, []);

    const getProjectsByIds = useCallback((ids: string[]) => {
        const projectsById = new Map(projects.map((project) => [project.id, project] as const));
        return ids.map((id) => projectsById.get(id)).filter((project): project is Project => Boolean(project));
    }, [projects]);

    const value = useMemo<ProjectsContextValue>(() => ({
        projects, draftStatus, draftError, hasLocalDraft, updateProject, createProject,
        replaceProjects, resetProjects, getProjectsByIds,
    }), [createProject, draftError, draftStatus, getProjectsByIds, hasLocalDraft, projects, replaceProjects, resetProjects, updateProject]);

    return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
};

export const useProjects = (): ProjectsContextValue => {
    const context = useContext(ProjectsContext);
    if (!context) throw new Error('useProjects must be used inside ProjectsProvider.');
    return context;
};

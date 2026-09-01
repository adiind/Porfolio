import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, ExternalLink, Play, X } from 'lucide-react';
import { JournalEntry, SocialPost, TimelineItem } from '../types';
import { TINKERVERSE_JOURNAL, TINKERVERSE_LOGO } from '../constants';
import { Project } from '../types/Project';
import { useProjects } from '../context/ProjectsContext';
import { useDialogA11y } from '../hooks/useDialogA11y';
import CuttingMatSurface from './ui/CuttingMatSurface';
import GlassSurface from './ui/GlassSurface';
import ProjectDetail from './ProjectDetail';
import { useContentEngagement } from '../hooks/useContentEngagement';

interface Props {
    item: TimelineItem;
    posts: SocialPost[];
    onClose: () => void;
}

const formatJournalDate = (publishedAt: string) => new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
}).format(new Date(publishedAt));

const journalExcerpt = (caption: string, lineCount = 2) => caption
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .slice(0, lineCount)
    .join(' ');

const JournalMedia: React.FC<{
    entry: JournalEntry;
    priority?: boolean;
}> = ({ entry, priority = false }) => {
    const [failed, setFailed] = useState(false);

    return (
        <div data-journal-media className="relative h-full min-h-0 overflow-hidden bg-[#07110f]">
            {!failed ? (
                <img
                    src={entry.localMediaUrl}
                    alt={entry.alt}
                    loading={priority ? 'eager' : 'lazy'}
                    decoding="async"
                    onError={() => setFailed(true)}
                    className={`h-full w-full ${priority ? 'object-contain' : 'object-cover'}`}
                />
            ) : (
                <div
                    data-journal-fallback="offline"
                    role="img"
                    aria-label={`${entry.alt} Media unavailable offline.`}
                    className="flex h-full min-h-48 items-center justify-center bg-[linear-gradient(145deg,#0b211d,#04100e)] p-8 text-center"
                >
                    <div>
                        <div className="mx-auto mb-4 h-12 w-12 rounded-full border border-[#e5e55a]/40 bg-[#e5e55a]/10" />
                        <p className="text-sm font-semibold text-white/85">Image unavailable</p>
                        <p className="mt-1 text-xs text-white/60">The caption below still reads offline.</p>
                    </div>
                </div>
            )}

            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
            {entry.mediaType === 'video-thumbnail' && (
                <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full border border-[#e5e55a]/35 bg-black/[0.72] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#f0f18a]">
                    <Play size={10} fill="currentColor" aria-hidden="true" /> Video still
                </span>
            )}
        </div>
    );
};

const TinkerVerseModal: React.FC<Props> = ({ item, onClose }) => {
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const { getProjectsByIds } = useProjects();
    const leadEntry = TINKERVERSE_JOURNAL[0];
    useContentEngagement({
        contentType: 'tinkerverse',
        contentId: item.id,
        section: 'journal',
        active: activeProject === null,
    });
    const morePosts = TINKERVERSE_JOURNAL.slice(1, 5);
    const projectsById = useMemo(() => {
        const ids = TINKERVERSE_JOURNAL
            .map((entry) => entry.projectId)
            .filter((id): id is string => Boolean(id));
        return new Map(getProjectsByIds(ids).map((project) => [project.id, project]));
    }, [getProjectsByIds]);

    const handleTopmostClose = () => {
        if (activeProject) {
            setActiveProject(null);
            return;
        }
        onClose();
    };

    const dialogRef = useDialogA11y(handleTopmostClose, { historyTag: 'tinkerverse' });

    const openProject = (entry: JournalEntry) => {
        if (!entry.projectId) return;
        const project = projectsById.get(entry.projectId);
        if (project) setActiveProject(project);
    };

    const projectButton = (entry: JournalEntry, compact = false) => {
        if (!entry.projectId) return null;
        const project = projectsById.get(entry.projectId);
        if (!project) return null;

        return (
            <button
                type="button"
                data-journal-project={project.id}
                aria-haspopup="dialog"
                onClick={() => openProject(entry)}
                className={`group inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#e5e55a]/35 bg-[#e5e55a]/10 font-semibold text-[#f0f18a] transition-colors hover:border-[#e5e55a]/60 hover:bg-[#e5e55a]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0f18a] ${compact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'}`}
            >
                <span className="truncate">Open {project.hero.title}</span>
                <ArrowUpRight size={compact ? 11 : 13} className="shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-1.5 sm:p-3 md:p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleTopmostClose}
                className="absolute inset-0 bg-[#020806]/95"
            />

            <motion.div
                ref={dialogRef}
                tabIndex={-1}
                initial={{ opacity: 0, scale: 0.98, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 16 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="tinkerverse-modal-title"
                aria-hidden={activeProject ? true : undefined}
                className={`relative h-full max-h-[96vh] w-full max-w-7xl overflow-hidden rounded-[1.7rem] shadow-2xl focus:outline-none md:rounded-[2.15rem] ${activeProject ? 'hidden' : ''}`}
            >
                <CuttingMatSurface active={!activeProject} float={false} density="auto" className="p-2.5 sm:p-4 md:p-7">
                    <GlassSurface strength="strong" blur="strong" className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.25rem] md:rounded-[1.6rem]">
                        <header className="relative z-10 flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-5 md:px-7 md:py-4">
                            <img src={TINKERVERSE_LOGO} alt="" className="h-9 w-9 shrink-0 rounded-lg border border-white/15 bg-black object-cover sm:h-10 sm:w-10" />
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <h2 id="tinkerverse-modal-title" className="text-xl font-bold tracking-tight text-white sm:text-2xl">TinkerVerse</h2>
                                </div>
                                <p className="mt-0.5 hidden text-xs text-white/65 sm:block"><span className="text-white/80">{item.title}</span> · {item.headline}</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleTopmostClose}
                                aria-label="Close TinkerVerse"
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/25 text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0f18a]"
                            >
                                <X size={19} aria-hidden="true" />
                            </button>
                        </header>

                        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-6 pt-4 custom-scrollbar sm:px-5 md:px-7 md:pb-8 md:pt-6">
                            <div className="mx-auto min-w-0 max-w-6xl">
                                {leadEntry && (
                                    <GlassSurface
                                        as="article"
                                        data-journal-lead
                                        data-journal-entry={leadEntry.id}
                                        strength="balanced"
                                        blur="none"
                                        className="mb-6 grid min-w-0 overflow-hidden rounded-2xl lg:grid-cols-[1.45fr_0.75fr]"
                                    >
                                        <div className="aspect-[16/10] min-h-[250px] lg:aspect-auto lg:min-h-[430px]">
                                            <JournalMedia entry={leadEntry} priority />
                                        </div>
                                        <div data-journal-text className="relative flex min-w-0 flex-col p-5 sm:p-6 lg:p-7">
                                            <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/55">
                                                {formatJournalDate(leadEntry.publishedAt)}
                                            </div>
                                            <h3 className="mt-3 break-words text-2xl font-bold leading-tight text-white sm:text-3xl">
                                                {projectsById.get(leadEntry.projectId ?? '')?.hero.title ?? 'TinkerVerse post'}
                                            </h3>
                                            <p className="mt-3 break-words text-sm leading-relaxed text-white/[0.72] [overflow-wrap:anywhere] sm:text-base">
                                                {journalExcerpt(leadEntry.caption, 3)}
                                            </p>
                                            <div className="mt-auto pt-6">{projectButton(leadEntry)}</div>
                                        </div>
                                    </GlassSurface>
                                )}

                                <section aria-labelledby="tinkerverse-projects-title">
                                    <div className="mb-4">
                                        <h3 id="tinkerverse-projects-title" className="text-xl font-bold text-white sm:text-2xl">Projects</h3>
                                    </div>

                                    <div data-journal-grid className="grid gap-3 sm:grid-cols-2 lg:gap-4">
                                        {morePosts.map((entry) => (
                                            <GlassSurface
                                                as="article"
                                                key={entry.id}
                                                data-journal-entry={entry.id}
                                                strength="quiet"
                                                blur="none"
                                                className="grid min-w-0 overflow-hidden rounded-xl sm:grid-cols-[0.95fr_1.05fr]"
                                            >
                                                <div className="aspect-[4/3] min-h-[180px] sm:aspect-auto sm:min-h-[230px]">
                                                    <JournalMedia entry={entry} />
                                                </div>
                                                <div data-journal-text className="flex min-w-0 flex-col p-4">
                                                    <div className="font-mono text-[9px] uppercase tracking-[0.13em] text-white/55">
                                                        {formatJournalDate(entry.publishedAt)}
                                                    </div>
                                                    <h4 className="mt-3 break-words text-base font-bold leading-snug text-white">
                                                        {projectsById.get(entry.projectId ?? '')?.hero.title ?? 'TinkerVerse post'}
                                                    </h4>
                                                    <p className="mt-2 line-clamp-4 break-words text-xs leading-relaxed text-white/[0.68] [overflow-wrap:anywhere]">
                                                        {journalExcerpt(entry.caption)}
                                                    </p>
                                                    <div className="mt-auto pt-4">{projectButton(entry, true)}</div>
                                                </div>
                                            </GlassSurface>
                                        ))}
                                    </div>
                                </section>

                            </div>
                        </div>
                    </GlassSurface>
                </CuttingMatSurface>
            </motion.div>

            {activeProject && ReactDOM.createPortal(
                <ProjectDetail
                    project={activeProject}
                    analyticsSource="tinkerverse"
                    onClose={() => setActiveProject(null)}
                />,
                document.body,
            )}
        </div>
    );
};

export default TinkerVerseModal;

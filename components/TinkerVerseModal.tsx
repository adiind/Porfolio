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
                        <p className="text-sm font-semibold text-white/85">Workshop image unavailable</p>
                        <p className="mt-1 text-xs text-white/60">The field note remains readable offline.</p>
                    </div>
                </div>
            )}

            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                <span
                    data-journal-fallback="verified-local"
                    className="rounded-full border border-white/20 bg-black/[0.72] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/80 backdrop-blur-md"
                >
                    Verified portfolio fallback
                </span>
                {entry.mediaType === 'video-thumbnail' && (
                    <span className="flex items-center gap-1 rounded-full border border-[#e5e55a]/35 bg-black/[0.72] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#f0f18a] backdrop-blur-md">
                        <Play size={10} fill="currentColor" aria-hidden="true" /> Video still
                    </span>
                )}
            </div>
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
    const fieldNotes = TINKERVERSE_JOURNAL.slice(1, 5);
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
                <CuttingMatSurface active={!activeProject} density="auto" className="p-2.5 sm:p-4 md:p-7">
                    <GlassSurface strength="strong" blur="strong" className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.25rem] md:rounded-[1.6rem]">
                        <header className="relative z-10 flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-5 md:px-7 md:py-4">
                            <img src={TINKERVERSE_LOGO} alt="" className="h-9 w-9 shrink-0 rounded-lg border border-white/15 bg-black object-cover sm:h-10 sm:w-10" />
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <h2 id="tinkerverse-modal-title" className="text-xl font-bold tracking-tight text-white sm:text-2xl">TinkerVerse</h2>
                                    <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#e5e55a]">Live workshop journal</span>
                                </div>
                                <p className="mt-0.5 hidden text-xs text-white/65 sm:block"><span className="text-white/80">{item.title}</span> · Physical computing, agentic software, and creative-tech experiments in progress.</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleTopmostClose}
                                aria-label="Close TinkerVerse journal"
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/25 text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0f18a]"
                            >
                                <X size={19} aria-hidden="true" />
                            </button>
                        </header>

                        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-6 pt-4 custom-scrollbar sm:px-5 md:px-7 md:pb-8 md:pt-6">
                            <div className="mx-auto min-w-0 max-w-6xl">
                                <section className="mb-5 grid gap-3 border-b border-white/10 pb-5 md:mb-7 md:grid-cols-[0.72fr_1.28fr] md:items-end md:gap-8 md:pb-7">
                                    <div>
                                        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e5e55a]">Founder thesis</p>
                                        <p className="mt-2 max-w-xl text-lg font-semibold leading-snug text-white sm:text-xl md:text-2xl">
                                            A live workshop for making technology tangible, one honest build at a time.
                                        </p>
                                    </div>
                                    <p className="max-w-2xl text-sm leading-relaxed text-white/70 md:justify-self-end">
                                        TinkerVerse is where I document physical computing, agentic software, and creative-tech experiments while they are still being figured out.
                                    </p>
                                </section>

                                {leadEntry && (
                                    <GlassSurface
                                        as="article"
                                        data-journal-lead
                                        data-journal-entry={leadEntry.id}
                                        strength="balanced"
                                        blur="medium"
                                        className="mb-6 grid min-w-0 overflow-hidden rounded-2xl lg:grid-cols-[1.45fr_0.75fr]"
                                    >
                                        <div className="aspect-[16/10] min-h-[250px] lg:aspect-auto lg:min-h-[430px]">
                                            <JournalMedia entry={leadEntry} priority />
                                        </div>
                                        <div data-journal-text className="relative flex min-w-0 flex-col p-5 sm:p-6 lg:p-7">
                                            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em]">
                                                <span data-journal-status className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 font-semibold text-emerald-200">{leadEntry.statusLabel}</span>
                                                <span className="text-white/55">{formatJournalDate(leadEntry.publishedAt)}</span>
                                            </div>
                                            <p className="mt-5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e5e55a]">Latest field note</p>
                                            <h3 className="mt-2 break-words text-2xl font-bold leading-tight text-white sm:text-3xl">
                                                {projectsById.get(leadEntry.projectId ?? '')?.hero.title ?? 'From the workbench'}
                                            </h3>
                                            <p className="mt-3 break-words text-sm leading-relaxed text-white/[0.72] [overflow-wrap:anywhere] sm:text-base">
                                                {journalExcerpt(leadEntry.caption, 3)}
                                            </p>
                                            <div className="mt-auto pt-6">{projectButton(leadEntry)}</div>
                                        </div>
                                    </GlassSurface>
                                )}

                                <section aria-labelledby="field-notes-title">
                                    <div className="mb-4 flex items-end justify-between gap-4">
                                        <div>
                                            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e5e55a]">Build log</p>
                                            <h3 id="field-notes-title" className="mt-1 text-xl font-bold text-white sm:text-2xl">Recent field notes</h3>
                                        </div>
                                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">Curated / {TINKERVERSE_JOURNAL.length}</span>
                                    </div>

                                    <div data-journal-grid className="grid gap-3 sm:grid-cols-2 lg:gap-4">
                                        {fieldNotes.map((entry) => (
                                            <GlassSurface
                                                as="article"
                                                key={entry.id}
                                                data-journal-entry={entry.id}
                                                strength="quiet"
                                                blur="soft"
                                                className="grid min-w-0 overflow-hidden rounded-xl sm:grid-cols-[0.95fr_1.05fr]"
                                            >
                                                <div className="aspect-[4/3] min-h-[180px] sm:aspect-auto sm:min-h-[230px]">
                                                    <JournalMedia entry={entry} />
                                                </div>
                                                <div data-journal-text className="flex min-w-0 flex-col p-4">
                                                    <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[0.13em]">
                                                        <span data-journal-status className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-0.5 font-semibold text-emerald-200">{entry.statusLabel}</span>
                                                        <span className="text-white/55">{formatJournalDate(entry.publishedAt)}</span>
                                                    </div>
                                                    <h4 className="mt-3 break-words text-base font-bold leading-snug text-white">
                                                        {projectsById.get(entry.projectId ?? '')?.hero.title ?? 'Workshop note'}
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

                                <div className="mt-7 flex justify-center border-t border-white/10 pt-6">
                                    <a
                                        data-follow-instagram
                                        href="https://www.instagram.com/tinker_verse/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-black/25 px-5 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:border-[#e5e55a]/45 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0f18a]"
                                    >
                                        Follow the ongoing work
                                        <ExternalLink size={14} aria-hidden="true" />
                                    </a>
                                </div>
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

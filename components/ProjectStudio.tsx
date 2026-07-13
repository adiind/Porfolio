import React, { ChangeEvent, DragEvent, useEffect, useId, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Check, ChevronDown, CircleAlert, Download, FileUp, ImagePlus,
    Plus, RotateCcw, Trash2, X,
} from 'lucide-react';
import { Project } from '../types/Project';
import { useProjects } from '../context/ProjectsContext';
import { useDialogA11y } from '../hooks/useDialogA11y';

interface Props { onClose: () => void; }

const themeColors: NonNullable<Project['themeColor']>[] = ['amber', 'teal', 'indigo', 'rose', 'emerald', 'violet'];
const statuses: Project['outcome']['status'][] = ['shipped', 'in-progress', 'concept', 'archived'];
const statusLabels: Record<Project['outcome']['status'], string> = {
    shipped: 'Shipped', 'in-progress': 'In progress', concept: 'Concept', archived: 'Archived',
};
const themeStyles: Record<NonNullable<Project['themeColor']>, { border: string; text: string; dot: string }> = {
    amber: { border: 'border-amber-300/45', text: 'text-amber-200', dot: 'bg-amber-300' },
    teal: { border: 'border-teal-300/45', text: 'text-teal-200', dot: 'bg-teal-300' },
    indigo: { border: 'border-indigo-300/45', text: 'text-indigo-200', dot: 'bg-indigo-300' },
    rose: { border: 'border-rose-300/45', text: 'text-rose-200', dot: 'bg-rose-300' },
    emerald: { border: 'border-emerald-300/45', text: 'text-emerald-200', dot: 'bg-emerald-300' },
    violet: { border: 'border-violet-300/45', text: 'text-violet-200', dot: 'bg-violet-300' },
};

const toDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
});
const getImageFiles = (files: FileList | File[]): File[] => Array.from(files).filter((file) => file.type.startsWith('image/'));
const textInputClass = 'w-full rounded-none border border-white/40 bg-white/[0.035] px-3 py-2.5 text-sm leading-relaxed text-white outline-none transition placeholder:text-white/50 focus:border-[#d8ff4e] focus:bg-white/[0.055] focus:ring-1 focus:ring-[#d8ff4e]/30';

const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string; asGroup?: boolean }> = ({ label, children, hint, asGroup = false }) => {
    const Tag = asGroup ? 'div' : 'label';
    return (
        <Tag className="block">
            <span className="mb-2 flex items-center justify-between font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
                {label}{hint && <span className="normal-case tracking-normal text-white/55">{hint}</span>}
            </span>
            {children}
        </Tag>
    );
};

const StudioPreview: React.FC<{ project: Project }> = ({ project }) => {
    const theme = themeStyles[project.themeColor ?? 'amber'];
    const skills = project.skills?.slice(0, 4) ?? [];
    return (
        <div className="relative min-h-[540px] overflow-hidden border border-white/10 bg-[#0a0b09] p-5 shadow-[0_28px_75px_rgba(0,0,0,0.35)] md:p-8">
            <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.09)_1px,transparent_1px)] [background-size:32px_32px]" />
            <div className="relative flex items-center justify-between border-b border-white/15 pb-4 font-mono text-[10px] uppercase tracking-[0.17em] text-white/50">
                <span className="flex items-center gap-2 text-[#d8ff4e]"><span className="h-1.5 w-1.5 rounded-full bg-[#d8ff4e]" /> Live card preview</span>
                <span>{statusLabels[project.outcome.status]}</span>
            </div>
            <div className="relative pt-9">
                <h2 className="max-w-3xl font-serif text-4xl leading-[0.95] tracking-[-0.055em] text-[#f7f6ed] md:text-6xl">{project.hero.title}</h2>
                <p className="mt-5 max-w-2xl font-mono text-xs uppercase leading-relaxed tracking-[0.1em] text-[#d8ff4e]">{project.hero.oneLiner}</p>
            </div>
            <div className={`relative mt-8 aspect-[16/10] overflow-hidden border ${theme.border} bg-white/[0.035]`}>
                {project.heroImage ? <img src={project.heroImage} alt="Selected hero preview" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center font-mono text-xs uppercase tracking-[0.18em] text-white/55">Drop a hero image</div>}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/65 to-transparent" />
            </div>
            <div className="relative mt-7 grid gap-6 border-t border-white/15 pt-5 md:grid-cols-[1fr_auto]">
                <p className="max-w-2xl text-sm leading-relaxed text-white/62">{project.outcome.text}</p>
                <div className="flex flex-wrap content-start gap-2 md:max-w-[190px] md:justify-end">
                    {skills.map((skill) => <span key={skill.label} className={`border px-2 py-1 font-mono text-[10px] uppercase tracking-wide ${theme.border} ${theme.text}`}>{skill.label}</span>)}
                </div>
            </div>
        </div>
    );
};

const MediaDropzone: React.FC<{ label: string; image?: string; onFiles: (files: File[]) => void; compact?: boolean }> = ({ label, image, onFiles, compact = false }) => {
    const inputId = useId();
    const [isDragging, setIsDragging] = useState(false);
    const acceptFiles = (files: FileList | File[]) => {
        const images = getImageFiles(files);
        if (images.length) onFiles(images);
    };
    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        acceptFiles(event.dataTransfer.files);
    };
    return (
        <div onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} className={`group relative overflow-hidden border border-dashed transition ${compact ? 'aspect-[4/3]' : 'aspect-[16/10]'} ${isDragging ? 'border-[#d8ff4e] bg-[#d8ff4e]/10' : 'border-white/18 bg-white/[0.025] hover:border-white/35'}`}>
            {image && <img src={image} alt="Selected project media" className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-300 group-hover:opacity-45" />}
            <label htmlFor={inputId} className="absolute inset-0 z-10 flex cursor-pointer flex-col items-center justify-center gap-2 p-4 text-center">
                <span className="flex h-9 w-9 items-center justify-center border border-white/25 bg-black/35 text-[#d8ff4e] backdrop-blur-sm"><ImagePlus size={17} strokeWidth={1.5} /></span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/70">{label}</span>
                {!compact && <span className="text-[11px] text-white/55">Drop an image or choose a file</span>}
            </label>
            <input id={inputId} type="file" accept="image/*" multiple={compact} className="sr-only" onChange={(event) => { if (event.target.files) acceptFiles(event.target.files); event.target.value = ''; }} />
        </div>
    );
};

const ProjectStudio: React.FC<Props> = ({ onClose }) => {
    const { projects, updateProject, createProject, replaceProjects, resetProjects, draftStatus, draftError, hasLocalDraft } = useProjects();
    const [activeId, setActiveId] = useState(projects[0]?.id ?? '');
    const [isResetting, setIsResetting] = useState(false);
    const importInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => { if (!projects.some((item) => item.id === activeId)) setActiveId(projects[0]?.id ?? ''); }, [activeId, projects]);
    const project = projects.find((item) => item.id === activeId) ?? projects[0];
    const patchProject = (updater: (current: Project) => Project) => { if (project) updateProject(project.id, updater); };
    const setHeroImage = async (files: File[]) => {
        const [file] = files;
        if (!file) return;
        const image = await toDataUrl(file);
        patchProject((current) => ({ ...current, heroImage: image }));
    };
    const addGalleryImages = async (files: File[]) => {
        const images = await Promise.all(files.map(toDataUrl));
        patchProject((current) => ({ ...current, gallery: [...(current.gallery ?? []), ...images] }));
    };
    const updateBullet = (index: number, value: string) => patchProject((current) => ({ ...current, build: { bullets: current.build.bullets.map((bullet, itemIndex) => itemIndex === index ? value : bullet) } }));
    const updateSkills = (value: string) => {
        const labels = value.split(',').map((skill) => skill.trim()).filter(Boolean);
        patchProject((current) => ({ ...current, skills: labels.map((label) => ({ label, description: current.skills?.find((skill) => skill.label === label)?.description ?? '' })) }));
    };
    const exportDraft = () => {
        const file = new Blob([JSON.stringify(projects, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'portfolio-project-draft.json';
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);
    };
    const importDraft = async (event: ChangeEvent<HTMLInputElement>) => {
        const [file] = Array.from(event.target.files ?? []);
        if (!file) return;
        try {
            const imported = JSON.parse(await file.text()) as unknown;
            if (!Array.isArray(imported) || !imported.every((item) => item && typeof item === 'object' && 'id' in item && 'hero' in item)) throw new Error('That file is not a Portfolio Studio project draft.');
            replaceProjects(imported as Project[]);
            setActiveId((imported[0] as Project | undefined)?.id ?? '');
        } catch (error) { window.alert(error instanceof Error ? error.message : 'Unable to import that draft.'); }
        finally { event.target.value = ''; }
    };
    const handleReset = async () => {
        if (!isResetting) { setIsResetting(true); return; }
        await resetProjects();
        setActiveId(projects[0]?.id ?? '');
        setIsResetting(false);
    };
    const dialogRef = useDialogA11y(onClose);
    if (!project) return null;
    const statusDetail = draftStatus === 'saving' ? 'Saving draft…' : draftStatus === 'error' ? 'Draft could not save' : hasLocalDraft ? 'Draft saved on this browser' : 'Editing the published source';

    return ReactDOM.createPortal((
        <motion.div ref={dialogRef} tabIndex={-1} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-labelledby="portfolio-studio-title" className="fixed inset-0 z-[170] overflow-hidden bg-[#10110e] text-white focus:outline-none">
            <div className="pointer-events-none absolute inset-0 opacity-[0.22] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px]" />
            <header className="relative flex min-h-[72px] items-center justify-between gap-4 border-b border-white/12 bg-[#10110e]/95 px-4 backdrop-blur-md md:px-6">
                <div className="flex min-w-0 items-center gap-4">
                    <button onClick={onClose} className="inline-flex shrink-0 items-center gap-2 border border-transparent px-2 py-2 font-mono text-xs text-white/60 transition hover:border-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#d8ff4e]"><ArrowLeft size={15} /> <span className="hidden sm:inline">Back to site</span></button>
                    <div className="hidden h-6 w-px bg-white/15 sm:block" />
                    <h2 id="portfolio-studio-title" className="truncate font-serif text-2xl tracking-[-0.04em] text-[#f7f6ed]">Portfolio Studio</h2>
                </div>
                <div className="flex items-center gap-2">
                    <div className="hidden flex-col items-end gap-1 sm:flex">
                        <div role="status" aria-live="polite" className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.13em] ${draftStatus === 'error' ? 'text-rose-300' : 'text-[#d8ff4e]'}`}>{draftStatus === 'error' ? <CircleAlert size={13} /> : <Check size={13} />}{statusDetail}</div>
                        {draftStatus === 'error' && draftError && <p role="alert" className="text-[10px] leading-snug text-rose-300">{draftError}</p>}
                    </div>
                    <button onClick={() => importInputRef.current?.click()} className="hidden border border-white/15 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.13em] text-white/65 transition hover:border-white/35 hover:text-white md:inline-flex"><FileUp size={13} className="mr-1.5" /> Import</button>
                    <button onClick={exportDraft} className="inline-flex items-center gap-1.5 bg-[#d8ff4e] px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-black transition hover:bg-[#edff99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><Download size={13} /> Export draft</button>
                    <input ref={importInputRef} className="sr-only" type="file" accept="application/json" aria-label="Import draft JSON" onChange={(event) => void importDraft(event)} />
                </div>
            </header>
            <div className="relative h-[calc(100dvh-72px)] min-h-0 overflow-y-auto lg:grid lg:overflow-hidden lg:grid-cols-[248px_minmax(0,1fr)_360px]">
                <aside className="min-h-0 overflow-y-auto border-b border-white/12 bg-[#0a0b09]/82 p-3 lg:border-b-0 lg:border-r">
                    <div className="mb-3 flex items-center justify-between px-2 pt-1"><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/55">Projects · {projects.length}</span><button onClick={() => setActiveId(createProject())} className="flex h-7 w-7 items-center justify-center border border-white/15 text-[#d8ff4e] transition hover:border-[#d8ff4e] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#d8ff4e]" aria-label="Create a new project"><Plus size={15} /></button></div>
                    <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-x-visible">
                        {projects.map((item, index) => {
                            const selected = item.id === project.id;
                            return <button key={item.id} onClick={() => setActiveId(item.id)} aria-current={selected ? 'true' : undefined} className={`group relative min-w-[175px] overflow-hidden border p-2 text-left transition lg:min-w-0 ${selected ? 'border-[#d8ff4e] bg-[#d8ff4e]/[0.07]' : 'border-white/10 bg-black/20 hover:border-white/28'}`}><span className={`absolute left-0 top-2 font-mono text-[9px] ${selected ? 'text-[#d8ff4e]' : 'text-white/60'}`}>{String(index + 1).padStart(2, '0')}</span><div className="ml-6 flex gap-2"><div className="h-10 w-12 shrink-0 overflow-hidden bg-white/[0.05]">{item.heroImage && <img src={item.heroImage} alt="" className="h-full w-full object-cover" />}</div><span className="line-clamp-2 self-center font-mono text-[11px] leading-snug text-white/75 group-hover:text-white">{item.hero.title}</span></div></button>;
                        })}
                    </div>
                    <div className="mt-5 hidden border-t border-white/10 px-2 pt-4 lg:block"><p className="text-xs leading-relaxed text-white/55">Images and text stay in this browser until you export or publish them.</p><button onClick={() => void handleReset()} className={`mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.13em] transition ${isResetting ? 'text-rose-300' : 'text-white/55 hover:text-white'}`}><RotateCcw size={12} /> {isResetting ? 'Click again to reset drafts' : 'Reset local drafts'}</button></div>
                </aside>
                <div className="p-4 md:p-7 lg:min-h-0 lg:overflow-y-auto"><div className="mx-auto max-w-4xl"><div className="mb-5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-white/55"><span>Preview</span><span className="hidden sm:inline">16 : 10 hero frame</span></div><StudioPreview project={project} /><div className="mt-5 border-t border-white/12 pt-4 text-xs leading-relaxed text-white/55">This is a live preview of the template that powers Selected Work. Changes are immediately reflected in the cards and project detail views behind the Studio.</div></div></div>
                <section className="border-t border-white/12 bg-[#0a0b09]/92 p-4 backdrop-blur-sm lg:min-h-0 lg:overflow-y-auto lg:border-l lg:border-t-0 lg:p-5">
                    <div className="mb-6 flex items-center justify-between border-b border-white/12 pb-4"><div><h2 className="font-serif text-2xl tracking-[-0.035em] text-[#f7f6ed]">Edit project</h2><p className="mt-1 text-xs text-white/55">No JSON required.</p></div><div className="flex gap-1">{themeColors.map((color) => <button key={color} onClick={() => patchProject((current) => ({ ...current, themeColor: color }))} className={`h-4 w-4 rounded-full border border-black/25 ${themeStyles[color].dot} ${project.themeColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0a0b09]' : 'opacity-45 hover:opacity-100'}`} aria-label={`Use ${color} project color`} aria-pressed={project.themeColor === color} />)}</div></div>
                    <div className="space-y-6 pb-10">
                        <Field label="Title"><input className={textInputClass} value={project.hero.title} onChange={(event) => patchProject((current) => ({ ...current, hero: { ...current.hero, title: event.target.value } }))} /></Field>
                        <Field label="One-liner"><textarea rows={3} className={textInputClass} value={project.hero.oneLiner} onChange={(event) => patchProject((current) => ({ ...current, hero: { ...current.hero, oneLiner: event.target.value } }))} /></Field>
                        <Field asGroup label="Hero image" hint="16:10 works best"><MediaDropzone label={project.heroImage ? 'Replace hero image' : 'Drop a hero image'} image={project.heroImage} onFiles={(files) => void setHeroImage(files)} /></Field>
                        <Field label="Project story"><textarea rows={6} className={textInputClass} value={project.context.text} onChange={(event) => patchProject((current) => ({ ...current, context: { text: event.target.value } }))} /></Field>
                        <Field label="What I built"><div className="space-y-2">{project.build.bullets.map((bullet, index) => <div key={index} className="flex gap-2"><textarea rows={2} className={textInputClass} value={bullet} onChange={(event) => updateBullet(index, event.target.value)} /><button onClick={() => patchProject((current) => ({ ...current, build: { bullets: current.build.bullets.filter((_, itemIndex) => itemIndex !== index) } }))} aria-label={`Remove build point ${index + 1}`} className="self-start border border-white/40 p-2.5 text-white/55 transition hover:border-rose-300/60 hover:text-rose-200"><Trash2 size={14} /></button></div>)}<button onClick={() => patchProject((current) => ({ ...current, build: { bullets: [...current.build.bullets, ''] } }))} className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.13em] text-[#d8ff4e] transition hover:text-[#edff99]"><Plus size={13} /> Add point</button></div></Field>
                        <Field label="Skills" hint="Separate with commas"><input className={textInputClass} value={(project.skills ?? []).map((skill) => skill.label).join(', ')} onChange={(event) => updateSkills(event.target.value)} placeholder="Research, React, Prototyping" /></Field>
                        <div className="grid grid-cols-2 gap-3"><Field label="Status"><div className="relative"><select value={project.outcome.status} onChange={(event) => patchProject((current) => ({ ...current, outcome: { ...current.outcome, status: event.target.value as Project['outcome']['status'] } }))} className={`${textInputClass} appearance-none pr-8 font-mono text-xs uppercase`}>{statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 text-white/55" size={14} /></div></Field><Field label="Source label"><input className={textInputClass} value={project.sourceLabel ?? ''} onChange={(event) => patchProject((current) => ({ ...current, sourceLabel: event.target.value || undefined }))} placeholder="View case study" /></Field></div>
                        <Field label="Outcome"><textarea rows={4} className={textInputClass} value={project.outcome.text} onChange={(event) => patchProject((current) => ({ ...current, outcome: { ...current.outcome, text: event.target.value } }))} /></Field>
                        <Field label="Reflection"><textarea rows={4} className={textInputClass} value={project.reflection.text} onChange={(event) => patchProject((current) => ({ ...current, reflection: { text: event.target.value } }))} /></Field>
                        <Field asGroup label="Gallery" hint="Drop screenshots or photos"><div className="grid grid-cols-2 gap-2">{(project.gallery ?? []).map((image, index) => <div key={`${image.slice(0, 24)}-${index}`} className="group relative aspect-[4/3] overflow-hidden border border-white/12"><img src={image} alt={`Gallery image ${index + 1}`} className="h-full w-full object-cover" /><button onClick={() => patchProject((current) => ({ ...current, gallery: (current.gallery ?? []).filter((_, itemIndex) => itemIndex !== index) }))} className="absolute right-2 top-2 border border-white/20 bg-black/65 p-1.5 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100" aria-label={`Remove gallery image ${index + 1}`}><X size={13} /></button></div>)}<MediaDropzone compact label="Add images" onFiles={(files) => void addGalleryImages(files)} /></div></Field>
                        <Field label="Source URL" hint="Optional"><input type="url" className={textInputClass} value={project.sourceUrl ?? ''} onChange={(event) => patchProject((current) => ({ ...current, sourceUrl: event.target.value || undefined }))} placeholder="https://…" /></Field>
                    </div>
                </section>
            </div>
        </motion.div>
    ), document.body);
};

export default ProjectStudio;

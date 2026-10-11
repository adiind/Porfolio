import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowDown, X } from 'lucide-react';
import { Project } from '../../types/Project';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { projectPath } from '../../lib/workRoutes';
import {
    PgRoom,
    pgChips,
    pgEyebrow,
    pgLadder,
    pgMeta,
    pgMethods,
    pgOverview,
    pgPhases,
    pgRooms,
    pgSections,
    pgSkills,
} from '../../data/pgStory';
import './pg-case.css';

interface Props {
    project: Project;
    onClose: () => void;
}

const SLIM = 'M10 1h4v4h2v5H8V5h2V1zm-2 11h8l1 26H7l1-26z';
const WIDE = 'M7 2h10v3h3v6H4V5h3V2zM3 13h18l1.2 25H1.8L3 13z';
const TALL = 'M9 0h6v6h1.5v5h-9V6H9V0zM7.5 13h9l.8 26h-10.6l.8-26z';
const SQUAT = 'M6 5h12v3h2.5v5h-17V8H6V5zM4 15h16l.8 22H3.2L4 15z';
const SHOULDER = 'M8 1.5h8v3.2h2.2l1.8 6.3H4l1.8-6.3H8V1.5zM5 13h14l1.4 25H3.6L5 13z';

type Bottle = { d: string; scale: number };
type LadderMark = { mode: 'stroke' | 'fill'; bottles: Bottle[] };

/** Count, fill, and shape change by rung so the ladder reads as a build, not a stamp. */
const LADDER_MARKS: Record<string, LadderMark> = {
    '01': { mode: 'stroke', bottles: [{ d: SLIM, scale: 0.72 }] },
    '02': { mode: 'stroke', bottles: [{ d: SLIM, scale: 0.84 }, { d: WIDE, scale: 0.7 }] },
    '03': {
        mode: 'fill',
        bottles: [
            { d: SLIM, scale: 0.9 },
            { d: WIDE, scale: 0.74 },
            { d: TALL, scale: 1 },
            { d: SQUAT, scale: 0.66 },
        ],
    },
    '04': {
        mode: 'fill',
        bottles: [
            { d: SLIM, scale: 0.7 },
            { d: SHOULDER, scale: 1 },
            { d: WIDE, scale: 0.76 },
        ],
    },
    '05': { mode: 'fill', bottles: [{ d: SHOULDER, scale: 0.88 }, { d: TALL, scale: 1 }] },
};

const LadderMarks: React.FC<{ step: string }> = ({ step }) => {
    const spec = LADDER_MARKS[step] ?? LADDER_MARKS['03'];
    return (
        <span className={`pg-silhouettes${spec.mode === 'stroke' ? ' pg-silhouettes-line' : ''}`} aria-hidden="true">
            {spec.bottles.map((bottle, index) => (
                <svg
                    key={`${step}-${index}`}
                    viewBox="0 0 24 40"
                    style={{ height: `${bottle.scale * 100}%` }}
                    fill={spec.mode === 'fill' ? 'currentColor' : 'none'}
                    stroke={spec.mode === 'stroke' ? 'currentColor' : 'none'}
                    strokeWidth={1.6}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                >
                    <path d={bottle.d} />
                </svg>
            ))}
        </span>
    );
};

const withheldFieldCopy = (rooms: PgRoom[]) => {
    const missing = rooms.filter((room) => !room.fieldSrc);
    if (!missing.length) return null;
    if (missing.length === rooms.length) {
        return 'Photographs from the in-home visits, the working session, and the central-site rounds stay off this page, with the stimuli and notes.';
    }
    const names = missing.map((room) => room.phase.toLowerCase()).join(', ');
    return `Photographs from ${names} stay off this page, with the stimuli and notes.`;
};

const PgProjectDetail: React.FC<Props> = ({ project, onClose }) => {
    const dialogRef = useDialogA11y(onClose, { historyTag: 'project', historyPath: projectPath(project.id) });
    const reduceMotion = useReducedMotion();
    const [activeId, setActiveId] = useState<string>(pgSections[0].id);
    const fieldNote = withheldFieldCopy(pgRooms);

    useEffect(() => {
        const root = dialogRef.current;
        if (!root) return;
        let frame = 0;
        const update = () => {
            frame = 0;
            const rootTop = root.getBoundingClientRect().top;
            // One line, the middle of the case. 03 is tied to the Research
            // plate so the sprint does not stay lit through the three rooms.
            const line = root.clientHeight * 0.5;
            const points: Array<[string, string]> = [
                ['pg-glance', '#pg-glance'],
                ['pg-sprint', '#pg-sprint'],
                ['pg-phases', '#pg-room-research'],
                ['pg-methods', '#pg-methods'],
                ['pg-ladder', '#pg-ladder'],
            ];
            let current = points[0][0];
            for (const [id, selector] of points) {
                const node = root.querySelector<HTMLElement>(selector);
                if (!node) continue;
                if (node.getBoundingClientRect().top - rootTop <= line) current = id;
            }
            setActiveId(current);
        };
        const onScroll = () => {
            if (frame) return;
            frame = window.requestAnimationFrame(update);
        };
        root.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        update();
        return () => {
            root.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            if (frame) window.cancelAnimationFrame(frame);
        };
    }, [dialogRef]);

    const scrollTo = (id: string) => {
        const root = dialogRef.current;
        const target = root?.querySelector<HTMLElement>(`#${id}`);
        if (!root || !target) return;
        const top = target.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - 76;
        root.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
        setActiveId(id);
    };

    return ReactDOM.createPortal(
        <motion.div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pg-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            className="pg-case fixed inset-0 z-[100] overflow-y-auto focus:outline-none"
        >
            <header className="pg-top">
                <button type="button" className="pg-back" onClick={onClose}>
                    <ArrowLeft size={16} aria-hidden="true" />
                    Selected Work
                </button>
                <p className="pg-crumb"><strong>P&G</strong> / Conditioning product packaging</p>
                <button type="button" className="pg-close" onClick={onClose} aria-label="Close">
                    <X size={16} aria-hidden="true" />
                </button>
            </header>

            <section className="pg-hero pg-plate" id="pg-glance">
                <div className="pg-hero-grid">
                    <div>
                        <p className="pg-eyebrow">
                            <span className="pg-dot" aria-hidden="true" />
                            {pgEyebrow}
                            <span className="pg-nda">Under NDA</span>
                        </p>
                        <h1 id="pg-title" className="pg-title pg-display">
                            Rethinking the bottle.
                            <em>And the routine around it.</em>
                        </h1>
                        <p className="pg-dek">
                            A human-centered exploration of conditioning product packaging: how it feels to hold, how it dispenses, and how it fits into everyday haircare.
                        </p>
                        <button type="button" className="pg-follow" onClick={() => scrollTo('pg-sprint')}>
                            Follow the process
                            <ArrowDown size={15} aria-hidden="true" />
                        </button>
                        <div className="pg-chips">
                            {pgChips.map((chip) => (
                                <p className="pg-chip" key={chip.label}>
                                    <b className="pg-display">{chip.value}</b>
                                    <span>{chip.label}</span>
                                </p>
                            ))}
                        </div>
                    </div>
                    <figure className="pg-hero-figure">
                        <img src={pgOverview.src} alt={pgOverview.alt} />
                        <figcaption className="pg-hero-caption">{pgOverview.caption}</figcaption>
                    </figure>
                </div>
            </section>

            <div className="pg-meta">
                {pgMeta.map((item) => (
                    <div key={item.label}>
                        <p className="pg-meta-label">{item.label}</p>
                        <p>{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="pg-body">
                <nav aria-label="Case sections">
                    <ol className="pg-toc">
                        {pgSections.map((section) => (
                            <li key={section.id}>
                                <button
                                    type="button"
                                    aria-current={activeId === section.id ? 'true' : undefined}
                                    onClick={() => scrollTo(section.id)}
                                >
                                    <span className="pg-toc-n">{section.n}</span>
                                    {section.label}
                                </button>
                            </li>
                        ))}
                    </ol>
                </nav>

                <div className="pg-story">
                    <section className="pg-section" id="pg-sprint" aria-labelledby="pg-sprint-title">
                        <div className="pg-plate">
                            <p className="pg-kicker">02 · The sprint</p>
                            <h2 id="pg-sprint-title" className="pg-display">One set. Three rooms.</h2>
                            <p className="pg-lead">
                                The miniatures share a palette, a camera, and a floor so the work reads as one place. Research, then the table where notes became requirements, then hands-on testing. Field photographs from the visits are withheld. Stimuli, notes, and final packs stay under the NDA.
                            </p>
                            <figure className="pg-overview">
                                <img src={pgOverview.src} alt={pgOverview.alt} />
                                <figcaption className="pg-cap">
                                    <b>Diagram</b>
                                    <span>{pgOverview.caption}</span>
                                </figcaption>
                            </figure>
                        </div>

                        {pgRooms.map((room) => (
                            <article className="pg-plate pg-room" id={`pg-room-${room.id}`} key={room.id}>
                                <p className="pg-kicker">{room.phase}</p>
                                <h3 className="pg-display">{room.title}</h3>
                                <p className="pg-lead">{room.body}</p>
                                <div className={room.fieldSrc ? 'pg-pair' : undefined}>
                                    <figure className="pg-shot">
                                        <img src={room.diagramSrc} alt={room.diagramAlt} />
                                        <figcaption className="pg-cap">
                                            <b>Diagram</b>
                                            <span>{room.diagramCaption}</span>
                                        </figcaption>
                                    </figure>
                                    {room.fieldSrc ? (
                                        <figure className="pg-field-figure">
                                            <img src={room.fieldSrc} alt="" />
                                            <figcaption className="pg-cap">
                                                <b>Field</b>
                                                <span>{room.fieldCaption}</span>
                                            </figcaption>
                                        </figure>
                                    ) : null}
                                </div>
                            </article>
                        ))}

                        {fieldNote ? (
                            <aside className="pg-plate pg-nda-note">
                                <p className="pg-kicker">Field</p>
                                <p><span className="pg-nda-label">Withheld under NDA.</span> {fieldNote}</p>
                            </aside>
                        ) : null}
                    </section>

                    <section className="pg-section" id="pg-phases" aria-labelledby="pg-phases-title">
                        <div className="pg-plate">
                            <div className="pg-work">
                                <div className="pg-work-copy">
                                    <p className="pg-kicker">03 · How we worked</p>
                                    <h2 id="pg-phases-title" className="pg-display">Four phases, then a direction.</h2>
                                    <ol className="pg-phase-list">
                                        {pgPhases.map((phase) => (
                                            <li key={phase.n}>
                                                <span>{phase.n}</span>
                                                <strong>{phase.title}</strong>
                                                <p>{phase.text}</p>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                                <aside className="pg-skills" aria-label="Skills and tools">
                                    <h2>Skills & tools</h2>
                                    <dl>
                                        {pgSkills.map((skill) => (
                                            <div key={skill.label}>
                                                <dt>{skill.label}</dt>
                                                <dd>{skill.detail}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                </aside>
                            </div>
                        </div>
                    </section>

                    <section className="pg-section" id="pg-methods" aria-labelledby="pg-methods-title">
                        <div className="pg-plate">
                            <p className="pg-kicker">04 · Methods</p>
                            <h2 id="pg-methods-title" className="pg-display">What we actually did.</h2>
                            <div className="pg-methods">
                                {pgMethods.map((method) => (
                                    <article className="pg-method" key={method.n}>
                                        <span>{method.n}</span>
                                        <h3>{method.title}</h3>
                                        <p>{method.text}</p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="pg-section" id="pg-ladder" aria-labelledby="pg-ladder-title">
                        <div className="pg-plate">
                            <p className="pg-kicker">05 · Prototypes</p>
                            <h2 id="pg-ladder-title" className="pg-display">From a note to a form in the hand.</h2>
                            <p className="pg-lead">
                                The ladder stops where the NDA starts. Silhouettes stand in for the printed studies. The sponsor&apos;s packs are blurred on purpose.
                            </p>
                            <ol className="pg-ladder">
                                {pgLadder.map((rung) => (
                                    <li className={rung.withheld ? 'pg-rung pg-rung-withheld' : 'pg-rung'} key={rung.n} data-ladder-step={rung.n}>
                                        <span className="pg-rung-n pg-display">{rung.n}</span>
                                        <div>
                                            <h3>{rung.title}</h3>
                                            <p>{rung.text}</p>
                                            {rung.withheld ? <span className="pg-withheld-label">Under NDA</span> : null}
                                        </div>
                                        <LadderMarks step={rung.n} />
                                    </li>
                                ))}
                            </ol>
                            <p className="pg-close-note">
                                {project.outcome.text}
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </motion.div>,
        document.body,
    );
};

export default PgProjectDetail;

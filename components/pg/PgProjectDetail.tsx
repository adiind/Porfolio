import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowDown, X } from 'lucide-react';
import { Project } from '../../types/Project';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { projectPath } from '../../lib/workRoutes';
import {
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

const BottleMarks: React.FC = () => (
    <span className="pg-silhouettes" aria-hidden="true">
        <svg viewBox="0 0 18 40" fill="currentColor"><path d="M7 1h4v4h2v6H5V5h2V1zm-2 12h10l1 26H4L5 13z" /></svg>
        <svg viewBox="0 0 22 40" fill="currentColor"><path d="M8 1h6v3h3v5H5V4h3V1zM4 11h14l2 28H2L4 11z" /></svg>
        <svg viewBox="0 0 16 40" fill="currentColor"><path d="M6 0h4v6h2v4H4V6h2V0zm-1 12h6l1 27H4l1-27z" /></svg>
        <svg viewBox="0 0 24 40" fill="currentColor"><path d="M9 2h6v4h3v5H6V6h3V2zM3 13h18l1 25H2L3 13z" /></svg>
    </span>
);

const PgProjectDetail: React.FC<Props> = ({ project, onClose }) => {
    const dialogRef = useDialogA11y(onClose, { historyTag: 'project', historyPath: projectPath(project.id) });
    const reduceMotion = useReducedMotion();
    const [activeId, setActiveId] = useState<string>(pgSections[0].id);

    useEffect(() => {
        const root = dialogRef.current;
        if (!root) return;
        const nodes = pgSections
            .map((section) => root.querySelector<HTMLElement>(`#${section.id}`))
            .filter((node): node is HTMLElement => Boolean(node));
        if (!nodes.length) return;
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
                if (visible?.target.id) setActiveId(visible.target.id);
            },
            { root, rootMargin: '-18% 0px -62% 0px', threshold: [0.15, 0.4, 0.7] },
        );
        nodes.forEach((node) => observer.observe(node));
        return () => observer.disconnect();
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

            <section className="pg-hero" id="pg-glance">
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
                        <div className="pg-meta">
                    {pgMeta.map((item) => (
                        <div key={item.label}>
                            <p className="pg-meta-label">{item.label}</p>
                            <p>{item.value}</p>
                        </div>
                    ))}
                </div>
            </section>

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

                        {pgRooms.map((room) => (
                            <article className="pg-room" key={room.id}>
                                <p className="pg-kicker">{room.phase}</p>
                                <h3 className="pg-display">{room.title}</h3>
                                <p className="pg-lead">{room.body}</p>
                                <div className="pg-pair">
                                    <figure className="pg-shot">
                                        <img src={room.diagramSrc} alt={room.diagramAlt} />
                                        <figcaption className="pg-cap">
                                            <b>Diagram</b>
                                            <span>{room.diagramCaption}</span>
                                        </figcaption>
                                    </figure>
                                    <figure className="pg-field-figure">
                                        {room.fieldSrc ? (
                                            <img src={room.fieldSrc} alt="" />
                                        ) : (
                                            <div className="pg-field" aria-hidden="true">
                                                <small>Withheld</small>
                                                <p>Working photograph</p>
                                            </div>
                                        )}
                                        <figcaption className="pg-cap">
                                            <b>Field</b>
                                            <span>{room.fieldCaption}</span>
                                        </figcaption>
                                    </figure>
                                </div>
                            </article>
                        ))}
                    </section>

                    <section className="pg-section" id="pg-phases" aria-labelledby="pg-phases-title">
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
                    </section>

                    <section className="pg-section" id="pg-methods" aria-labelledby="pg-methods-title">
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
                    </section>

                    <section className="pg-section" id="pg-ladder" aria-labelledby="pg-ladder-title">
                        <p className="pg-kicker">05 · Prototypes</p>
                        <h2 id="pg-ladder-title" className="pg-display">From a note to a form in the hand.</h2>
                        <p className="pg-lead">
                            The ladder stops where the NDA starts. Silhouettes stand in for the printed studies. The sponsor&apos;s packs are blurred on purpose.
                        </p>
                        <ol className="pg-ladder">
                            {pgLadder.map((rung) => (
                                <li className={rung.withheld ? 'pg-rung pg-rung-withheld' : 'pg-rung'} key={rung.n}>
                                    <span className="pg-rung-n pg-display">{rung.n}</span>
                                    <div>
                                        <h3>{rung.title}</h3>
                                        <p>{rung.text}</p>
                                        {rung.withheld ? <span className="pg-withheld-label">Under NDA</span> : null}
                                    </div>
                                    <BottleMarks />
                                </li>
                            ))}
                        </ol>
                        <p className="pg-close-note">
                            {project.outcome.text}
                        </p>
                    </section>
                </div>
            </div>
        </motion.div>,
        document.body,
    );
};

export default PgProjectDetail;

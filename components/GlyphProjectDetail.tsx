import React, { useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Project } from '../types/Project';
import { useDialogA11y } from '../hooks/useDialogA11y';

interface Props {
    project: Project;
    onClose: () => void;
}

const productImages = [
    {
        src: '/images/glyph/hero-wrist.webp',
        label: 'On the arm',
        caption: 'I made it for short, active sessions. It is not trying to be a smartwatch.',
    },
    {
        src: '/images/glyph/on-wrist-01.webp',
        label: 'The sleeve',
        caption: 'The sleeve holds the larger body in place and makes it feel like something you choose to wear.',
    },
    {
        src: '/images/glyph/on-wrist-02.webp',
        label: 'The size',
        caption: 'It is bigger than a watch because I wanted room for movement, light, and add-on parts.',
    },
    {
        src: '/images/glyph/detail-angled.webp',
        label: 'The clear shell',
        caption: 'The clear PETG sits over a clean black layer and three white light filaments.',
    },
    {
        src: '/images/glyph/detail-side.webp',
        label: 'The side view',
        caption: 'This view shows how the main body, sleeve, and side module sit together.',
    },
    {
        src: '/images/glyph/side-module.webp',
        label: 'The side module',
        caption: 'I kept the extra module visible so it was obvious that the device could be changed and added to.',
    },
];

const nothingReferences = [
    {
        src: '/images/glyph/references/nothing-phone-2-dark.webp',
        alt: 'Official Nothing Phone (2) dark product reference',
        source: 'https://us.nothing.tech/products/phone-2',
        title: 'Show how it is built',
        note: 'The clear back lets you understand the object without showing a pile of unfinished wiring.',
    },
    {
        src: '/images/glyph/references/nothing-phone-2-light.webp',
        alt: 'Official Nothing Phone (2) light product reference',
        source: 'https://us.nothing.tech/products/phone-2',
        title: 'Make the lights useful',
        note: 'The lights tell you something. They are not there just to glow.',
    },
    {
        src: '/images/glyph/references/nothing-ear-black.webp',
        alt: 'Official Nothing Ear black product reference',
        source: 'https://us.nothing.tech/products/ear',
        title: 'Clean up what people can see',
        note: 'If the inside is visible, it still has to be arranged and easy to understand.',
    },
    {
        src: '/images/glyph/references/nothing-headphone-white.webp',
        alt: 'Official Nothing Headphone (1) white product reference',
        source: 'https://us.nothing.tech/products/headphone-1',
        title: 'Make hardware feel good to touch',
        note: 'A technical product can still feel friendly enough to use and wear.',
    },
];

const researchThemes = [
    ['Let me add things', 'People liked the side module because it made the device feel open to new parts instead of sealed shut.'],
    ['Do not make me wire it up every time', 'Magnets and contact pins made more sense than asking someone to plug cables into a wearable.'],
    ['Show me what it is doing', 'People wanted a display and feedback they could understand quickly.'],
];

const gestureSteps = ['Lift from ready', 'Point', 'Snap or tap', 'Move for brightness', 'Roll for color', 'Confirm'];

const truthRows = [
    {
        state: 'Built',
        tone: 'bg-[#d8ff4e] text-black',
        items: 'Looks-like gauntlet, clear PETG shell, PETG-GF structure, black acrylic layer, three white light filaments, custom sleeve, side module.',
    },
    {
        state: 'Working demo',
        tone: 'bg-white text-black',
        items: 'Separate 1.83-inch ESP32-S3 works-like model, nRF52840 module, IMU gestures, BLE-HID and air-mouse paths, telemetry, Home Assistant control.',
    },
    {
        state: 'Not built yet',
        tone: 'bg-[#ff3b30] text-white',
        items: 'Integrated haptics, EMG, dense light matrix, custom PCB, full module ecosystem, and one unified wearable prototype.',
    },
];

const dotLetters: Record<string, string[]> = {
    G: ['01110', '10001', '10000', '10111', '10001', '10001', '01110'],
    L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
    Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
    P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
    H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
};

const DotMatrixGlyph: React.FC = () => (
    <span className="glyph-dot-word" aria-hidden="true">
        {'GLYPH'.split('').map((letter) => (
            <span key={letter} className="glyph-dot-letter">
                {dotLetters[letter].join('').split('').map((value, index) => (
                    <span key={index} className={`glyph-dot ${value === '1' ? 'glyph-dot-on' : ''}`} />
                ))}
            </span>
        ))}
    </span>
);

const FactorLabel: React.FC<{ number: string; children: React.ReactNode; light?: boolean }> = ({ number, children }) => (
    <div className="mb-8 flex items-center gap-4 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-white/55">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-current">{number}</span>
        <span>{children}</span>
        <span className="h-px flex-1 bg-current opacity-25" />
    </div>
);

const NothingCarousel: React.FC = () => {
    const [active, setActive] = useState(0);
    const touchStartX = useRef<number | null>(null);
    const current = nothingReferences[active];

    const previous = () => setActive((value) => (value - 1 + nothingReferences.length) % nothingReferences.length);
    const next = () => setActive((value) => (value + 1) % nothingReferences.length);

    return (
        <div className="overflow-hidden border border-white/15 bg-[#111111]">
            <div
                className="relative aspect-[4/3] touch-pan-y overflow-hidden bg-[#d8d7d2] sm:aspect-[16/10]"
                onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }}
                onTouchEnd={(event) => {
                    if (touchStartX.current === null) return;
                    const delta = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
                    touchStartX.current = null;
                    if (Math.abs(delta) < 48) return;
                    if (delta < 0) next();
                    else previous();
                }}
            >
                <AnimatePresence mode="wait" initial={false}>
                    <motion.a
                        key={current.src}
                        href={current.source}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open official source for ${current.title}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-0 flex items-center justify-center p-7 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#ff3b30] md:p-12"
                    >
                        <img src={current.src} alt={current.alt} loading="lazy" decoding="async" className="h-full w-full scale-125 object-contain" />
                    </motion.a>
                </AnimatePresence>
                <span className="absolute left-4 top-4 bg-black px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white">Official reference</span>
            </div>

            <div className="grid gap-6 border-t border-white/15 p-5 sm:grid-cols-[1fr_auto] sm:items-end md:p-7" aria-live="polite">
                <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">Reference {String(active + 1).padStart(2, '0')}</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">{current.title}</h3>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60">{current.note}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={previous} aria-label="Previous Nothing reference" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-white transition hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b30]">
                        <ChevronLeft size={18} />
                    </button>
                    <span className="min-w-12 text-center font-mono text-[10px] text-white/55">{active + 1} / {nothingReferences.length}</span>
                    <button type="button" onClick={next} aria-label="Next Nothing reference" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-white transition hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b30]">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const GlyphProjectDetail: React.FC<Props> = ({ project, onClose }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const dialogRef = useDialogA11y(onClose, { historyTag: 'project' });
    const year = useMemo(() => new Date().getFullYear(), []);

    return ReactDOM.createPortal(
        <motion.div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="glyph-project-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="glyph-case fixed inset-0 z-[100] overflow-hidden bg-[#080808] text-white focus:outline-none"
        >
            <style>{`
                .glyph-case {
                    --glyph-red: #ff3b30;
                    --glyph-paper: #efeee8;
                    --glyph-ink: #0b0b0b;
                    font-family: "Avenir Next", "Helvetica Neue", sans-serif;
                }
                .glyph-case .glyph-display {
                    font-family: "Avenir Next", "Helvetica Neue", sans-serif;
                }
                .glyph-case .glyph-dotfield {
                    background-image: radial-gradient(circle, rgba(255,255,255,.25) 1px, transparent 1.4px);
                    background-size: 13px 13px;
                }
                .glyph-case .glyph-dot-word {
                    display: flex;
                    align-items: flex-start;
                    gap: clamp(7px, 1.05vw, 15px);
                }
                .glyph-case .glyph-dot-letter {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    grid-template-rows: repeat(7, 1fr);
                    width: clamp(2.55rem, 5.7vw, 5.5rem);
                    aspect-ratio: 5 / 7;
                    gap: clamp(2px, .33vw, 5px);
                }
                .glyph-case .glyph-dot {
                    border-radius: 999px;
                    background: transparent;
                }
                .glyph-case .glyph-dot-on {
                    background: #f4f3ed;
                    box-shadow: 0 0 10px rgba(255,255,255,.08);
                }
                .glyph-case .glyph-outline-text {
                    color: transparent;
                    -webkit-text-stroke: 1px rgba(255,255,255,.28);
                }
                .glyph-case ::selection {
                    background: var(--glyph-red);
                    color: white;
                }
                @media (prefers-reduced-motion: reduce) {
                    .glyph-case * { scroll-behavior: auto !important; }
                }
            `}</style>

            <button
                type="button"
                onClick={onClose}
                aria-label={`Close ${project.hero.title}`}
                className="fixed right-3 top-3 z-[9999] flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-black/15 bg-[#efeee8] p-0 text-sm font-semibold text-black shadow-2xl transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b30] sm:w-auto sm:px-4 md:right-6 md:top-6"
            >
                <X size={18} strokeWidth={2.25} />
                <span className="hidden sm:inline">Close</span>
            </button>

            <div ref={scrollRef} className="h-full overflow-y-auto overflow-x-hidden overscroll-contain">
                <div>
                    <section className="relative min-h-[100svh] overflow-hidden border-b border-white/10 bg-[#080808]">
                        <div className="glyph-dotfield pointer-events-none absolute -right-12 top-0 h-72 w-72 opacity-25" aria-hidden="true" />
                        <div className="mx-auto grid min-h-[100svh] max-w-[1500px] lg:grid-cols-[1.04fr_.96fr]">
                            <motion.div
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.06, duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
                                className="relative z-10 flex flex-col justify-between px-5 pb-10 pt-20 sm:px-8 md:px-12 md:pb-14 md:pt-24 lg:px-16 lg:py-20"
                            >
                                <div className="max-w-3xl">
                                    <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white/55">
                                        <span className="bg-[#ff3b30] px-2.5 py-1.5 text-white">Prototype</span>
                                        <span>Product Practicum</span>
                                        <span>Spring 2026</span>
                                        <span>Looks-like + works-like</span>
                                    </div>
                                    <p className="max-w-2xl text-[clamp(2.7rem,7vw,7.4rem)] font-semibold leading-[0.9] tracking-[-0.075em] text-white">
                                        What if AI lived somewhere other than a chatbox?
                                    </p>
                                    <p className="mt-8 max-w-xl text-base leading-relaxed text-white/65 md:text-lg">
                                        I built Glyph to see what happens when AI leaves the chat window and becomes something you can wear, move, and build on.
                                    </p>
                                </div>

                                <div className="mt-14">
                                    <h2 id="glyph-project-title" aria-label="Glyph"><DotMatrixGlyph /></h2>
                                    <p className="mt-7 max-w-2xl border-t border-white/20 pt-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-white/50">
                                        A Northwestern class project. Nothing, the company, was used as a reference. The company was not involved.
                                    </p>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 1.025 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
                                className="relative flex min-h-[62svh] items-center justify-center border-t border-white/10 bg-[#d8d8d5] p-4 sm:p-7 lg:min-h-[100svh] lg:border-l lg:border-t-0"
                            >
                                <img
                                    src="/images/glyph/hero-wrist.webp"
                                    alt="AI-cleaned Glyph presentation image showing the transparent gauntlet worn on a raised wrist"
                                    decoding="async"
                                    fetchPriority="high"
                                    className="block max-h-[calc(100svh-3.5rem)] w-auto max-w-full object-contain"
                                />
                                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4 font-mono text-[8px] uppercase tracking-[0.16em] text-black/55 sm:bottom-7 sm:left-7 sm:right-7">
                                    <span>Presentation image / 01</span>
                                    <span className="text-right">Final form view<br />Not the working hardware</span>
                                </div>
                            </motion.div>
                        </div>
                    </section>

                    <section className="bg-[#0b0b0b] px-5 py-10 text-white sm:px-8 md:px-12 md:py-14">
                        <div className="mx-auto grid max-w-6xl gap-8 border-y border-white/15 py-8 md:grid-cols-[1.2fr_2fr] md:items-center">
                            <a
                                href="https://design.northwestern.edu/people/profiles/saubert-michael.html"
                                target="_blank"
                                rel="noreferrer"
                                className="group flex items-center gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b30]"
                            >
                                <img src="/images/glyph/michael-saubert.webp" alt="Michael Saubert" loading="lazy" decoding="async" className="h-20 w-20 shrink-0 rounded-full object-cover grayscale transition group-hover:grayscale-0 md:h-24 md:w-24" />
                                <div>
                                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white/45">Professor</p>
                                    <p className="mt-1 text-xl font-semibold tracking-tight">Michael Saubert</p>
                                    <p className="mt-1 flex items-center gap-1 text-xs text-white/55">Adjunct Lecturer <ArrowUpRight size={13} /></p>
                                </div>
                            </a>
                            <div>
                                <p className="text-xl font-medium leading-snug tracking-[-0.025em] md:text-2xl">
                                    Product Practicum · DSGN 495-0, Section 44 · Spring 2026
                                </p>
                                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/60">
                                    Michael asked us to choose a company and design the product as if it belonged in that world. I chose Nothing. This is still my project. Nothing was only used as a reference.
                                </p>
                            </div>
                        </div>
                    </section>

                    <motion.section
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.12 }}
                        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                        className="glyph-dotfield bg-[#0d0d0d] px-5 py-20 text-white sm:px-8 md:px-12 md:py-28"
                    >
                        <div className="mx-auto max-w-6xl">
                            <FactorLabel number="01">I started with tinkerers</FactorLabel>
                            <div className="grid gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-20">
                                <div>
                                    <p className="glyph-display text-[clamp(3rem,6vw,6.2rem)] font-semibold leading-[0.92] tracking-[-0.065em]">
                                        I wanted to make something tinkerers could build on.
                                    </p>
                                    <p className="mt-8 max-w-xl text-base leading-relaxed text-white/65 md:text-lg">
                                        The first idea was simple. Make a wearable test bed for people building body-worn products. Give them easy connection points, sensors, haptics, and enough access to try things without making a whole device first.
                                    </p>
                                    <p className="mt-5 max-w-xl text-base leading-relaxed text-white/65 md:text-lg">
                                        I spoke with tinkerers about how they use wearables, attach new parts, and tell what a device is doing. Those conversations changed what I focused on.
                                    </p>
                                </div>

                                <div className="self-end border border-white/20 bg-[#111111] p-5 md:p-7">
                                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white/45">The first setup</p>
                                    <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
                                        {['Module', 'Wearable', 'Person + world'].map((item, index) => (
                                            <React.Fragment key={item}>
                                                <div className="flex min-h-24 items-center justify-center border border-white/20 bg-[#080808] px-3 text-center font-mono text-xs font-bold uppercase tracking-[0.12em]">
                                                    {item}
                                                </div>
                                                {index < 2 && <span className="rotate-90 text-center font-mono text-lg text-[#ff3b30] sm:rotate-0" aria-hidden="true">→</span>}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                    <div className="mt-5 flex flex-wrap gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/55">
                                        <span className="border border-white/20 px-2 py-1">Rails</span>
                                        <span className="border border-white/20 px-2 py-1">Magnets</span>
                                        <span className="border border-white/20 px-2 py-1">Contacts</span>
                                        <span className="border border-white/20 px-2 py-1">Sensors</span>
                                        <span className="border border-white/20 px-2 py-1">Software</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-16 border-t border-white/20">
                                {researchThemes.map(([title, description], index) => (
                                    <div key={title} className="grid gap-3 border-b border-white/20 py-6 sm:grid-cols-[56px_1fr_2fr] sm:items-baseline">
                                        <span className="font-mono text-[10px] text-[#ff3b30]">0{index + 1}</span>
                                        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                                        <p className="text-sm leading-relaxed text-white/60">{description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.12 }}
                        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                        className="relative overflow-hidden bg-[#0a0a0a] px-5 py-20 sm:px-8 md:px-12 md:py-28"
                    >
                        <div className="glyph-dotfield pointer-events-none absolute -left-10 bottom-0 h-80 w-80 opacity-25" aria-hidden="true" />
                        <div className="relative mx-auto max-w-6xl">
                            <FactorLabel number="02">The AI part</FactorLabel>
                            <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
                                <div>
                                    <p className="glyph-display text-[clamp(3.2rem,7vw,7rem)] font-semibold leading-[0.92] tracking-[-0.065em] text-white">
                                        AI was getting better. We were still typing into a box.
                                    </p>
                                    <p className="mt-8 max-w-xl text-base leading-relaxed text-white/60 md:text-lg">
                                        That felt too narrow to me. If AI is going to be around more often, I want it to show up in useful ways: a light, a gesture, a tap, or something in the room changing.
                                    </p>
                                </div>

                                <aside className="self-end border-l-4 border-[#ff3b30] bg-[#141414] p-6 text-white md:p-9">
                                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-[#ff3b30]">Adi’s opinion / 01</p>
                                    <blockquote className="mt-5 text-2xl font-medium leading-snug tracking-[-0.035em] md:text-3xl">
                                        “AI should not feel like another app I have to open. I want it around when it is useful, quiet when it is not, and physical when I need to take control.”
                                    </blockquote>
                                </aside>
                            </div>

                            <div className="mt-20 border-y border-white/20 py-8 md:py-12">
                                <div className="grid gap-5 text-center glyph-display text-[clamp(2.4rem,5.6vw,6rem)] font-semibold leading-[0.94] tracking-[-0.055em] md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
                                    <span>Wearable for tinkerers</span>
                                    <span className="text-[#ff3b30]">+</span>
                                    <span>AI outside chat</span>
                                    <span className="text-[#ff3b30]">=</span>
                                    <span className="glyph-outline-text">Glyph</span>
                                </div>
                                <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed text-white/50">
                                    That became Glyph. I did not get every part into one wearable, so I built the form and the working interaction separately.
                                </p>
                            </div>
                        </div>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                        className="bg-[#0d0d0d] px-5 py-20 text-white sm:px-8 md:px-12 md:py-28"
                    >
                        <div className="mx-auto max-w-6xl">
                            <FactorLabel number="03">Choosing a company</FactorLabel>
                            <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
                                <div>
                                    <p className="glyph-display text-[clamp(3rem,6vw,6rem)] font-semibold leading-[0.92] tracking-[-0.06em]">Then Michael asked us to choose a company. I chose Nothing.</p>
                                    <p className="mt-8 text-base leading-relaxed text-white/65 md:text-lg">
                                        Nothing made sense because its products show how they are put together. The lights do a job. The hardware feels technical without feeling like lab equipment. That was close to what I wanted Glyph to feel like.
                                    </p>
                                    <a href="https://us.nothing.tech/about" target="_blank" rel="noreferrer" className="mt-7 inline-flex min-h-11 items-center gap-2 border-b border-white pb-1 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b30]">
                                        See how Nothing describes its design <ArrowUpRight size={15} />
                                    </a>

                                    <div className="mt-12 grid gap-8 border-t border-white/20 pt-8 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                                        <div>
                                            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#ff3b30]">What I used</p>
                                            <p className="mt-3 text-sm leading-relaxed text-white/60">A clear shell, black and white parts, lights that show status, and one small red marker.</p>
                                        </div>
                                        <div>
                                            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white/45">What I left alone</p>
                                            <p className="mt-3 text-sm leading-relaxed text-white/60">Their logo, phone light patterns, camera layouts, and the exact shape of any Nothing product.</p>
                                        </div>
                                    </div>
                                </div>
                                <NothingCarousel />
                            </div>

                            <p className="mt-9 border-t border-white/20 pt-5 font-mono text-[9px] uppercase leading-relaxed tracking-[0.16em] text-white/45">
                                Nothing, the company, was used only as a reference for this Northwestern class project. It did not sponsor or take part in the work. The reference images belong to Nothing Technology Limited.
                            </p>
                        </div>
                    </motion.section>

                    <section className="bg-[#0a0a0a] px-5 py-20 sm:px-8 md:px-12 md:py-28">
                        <div className="mx-auto max-w-7xl">
                            <FactorLabel number="04">The physical direction</FactorLabel>
                            <div className="mb-14 grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
                                <p className="glyph-display max-w-3xl text-[clamp(3rem,6vw,6.5rem)] font-semibold leading-[0.92] tracking-[-0.06em]">This is where the form landed.</p>
                                <div className="border-l border-[#ff3b30] pl-5">
                                    <p className="text-sm leading-relaxed text-white/60 md:text-base">
                                        I cleaned these images up with AI from the final looks-like model. I am using them to show the shape, materials, and how it sits on the arm. They are presentation images, not photos of the working electronics.
                                    </p>
                                </div>
                            </div>

                            <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5">
                                {productImages.map((image, index) => {
                                    const spans = ['lg:col-span-7', 'lg:col-span-5 lg:mt-24', 'lg:col-span-4', 'lg:col-span-4 lg:mt-20', 'lg:col-span-4', 'lg:col-span-5 lg:col-start-5 lg:mt-10'];
                                    return (
                                        <motion.figure
                                            key={image.src}
                                            initial={{ opacity: 0, y: 24 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true, amount: 0.12 }}
                                            transition={{ duration: 0.48, delay: Math.min(index * 0.04, 0.16) }}
                                            className={spans[index]}
                                        >
                                            <div className="overflow-hidden bg-[#d7d7d4]">
                                                <img
                                                    src={image.src}
                                                    alt={`AI-cleaned Glyph presentation image: ${image.label}`}
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="block h-auto w-full"
                                                />
                                            </div>
                                            <figcaption className="grid grid-cols-[auto_1fr] gap-4 border-t border-white/20 py-3">
                                                <span className="font-mono text-[9px] text-[#ff3b30]">{String(index + 1).padStart(2, '0')}</span>
                                                <span>
                                                    <strong className="block text-xs font-semibold uppercase tracking-[0.08em] text-white">{image.label}</strong>
                                                    <span className="mt-1 block text-xs leading-relaxed text-white/45">{image.caption}</span>
                                                </span>
                                            </figcaption>
                                        </motion.figure>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    <section className="bg-[#0d0d0d] px-5 py-20 text-white sm:px-8 md:px-12 md:py-28">
                        <div className="mx-auto max-w-6xl">
                            <FactorLabel number="05">What I built</FactorLabel>
                            <div className="grid border-y border-white/20 lg:grid-cols-2">
                                <article className="border-b border-white/20 py-10 lg:border-b-0 lg:border-r lg:pr-12">
                                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-[#ff3b30]">Model A / Looks-like</p>
                                    <h3 className="mt-5 text-4xl font-semibold tracking-[-0.055em] md:text-5xl">What it looked like</h3>
                                    <p className="mt-5 max-w-xl text-base leading-relaxed text-white/60">
                                        I used this model to work out the shape and materials. It has a clear thermoformed PETG shell, PETG-GF structure, a black acrylic layer, three white light filaments, a custom sleeve, and the side module.
                                    </p>
                                    <p className="mt-6 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-white/45">Approx. body size / 104 × 54 × 15 mm</p>
                                </article>
                                <article className="py-10 lg:pl-12">
                                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-[#ff3b30]">Model B / Works-like</p>
                                    <h3 className="mt-5 text-4xl font-semibold tracking-[-0.055em] md:text-5xl">What actually worked</h3>
                                    <p className="mt-5 max-w-xl text-base leading-relaxed text-white/60">
                                        The second model ran on a Waveshare ESP32-S3 Touch LCD 1.83-inch board and a XIAO nRF52840 Sense Plus. I got the gestures, BLE-HID, air mouse, telemetry, Wi-Fi and BLE bridges, and Home Assistant lighting control working.
                                    </p>
                                    <p className="mt-6 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-white/45">This hardware was separate from the polished shell.</p>
                                </article>
                            </div>

                            <div className="mt-16">
                                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-white/45">The demo flow</p>
                                <ol className="mt-6 grid border-l border-t border-white/20 sm:grid-cols-2 lg:grid-cols-6">
                                    {gestureSteps.map((step, index) => (
                                        <li key={step} className="min-h-32 border-b border-r border-white/20 p-4">
                                            <span className="font-mono text-[9px] text-[#ff3b30]">{String(index + 1).padStart(2, '0')}</span>
                                            <span className="mt-8 block text-sm font-semibold leading-tight">{step}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>

                            <div className="mt-16">
                                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-white/45">What was built and what was not</p>
                                <div className="mt-6 border-t border-white/20">
                                    {truthRows.map((row) => (
                                        <div key={row.state} className="grid gap-4 border-b border-white/20 py-6 sm:grid-cols-[140px_1fr] sm:items-start">
                                            <span className={`w-fit px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] ${row.tone}`}>{row.state}</span>
                                            <p className="text-sm leading-relaxed text-white/65">{row.items}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="relative overflow-hidden bg-[#0a0a0a] px-5 py-24 sm:px-8 md:px-12 md:py-36">
                        <div className="glyph-dotfield pointer-events-none absolute bottom-0 right-0 h-96 w-96 opacity-20" aria-hidden="true" />
                        <div className="relative mx-auto max-w-6xl">
                            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-[#ff3b30]">Where I ended up / Spring 2026</p>
                            <p className="mt-8 max-w-5xl text-[clamp(2.8rem,7vw,7.5rem)] font-semibold leading-[0.91] tracking-[-0.07em] text-white">
                                AI has enough brains. I wanted to see what happens when you give it a body.
                            </p>
                            <div className="mt-16 grid gap-10 border-t border-white/20 pt-8 md:grid-cols-[1.2fr_.8fr]">
                                <p className="max-w-2xl text-base leading-relaxed text-white/60 md:text-lg">
                                    For the final, I brought in two things: the polished wearable model and the separate electronics demo. I kept them separate because that was the honest state of the project.
                                </p>
                                <div className="font-mono text-[9px] uppercase leading-loose tracking-[0.15em] text-white/40">
                                    <p>Product Practicum · Northwestern University</p>
                                    <p>Course guide · Michael Saubert</p>
                                    <p>Company reference · Nothing</p>
                                    <p>Presentation imagery · AI-cleaned from prototype references</p>
                                    <p className="mt-5">© {year} Adi Agarwal</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </motion.div>,
        document.body,
    );
};

export default GlyphProjectDetail;

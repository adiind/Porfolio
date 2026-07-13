import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import {
    ArrowDown,
    ArrowRight,
    Camera,
    Check,
    CircleAlert,
    Cpu,
    Layers3,
    Radio,
    X,
} from 'lucide-react';
import { Project } from '../types/Project';
import { useDialogA11y } from '../hooks/useDialogA11y';

interface Props {
    project: Project;
    onClose: () => void;
}

const prototypeFacts = {
    looksLike: [
        'Transparent thermoformed PETG shell; smoked tint remains a future direction.',
        'PETG-GF structural parts with a curated black acrylic + acrylic-sticker layer.',
        'Approximately 104 × 54 × 15 mm bounding dimensions with a sculpted gauntlet form.',
        'Three diagonal white LED filaments — no dense LED matrix was built.',
        'Custom breathable sleeve and a side-mounted module direction, not a rear cartridge.',
    ],
    worksLike: [
        'Separate Waveshare ESP32-S3 Touch LCD 1.83-inch development board.',
        '240 × 284 touch display with IMU, microphones/audio, Wi-Fi, and Bluetooth.',
        'XIAO nRF52840 Sense Plus served as the first working secondary module.',
        'Firmware paths cover IMU input, BLE-HID, dashboard telemetry, and device control.',
        'The functional electronics do not share the appearance model’s finished enclosure.',
    ],
};

const gestureSteps = [
    ['01', 'Lift', 'Leave the ready plane'],
    ['02', 'Point', 'Aim at a taught target'],
    ['03', 'Snap / tap', 'Select the light or button'],
    ['04', 'Move', 'Hand height sets brightness'],
    ['05', 'Roll', 'Wrist roll sets color'],
    ['06', 'Confirm', 'Snap / tap to commit'],
];

const truthRows = [
    { item: 'Transparent PETG appearance shell', scope: 'Looks-like model', status: 'Built', kind: 'built' },
    { item: 'Three white LED filaments', scope: 'Looks-like model', status: 'Built', kind: 'built' },
    { item: '1.83-inch Waveshare dev board', scope: 'Works-like model', status: 'Built', kind: 'built' },
    { item: 'IMU + BLE-HID interaction paths', scope: 'Firmware evidence', status: 'Implemented', kind: 'built' },
    { item: 'Dashboard + Home Assistant bridge', scope: 'Software evidence', status: 'Implemented', kind: 'built' },
    { item: 'Two-actuator 1-D haptic display', scope: 'Integrated device', status: 'Production intent', kind: 'intent' },
    { item: 'Dense white LED matrix', scope: 'Integrated device', status: 'Production intent', kind: 'intent' },
    { item: 'Custom integrated PCB', scope: 'Electrical design', status: 'Paper design', kind: 'intent' },
    { item: 'Smoked PETG finish', scope: 'CMF direction', status: 'Future', kind: 'intent' },
    { item: 'EMG input band', scope: 'Interaction concept', status: 'Concept only', kind: 'concept' },
    { item: 'Full module ecosystem', scope: 'Platform vision', status: 'Future', kind: 'concept' },
];

const pendingProof = [
    'Authentic looks-like model photography',
    'Authentic works-like electronics photography',
    'A real demo recording or screen capture',
    'Confirmed role, collaborators, and credits',
    'Confirmed outcome, reflection, and public links',
];

const Eyebrow: React.FC<{ children: React.ReactNode; light?: boolean }> = ({ children, light = false }) => (
    <span className={`font-mono text-[10px] font-bold uppercase tracking-[0.24em] ${light ? 'text-white/60' : 'text-black/55'}`}>
        {children}
    </span>
);

const EvidencePlaceholder: React.FC<{ label: string; code: string }> = ({ label, code }) => (
    <div
        className="relative flex min-h-[250px] flex-col justify-between overflow-hidden border border-black/25 bg-[#e5e5df] p-5 md:min-h-[320px] md:p-7"
        style={{
            backgroundImage: 'repeating-linear-gradient(135deg, rgba(0,0,0,0.035) 0, rgba(0,0,0,0.035) 1px, transparent 1px, transparent 12px)',
        }}
    >
        <div className="flex items-start justify-between gap-4">
            <span className="border border-black/30 bg-[#efefe9] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-black/70">
                Evidence slot · {code}
            </span>
            <Camera size={18} strokeWidth={1.5} aria-hidden="true" />
        </div>
        <div>
            <p className="max-w-sm text-2xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-black md:text-4xl">
                Authentic photo needed
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-black/60">
                {label} No synthetic or unverified render is substituted here.
            </p>
        </div>
    </div>
);

const GlyphSystemSketch: React.FC = () => (
    <svg
        viewBox="0 0 820 330"
        role="img"
        aria-labelledby="glyph-system-sketch-title glyph-system-sketch-desc"
        className="h-auto w-full"
    >
        <title id="glyph-system-sketch-title">Glyph two-model system diagram</title>
        <desc id="glyph-system-sketch-desc">
            A labeled diagram showing the appearance model and the separate interaction prototype. This is a system diagram, not product evidence.
        </desc>
        <g fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M64 93C64 63 86 43 118 43H326C362 43 385 67 385 99V230C385 265 360 287 326 287H118C85 287 64 266 64 235Z" opacity=".86" />
            <path d="M92 113C92 91 108 77 130 77H286C310 77 326 93 326 116V212C326 237 309 253 285 253H130C107 253 92 238 92 215Z" opacity=".38" />
            <path d="M122 220L195 112M211 226L275 132M145 156L304 156" opacity=".3" />
            <circle cx="344" cy="115" r="4" fill="#ff3b30" stroke="none" />
            <circle cx="344" cy="136" r="4" fill="#ff3b30" stroke="none" />
            <circle cx="344" cy="157" r="4" fill="#ff3b30" stroke="none" />
            <path d="M430 165H492" strokeDasharray="5 7" opacity=".55" />
            <path d="M480 153L493 165L480 177" opacity=".55" />
            <rect x="538" y="65" width="205" height="202" rx="7" />
            <rect x="565" y="91" width="151" height="99" rx="3" opacity=".45" />
            <path d="M566 214H712M566 232H660" opacity=".35" />
            <circle cx="691" cy="231" r="7" opacity=".6" />
        </g>
        <g fill="currentColor" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
            <text x="64" y="22" fontSize="11" letterSpacing="2">01 / LOOKS-LIKE</text>
            <text x="538" y="43" fontSize="11" letterSpacing="2">02 / WORKS-LIKE</text>
            <text x="64" y="317" fontSize="9" opacity=".48" letterSpacing="1.5">SYSTEM DIAGRAM · NOT PRODUCT EVIDENCE</text>
        </g>
    </svg>
);

const StatusBadge: React.FC<{ kind: string; children: React.ReactNode }> = ({ kind, children }) => {
    const className = kind === 'built'
        ? 'border-black bg-black text-white'
        : kind === 'intent'
            ? 'border-[#e22b1f] bg-[#e22b1f] text-white'
            : 'border-black/25 bg-transparent text-black/55';

    return (
        <span className={`inline-flex w-fit items-center px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] ${className}`}>
            {children}
        </span>
    );
};

const GlyphProjectDetail: React.FC<Props> = ({ project, onClose }) => {
    const dialogRef = useDialogA11y(onClose, { historyTag: 'project' });
    const scrollRef = useRef<HTMLDivElement>(null);

    return (
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
            className="fixed inset-0 z-[100] overflow-hidden bg-black focus:outline-none"
            onClick={onClose}
        >
            {ReactDOM.createPortal(
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onClose();
                    }}
                    aria-label="Close Glyph project"
                    className="fixed right-4 top-4 z-[9999] flex items-center gap-2 rounded-full border border-black/15 bg-[#efefe9] px-4 py-3 text-sm font-bold text-black shadow-2xl transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e22b1f] md:right-6 md:top-6 md:px-5"
                >
                    <X size={18} strokeWidth={2.5} />
                    <span>Close</span>
                </button>,
                document.body,
            )}

            <div
                ref={scrollRef}
                className="h-full overflow-y-auto overflow-x-hidden"
                onClick={(event) => event.stopPropagation()}
            >
                <main className="bg-[#efefe9] text-black">
                    <section
                        id="section-hero"
                        className="relative min-h-[100svh] overflow-hidden bg-[#090909] px-5 pb-8 pt-24 text-white md:px-10 md:pb-10 md:pt-12 lg:px-16"
                        style={{
                            backgroundImage: 'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)',
                            backgroundSize: '44px 44px',
                        }}
                    >
                        <div className="mx-auto flex min-h-[calc(100svh-7rem)] max-w-[1500px] flex-col">
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-white/20 pb-4 pr-24">
                                <Eyebrow light>Northwestern · Product Practicum</Eyebrow>
                                <span className="h-1 w-1 rounded-full bg-[#ff3b30]" aria-hidden="true" />
                                <Eyebrow light>Evidence-first case study</Eyebrow>
                                <span className="ml-auto hidden font-mono text-[10px] uppercase tracking-[0.2em] text-white/45 md:block">
                                    Canonical facts + live firmware · 07/2026
                                </span>
                            </div>

                            <div className="flex flex-1 flex-col justify-center py-12 md:py-16">
                                <div className="flex items-center gap-3">
                                    <span className="h-2 w-2 rounded-full bg-[#ff3b30] shadow-[0_0_18px_rgba(255,59,48,.8)]" aria-hidden="true" />
                                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-white/65">Open wearable platform</span>
                                </div>

                                <h2
                                    id="glyph-project-title"
                                    className="mt-6 text-[clamp(5.6rem,19vw,16rem)] font-black uppercase leading-[0.72] tracking-[-0.085em]"
                                >
                                    Glyph
                                </h2>

                                <div className="mt-8 grid gap-8 border-t border-white/20 pt-6 md:grid-cols-[1.25fr_.75fr] md:gap-14 lg:grid-cols-[1.4fr_.6fr]">
                                    <p className="max-w-4xl text-[clamp(1.35rem,2.75vw,2.65rem)] font-medium leading-[1.08] tracking-[-0.035em] text-white/90">
                                        {project.hero.oneLiner}
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-white/55 md:grid-cols-1">
                                        <p><span className="block text-white">01 / Looks-like</span>Form, CMF, wear</p>
                                        <p><span className="block text-white">02 / Works-like</span>Electronics, software, behavior</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid items-end gap-6 border-t border-white/20 pt-6 md:grid-cols-[1fr_auto]">
                                <div className="max-w-4xl text-white/80">
                                    <GlyphSystemSketch />
                                </div>
                                <a
                                    href="#glyph-two-models"
                                    className="inline-flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b30]"
                                >
                                    Read the evidence <ArrowDown size={15} />
                                </a>
                            </div>
                        </div>
                    </section>

                    <section className="border-b border-black/20 bg-[#efefe9] px-5 py-6 md:px-10 lg:px-16">
                        <div className="mx-auto grid max-w-[1500px] gap-px overflow-hidden border border-black/20 bg-black/20 md:grid-cols-4">
                            {[
                                ['Context', 'DSGN 495-0 · Spring 2026'],
                                ['Prototype', 'Separate looks-like + works-like'],
                                ['Current state', 'Case-study evidence pass'],
                                ['Role + credits', 'Pending Adi confirmation'],
                            ].map(([label, value]) => (
                                <div key={label} className="bg-[#efefe9] p-4 md:min-h-[92px] md:p-5">
                                    <Eyebrow>{label}</Eyebrow>
                                    <p className="mt-3 text-sm font-bold leading-snug md:text-base">{value}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section id="glyph-two-models" className="px-5 py-20 md:px-10 md:py-28 lg:px-16">
                        <div className="mx-auto max-w-[1500px]">
                            <div className="grid gap-8 md:grid-cols-[.7fr_1.3fr] md:gap-16">
                                <div>
                                    <Eyebrow>01 · Prototype strategy</Eyebrow>
                                    <p className="mt-5 max-w-sm font-mono text-xs leading-relaxed text-black/60">
                                        The appearance model and the functional electronics answer different questions. They were not one integrated commercial device.
                                    </p>
                                </div>
                                <h3 className="text-[clamp(3.5rem,8.8vw,8.5rem)] font-black uppercase leading-[0.82] tracking-[-0.075em]">
                                    Two models.<br />Two truths.
                                </h3>
                            </div>

                            <div className="mt-16 grid gap-12 border-t border-black/25 pt-8 lg:grid-cols-2 lg:gap-0">
                                <article className="lg:border-r lg:border-black/25 lg:pr-8 xl:pr-12">
                                    <div className="flex items-start justify-between gap-5">
                                        <div>
                                            <Eyebrow>Model 01</Eyebrow>
                                            <h4 className="mt-3 text-4xl font-black uppercase tracking-[-0.05em] md:text-6xl">Looks-like</h4>
                                            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-black/55">Appearance / form / CMF / wear</p>
                                        </div>
                                        <span className="font-mono text-5xl font-light text-black/20">01</span>
                                    </div>
                                    <div className="mt-8">
                                        <EvidencePlaceholder
                                            code="LL-01"
                                            label="The handoff contains no approved physical-build photograph."
                                        />
                                    </div>
                                    <ul className="mt-8 divide-y divide-black/15 border-y border-black/15">
                                        {prototypeFacts.looksLike.map((fact, index) => (
                                            <li key={fact} className="grid grid-cols-[2rem_1fr] gap-3 py-4 text-sm leading-relaxed md:text-base">
                                                <span className="font-mono text-[10px] text-black/40">{String(index + 1).padStart(2, '0')}</span>
                                                <span>{fact}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </article>

                                <article className="lg:pl-8 xl:pl-12">
                                    <div className="flex items-start justify-between gap-5">
                                        <div>
                                            <Eyebrow>Model 02</Eyebrow>
                                            <h4 className="mt-3 text-4xl font-black uppercase tracking-[-0.05em] md:text-6xl">Works-like</h4>
                                            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-black/55">Electronics / software / behavior</p>
                                        </div>
                                        <span className="font-mono text-5xl font-light text-black/20">02</span>
                                    </div>
                                    <div className="mt-8">
                                        <EvidencePlaceholder
                                            code="WL-01"
                                            label="The handoff contains no approved electronics-build photograph."
                                        />
                                    </div>
                                    <ul className="mt-8 divide-y divide-black/15 border-y border-black/15">
                                        {prototypeFacts.worksLike.map((fact, index) => (
                                            <li key={fact} className="grid grid-cols-[2rem_1fr] gap-3 py-4 text-sm leading-relaxed md:text-base">
                                                <span className="font-mono text-[10px] text-black/40">{String(index + 1).padStart(2, '0')}</span>
                                                <span>{fact}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                            </div>
                        </div>
                    </section>

                    <section className="bg-[#e22b1f] px-5 py-20 text-white md:px-10 md:py-28 lg:px-16">
                        <div className="mx-auto grid max-w-[1500px] gap-10 md:grid-cols-[.55fr_1.45fr] md:gap-16">
                            <Eyebrow light>02 · Thesis</Eyebrow>
                            <div>
                                <p className="text-[clamp(2.5rem,6.5vw,6.5rem)] font-black uppercase leading-[0.88] tracking-[-0.065em]">
                                    The wrist is useful.<br />The wrist is closed.
                                </p>
                                <p className="mt-10 max-w-3xl text-lg leading-relaxed text-white/85 md:text-2xl">
                                    Glyph explores a different category: a session-worn gauntlet that exposes sensors, GPIO, firmware, and modular connections as a programmable interface for computers and environments.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-[#090909] px-5 py-20 text-white md:px-10 md:py-28 lg:px-16">
                        <div className="mx-auto max-w-[1500px]">
                            <div className="grid gap-8 md:grid-cols-[.55fr_1.45fr] md:gap-16">
                                <div>
                                    <Eyebrow light>03 · Current interaction proof</Eyebrow>
                                    <p className="mt-5 max-w-xs font-mono text-xs leading-relaxed text-white/50">
                                        Updated from the live <span className="text-white">glyph-lights-demo</span> source, not the stale portfolio snapshot.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-[clamp(3rem,7vw,7rem)] font-black uppercase leading-[0.84] tracking-[-0.07em]">
                                        Point.<br />Adjust.<br /><span className="text-[#ff3b30]">Confirm.</span>
                                    </h3>
                                    <p className="mt-8 max-w-3xl text-lg leading-relaxed text-white/65 md:text-xl">
                                        The current demo uses a gravity-referenced ready pose and relative pointing. It avoids claiming absolute direction: without a magnetometer, targets must be taught and recalibrated if the aim map drifts.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-16 grid border-y border-white/20 md:grid-cols-3 lg:grid-cols-6">
                                {gestureSteps.map(([number, title, detail], index) => (
                                    <div key={number} className="relative border-b border-white/20 p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 md:p-6">
                                        <span className="font-mono text-[10px] text-[#ff3b30]">{number}</span>
                                        <p className="mt-12 text-xl font-black uppercase tracking-[-0.03em]">{title}</p>
                                        <p className="mt-2 text-xs leading-relaxed text-white/50">{detail}</p>
                                        {index < gestureSteps.length - 1 && (
                                            <ArrowRight className="absolute right-[-8px] top-6 z-10 hidden bg-[#090909] text-white/35 lg:block" size={16} aria-hidden="true" />
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-20 grid gap-px border border-white/20 bg-white/20 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
                                <div className="bg-[#090909] p-6 md:p-8">
                                    <Radio size={22} className="text-[#ff3b30]" aria-hidden="true" />
                                    <Eyebrow light>Sense</Eyebrow>
                                    <p className="mt-4 text-xl font-bold">Waveshare 1.83 + nRF52840 Sense Plus</p>
                                    <p className="mt-2 text-sm leading-relaxed text-white/50">Touch, motion, audio, Wi-Fi, and BLE telemetry.</p>
                                </div>
                                <div className="hidden items-center bg-[#090909] px-3 lg:flex"><ArrowRight size={18} className="text-white/35" /></div>
                                <div className="bg-[#090909] p-6 md:p-8">
                                    <Cpu size={22} className="text-[#ff3b30]" aria-hidden="true" />
                                    <Eyebrow light>Interpret</Eyebrow>
                                    <p className="mt-4 text-xl font-bold">Gesture state machine + browser dashboard</p>
                                    <p className="mt-2 text-sm leading-relaxed text-white/50">Calibration, fusion, target selection, and live controls.</p>
                                </div>
                                <div className="hidden items-center bg-[#090909] px-3 lg:flex"><ArrowRight size={18} className="text-white/35" /></div>
                                <div className="bg-[#090909] p-6 md:p-8">
                                    <Layers3 size={22} className="text-[#ff3b30]" aria-hidden="true" />
                                    <Eyebrow light>Act</Eyebrow>
                                    <p className="mt-4 text-xl font-bold">BLE-HID + mapped environment controls</p>
                                    <p className="mt-2 text-sm leading-relaxed text-white/50">Presentation, pointer, light, and Home Assistant paths.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="px-5 py-20 md:px-10 md:py-28 lg:px-16">
                        <div className="mx-auto max-w-[1500px]">
                            <div className="grid gap-8 md:grid-cols-[.55fr_1.45fr] md:gap-16">
                                <Eyebrow>04 · Truth matrix</Eyebrow>
                                <div>
                                    <h3 className="text-[clamp(3rem,7vw,7rem)] font-black uppercase leading-[0.84] tracking-[-0.07em]">Built is not<br />the same as intended.</h3>
                                    <p className="mt-8 max-w-3xl text-lg leading-relaxed text-black/60 md:text-xl">
                                        This boundary is part of the work. The appearance model, software implementation, production architecture, and speculative input concepts are labeled separately.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-14 border-t border-black/30">
                                <div className="hidden grid-cols-[1.2fr_.8fr_.55fr] gap-6 border-b border-black/20 py-3 md:grid">
                                    <Eyebrow>Element</Eyebrow><Eyebrow>Evidence scope</Eyebrow><Eyebrow>Status</Eyebrow>
                                </div>
                                {truthRows.map((row) => (
                                    <div key={row.item} className="grid gap-3 border-b border-black/20 py-5 md:grid-cols-[1.2fr_.8fr_.55fr] md:items-center md:gap-6">
                                        <p className="text-lg font-bold tracking-[-0.02em]">{row.item}</p>
                                        <p className="text-sm text-black/55">{row.scope}</p>
                                        <StatusBadge kind={row.kind}>{row.status}</StatusBadge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="border-y border-black/20 bg-[#deded7] px-5 py-20 md:px-10 md:py-28 lg:px-16">
                        <div className="mx-auto max-w-[1500px]">
                            <div className="grid gap-12 md:grid-cols-2 md:gap-16">
                                <div>
                                    <Eyebrow>05 · What the evidence supports</Eyebrow>
                                    <h3 className="mt-6 text-[clamp(2.8rem,5vw,5rem)] font-black uppercase leading-[0.9] tracking-[-0.06em]">A product thesis made tangible in two parts.</h3>
                                    <ul className="mt-10 space-y-5">
                                        {[
                                            'A resolved visual direction around transparent PETG, black internals, white light, and a gauntlet form.',
                                            'A separate embedded stack that demonstrates touch, motion, BLE/Wi-Fi, and environmental-control paths.',
                                            'A clear next challenge: integrate the physical and functional models without hiding the tradeoffs.',
                                        ].map((item) => (
                                            <li key={item} className="flex gap-3 text-base leading-relaxed text-black/70 md:text-lg">
                                                <Check className="mt-1 shrink-0" size={17} aria-hidden="true" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="border-l-0 border-black/25 md:border-l md:pl-16">
                                    <div className="flex items-center gap-3 text-[#c92218]">
                                        <CircleAlert size={20} aria-hidden="true" />
                                        <Eyebrow>Publish gate</Eyebrow>
                                    </div>
                                    <h4 className="mt-6 text-3xl font-black uppercase tracking-[-0.04em] md:text-5xl">Proof still needed</h4>
                                    <p className="mt-4 max-w-xl text-sm leading-relaxed text-black/60 md:text-base">
                                        This case study remains intentionally incomplete until Adi verifies the missing evidence and credits.
                                    </p>
                                    <ol className="mt-8 divide-y divide-black/15 border-y border-black/15">
                                        {pendingProof.map((item, index) => (
                                            <li key={item} className="grid grid-cols-[2rem_1fr] gap-3 py-4 text-sm md:text-base">
                                                <span className="font-mono text-[10px] text-[#c92218]">{String(index + 1).padStart(2, '0')}</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </section>

                    <footer className="bg-[#090909] px-5 py-10 text-white md:px-10 lg:px-16">
                        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 border-t border-white/20 pt-6 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="text-5xl font-black uppercase tracking-[-0.06em] md:text-7xl">Glyph</p>
                                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">Case study draft · evidence-first rebuild</p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex w-fit items-center gap-3 border border-white/30 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition hover:border-white hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b30]"
                            >
                                Back to selected work <ArrowRight size={15} />
                            </button>
                        </div>
                    </footer>
                </main>
            </div>
        </motion.div>
    );
};

export default GlyphProjectDetail;

/**
 * Public story for /work/pg-haircare.
 * Process and counts only. No sponsor codename, pack artwork, or mechanism.
 * Field frames render only when a redacted file is present at `fieldSrc`.
 * Expected public files, when a safe crop exists:
 * public/images/pg/photo-research-safe.webp
 * public/images/pg/photo-synthesis-safe.webp
 * public/images/pg/photo-testing-safe.webp
 */

export interface PgRoom {
    id: string;
    phase: string;
    title: string;
    body: string;
    diagramSrc: string;
    diagramAlt: string;
    diagramCaption: string;
    fieldSrc?: string;
    fieldCaption: string;
}

export interface PgPhase {
    n: string;
    title: string;
    text: string;
}

export interface PgMethod {
    n: string;
    title: string;
    text: string;
}

export interface PgRung {
    n: string;
    title: string;
    text: string;
    withheld?: boolean;
}

export const pgEyebrow = 'P&G × Northwestern EDI · Fall 2025';

export const pgChips = [
    { value: '8', label: 'in-home visits' },
    { value: '2', label: 'central-site rounds' },
    { value: '10', label: 'bottle form studies' },
] as const;

export const pgMeta = [
    { label: 'Timeframe', value: 'Fall 2025' },
    { label: 'My contribution', value: 'Consumer research, prototype exploration, and the CSV2 research synthesis' },
    { label: 'Tools', value: 'Research guides · CAD · 3D printing' },
    { label: 'Team', value: 'Adi, Anastazja, Amber-Siyuan, Andrea, Adam' },
    { label: 'Public outcome', value: 'Packaging direction and a team presentation' },
] as const;

export const pgSections = [
    { id: 'pg-glance', n: '01', label: 'At a glance' },
    { id: 'pg-sprint', n: '02', label: 'The sprint' },
    { id: 'pg-phases', n: '03', label: 'How we worked' },
    { id: 'pg-methods', n: '04', label: 'Methods' },
    { id: 'pg-ladder', n: '05', label: 'Prototypes' },
] as const;

export const pgOverview = {
    src: '/images/pg/process-overview.webp',
    alt: 'Three connected miniature rooms: a bathroom visit, a synthesis table, and a hands-on testing bench, sharing one cream studio.',
    caption: 'Research → concepts → hands-on testing',
};

export const pgRooms: PgRoom[] = [
    {
        id: 'research',
        phase: 'Research',
        title: 'Where the bottle actually lives',
        body: 'Eight in-home visits. We sat in bathrooms and watched the routine around a conditioning bottle: where it stays, how it is held, and what happens at the sink.',
        diagramSrc: '/images/pg/research-room.webp',
        diagramAlt: 'Miniature bathroom with two adults, a round mirror, and unlabeled bottles on a wood shelf.',
        diagramCaption: 'The visit, as a room. Same set as the other two.',
        fieldCaption: 'In-home visit. Product stimuli and notes redacted.',
    },
    {
        id: 'synthesis',
        phase: 'Synthesis',
        title: 'Notes onto one table',
        body: 'The visits came back as patterns, not quotes for a poster. I wrote the CSV2 research synthesis the team designed from: behaviors, requirements, and what a form study needed to answer.',
        diagramSrc: '/images/pg/synthesis-room.webp',
        diagramAlt: 'Miniature workshop table with two adults, paper swatches, and unlabeled bottle forms.',
        diagramCaption: 'Synthesis as a shared table, not a slide.',
        fieldCaption: 'Working session. Notes and stimuli redacted.',
    },
    {
        id: 'testing',
        phase: 'Testing',
        title: 'Hands on the form',
        body: 'Two central-site rounds. People handled bottle form studies while we watched grip, dispense, and cleanup. The conversation stayed on the routine, not on a finished pack.',
        diagramSrc: '/images/pg/testing-room.webp',
        diagramAlt: 'Miniature testing bench with a rack of hair swatches, a ceramic bowl, and two adults.',
        diagramCaption: 'The central-site round, built as the third room.',
        fieldCaption: 'Central-site round. Product stimuli and notes redacted.',
    },
];

export const pgPhases: PgPhase[] = [
    { n: '01', title: 'Research', text: 'Eight in-home visits. Hold, storage, and the routine around the bottle.' },
    { n: '02', title: 'Synthesis', text: 'Visit material turned into requirements. I owned the CSV2 synthesis.' },
    { n: '03', title: 'Form studies', text: 'Ten bottle forms, modeled and printed, so a difference could be handled.' },
    { n: '04', title: 'Testing', text: 'Two central-site rounds. Stimuli and notes stay off this page.' },
];

export const pgSkills = [
    { label: 'Research guides', detail: 'What we asked, and what we watched for, written down before the visit.' },
    { label: 'Synthesis', detail: 'CSV2 writeup the team could design from, without publishing the findings.' },
    { label: 'CAD', detail: 'Bottle forms precise enough to compare in the hand.' },
    { label: '3D printing', detail: 'Printed studies people could actually hold.' },
];

export const pgMethods: PgMethod[] = [
    { n: '01', title: 'In-home visits', text: 'Eight visits where the product already lives. We watched the routine instead of asking people to imagine one.' },
    { n: '02', title: 'Central-site rounds', text: 'Two rounds in a shared room, with the same tasks. Easier to compare. Still not the bathroom.' },
    { n: '03', title: 'Bottle form studies', text: 'Ten forms. Proportion and grip changed on purpose so a difference was something you could hold.' },
    { n: '04', title: 'CSV2 synthesis', text: 'I gathered the visit material into one synthesis: what we saw, what it required, and what the next form needed to test.' },
];

export const pgLadder: PgRung[] = [
    { n: '01', title: 'Visit notes', text: 'Bathroom placement, grip, and the order of the routine.' },
    { n: '02', title: 'Paper studies', text: 'Proportion and how the hand closes around a form, before any print.' },
    { n: '03', title: 'Printed forms', text: 'Ten bottle studies. CAD, then a print someone could pick up.' },
    { n: '04', title: 'Central-site handling', text: 'The same forms, in front of people, across two rounds.' },
    { n: '05', title: 'Final packs', text: 'Presented to the sponsor with the team. Artwork and mechanisms stay under NDA.', withheld: true },
];

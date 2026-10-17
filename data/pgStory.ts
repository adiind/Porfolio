// Only eight in-home visits is cleared for the public metric chip.
// TODO: Confirm whether "10 bottle form studies" may be shown publicly. The source summary records ten weighted 3D-printed studies, but Adi's latest handoff excludes it pending confirmation.
// TODO: Do not reuse the older "16 central-site visits" count. Current material supports two central-site rounds, not a participant/visit count.
export const pgMetrics = [{ value: '8', label: 'in-home visits' }];

export const pgSections = [
  { id: 'pg-glance', number: '01', label: 'At a glance', title: 'Research to exploration.', intro: 'Consumer research, prototyping, and synthesis.' },
  { id: 'pg-sprint', number: '02', label: 'The sprint', title: 'From the home to the studio.', intro: 'Four checkpoints connect research, synthesis, exploration, and review.' },
  { id: 'pg-worked', number: '03', label: 'How we worked', title: 'Listen. Sort. Frame.', intro: '', actions: [
    { title: 'Listen in context', text: 'Use guides and participant-led activities to understand the routine.' },
    { title: 'Sort observations', text: 'Bring notes together and look for recurring themes.' },
    { title: 'Frame the next question', text: 'Turn those themes into questions for exploration.' },
  ] },
  { id: 'pg-methods', number: '04', label: 'Methods', title: 'One question at a time.', intro: 'Focused activities gave each discussion a clear purpose.' },
  { id: 'pg-prototypes', number: '05', label: 'Prototypes', title: 'Make. Learn. Iterate.', intro: 'Prototypes supported conversations and the next round of exploration.' },
];

export const pgVisitEvents = [
  { id: 'ihv-1', label: 'IHV 1', setting: 'In-home', diamond: 'discover-define', phase: 'Discover', detail: 'Learn in context.' },
  { id: 'ihv-2', label: 'IHV 2', setting: 'In-home', diamond: 'discover-define', phase: 'Define', detail: 'Frame the questions.' },
  { id: 'csv-1', label: 'CSV 1', setting: 'Central site', diamond: 'develop-deliver', phase: 'Develop', detail: 'Explore possibilities.' },
  { id: 'csv-2', label: 'CSV 2', setting: 'Central site', diamond: 'develop-deliver', phase: 'Deliver', detail: 'Review and synthesize.' },
];

export const pgNeeds = [
  { title: 'Functional needs', text: 'What the routine asks of a product.' },
  { title: 'Emotional needs', text: 'How the experience should feel.' },
];

export const pgMethods = [
  { number: 'A', title: 'Research', summary: 'Understand the experience in context.', task: 'Use structured conversations and activities.', observe: 'Listen for needs and points of friction.' },
  { number: 'B', title: 'Synthesis', summary: 'Connect observations across the work.', task: 'Organize what the team learned.', observe: 'Look for themes that shape next steps.' },
  { number: 'C', title: 'Prototype exploration', summary: 'Make ideas tangible for review.', task: 'Explore directions through prototypes.', observe: 'Use feedback to guide iteration.' },
];

export const pgLadder = [
  { label: 'Sketch', note: 'Open up possibilities.' },
  { label: 'Make', note: 'Give ideas a physical form.' },
  { label: 'Learn', note: 'Invite feedback.' },
  { label: 'Iterate', note: 'Carry learning forward.' },
];

export const pgTakeaways = [
  { title: 'Learn in context.', text: 'Start with the routine.' },
  { title: 'Keep questions focused.', text: 'Give each activity a purpose.' },
  { title: 'Synthesize for the next step.', text: 'Carry learning forward.' },
];

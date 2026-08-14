export type HcdAccent = 'care' | 'mcdonalds';
export type HcdTreatment = 'full' | 'focus' | 'editorial';
export type HcdChapterKey = 'frame' | 'tension' | 'opportunity' | 'journey' | 'decisions' | 'interaction' | 'outcome';

export interface HcdEvidence {
  id: string;
  src: string;
  fullSrc: string;
  alt: string;
  caption: string;
  sourceUrl: string;
  sourceLabel: string;
  treatment: 'full' | 'focus' | 'editorial';
  aspect?: string;
  objectPosition?: string;
}

export interface HcdChapter {
  key: HcdChapterKey;
  index: string;
  eyebrow: string;
  title: string;
  intro: string;
  layout: 'single' | 'pair' | 'sequence' | 'wide';
  evidence: HcdEvidence[];
  takeaways?: string[];
}

export interface HcdProjectStory {
  projectId: 'familysync-jpmorgan' | 'mcdonalds-interaction-design';
  accent: HcdAccent;
  label: string;
  title: string;
  proposition: string;
  context: string;
  role: string;
  status: string;
  disciplines: string[];
  hero: HcdEvidence;
  metrics?: Array<{ value: string; label: string }>;
  chapters: HcdChapter[];
  outcome: string;
  limitation: string;
  reflection: string;
}

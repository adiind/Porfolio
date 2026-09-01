export type HcdAccent = 'care' | 'mcdonalds';
export type HcdTreatment = 'full' | 'focus' | 'editorial';
export type HcdSectionKey = 'situation' | 'learning' | 'idea' | 'mechanics' | 'reflection';
export type HcdVisualLayout = 'single' | 'pair' | 'sequence' | 'wide';
export type HcdPostItTone = 'yellow' | 'blue' | 'green' | 'cream' | 'red';

export interface HcdVisual {
  id: string;
  src: string;
  fullSrc: string;
  alt: string;
  caption: string;
  treatment: HcdTreatment;
  aspect?: string;
  objectPosition?: string;
}

export interface HcdPostIt {
  id: string;
  text: string;
  tone: HcdPostItTone;
  rotation: number;
}

export interface HcdVisualGroup {
  id: string;
  title?: string;
  layout: HcdVisualLayout;
  visuals: HcdVisual[];
}

export interface HcdStorySection {
  key: HcdSectionKey;
  title: string;
  intro: string;
  storyNotes: HcdPostIt[];
  notes?: HcdPostIt[];
  takeaways?: string[];
  groups: HcdVisualGroup[];
}

export interface HcdProjectStory {
  projectId: 'familysync-jpmorgan' | 'mcdonalds-interaction-design';
  accent: HcdAccent;
  label: string;
  title: string;
  proposition: string;
  context: string;
  role: string;
  hero: HcdVisual;
  heroNotes: HcdPostIt[];
  metrics?: Array<{ value: string; label: string }>;
  sections: HcdStorySection[];
  closingContext: string;
}

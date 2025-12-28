

export interface CaseStudySlide {
  type: 'cover' | 'problem' | 'solution' | 'impact' | 'problem-statement' | 'process-role' | 'system-architecture' | 'outcomes' | 'reflection';
  title?: string;
  content?: any;
}

export interface CaseStudy {
  title: string;
  summary: string;
  thumbnailUrl?: string; // Optional image URL
  linkUrl?: string;
  themeColor?: 'red' | 'orange' | 'blue' | 'green';
  slides?: CaseStudySlide[];
}

export interface Award {
  title: string;
  summary: string;
  icon?: string; // URL or name
  date?: string;
}

export interface Publication {
  title: string;
  summary: string;
  journal: string;
  link?: string;
}

export interface FeatureCard {
  title: string;
  subtitle: string;
  summary: string; // Short summary for closed state
  expandedSummary: string; // Longer summary for open state
  pills: {
    label: string;
    description: string;
  }[];
  details: string[]; // Bullet points for open state
  skills?: { label: string; description: string }[]; // Skills with descriptions for this project
}

export interface TimelineItem {
  id: string;
  lane: 0 | 1 | 2;
  title: string;
  company: string;
  companyUrl?: string; // Optional URL for company/competition
  type: 'corporate' | 'education' | 'personal' | 'foundational' | 'competition' | 'project' | 'vignette';
  subtype?: 'role' | 'post';
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  summary: string;
  bullets?: string[];
  caseStudy?: CaseStudy; // New Field for Case Studies
  award?: Award; // New Field for Awards
  publication?: Publication; // New Field for Publications
  featureCards?: FeatureCard[]; // New Field for Special Feature Cards (e.g. Snapdeal Ads)
  videoUrl?: string; // New Field for Video Embeds
  imageUrl?: string; // New Field for Project Images

  // New Fields for Redesign
  logoUrl?: string;
  skills?: { label: string; description: string }[]; // Skills/toolkit with descriptions
  themeColor?: 'red' | 'orange' | 'blue' | 'green';

  // Detailed Project View
  extendedDescription?: string;
  projectLinks?: { label: string; url: string }[];

  // Social Data
  url?: string;
  caption?: string;
  likes?: number;
  comments?: number;

  // Differentiator callout for company cards
  differentiator?: string;
}

export interface SocialPost {
  id: string;
  date: string; // YYYY-MM-DD
  summary: string;
  url: string;
  caption: string;
  likes: number;
  comments: number;
}

export interface TimelineConfig {
  startDate: string;
  endDate: string;
}

export type TimelineMode = 'intro' | 'fit' | 'normal' | 'detail';

import { JournalEntry, TimelineConfig, SocialPost } from './types';
import RAW_TINKERVERSE_JOURNAL from './data/tinkerverse_journal.json';
import { TIMELINE_DATA } from './data/timeline';
import { USER_IMAGE_URL, REAL_USER_IMAGE, TINKERVERSE_LOGO } from './assets';

export { TIMELINE_DATA, USER_IMAGE_URL, REAL_USER_IMAGE, TINKERVERSE_LOGO };

export const SOCIAL_LINKS = {
  linkedin: "https://linkedin.com/in/adiind",
  resume: "/Adi_Agarwal_Resume_2025.pdf",
  email: "mailto:kriitya@gmail.com"
};

export const PROFILE_BIO = `I work at the seam between design and technology, with a focus on making AI tangible. I turn invisible models and complex systems into interfaces, devices, and services that people can see, feel, understand, and trust.

I came to design through product analytics, working across e-commerce, advertising, supply chains, and food delivery before joining Northwestern’s Engineering Design Innovation program. That path lets me translate in both directions: I bring human context, design judgment, and product intent to technologists, while giving designers a working understanding of the systems underneath the interface.

My work now spans agentic assistants, embedded intelligence, service design, healthcare, and physical prototypes. Whether the output is a wearable, an AI workflow, or a decision system, I care about the same question: how do we make powerful technology legible enough to become genuinely useful?`;

export const PROFILE_SKILLS = [
  "Tangible AI", "Interaction Design", "Product Strategy",
  "Agentic Systems", "Embedded Systems", "Rapid Prototyping",
  "Product Analytics", "Service Design", "Technical Storytelling"
];

// Visual Configuration
export const CONFIG: TimelineConfig = {
  startDate: '2016-01-01',
  endDate: '2026-03-31'
};

export const TINKERVERSE_JOURNAL: JournalEntry[] = RAW_TINKERVERSE_JOURNAL as JournalEntry[];

// Compatibility data for older timeline analytics/call sites. The durable
// five-entry journal is the public source; the legacy caption archive remains
// on disk but is intentionally not bundled into the portfolio.
export const SOCIAL_POSTS: SocialPost[] = TINKERVERSE_JOURNAL.map((entry) => {
  return {
    id: entry.id,
    date: entry.publishedAt.split('T')[0],
    summary: entry.caption,
    url: entry.instagramUrl,
    caption: entry.caption,
    likes: 0,
    comments: 0,
  };
});

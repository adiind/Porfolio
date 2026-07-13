
import { TimelineConfig, SocialPost } from './types';
import RAW_INSTAGRAM_POSTS from './data/instagram_posts.json';
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

export const SOCIAL_POSTS: SocialPost[] = (RAW_INSTAGRAM_POSTS as any[]).map((post: any) => {
  // Handle both 'timestamp' (ISO format) and 'date' (YYYY-MM-DD) fields
  let dateStr = '';
  if (post.timestamp) {
    dateStr = post.timestamp.split('T')[0];
  } else if (post.date) {
    dateStr = post.date;
  }

  return {
    id: post.url || post.id,
    date: dateStr,
    summary: post.caption || post.summary || '',
    url: post.url,
    caption: post.caption || '',
    likes: post.likesCount ?? post.likes ?? 0,
    comments: post.commentsCount ?? post.comments ?? 0
  };
});

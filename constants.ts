
import { TimelineConfig, SocialPost } from './types';
import RAW_INSTAGRAM_POSTS from './dataset_instagram-post-scraper_2025-12-05_08-56-36-834.json';
import { TIMELINE_DATA } from './data/timeline';
import { USER_IMAGE_URL, REAL_USER_IMAGE, TINKERVERSE_LOGO } from './assets';

export { TIMELINE_DATA, USER_IMAGE_URL, REAL_USER_IMAGE, TINKERVERSE_LOGO };

export const SOCIAL_LINKS = {
  linkedin: "https://linkedin.com/in/adiind",
  resume: "#", // Replace with actual resume URL
  email: "mailto:kriitya@gmail.com"
};

export const PROFILE_BIO = `I am Aditya Agarwal, a student in Northwestern’s Engineering Design Innovation program. My path began in product analytics, where I worked on e-commerce, ads, supply chain, and food delivery, learning how algorithms can shape experiences at scale. Alongside this, I’ve always had the drive to make things with my hands, whether sculpting, tinkering with electronics, and building prototypes that tell stories through design.

With my engineering background and a master’s in bioscience, I became deeply interested in healthcare and the ways technology can support human performance and longevity. I believe good design should move beyond fixing problems to create experiences that feel natural, intuitive, and responsive to the body itself. Instead of relying on screens and menus, I want to explore technologies that adapt to context: a wearable that adjusts its feedback when you’re fatigued, or a workspace that shifts as your needs change. My goal is to design tools that fit into people’s lives as companions, supporting well-being, enhancing performance, and helping people thrive.`;

export const PROFILE_SKILLS = [
  "Product Analytics", "Engineering Design", "Rapid Prototyping",
  "Electronics", "Physical Computing", "3D Printing",
  "Human-Centered Design", "Bioscience", "Healthcare Innovation"
];

// Visual Configuration
export const CONFIG: TimelineConfig = {
  startDate: '2016-01-01',
  endDate: '2025-12-31'
};

export const SOCIAL_POSTS: SocialPost[] = (RAW_INSTAGRAM_POSTS as any[]).map((post: any) => ({
  id: post.url,
  date: post.timestamp.split('T')[0],
  summary: post.caption,
  url: post.url,
  caption: post.caption,
  likes: post.likesCount,
  comments: post.commentsCount
}));

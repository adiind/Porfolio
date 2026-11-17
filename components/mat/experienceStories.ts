import self from '../../public/data/self-story.json';
import zomato from '../../public/data/zomato-story.json';
import udaan from '../../public/data/udaan-story.json';
import schmooze from '../../public/data/schmooze-story.json';
import snapdeal from '../../public/data/snapdeal-story.json';

export type ExperienceId = 'self' | 'zomato' | 'udaan' | 'schmooze' | 'snapdeal';
type Card = { id: string; kicker: string; title: string; lines: string[] };
export const EXPERIENCE_STORIES: Record<ExperienceId, { title: string; role: string; cards: Card[] }> = {
  self: { title: 'Self', role: 'AI Product Manager intern · 2026', cards: self },
  zomato: { title: 'Zomato', role: 'Senior Product Analyst · 2024–2025', cards: zomato },
  udaan: { title: 'Udaan', role: 'Product Analyst · 2023–2024', cards: udaan },
  schmooze: { title: 'Schmooze', role: 'Product and Growth Analyst · 2022', cards: schmooze },
  snapdeal: { title: 'Snapdeal', role: 'Data Analyst · 2020–2022', cards: snapdeal },
};
export function experienceIdFromHash(hash: string): ExperienceId | null {
  const name = hash.replace(/^#experience-/, '');
  return hash.startsWith('#experience-') && Object.hasOwn(EXPERIENCE_STORIES, name) ? name as ExperienceId : null;
}

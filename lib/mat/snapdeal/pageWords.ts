/**
 * Every word of the Snapdeal entry on the site's timeline page (data/timeline.ts, id "snapdeal"), read straight from
 * that file so the parcel and the page cannot drift apart. Adi, 2026-11-23: "we want all those details here as well.
 * Every single word." Nothing here is written by hand except the month names.
 */
import { TIMELINE_DATA } from '../../../data/timeline';

const entry = TIMELINE_DATA.find((item) => item.id === 'snapdeal')!;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const month = (iso: string) => `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;

export interface FeatureWords { title: string; subtitle: string; text: string; pills: Array<{ label: string; description: string }>; details: string[]; skills: Array<{ label: string; description: string }>; }
const card = (i: number): FeatureWords => {
  const f = entry.featureCards![i];
  return { title: f.title, subtitle: f.subtitle ?? '', text: f.expandedSummary ?? f.summary, pills: f.pills ?? [], details: f.details ?? [], skills: f.skills ?? [] };
};

export const PAGE = {
  title: entry.title, company: entry.company, dates: `${month(entry.start)} – ${month(entry.end!)}`,
  headline: entry.headline, bullets: entry.bullets ?? [], skills: entry.skills ?? [], differentiator: entry.differentiator ?? '',
  award: entry.award!, ads: card(0), warehouse: card(1),
};

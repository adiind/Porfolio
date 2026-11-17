/**
 * Where each poster's close-up leads: white "Open ..." pills next to "Back to the mat".
 * One table, by poster id (data/matStage.json), so a new page is one line here. The links are plain and relative; the
 * shipped site's own layer marks them so that closing the page comes back to the mat.
 *
 * Self, Zomato and Snapdeal open their story on the mat (#experience-<id>, drawn by components/mat/ExperienceStory.tsx,
 * which the timeline section listens for); closing it comes back to the mat. Tested from each poster's close-up on
 * 2026-11-16. rescue has none (its cards are the story); printer is gone. design has none either: it deals out its three
 * case-study cards (lib/mat/designCards.ts), and each card opens its case study.
 */
export interface PosterLink { label: string; href: string }

export const POSTER_LINKS: Record<string, PosterLink[]> = {
  self: [{ label: 'Open Self', href: '#experience-self' }],
  zomato: [{ label: 'Open Zomato', href: '#experience-zomato' }],
  snapdeal: [{ label: 'Open Snapdeal', href: '#experience-snapdeal' }],
  photo: [{ label: 'Open résumé', href: '/Adi_Agarwal_Resume_2026.pdf' }],
};

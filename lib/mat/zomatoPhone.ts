/**
 * Zomato on the phone home page: the words. The phone gets the flat page, not the 3D mat, so the rider's bag cannot be
 * opened there; its papers are laid out as one scroll instead (public/home-flat/self-cards.js). This is every word that
 * scroll prints, taken from the same two places the 3D bag reads: TEXT (lib/mat/zomatoBagArt.ts) and the Food Rescue
 * journey (lib/mat/rescueJourney.ts). Nothing is written here by hand.
 *
 * `node scripts/phone/make-zomato.mjs` writes these words and the papers' pictures to public/home-flat/. A unit test
 * (zomatoPhone.test.ts) fails when the words here and the written file differ: run the script again.
 */
import { TEXT } from './zomatoBagArt';
import { gains, header, journeySteps, losses, myPart, offer, result } from './rescueJourney';

export function zomatoPhoneWords() {
  return {
    company: 'Zomato',
    role: TEXT.role, team: TEXT.team, when: TEXT.when,
    lines: [...TEXT.lines],
    skillsHeading: TEXT.skillsHeading, skills: [...TEXT.skills], closing: TEXT.closing,
    projects: (['home', 'friends'] as const).map((id) => ({ id, title: TEXT.projects[id].title, role: TEXT.projects[id].role, lines: [...TEXT.projects[id].lines], foot: TEXT.projects[id].foot })),
    rescue: {
      title: header.project, role: header.role, years: header.years, kicker: header.kicker, example: header.example,
      steps: journeySteps.map((s) => ({ n: s.n, clock: s.clock, title: s.title, line: s.line, why: s.why, tone: s.tone })),
      losses: losses.map((l) => ({ who: l.who, text: l.text })),
      offer: { caption: offer.caption, priceTag: offer.priceTag },
      result: { lead: result.lead, figure: result.figure, caption: result.caption, gainsTitle: result.gainsTitle, press: result.press },
      gains: gains.map((g) => ({ who: g.who, text: g.text })),
      myPart: { title: myPart.title, role: myPart.role, lines: [...myPart.lines] },
    },
    press: {
      heading: TEXT.press.heading,
      sections: TEXT.press.sections.map((s) => ({ project: s.project, articles: s.articles.map((a) => ({ title: a.title, source: a.source, href: a.href })), more: s.more.map((m) => ({ label: m.label, href: m.href })) })),
    },
  };
}
export type ZomatoPhoneWords = ReturnType<typeof zomatoPhoneWords>;

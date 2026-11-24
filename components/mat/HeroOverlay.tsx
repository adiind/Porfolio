import React from 'react';
import './hero-overlay.css';
import { GITHUB, TOOL_MARKS_LABEL } from '../../lib/mat/matPieces';

export interface HeroOverlayProps {
  /** false while the camera is flying to something or a book is open: the layer fades out and stops taking clicks */
  shown: boolean;
  /** true once the scene's opening has finished: the words rise in, staggered */
  lit: boolean;
  /**
   * The loading greeting (index.html's "Hi, I'm Adi." under the bulb, see components/mat/hello.ts): 'held' while it is
   * on screen (the headline waits, unmoved, in its place), 'landed' once it has been carried onto the headline (the
   * headline shows at once, without rising in). 'none' when there was no greeting.
   */
  greeting?: 'none' | 'held' | 'landed';
}

// The prototype (review/home-cc-v30) uses "#" for Work, Experience, Résumé and See my work, and for
// LinkedIn. These are the real targets from the live site; change them here, in one place.
const HREF = {
  home: '/',
  work: '#work',
  experience: '#timeline',
  resume: '/Adi_Agarwal_Resume_2026.pdf',
  linkedin: 'https://www.linkedin.com/in/adiind',
  github: GITHUB.href,
} as const;

// The GitHub numbers live with the sticker that shows them on the mat (lib/mat/matPieces.ts).
const GH_LEVELS = GITHUB.levels;
const GH_TITLE = GITHUB.title;

const GITHUB_MARK =
  'M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.500 11.500 0 0 1 6 0c2.300-1.500 3.300-1.200 3.300-1.200.7 1.700.2 2.900.1 3.200.8.800 1.200 1.900 1.200 3.200 0 4.600-2.800 5.600-5.500 5.900.4.400.8 1.100.8 2.200v3.300c0 .3.2.7.8.6A12 12 0 0 0 12 .5z';

const idx = (i: number) => ({ '--mh-i': i } as React.CSSProperties);

/*
 * On the 3D home every block of these words is a thing lying on the mat (lib/mat/wordStage.ts: the name label, the menu
 * tabs, the cut letters of the greeting, the Self strip, the facts card, the GitHub sticker, the "See my work" tag, the
 * LinkedIn tab, the résumé sheet). This layer stays as the real text for screen readers and keyboards, unseen: each link
 * carries `data-piece`, the piece it stands for, and FlipBookApp rings that piece on the mat while the link has focus.
 */
const HeroOverlay: React.FC<HeroOverlayProps> = ({ shown, lit, greeting = 'none' }) => {
  const cls = ['mh-root', 'mh-laid', lit ? 'mh-lit' : '', shown ? '' : 'mh-off', greeting === 'none' ? '' : `mh-greet-${greeting}`].filter(Boolean).join(' ');
  return (
    <div className={cls} aria-hidden={shown ? undefined : true} inert={!shown}>
      <nav className="mh-nav" aria-label="Main">
        <a className="mh-a mh-p mh-name" href={HREF.home} style={idx(0)} data-piece="word:name">Adi Agarwal</a>
        <a
          className="mh-a mh-p mh-gh"
          data-piece="piece:github"
          href={HREF.github}
          style={idx(1)}
          title={GH_TITLE}
          aria-label={`GitHub: ${GITHUB.commits} commits in this site's source, ${GH_TITLE}. Built with ${TOOL_MARKS_LABEL}. Opens the repository.`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={GITHUB_MARK} /></svg>
          <span className="mh-gh-n"><b>{GITHUB.commits}</b>commits</span>
          <span className="mh-gh-grid" aria-hidden="true">
            {GH_LEVELS.split('').map((l, i) => <i key={i} data-l={l} />)}
          </span>
        </a>
        <span className="mh-links mh-p" style={idx(2)}>
          <a className="mh-a" href={HREF.work} data-piece="word:work">Work</a>
          <a className="mh-a" href={HREF.experience} data-piece="word:experience">Experience</a>
          {/* (a plain click opens the résumé sheet up close on the mat, FlipBookApp; the address is the PDF itself) */}
          <a className="mh-a" href={HREF.resume} data-piece="word:resume">Résumé</a>
        </span>
      </nav>

      <div className="mh-text">
        {/* Where the portrait photo sits in the prototype. The photo is drawn in 3D, so only its space is kept. */}
        <div className="mh-gap" aria-hidden="true" />
        <h1 className="mh-hi mh-p" style={idx(3)}>Hi, I’m <em>Adi.</em></h1>
        <p className="mh-say mh-p" style={idx(4)}>I worked on agentic AI products at <b>Self</b>.</p>
        <ul className="mh-facts">
          <li className="mh-p" style={idx(5)}><i>2026</i><span>AI Product Manager intern, <b>Self</b></span></li>
          <li className="mh-p" style={idx(6)}><i>Now</i><span>M.S. Engineering Design Innovation, <b>Northwestern</b></span></li>
          <li className="mh-p" style={idx(7)}><i>Before</i><span>Senior Product Analyst, <b>Zomato</b></span></li>
        </ul>
        <div className="mh-cta mh-p" style={idx(8)}>
          <a className="mh-a mh-btn" href={HREF.work} data-piece="piece:work">
            See my work
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 2v10M2.5 7.5 7 12l4.5-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <a className="mh-a mh-link" href={HREF.resume} data-piece="resume">Résumé</a>
          <a className="mh-a mh-link" href={HREF.linkedin} target="_blank" rel="noopener noreferrer" data-piece="word:linkedin">LinkedIn</a>
        </div>
      </div>
    </div>
  );
};

export default HeroOverlay;

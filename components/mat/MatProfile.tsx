import React from 'react';
import { PROFILE_BIO, PROFILE_SKILLS, SOCIAL_LINKS } from '../../constants';
import './mat-profile.css';

/** The mat shows the same profile as the classic site; the portrait remains on the stage. */
export default function MatProfile() {
  return (
    <section className="mat-profile" aria-labelledby="mat-profile-title">
      <p className="mat-profile-kicker">PROFILE · ADI AGARWAL</p>
      <h2 id="mat-profile-title">Hello, I’m Adi.</h2>
      <p className="mat-profile-subtitle">Product Management · AI Product Development · Product Analytics</p>
      <div className="mat-profile-bio">{PROFILE_BIO.split('\n\n').map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      <h3>Core toolkit</h3>
      <ul className="mat-profile-skills">{PROFILE_SKILLS.map((skill) => <li key={skill}>{skill}</li>)}</ul>
      <div className="mat-profile-links">
        <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
        <a href={SOCIAL_LINKS.resume} target="_blank" rel="noopener noreferrer">View résumé ↗</a>
      </div>
    </section>
  );
}

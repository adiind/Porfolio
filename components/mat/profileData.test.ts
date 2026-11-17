import { describe, expect, it } from 'vitest';
import { PROFILE_BIO, PROFILE_SKILLS, SOCIAL_LINKS } from '../../constants';
import profile from '../../public/data/mat-profile.json';

describe('mat profile content', () => {
  it('matches the existing portfolio profile on desktop and phone', () => {
    expect(profile.bio.join('\n\n')).toBe(PROFILE_BIO);
    expect(profile.skills).toEqual(PROFILE_SKILLS);
    expect(profile.linkedin).toBe(SOCIAL_LINKS.linkedin);
    expect(profile.resume).toBe(SOCIAL_LINKS.resume);
  });
});

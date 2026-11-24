import { describe, expect, it } from 'vitest';
import { LEFT_OUT, REMADE } from './WorkSection';
import { SHAPE, boardIsFull, layBento } from './workBento';
import { PROJECTS } from '../../data/projects';

const KNOWN = Object.keys(SHAPE);

describe('Selected work board', () => {
  it('lays every project the board lists with no gap, with Lawn', () => {
    const places = layBento(KNOWN);
    expect(Object.keys(places).sort()).toEqual([...KNOWN].sort());
    expect(boardIsFull(places)).toBe(true);
    expect(Math.max(...Object.values(places).map((p) => p.r + p.h - 1))).toBe(6);
  });

  it('lays them with no gap without Lawn (a build whose project list has none)', () => {
    const places = layBento(KNOWN.filter((id) => id !== 'lawn'));
    expect('lawn' in places).toBe(false);
    expect(boardIsFull(places)).toBe(true);
    // the three design case studies lead the board, side by side; Glyph starts the row under them
    REMADE.forEach((id, index) => expect(places[id], id).toEqual({ c: 1 + index * 2, r: 1, w: 2, h: 2 }));
    expect(places.glyph).toMatchObject({ c: 1, r: 3 });
  });

  it('never leaves a hole or an overlap whichever projects are missing (all 4095 sets)', () => {
    for (let mask = 1; mask < 1 << KNOWN.length; mask += 1) {
      const ids = KNOWN.filter((_, index) => mask & (1 << index));
      const places = layBento(ids);
      expect(Object.keys(places).length, ids.join(',')).toBe(ids.length);
      expect(boardIsFull(places), ids.join(',')).toBe(true);
    }
  });

  it('gives a project it does not know one small chip at the end, still with no gap', () => {
    const places = layBento([...KNOWN, 'new-thing']);
    expect(places['new-thing']).toMatchObject({ w: expect.any(Number), h: 1 });
    expect(boardIsFull(places)).toBe(true);
  });

  it('lays the projects this build really has with no gap, the three design case studies among them', () => {
    const ids = PROJECTS.filter((project) => !LEFT_OUT.includes(project.id)).map((project) => project.id);
    REMADE.forEach((id) => expect(ids, id).toContain(id));
    expect(boardIsFull(layBento(ids))).toBe(true);
  });
});

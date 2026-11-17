/**
 * Where each project lies on the Selected work board, worked out from the projects that are really there.
 *
 * The board is six columns wide and as many rows tall as it needs. Every project has the shape it likes (a big print, a
 * wide strip, a small chip). The tiles are put down in a fixed order, each in the first place it fits; if the projects
 * present leave a gap (one is missing from this build's list), the tile beside the gap is stretched over it, so the board
 * never has a hole. A project this file does not know is one small chip at the end.
 */
export interface Place { c: number; r: number; w: number; h: number }

export const COLUMNS = 6;

/** The shape each project likes, [columns across, rows down], in the order they are laid down. */
export const SHAPE: Record<string, [number, number]> = {
  glyph: [3, 2],
  lawn: [3, 2],
  surya: [2, 2],
  jarvis: [1, 1],
  'zero-my-ai': [1, 1],
  helios: [1, 1],
  plotter: [1, 1],
  solopump: [2, 1],
  'portfolio-website': [2, 1],
};
const ORDER = Object.keys(SHAPE);

export function layBento(ids: string[]): Record<string, Place> {
  const ordered = [...ids].sort((a, b) => {
    const ia = ORDER.indexOf(a); const ib = ORDER.indexOf(b);
    return (ia < 0 ? ORDER.length : ia) - (ib < 0 ? ORDER.length : ib);
  });
  const places: Record<string, Place> = {};
  const grid: string[][] = []; // grid[row - 1][col - 1] = the id lying there
  const at = (c: number, r: number) => grid[r - 1]?.[c - 1];
  const put = (id: string, place: Place) => {
    for (let r = place.r; r < place.r + place.h; r += 1) {
      grid[r - 1] ??= Array<string>(COLUMNS).fill('');
      for (let c = place.c; c < place.c + place.w; c += 1) grid[r - 1][c - 1] = id;
    }
    places[id] = place;
  };
  const free = (place: Place) => {
    for (let r = place.r; r < place.r + place.h; r += 1) for (let c = place.c; c < place.c + place.w; c += 1) if (at(c, r)) return false;
    return true;
  };

  for (const id of ordered) {
    const [w, h] = SHAPE[id] ?? [1, 1];
    let done = false;
    for (let r = 1; !done; r += 1) {
      for (let c = 1; c + w - 1 <= COLUMNS && !done; c += 1) {
        const place = { c, r, w, h };
        if (free(place)) { put(id, place); done = true; }
      }
    }
  }

  // stretch tiles over any gap (a row with empty cells, usually the last)
  const rows = grid.length;
  const clear = (id: string) => { const p = places[id]; for (let r = p.r; r < p.r + p.h; r += 1) for (let c = p.c; c < p.c + p.w; c += 1) grid[r - 1][c - 1] = ''; };
  const tilesAbove = (from: number, to: number, r: number) => {
    if (r < 2) return false;
    for (let c = from; c <= to; c += 1) {
      const id = at(c, r - 1);
      if (!id) return false;
      const p = places[id];
      if (p.r + p.h !== r || p.c < from || p.c + p.w - 1 > to) return false;
    }
    return true;
  };
  for (let r = 1; r <= rows; r += 1) {
    let c = 1;
    while (c <= COLUMNS) {
      if (at(c, r)) { c += 1; continue; }
      let end = c;
      while (end + 1 <= COLUMNS && !at(end + 1, r)) end += 1;
      const len = end - c + 1;
      const left = c > 1 ? at(c - 1, r) : '';
      const right = end < COLUMNS ? at(end + 1, r) : '';
      const above = r > 1 ? at(c, r - 1) : '';
      if (left && places[left].h === 1) {
        const p = places[left]; clear(left); put(left, { ...p, w: p.w + len });
      } else if (right && places[right].h === 1) {
        const p = places[right]; clear(right); put(right, { ...p, c, w: p.w + len });
      } else if (tilesAbove(c, end, r)) {
        // every cell of the gap sits under a tile that ends in the row above and stays inside the gap's width: each grows one row down
        for (const id of new Set(Array.from({ length: len }, (_, i) => at(c + i, r - 1)))) { const p = places[id]; clear(id); put(id, { ...p, h: p.h + 1 }); }
      } else if (left) {
        // a tall tile on the left: stretch it into the gap on every row it covers only if those cells are free
        const p = places[left]; const wider = { ...p, w: p.w + len };
        clear(left);
        if (free(wider)) put(left, wider); else put(left, p);
      }
      c = end + 1;
      if (at(end, r) === '' ) c = end + 1;
    }
  }
  return places;
}

/** True when every cell of the board is covered by exactly one tile. */
export function boardIsFull(places: Record<string, Place>): boolean {
  const rows = Math.max(0, ...Object.values(places).map((p) => p.r + p.h - 1));
  const seen = new Set<string>();
  for (const p of Object.values(places)) {
    for (let r = p.r; r < p.r + p.h; r += 1) for (let c = p.c; c < p.c + p.w; c += 1) {
      if (c < 1 || c > COLUMNS) return false;
      const key = `${c},${r}`;
      if (seen.has(key)) return false;
      seen.add(key);
    }
  }
  return seen.size === rows * COLUMNS;
}

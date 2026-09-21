import type { Board, Cell, Color, LevelDef, Special, Tile } from './types';

let tileId = 1;
export const newTile = (color: Color, special?: Special): Tile => ({
  id: tileId++,
  color,
  ...(special ? { special } : {}),
});

const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const key = (r: number, c: number) => `${r},${c}`;
export const unkey = (k: string): [number, number] => {
  const [r, c] = k.split(',').map(Number);
  return [r, c];
};

const emptyCell = (): Cell => ({ tile: null, ice: 0, crate: 0, lock: false });

export function createBoard(def: LevelDef): Board {
  const b: Board = [];
  for (let r = 0; r < def.rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < def.cols; c++) {
      const cell = emptyCell();
      const ch = def.layout?.[r]?.[c] ?? '.';
      if (ch === 'C') cell.crate = 1;
      else if (ch === 'D') cell.crate = 2;
      else if (ch === 'I') cell.ice = 1;
      else if (ch === 'J') cell.ice = 2;
      else if (ch === 'L') cell.lock = true;
      row.push(cell);
    }
    b.push(row);
  }
  // fill tiles avoiding starting matches
  for (let r = 0; r < def.rows; r++) {
    for (let c = 0; c < def.cols; c++) {
      if (b[r][c].crate > 0) continue;
      let color: Color;
      let guard = 0;
      do {
        color = rand(def.colors);
        guard++;
      } while (guard < 40 && makesMatchAt(b, r, c, color));
      b[r][c].tile = newTile(color);
    }
  }
  return b;
}

function makesMatchAt(b: Board, r: number, c: number, color: Color): boolean {
  const col = (rr: number, cc: number) => b[rr]?.[cc]?.tile?.color;
  return (
    (col(r, c - 1) === color && col(r, c - 2) === color) ||
    (col(r - 1, c) === color && col(r - 2, c) === color)
  );
}

export const cloneBoard = (b: Board): Board =>
  b.map((row) => row.map((cell) => ({ ...cell, tile: cell.tile ? { ...cell.tile } : null })));

export const inBounds = (b: Board, r: number, c: number) =>
  r >= 0 && r < b.length && c >= 0 && c < b[0].length;

export const canSwapCell = (b: Board, r: number, c: number) => {
  const cell = b[r]?.[c];
  return !!cell && cell.crate === 0 && !cell.lock && !!cell.tile;
};

// ---------- Match detection ----------

interface Run { cells: [number, number][]; dir: 'h' | 'v'; color: Color; }

export interface MatchResult {
  cleared: Set<string>;
  specials: { r: number; c: number; type: Special; color: Color }[];
}

export function findMatches(b: Board, swapPos?: [number, number][]): MatchResult {
  const runs: Run[] = [];
  const rows = b.length, cols = b[0].length;

  for (let r = 0; r < rows; r++) {
    let c = 0;
    while (c < cols) {
      const t = b[r][c].tile;
      if (!t) { c++; continue; }
      let e = c;
      while (e + 1 < cols && b[r][e + 1].tile?.color === t.color) e++;
      if (e - c + 1 >= 3) runs.push({ dir: 'h', color: t.color, cells: Array.from({ length: e - c + 1 }, (_, i) => [r, c + i] as [number, number]) });
      c = e + 1;
    }
  }
  for (let c = 0; c < cols; c++) {
    let r = 0;
    while (r < rows) {
      const t = b[r][c].tile;
      if (!t) { r++; continue; }
      let e = r;
      while (e + 1 < rows && b[e + 1][c].tile?.color === t.color) e++;
      if (e - r + 1 >= 3) runs.push({ dir: 'v', color: t.color, cells: Array.from({ length: e - r + 1 }, (_, i) => [r + i, c] as [number, number]) });
      r = e + 1;
    }
  }

  const cleared = new Set<string>();
  runs.forEach((run) => run.cells.forEach(([r, c]) => cleared.add(key(r, c))));

  // special creation
  const specials: MatchResult['specials'] = [];
  const specialTaken = new Set<string>();
  const preferPos = (run: Run): [number, number] => {
    if (swapPos) {
      for (const [sr, sc] of swapPos) {
        if (run.cells.some(([r, c]) => r === sr && c === sc) && !specialTaken.has(key(sr, sc))) return [sr, sc];
      }
    }
    const free = run.cells.filter(([r, c]) => !specialTaken.has(key(r, c)));
    return free[Math.floor(free.length / 2)] ?? run.cells[0];
  };

  // bombs first (5+ in a line)
  for (const run of runs.filter((x) => x.cells.length >= 5)) {
    const [r, c] = preferPos(run);
    specials.push({ r, c, type: 'bomb', color: run.color });
    specialTaken.add(key(r, c));
  }
  // wraps: intersecting h & v runs of same color
  for (const h of runs.filter((x) => x.dir === 'h' && x.cells.length < 5)) {
    for (const v of runs.filter((x) => x.dir === 'v' && x.cells.length < 5 && x.color === h.color)) {
      const cross = h.cells.find(([r, c]) => v.cells.some(([vr, vc]) => vr === r && vc === c));
      if (cross && !specialTaken.has(key(cross[0], cross[1]))) {
        specials.push({ r: cross[0], c: cross[1], type: 'wrap', color: h.color });
        specialTaken.add(key(cross[0], cross[1]));
      }
    }
  }
  // stripes (4 in a line)
  for (const run of runs.filter((x) => x.cells.length === 4)) {
    const [r, c] = preferPos(run);
    if (specialTaken.has(key(r, c))) continue;
    specials.push({ r, c, type: run.dir === 'h' ? 'stripeH' : 'stripeV', color: run.color });
    specialTaken.add(key(r, c));
  }

  return { cleared, specials };
}

// ---------- Special effects ----------

function mostCommonColor(b: Board): Color | null {
  const counts = new Map<Color, number>();
  b.forEach((row) => row.forEach((cell) => {
    if (cell.tile) counts.set(cell.tile.color, (counts.get(cell.tile.color) ?? 0) + 1);
  }));
  let best: Color | null = null, n = 0;
  counts.forEach((v, k) => { if (v > n) { n = v; best = k; } });
  return best;
}

/** Expand the clear-set with chained special explosions. */
export function expandClears(b: Board, initial: Set<string>, protectedPos: Set<string>): Set<string> {
  const cleared = new Set(initial);
  const queue = [...initial];
  while (queue.length) {
    const k = queue.pop()!;
    if (protectedPos.has(k)) continue;
    const [r, c] = unkey(k);
    const tile = b[r]?.[c]?.tile;
    if (!tile?.special) continue;
    const add = (rr: number, cc: number) => {
      if (!inBounds(b, rr, cc)) return;
      if (b[rr][cc].crate > 0) return;
      const kk = key(rr, cc);
      if (!cleared.has(kk)) { cleared.add(kk); queue.push(kk); }
    };
    if (tile.special === 'stripeH') for (let cc = 0; cc < b[0].length; cc++) add(r, cc);
    if (tile.special === 'stripeV') for (let rr = 0; rr < b.length; rr++) add(rr, c);
    if (tile.special === 'wrap') for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) add(r + dr, c + dc);
    if (tile.special === 'bomb') {
      const target = mostCommonColor(b);
      if (target) b.forEach((row, rr) => row.forEach((cell, cc) => { if (cell.tile?.color === target) add(rr, cc); }));
    }
  }
  return cleared;
}

export interface RemovalStats {
  collected: Partial<Record<Color, number>>;
  ice: number;
  crates: number;
  locks: number;
  tilesCleared: number;
}

/** Removes cleared tiles, damages obstacles, spawns specials. Mutates board. */
export function applyRemoval(
  b: Board,
  cleared: Set<string>,
  specials: MatchResult['specials'],
): RemovalStats {
  const stats: RemovalStats = { collected: {}, ice: 0, crates: 0, locks: 0, tilesCleared: 0 };
  const specialAt = new Map<string, MatchResult['specials'][number]>();
  specials.forEach((s) => specialAt.set(key(s.r, s.c), s));

  // damage crates adjacent to cleared cells (1 hit per removal step)
  const crateHit = new Set<string>();
  cleared.forEach((k) => {
    const [r, c] = unkey(k);
    [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([rr, cc]) => {
      if (inBounds(b, rr, cc) && b[rr][cc].crate > 0) crateHit.add(key(rr, cc));
    });
  });
  crateHit.forEach((k) => {
    const [r, c] = unkey(k);
    b[r][c].crate--;
    if (b[r][c].crate === 0) stats.crates++;
  });

  cleared.forEach((k) => {
    const [r, c] = unkey(k);
    const cell = b[r][c];
    if (!cell.tile) return;
    if (cell.ice > 0) { cell.ice--; stats.ice++; }
    if (cell.lock) { cell.lock = false; stats.locks++; }
    stats.collected[cell.tile.color] = (stats.collected[cell.tile.color] ?? 0) + 1;
    stats.tilesCleared++;
    const spawn = specialAt.get(k);
    cell.tile = spawn ? newTile(spawn.color, spawn.type) : null;
  });
  return stats;
}

/** Gravity with static blockers (crates, locked tiles). Returns true if anything moved/spawned. */
export function applyGravity(b: Board, colors: Color[]): boolean {
  let changed = false;
  const rows = b.length, cols = b[0].length;
  for (let c = 0; c < cols; c++) {
    // split column into segments between static cells
    let segStart = 0;
    const processSegment = (start: number, end: number) => {
      if (end < start) return;
      const tiles: Tile[] = [];
      for (let r = start; r <= end; r++) if (b[r][c].tile) tiles.push(b[r][c].tile!);
      let idx = tiles.length - 1;
      for (let r = end; r >= start; r--) {
        const want = idx >= 0 ? tiles[idx--] : newTile(rand(colors));
        if (b[r][c].tile?.id !== want.id) changed = true;
        b[r][c].tile = want;
      }
    };
    for (let r = 0; r < rows; r++) {
      const isStatic = b[r][c].crate > 0 || b[r][c].lock;
      if (isStatic) {
        processSegment(segStart, r - 1);
        segStart = r + 1;
      }
    }
    processSegment(segStart, rows - 1);
  }
  return changed;
}

// ---------- Move validation & shuffle ----------

export function hasValidMove(b: Board): boolean {
  const rows = b.length, cols = b[0].length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!canSwapCell(b, r, c)) continue;
      if (b[r][c].tile?.special === 'bomb') return true;
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const r2 = r + dr, c2 = c + dc;
        if (!inBounds(b, r2, c2) || !canSwapCell(b, r2, c2)) continue;
        const copy = cloneBoard(b);
        const t = copy[r][c].tile;
        copy[r][c].tile = copy[r2][c2].tile;
        copy[r2][c2].tile = t;
        if (findMatches(copy).cleared.size > 0) return true;
      }
    }
  }
  return false;
}

export function shuffleBoard(b: Board, colors: Color[]) {
  let guard = 0;
  do {
    const movable: [number, number][] = [];
    b.forEach((row, r) => row.forEach((cell, cc) => {
      if (cell.tile && cell.crate === 0 && !cell.lock) movable.push([r, cc]);
    }));
    const tiles = movable.map(([r, c]) => b[r][c].tile!);
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    movable.forEach(([r, c], i) => { b[r][c].tile = tiles[i]; });
    guard++;
  } while (guard < 30 && (findMatches(b).cleared.size > 0 || !hasValidMove(b)));
  void colors;
}

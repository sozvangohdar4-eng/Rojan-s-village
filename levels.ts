import type { LevelDef } from './types';

/**
 * Modular, JSON-style level definitions.
 * Layout legend:  '.'=normal  C=crate(1 hit)  D=crate(2)  I=ice(1)  J=ice(2)  L=locked tile
 * New levels can be appended here without any engine changes.
 */
export const LEVELS: LevelDef[] = [
  {
    id: 'l1',
    name: 'The Mountain Road',
    rows: 7, cols: 7,
    colors: ['tulip', 'sun', 'leaf', 'eye'],
    moves: 20,
    goals: [{ type: 'collect', color: 'tulip', count: 15 }],
    starScores: [1200, 2200, 3400],
    intro: 'Swipe or tap two neighbouring pieces to swap them. Match 3 or more of the same kind!',
  },
  {
    id: 'l2',
    name: 'Grandmother\u2019s Gate',
    rows: 7, cols: 7,
    colors: ['tulip', 'sun', 'leaf', 'eye'],
    moves: 20,
    goals: [
      { type: 'collect', color: 'sun', count: 18 },
      { type: 'collect', color: 'leaf', count: 18 },
    ],
    starScores: [1600, 2800, 4200],
  },
  {
    id: 'l3',
    name: 'The Dusty Courtyard',
    rows: 8, cols: 7,
    colors: ['tulip', 'sun', 'leaf', 'eye', 'grape'],
    moves: 22,
    goals: [
      { type: 'collect', color: 'grape', count: 20 },
      { type: 'collect', color: 'eye', count: 20 },
    ],
    starScores: [2000, 3400, 5000],
  },
  {
    id: 'l4',
    name: 'Crates in the Bakery',
    rows: 8, cols: 7,
    colors: ['tulip', 'sun', 'leaf', 'eye', 'grape'],
    moves: 24,
    layout: [
      '.......',
      '.......',
      '.......',
      '..CCC..',
      '..C.C..',
      '..CCC..',
      '.......',
      '.......',
    ],
    goals: [{ type: 'crate', count: 8 }],
    starScores: [2200, 3600, 5200],
    intro: 'Old crates block the board. Make matches right next to a crate to smash it open!',
  },
  {
    id: 'l5',
    name: 'Striped Sunlight',
    rows: 8, cols: 7,
    colors: ['tulip', 'sun', 'leaf', 'eye', 'grape'],
    moves: 22,
    goals: [
      { type: 'collect', color: 'sun', count: 30 },
      { type: 'collect', color: 'tulip', count: 25 },
    ],
    starScores: [2600, 4200, 6000],
    intro: 'Match 4 in a line to bake a STRIPED piece \u2014 match it to blast a whole row or column!',
  },
  {
    id: 'l6',
    name: 'Frozen Spring Water',
    rows: 8, cols: 7,
    colors: ['tulip', 'sun', 'leaf', 'eye', 'grape'],
    moves: 26,
    layout: [
      '.......',
      '.......',
      'IIIIIII',
      'IJJJJJI',
      'IJJJJJI',
      'IIIIIII',
      '.......',
      '.......',
    ],
    goals: [{ type: 'ice', count: 32 }],
    starScores: [2800, 4600, 6600],
    intro: 'Mountain ice covers some tiles. Match pieces on top of the ice to melt it, layer by layer.',
  },
  {
    id: 'l7',
    name: 'The Wrapped Parcel',
    rows: 8, cols: 8,
    colors: ['tulip', 'sun', 'leaf', 'eye', 'grape'],
    moves: 24,
    layout: [
      '........',
      '........',
      '........',
      '...CC...',
      '...CC...',
      'IIIIIIII',
      '........',
      '........',
    ],
    goals: [
      { type: 'crate', count: 4 },
      { type: 'ice', count: 8 },
    ],
    starScores: [3000, 5000, 7200],
    intro: 'Match in an L or T shape to wrap a piece in kilim cloth \u2014 it explodes all around itself!',
  },
  {
    id: 'l8',
    name: 'Chained Doors',
    rows: 8, cols: 8,
    colors: ['tulip', 'sun', 'leaf', 'eye', 'grape', 'tea'],
    moves: 26,
    layout: [
      '........',
      '.L....L.',
      '........',
      '..LLLL..',
      '..LLLL..',
      '........',
      '.L....L.',
      '........',
    ],
    goals: [{ type: 'lock', count: 12 }],
    starScores: [3200, 5400, 7800],
    intro: 'Chained pieces cannot move \u2014 but you can still match them to break the rusty chains.',
  },
  {
    id: 'l9',
    name: 'The Colour Bomb',
    rows: 8, cols: 8,
    colors: ['tulip', 'sun', 'leaf', 'eye', 'grape', 'tea'],
    moves: 24,
    goals: [
      { type: 'collect', color: 'tea', count: 30 },
      { type: 'collect', color: 'grape', count: 30 },
    ],
    starScores: [3600, 6000, 8600],
    intro: 'Match 5 in a straight line to forge a COLOUR BOMB. Swap it with any piece to clear every piece of that colour!',
  },
  {
    id: 'l10',
    name: 'Rebuilding Together',
    rows: 9, cols: 8,
    colors: ['tulip', 'sun', 'leaf', 'eye', 'grape', 'tea'],
    moves: 30,
    layout: [
      '........',
      '.L....L.',
      '..IIII..',
      '..IJJI..',
      'C.IJJI.C',
      'C.IIII.C',
      '........',
      '.L....L.',
      'DDDDDDDD',
    ],
    goals: [
      { type: 'crate', count: 12 },
      { type: 'ice', count: 16 },
      { type: 'lock', count: 4 },
      { type: 'collect', color: 'tulip', count: 20 },
    ],
    starScores: [4200, 7000, 10000],
    intro: 'Everything you have learned, all at once. The whole village is watching, Rojan!',
  },
];

/** Limited-time Newroz festival event level */
export const EVENT_LEVEL: LevelDef = {
  id: 'event-newroz',
  name: 'Newroz Bonfire',
  rows: 8, cols: 8,
  colors: ['tulip', 'sun', 'leaf', 'eye', 'grape'],
  moves: 25,
  layout: [
    '........',
    '...CC...',
    '..CJJC..',
    '.CJDDJC.',
    '.CJDDJC.',
    '..CJJC..',
    '...CC...',
    '........',
  ],
  goals: [
    { type: 'crate', count: 12 },
    { type: 'collect', color: 'sun', count: 25 },
  ],
  starScores: [3000, 5000, 7500],
  intro: 'Light the Newroz bonfire! Break the woodpile and gather sunlight before the festival begins.',
};

export function getLevel(id: string): LevelDef | undefined {
  if (id === EVENT_LEVEL.id) return EVENT_LEVEL;
  return LEVELS.find((l) => l.id === id);
}

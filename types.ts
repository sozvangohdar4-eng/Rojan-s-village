// ---------- Match-3 core types ----------

export type Color = 'tulip' | 'sun' | 'leaf' | 'eye' | 'grape' | 'tea';

export type Special = 'stripeH' | 'stripeV' | 'wrap' | 'bomb';

export interface Tile {
  id: number;
  color: Color;
  special?: Special;
}

export interface Cell {
  tile: Tile | null;
  ice: number;   // 0-2 layers under the tile
  crate: number; // 0-2 hits; crate occupies the cell (no tile)
  lock: boolean; // tile is chained in place
}

export type Board = Cell[][]; // [row][col]

export type Goal =
  | { type: 'collect'; color: Color; count: number }
  | { type: 'crate'; count: number }
  | { type: 'ice'; count: number }
  | { type: 'lock'; count: number };

export interface LevelDef {
  id: string;
  name: string;
  rows: number;
  cols: number;
  colors: Color[];
  moves: number;
  goals: Goal[];
  /** layout strings, one per row. '.'=tile  C/D=crate(1/2 hits)  I/J=ice(1/2)  L=locked tile */
  layout?: string[];
  starScores: [number, number, number];
  intro?: string; // new mechanic explanation
}

// ---------- Meta / save types ----------

export interface SaveState {
  coins: number;
  gems: number;
  bonusStars: number; // stars earned outside levels (events, helper)
  starsSpent: number;
  lives: number;
  lastLifeAt: number;
  levelStars: Record<string, number>; // best stars per level id
  tasksDone: string[];
  choices: Record<string, string>; // taskId -> choiceId
  cutscenesSeen: string[];
  boosters: { hammer: number; moves: number; shuffle: number };
  lastLoginDay: string;
  loginStreak: number;
  helperDay: string;
  helperProgress: number;
  helperClaimed: boolean;
  eventWeek: string;
  eventDone: boolean;
  cloudSync: boolean;
  lastSyncedAt: number | null;
}

export interface GoalProgress {
  goal: Goal;
  done: number;
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { SaveState } from './game/types';
import { LEVELS } from './game/levels';
import { NPCS, HELPER_TASKS } from './data/story';

const SAVE_KEY = 'rojans-village-save-v1';
export const MAX_LIVES = 5;
export const LIFE_REGEN_MS = 30 * 60 * 1000; // 30 minutes

const todayStr = () => new Date().toISOString().slice(0, 10);
const weekStr = () => {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-w${week}`;
};
const dayOfYear = () => Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);

const defaultSave = (): SaveState => ({
  coins: 200,
  gems: 5,
  bonusStars: 0,
  starsSpent: 0,
  lives: MAX_LIVES,
  lastLifeAt: Date.now(),
  levelStars: {},
  tasksDone: [],
  choices: {},
  cutscenesSeen: [],
  boosters: { hammer: 1, moves: 1, shuffle: 1 },
  lastLoginDay: '',
  loginStreak: 0,
  helperDay: '',
  helperProgress: 0,
  helperClaimed: false,
  eventWeek: '',
  eventDone: false,
  cloudSync: false,
  lastSyncedAt: null,
});

function loadSave(): SaveState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return { ...defaultSave(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultSave();
}

interface Ctx {
  save: SaveState;
  update: (patch: Partial<SaveState> | ((s: SaveState) => Partial<SaveState>)) => void;
  starsEarned: number;
  starsAvailable: number;
  levelsCompleted: number;
  dailyRewardAvailable: boolean;
  helperNpcId: string;
  helperTaskIdx: number;
  eventAvailable: boolean;
  spendLife: () => boolean;
  refillLives: () => void;
  cloudSyncNow: () => void;
}

const GameCtx = createContext<Ctx | null>(null);
export const useGame = () => useContext(GameCtx)!;

export function GameProvider({ children }: { children: ReactNode }) {
  const [save, setSave] = useState<SaveState>(loadSave);

  // persist
  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  }, [save]);

  const update = useCallback((patch: Partial<SaveState> | ((s: SaveState) => Partial<SaveState>)) => {
    setSave((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }));
  }, []);

  // lives regeneration ticker
  useEffect(() => {
    const t = setInterval(() => {
      setSave((s) => {
        if (s.lives >= MAX_LIVES) return s;
        const elapsed = Date.now() - s.lastLifeAt;
        const gained = Math.floor(elapsed / LIFE_REGEN_MS);
        if (gained <= 0) return s;
        return {
          ...s,
          lives: Math.min(MAX_LIVES, s.lives + gained),
          lastLifeAt: s.lives + gained >= MAX_LIVES ? Date.now() : s.lastLifeAt + gained * LIFE_REGEN_MS,
        };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // daily helper reset
  useEffect(() => {
    const today = todayStr();
    if (save.helperDay !== today) {
      update({ helperDay: today, helperProgress: 0, helperClaimed: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const starsEarned = useMemo(
    () => Object.values(save.levelStars).reduce((a, b) => a + b, 0) + save.bonusStars,
    [save.levelStars, save.bonusStars],
  );
  const starsAvailable = starsEarned - save.starsSpent;
  const levelsCompleted = useMemo(
    () => LEVELS.filter((l) => (save.levelStars[l.id] ?? 0) > 0).length,
    [save.levelStars],
  );

  const dailyRewardAvailable = save.lastLoginDay !== todayStr();
  const helperNpcId = NPCS[dayOfYear() % NPCS.length].id;
  const helperTaskIdx = dayOfYear() % HELPER_TASKS.length;
  const eventAvailable = save.eventWeek !== weekStr() || !save.eventDone;

  const spendLife = useCallback(() => {
    let ok = false;
    setSave((s) => {
      if (s.lives <= 0) return s;
      ok = true;
      return {
        ...s,
        lives: s.lives - 1,
        lastLifeAt: s.lives === MAX_LIVES ? Date.now() : s.lastLifeAt,
      };
    });
    return ok;
  }, []);

  const refillLives = useCallback(() => {
    setSave((s) => ({ ...s, lives: MAX_LIVES, lastLifeAt: Date.now() }));
  }, []);

  const cloudSyncNow = useCallback(() => {
    setSave((s) => ({ ...s, lastSyncedAt: Date.now() }));
  }, []);

  const value: Ctx = {
    save, update, starsEarned, starsAvailable, levelsCompleted,
    dailyRewardAvailable, helperNpcId, helperTaskIdx, eventAvailable,
    spendLife, refillLives, cloudSyncNow,
  };

  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

export { todayStr, weekStr };

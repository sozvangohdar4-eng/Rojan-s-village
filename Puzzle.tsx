import { useCallback, useEffect, useRef, useState } from 'react';
import type { Board, GoalProgress, LevelDef, Tile } from '../game/types';
import {
  applyGravity, applyRemoval, canSwapCell, cloneBoard, createBoard, expandClears,
  findMatches, hasValidMove, key, shuffleBoard,
} from '../game/engine';
import type { MatchResult } from '../game/engine';
import { useGame } from '../state';
import { TILE_STYLE, BigButton, Modal, StarRow, AdModal } from './ui';
import { weekStr } from '../state';

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

interface Fx { id: number; r: number; c: number; icon: string; }
let fxId = 1;

export interface PuzzleResult { won: boolean; stars: number; coins: number; }
export type PuzzleExit = PuzzleResult | null | 'retry';

export default function Puzzle({ level, onExit }: { level: LevelDef; onExit: (r: PuzzleExit) => void }) {
  const { save, update, spendLife } = useGame();
  const boardRef = useRef<Board>(createBoard(level));
  const [board, setBoard] = useState<Board>(() => cloneBoard(boardRef.current));
  const [moves, setMoves] = useState(level.moves);
  const [score, setScore] = useState(0);
  const [goals, setGoals] = useState<GoalProgress[]>(level.goals.map((g) => ({ goal: g, done: 0 })));
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [fx, setFx] = useState<Fx[]>([]);
  const [banner, setBanner] = useState<string | null>(null);
  const [phase, setPhase] = useState<'intro' | 'play' | 'won' | 'lost'>(level.intro ? 'intro' : 'play');
  const [hammerMode, setHammerMode] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ r: number; c: number; x: number; y: number } | null>(null);
  const endedRef = useRef(false);
  const scoreRef = useRef(0);
  const goalsRef = useRef(goals);
  const movesRef = useRef(moves);

  const render = useCallback(() => setBoard(cloneBoard(boardRef.current)), []);

  const isEvent = level.id.startsWith('event');
  const rows = level.rows, cols = level.cols;

  const addFx = (items: Fx[]) => {
    setFx((f) => [...f, ...items]);
    setTimeout(() => setFx((f) => f.filter((x) => !items.includes(x))), 450);
  };

  const bumpGoals = (stats: ReturnType<typeof applyRemoval>) => {
    goalsRef.current = goalsRef.current.map((gp) => {
      const g = gp.goal;
      let add = 0;
      if (g.type === 'collect') add = stats.collected[g.color] ?? 0;
      if (g.type === 'ice') add = stats.ice;
      if (g.type === 'crate') add = stats.crates;
      if (g.type === 'lock') add = stats.locks;
      return { ...gp, done: Math.min(g.count, gp.done + add) };
    });
    setGoals(goalsRef.current);
  };

  const goalsMet = () => goalsRef.current.every((gp) => gp.done >= gp.goal.count);

  const addScore = (n: number) => { scoreRef.current += n; setScore(scoreRef.current); };

  const starsFor = (s: number) => (s >= level.starScores[2] ? 3 : s >= level.starScores[1] ? 2 : s >= level.starScores[0] ? 1 : 0);

  const finish = useCallback((won: boolean) => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (won) {
      addScore(movesRef.current * 100);
      setPhase('won');
    } else {
      setPhase('lost');
    }
  }, []);

  const removalStep = async (b: Board, m: MatchResult, chain: number) => {
    const protectedPos = new Set(m.specials.map((s) => key(s.r, s.c)));
    const cleared = expandClears(b, m.cleared, protectedPos);
    const pops: Fx[] = [];
    cleared.forEach((k) => {
      const [r, c] = k.split(',').map(Number);
      const t = b[r][c].tile;
      if (t) pops.push({ id: fxId++, r, c, icon: TILE_STYLE[t.color].icon });
    });
    addFx(pops);
    const stats = applyRemoval(b, cleared, m.specials);
    addScore((stats.tilesCleared * 60 + stats.crates * 100 + stats.ice * 50 + stats.locks * 80) * chain);
    bumpGoals(stats);
    if (chain >= 2) {
      setBanner(chain >= 4 ? 'Spectacular!' : chain === 3 ? 'Amazing!' : 'Combo x2!');
      setTimeout(() => setBanner(null), 900);
    }
    render();
    await wait(270);
    applyGravity(b, level.colors);
    render();
    await wait(240);
  };

  const cascade = async (first?: MatchResult) => {
    const b = boardRef.current;
    let chain = 1;
    let m = first ?? findMatches(b);
    while (m.cleared.size > 0) {
      await removalStep(b, m, chain);
      chain++;
      m = findMatches(b);
    }
    if (!hasValidMove(b)) {
      setBanner('No moves left — reshuffling!');
      await wait(600);
      shuffleBoard(b, level.colors);
      render();
      setBanner(null);
    }
  };

  const afterMove = () => {
    if (goalsMet()) finish(true);
    else if (movesRef.current <= 0) finish(false);
  };

  const consumeMove = () => { movesRef.current -= 1; setMoves(movesRef.current); };

  const trySwap = async (r1: number, c1: number, r2: number, c2: number) => {
    if (busy || phase !== 'play' || endedRef.current) return;
    const b = boardRef.current;
    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return;
    if (!canSwapCell(b, r1, c1) || !canSwapCell(b, r2, c2)) return;
    setBusy(true);
    setSelected(null);
    const t1 = b[r1][c1].tile!, t2 = b[r2][c2].tile!;

    // colour bomb swaps
    if (t1.special === 'bomb' || t2.special === 'bomb') {
      b[r1][c1].tile = t2; b[r2][c2].tile = t1;
      render(); await wait(200);
      consumeMove();
      const cleared = new Set<string>();
      const bothBombs = t1.special === 'bomb' && t2.special === 'bomb';
      const bombPos = t1.special === 'bomb' ? [r2, c2] : [r1, c1];
      const other: Tile = t1.special === 'bomb' ? t2 : t1;
      if (bothBombs) {
        b.forEach((row, r) => row.forEach((cell, c) => { if (cell.tile) cleared.add(key(r, c)); }));
      } else {
        cleared.add(key(bombPos[0], bombPos[1]));
        b.forEach((row, r) => row.forEach((cell, c) => {
          if (cell.tile?.color === other.color) cleared.add(key(r, c));
        }));
      }
      await removalStep(b, { cleared, specials: [] }, 1);
      await cascade();
      setBusy(false);
      afterMove();
      return;
    }

    b[r1][c1].tile = t2; b[r2][c2].tile = t1;
    const m = findMatches(b, [[r1, c1], [r2, c2]]);
    if (m.cleared.size === 0) {
      render(); await wait(200);
      b[r1][c1].tile = t1; b[r2][c2].tile = t2;
      render(); await wait(150);
      setBusy(false);
      return;
    }
    render(); await wait(200);
    consumeMove();
    await cascade(m);
    setBusy(false);
    afterMove();
  };

  // ---------- boosters ----------
  const useHammer = async (r: number, c: number) => {
    const b = boardRef.current;
    if (!b[r][c].tile && b[r][c].crate === 0) return;
    setHammerMode(false);
    update((s) => ({ boosters: { ...s.boosters, hammer: s.boosters.hammer - 1 } }));
    setBusy(true);
    if (b[r][c].crate > 0) {
      b[r][c].crate = 0;
      bumpGoals({ collected: {}, ice: 0, crates: 1, locks: 0, tilesCleared: 0 });
      addScore(100);
      render();
      await wait(250);
      applyGravity(b, level.colors);
      render();
    } else {
      await removalStep(b, { cleared: new Set([key(r, c)]), specials: [] }, 1);
    }
    await cascade();
    setBusy(false);
    if (goalsMet()) finish(true);
  };

  const boosterMoves = () => {
    update((s) => ({ boosters: { ...s.boosters, moves: s.boosters.moves - 1 } }));
    movesRef.current += 5; setMoves(movesRef.current);
  };

  const boosterShuffle = async () => {
    update((s) => ({ boosters: { ...s.boosters, shuffle: s.boosters.shuffle - 1 } }));
    setBusy(true);
    shuffleBoard(boardRef.current, level.colors);
    render();
    await wait(300);
    await cascade();
    setBusy(false);
  };

  const buyBooster = (kind: 'hammer' | 'moves' | 'shuffle') => {
    if (save.coins < 60) { setBanner('Not enough coins!'); setTimeout(() => setBanner(null), 900); return; }
    update((s) => ({ coins: s.coins - 60, boosters: { ...s.boosters, [kind]: s.boosters[kind] + 1 } }));
  };

  // ---------- input ----------
  const cellFromEvent = (e: React.PointerEvent): [number, number] | null => {
    const el = gridRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const c = Math.floor(((e.clientX - rect.left) / rect.width) * cols);
    const r = Math.floor(((e.clientY - rect.top) / rect.height) * rows);
    if (r < 0 || r >= rows || c < 0 || c >= cols) return null;
    return [r, c];
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (busy || phase !== 'play') return;
    const pos = cellFromEvent(e);
    if (!pos) return;
    const [r, c] = pos;
    if (hammerMode) { void useHammer(r, c); return; }
    dragRef.current = { r, c, x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || busy) return;
    const el = gridRef.current;
    if (!el) return;
    const cellW = el.getBoundingClientRect().width / cols;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < cellW * 0.35) return;
    const [dr, dc] = Math.abs(dx) > Math.abs(dy) ? [0, Math.sign(dx)] : [Math.sign(dy), 0];
    dragRef.current = null;
    void trySwap(d.r, d.c, d.r + dr, d.c + dc);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d || busy || phase !== 'play') return;
    const pos = cellFromEvent(e);
    if (!pos) return;
    const [r, c] = pos;
    if (selected) {
      const [sr, sc] = selected;
      if (sr === r && sc === c) { setSelected(null); return; }
      if (Math.abs(sr - r) + Math.abs(sc - c) === 1) { void trySwap(sr, sc, r, c); return; }
    }
    if (canSwapCell(boardRef.current, r, c) || boardRef.current[r][c].tile) setSelected([r, c]);
  };

  // initial validity check
  useEffect(() => {
    if (!hasValidMove(boardRef.current)) {
      shuffleBoard(boardRef.current, level.colors);
      render();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- rewards ----------
  const stars = starsFor(scoreRef.current);
  const coinReward = 40 + stars * 40 + (isEvent ? 200 : 0);

  const collectWin = () => {
    update((s) => {
      const patch: Partial<typeof s> = { coins: s.coins + coinReward };
      if (isEvent) {
        patch.bonusStars = s.bonusStars + stars;
        patch.eventWeek = weekStr();
        patch.eventDone = true;
      } else {
        patch.levelStars = { ...s.levelStars, [level.id]: Math.max(s.levelStars[level.id] ?? 0, stars) };
      }
      if (!s.helperClaimed) patch.helperProgress = s.helperProgress + 1;
      return patch;
    });
    onExit({ won: true, stars, coins: coinReward });
  };

  const retry = () => {
    if (!spendLife()) return;
    onExit('retry');
  };

  const extraMoves = (via: 'gems' | 'ad') => {
    if (via === 'gems') {
      if (save.gems < 9) return;
      update((s) => ({ gems: s.gems - 9 }));
    }
    endedRef.current = false;
    movesRef.current += 5; setMoves(movesRef.current);
    setPhase('play');
    setShowAd(false);
  };

  // ---------- render helpers ----------
  const goalIcon = (gp: GoalProgress) => {
    const g = gp.goal;
    if (g.type === 'collect') return TILE_STYLE[g.color].icon;
    if (g.type === 'crate') return '📦';
    if (g.type === 'ice') return '❄️';
    return '⛓️';
  };

  const tilePct = { w: 100 / cols, h: 100 / rows };

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-orange-200 via-amber-100 to-emerald-100">
      {/* HUD */}
      <div className="flex items-center justify-between px-3 pt-3">
        <button onClick={() => onExit(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/25 text-white active:scale-95">✕</button>
        <div className="rounded-2xl bg-white/70 px-4 py-1 text-center shadow">
          <div className="text-[10px] font-bold uppercase tracking-wide text-stone-500">Moves</div>
          <div className={`text-xl font-black leading-none ${moves <= 5 ? 'text-rose-600' : 'text-stone-800'}`}>{moves}</div>
        </div>
        <div className="rounded-2xl bg-white/70 px-3 py-1 text-center shadow">
          <div className="text-[10px] font-bold uppercase tracking-wide text-stone-500">Score</div>
          <div className="text-sm font-black leading-tight text-stone-800">{score.toLocaleString()}</div>
        </div>
      </div>

      {/* star progress */}
      <div className="mx-4 mt-2">
        <div className="relative h-3 overflow-hidden rounded-full bg-white/60 shadow-inner">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500" style={{ width: `${Math.min(100, (score / level.starScores[2]) * 100)}%` }} />
          {level.starScores.map((s, i) => (
            <span key={i} className="absolute -top-1 text-xs" style={{ left: `calc(${(s / level.starScores[2]) * 100}% - 7px)` }}>
              <span className={score >= s ? '' : 'opacity-40 grayscale'}>⭐</span>
            </span>
          ))}
        </div>
      </div>

      {/* goals */}
      <div className="mt-2 flex justify-center gap-2 px-3">
        {goals.map((gp, i) => {
          const left = gp.goal.count - gp.done;
          return (
            <div key={i} className={`flex items-center gap-1 rounded-xl px-2.5 py-1 shadow ${left <= 0 ? 'bg-emerald-200' : 'bg-white/80'}`}>
              <span className="text-lg">{goalIcon(gp)}</span>
              <span className="text-sm font-extrabold text-stone-700">{left <= 0 ? '✓' : left}</span>
            </div>
          );
        })}
      </div>

      {/* board */}
      <div className="flex flex-1 items-center justify-center p-3">
        <div
          ref={gridRef}
          className="relative w-full touch-none select-none overflow-hidden rounded-2xl border-4 border-amber-800/40 bg-amber-900/20 shadow-xl"
          style={{ maxWidth: `min(100%, calc((100dvh - 320px) * ${cols / rows}))`, aspectRatio: `${cols}/${rows}` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {/* cell backgrounds */}
          {board.map((row, r) => row.map((_cell, c) => (
            <div key={`bg${r}-${c}`} className={`absolute ${(r + c) % 2 ? 'bg-amber-100/40' : 'bg-amber-50/25'}`}
              style={{ width: `${tilePct.w}%`, height: `${tilePct.h}%`, left: `${c * tilePct.w}%`, top: `${r * tilePct.h}%` }} />
          )))}

          {/* tiles */}
          {board.flatMap((row, r) => row.map((cell, c) => {
            const t = cell.tile;
            if (!t) return null;
            const st = TILE_STYLE[t.color];
            const sel = selected && selected[0] === r && selected[1] === c;
            return (
              <div key={t.id} className="absolute p-[3%] transition-transform duration-200 ease-out"
                style={{ width: `${tilePct.w}%`, height: `${tilePct.h}%`, transform: `translate(${c * 100}%, ${r * 100}%)`, zIndex: 2 }}>
                <div className={`relative flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br ${st.bg} shadow-md ${sel ? 'ring-4 ring-white scale-110' : ''} ${t.special === 'bomb' ? '!bg-gradient-to-br !from-stone-800 !to-stone-950' : ''}`}>
                  <span className="text-[4.2cqw] leading-none" style={{ fontSize: 'min(5vw, 26px)' }}>
                    {t.special === 'bomb' ? '💥' : st.icon}
                  </span>
                  {t.special === 'stripeH' && <div className="pointer-events-none absolute inset-0 rounded-xl bg-[repeating-linear-gradient(0deg,transparent,transparent_4px,rgba(255,255,255,.75)_4px,rgba(255,255,255,.75)_7px)]" />}
                  {t.special === 'stripeV' && <div className="pointer-events-none absolute inset-0 rounded-xl bg-[repeating-linear-gradient(90deg,transparent,transparent_4px,rgba(255,255,255,.75)_4px,rgba(255,255,255,.75)_7px)]" />}
                  {t.special === 'wrap' && <div className="pointer-events-none absolute inset-[6%] rounded-lg border-[3px] border-dashed border-white/90" />}
                  {t.special === 'bomb' && <div className="pointer-events-none absolute inset-0 animate-pulse rounded-xl ring-2 ring-amber-300" />}
                  {cell.lock && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-black/25 ring-2 ring-stone-500">
                      <span className="absolute -right-1 -top-1 text-xs">⛓️</span>
                    </div>
                  )}
                </div>
              </div>
            );
          }))}

          {/* ice overlays */}
          {board.flatMap((row, r) => row.map((cell, c) => cell.ice > 0 ? (
            <div key={`ice${r}-${c}`} className="pointer-events-none absolute p-[2%]" style={{ width: `${tilePct.w}%`, height: `${tilePct.h}%`, left: `${c * tilePct.w}%`, top: `${r * tilePct.h}%`, zIndex: 3 }}>
              <div className={`h-full w-full rounded-xl border-2 border-cyan-200/90 ${cell.ice === 2 ? 'bg-cyan-200/70' : 'bg-cyan-100/45'} backdrop-blur-[1px]`}>
                <span className="absolute right-0.5 top-0 text-[10px]">❄️</span>
              </div>
            </div>
          ) : null))}

          {/* crates */}
          {board.flatMap((row, r) => row.map((cell, c) => cell.crate > 0 ? (
            <div key={`cr${r}-${c}`} className="pointer-events-none absolute p-[3%]" style={{ width: `${tilePct.w}%`, height: `${tilePct.h}%`, left: `${c * tilePct.w}%`, top: `${r * tilePct.h}%`, zIndex: 4 }}>
              <div className={`flex h-full w-full items-center justify-center rounded-lg border-2 border-amber-950/60 bg-gradient-to-br ${cell.crate === 2 ? 'from-amber-700 to-amber-900' : 'from-amber-600 to-amber-800'} shadow-inner`}>
                <span style={{ fontSize: 'min(5vw, 24px)' }}>📦</span>
                {cell.crate === 2 && <span className="absolute bottom-0.5 right-1 text-[9px] font-black text-amber-200">2</span>}
              </div>
            </div>
          ) : null))}

          {/* fx pops */}
          {fx.map((f) => (
            <div key={f.id} className="pointer-events-none absolute flex items-center justify-center" style={{ width: `${tilePct.w}%`, height: `${tilePct.h}%`, left: `${f.c * tilePct.w}%`, top: `${f.r * tilePct.h}%`, zIndex: 10 }}>
              <span className="animate-[pop_.45s_ease-out_forwards] text-xl">{f.icon}</span>
            </div>
          ))}

          {/* combo banner */}
          {banner && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
              <div className="animate-[popin_.3s_ease-out] rounded-2xl bg-black/60 px-5 py-2 text-xl font-black text-amber-300 drop-shadow-lg">{banner}</div>
            </div>
          )}
        </div>
      </div>

      {/* boosters */}
      <div className="flex justify-center gap-3 pb-4">
        {([
          { kind: 'hammer' as const, icon: '🔨', label: 'Hammer', action: () => setHammerMode((h) => !h) },
          { kind: 'moves' as const, icon: '➕', label: '+5 moves', action: boosterMoves },
          { kind: 'shuffle' as const, icon: '🔀', label: 'Shuffle', action: () => void boosterShuffle() },
        ]).map((b) => {
          const count = save.boosters[b.kind];
          return (
            <button key={b.kind} disabled={busy || phase !== 'play'}
              onClick={() => (count > 0 ? b.action() : buyBooster(b.kind))}
              className={`relative flex h-14 w-16 flex-col items-center justify-center rounded-2xl border-b-4 shadow-md transition active:translate-y-0.5 disabled:opacity-50 ${b.kind === 'hammer' && hammerMode ? 'border-rose-700 bg-rose-400 ring-2 ring-white' : 'border-amber-600 bg-gradient-to-b from-amber-200 to-amber-400'}`}>
              <span className="text-xl">{b.icon}</span>
              <span className="text-[9px] font-bold text-amber-900">{b.label}</span>
              <span className={`absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black text-white ${count > 0 ? 'bg-emerald-500' : 'bg-sky-500'}`}>
                {count > 0 ? count : '60🪙'}
              </span>
            </button>
          );
        })}
      </div>
      {hammerMode && <div className="pb-2 text-center text-xs font-bold text-rose-600">Tap any piece or crate to smash it!</div>}

      {/* intro modal */}
      {phase === 'intro' && (
        <Modal>
          <div className="text-center">
            <div className="text-xs font-bold uppercase tracking-widest text-orange-500">{isEvent ? '🔥 Newroz Event' : `Level ${level.name}`}</div>
            <h2 className="mt-1 text-xl font-black text-stone-800">{level.name}</h2>
            <div className="my-3 flex justify-center gap-2">
              {goals.map((gp, i) => (
                <div key={i} className="flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 shadow">
                  <span className="text-xl">{goalIcon(gp)}</span>
                  <span className="font-extrabold text-stone-700">{gp.goal.count}</span>
                </div>
              ))}
            </div>
            {level.intro && <p className="mb-4 rounded-xl bg-amber-100 p-3 text-sm font-medium text-amber-900">{level.intro}</p>}
            <BigButton onClick={() => setPhase('play')}>Play! ({level.moves} moves)</BigButton>
          </div>
        </Modal>
      )}

      {/* win modal */}
      {phase === 'won' && (
        <Modal>
          <div className="text-center">
            <h2 className="text-2xl font-black text-emerald-600">Level Complete!</h2>
            <div className="my-3"><StarRow count={stars} size="text-4xl" /></div>
            <div className="mb-1 text-sm font-bold text-stone-600">Score: {score.toLocaleString()}</div>
            <div className="mb-4 flex justify-center gap-3 text-sm font-extrabold">
              <span className="rounded-full bg-amber-200 px-3 py-1 text-amber-800">🪙 +{coinReward}</span>
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-yellow-700">⭐ +{stars}</span>
            </div>
            <BigButton onClick={collectWin}>Collect & Continue</BigButton>
          </div>
        </Modal>
      )}

      {/* lose modal */}
      {phase === 'lost' && (
        <Modal>
          <div className="text-center">
            <h2 className="text-2xl font-black text-rose-600">Out of moves!</h2>
            <p className="my-3 text-sm font-medium text-stone-600">Rojan was so close! Keep going with 5 extra moves?</p>
            <div className="space-y-2">
              <BigButton color="sky" disabled={save.gems < 9} onClick={() => extraMoves('gems')}>+5 moves — 💎 9 gems</BigButton>
              <BigButton color="amber" onClick={() => setShowAd(true)}>📺 Watch ad for +5 moves</BigButton>
              <BigButton color="gray" disabled={save.lives <= 0} onClick={retry}>Retry (uses ❤️ 1 life)</BigButton>
              <button onClick={() => onExit({ won: false, stars: 0, coins: 0 })} className="pt-1 text-xs font-bold text-stone-400">Give up</button>
            </div>
          </div>
        </Modal>
      )}

      {showAd && <AdModal label="+5 moves" onDone={() => extraMoves('ad')} onClose={() => setShowAd(false)} />}
    </div>
  );
}

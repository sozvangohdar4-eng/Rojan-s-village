import { LEVELS } from '../game/levels';
import { ROOMS, npcById, HELPER_TASKS } from '../data/story';
import { useGame, MAX_LIVES, LIFE_REGEN_MS } from '../state';
import { IMG } from '../assets/images';
import { Pill, Avatar } from './ui';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface Props {
  onPlayLevel: (id: string) => void;
  onOpenRoom: (id: string) => void;
  openModal: (m: string) => void;
}

function LifeTimer() {
  const { save } = useGame();
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  if (save.lives >= MAX_LIVES) return <span>Full</span>;
  const ms = Math.max(0, save.lastLifeAt + LIFE_REGEN_MS - Date.now());
  const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000);
  return <span>{m}:{s.toString().padStart(2, '0')}</span>;
}

/**
 * Level node positions along a winding path.
 * x: % of map width. y: 0 = first level (bottom), 1 = last level (top).
 * The nodes are rendered inside a "free band" between the top HUD and the
 * bottom room bar — measured live in px — so they never overlap the chrome,
 * on any phone or tablet size.
 */
const PATH = [
  { x: 50, y: 0 }, { x: 26, y: 0.11 }, { x: 18, y: 0.24 }, { x: 38, y: 0.35 },
  { x: 64, y: 0.42 }, { x: 80, y: 0.55 }, { x: 62, y: 0.67 }, { x: 36, y: 0.74 },
  { x: 24, y: 0.88 }, { x: 48, y: 1 },
];

export default function Map({ onPlayLevel, onOpenRoom, openModal }: Props) {
  const { save, starsAvailable, levelsCompleted, dailyRewardAvailable, helperNpcId, helperTaskIdx, eventAvailable } = useGame();
  const helper = npcById(helperNpcId);
  const task = HELPER_TASKS[helperTaskIdx];

  const mapRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0, top: 164, bot: 132 });

  useLayoutEffect(() => {
    const measure = () => {
      const el = mapRef.current;
      if (!el) return;
      const hudH = hudRef.current?.offsetHeight ?? 0;
      const barH = barRef.current?.offsetHeight ?? 0;
      setDims({
        w: el.clientWidth,
        h: el.clientHeight,
        // keep clear of the event / helper banners that sit ~148px from the top
        top: Math.max(hudH, 148) + 16,
        // keep clear of the room bar + the star row hanging under level 1
        bot: barH + 40,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    for (const r of [mapRef, hudRef, barRef]) if (r.current) ro.observe(r.current);
    window.addEventListener('orientationchange', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', measure);
    };
  }, []);

  const half = 30; // half of the (largest) node size + margin
  // usable height between the reserved chrome zones, inset by one node radius
  // on each side so even the outermost nodes sit fully clear of the HUD/bar
  const usableH = Math.max(140, dims.h - dims.top - dims.bot - 2 * half);
  const bandTop = dims.top + half;
  const nodeAt = (p: { x: number; y: number }) => ({
    x: (p.x / 100) * dims.w,
    y: bandTop + (1 - p.y) * usableH,
  });

  return (
    <div ref={mapRef} className="relative h-full overflow-hidden">
      <img src={IMG.village} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/30" />

      {/* top HUD */}
      <div ref={hudRef} className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-1 px-3 pt-3">
        <div className="flex flex-col items-start gap-1.5">
          <Pill icon="❤️" value={<span>{save.lives}/{MAX_LIVES} · <LifeTimer /></span>} onClick={() => openModal('lives')} />
          <Pill icon="⭐" value={starsAvailable} />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex gap-1.5">
            <Pill icon="🪙" value={save.coins} onClick={() => openModal('shop')} />
            <Pill icon="💎" value={save.gems} onClick={() => openModal('shop')} />
          </div>
          <div className="flex gap-1.5">
            <Pill icon="🎁" value="Daily" pulse={dailyRewardAvailable} onClick={() => openModal('daily')} />
            <Pill icon="🏆" value="Friends" onClick={() => openModal('leaderboard')} />
            <Pill icon="⚙️" value="" onClick={() => openModal('settings')} />
          </div>
        </div>
      </div>

      {/* Newroz event banner + daily helper (kept on one row, no overlap) */}
      <div className="absolute inset-x-3 top-24 z-20 flex items-start justify-between gap-2">
        <button onClick={() => openModal('event')}
          className={`flex min-w-0 items-center gap-1.5 rounded-2xl border-2 px-2.5 py-1.5 shadow-lg backdrop-blur-sm active:scale-95 ${eventAvailable ? 'animate-pulse border-amber-300 bg-gradient-to-r from-rose-500/90 to-orange-500/90' : 'border-white/30 bg-black/40'}`}>
          <span className="text-xl sm:text-2xl">🔥</span>
          <div className="min-w-0 text-left">
            <div className="text-[9px] font-black uppercase tracking-wide text-amber-200 sm:text-[10px]">Weekly event</div>
            <div className="truncate text-[11px] font-extrabold text-white sm:text-xs">Newroz Festival</div>
          </div>
        </button>
        <button onClick={() => openModal('helper')}
          className="flex min-w-0 items-center gap-1.5 rounded-2xl border-2 border-white/40 bg-black/40 px-2 py-1.5 shadow-lg backdrop-blur-sm active:scale-95">
          <Avatar npcId={helper.id} size="sm" />
          <div className="min-w-0 text-left">
            <div className="text-[9px] font-black uppercase tracking-wide text-amber-300 sm:text-[10px]">Daily helper</div>
            <div className="truncate text-[11px] font-extrabold text-white sm:text-xs">
              {save.helperClaimed ? 'Done ✓' : `${Math.min(save.helperProgress, task.targetLevels)}/${task.targetLevels} wins`}
            </div>
          </div>
        </button>
      </div>

      {/* level path */}
      {dims.w > 0 && (
        <svg className="absolute inset-0 z-10 h-full w-full" width={dims.w} height={dims.h}>
          <polyline
            points={PATH.map((p) => { const n = nodeAt(p); return `${n.x},${n.y}`; }).join(' ')}
            fill="none" stroke="rgba(255,248,225,.75)" strokeWidth={2.5} strokeDasharray="7 7" strokeLinecap="round"
          />
        </svg>
      )}

      {LEVELS.map((lvl, i) => {
        const stars = save.levelStars[lvl.id] ?? 0;
        const unlocked = i === 0 || (save.levelStars[LEVELS[i - 1].id] ?? 0) > 0;
        const current = unlocked && stars === 0;
        const n = nodeAt(PATH[i]);
        return (
          <button key={lvl.id} disabled={!unlocked}
            onClick={() => onPlayLevel(lvl.id)}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: n.x, top: n.y }}>
            <div className={`relative flex h-12 w-12 items-center justify-center rounded-full border-4 text-lg font-black shadow-lg transition active:scale-90 md:h-14 md:w-14 md:text-xl ${
              !unlocked ? 'border-stone-400 bg-stone-300/80 text-stone-500'
              : current ? 'animate-bounce border-amber-200 bg-gradient-to-b from-orange-400 to-rose-500 text-white'
              : 'border-emerald-200 bg-gradient-to-b from-emerald-400 to-green-600 text-white'}`}>
              {unlocked ? i + 1 : '🔒'}
              {stars > 0 && (
                <div className="absolute -bottom-2 flex gap-px text-[9px]">
                  {[1, 2, 3].map((s) => <span key={s} className={s <= stars ? '' : 'opacity-30 grayscale'}>⭐</span>)}
                </div>
              )}
            </div>
          </button>
        );
      })}

      {/* room buttons (scroll horizontally on narrow phones instead of squishing) */}
      <div ref={barRef} className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/60 via-black/20 to-transparent px-3 pt-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {ROOMS.map((room) => {
            const unlocked = levelsCompleted >= room.unlockLevel;
            const done = room.tasks.filter((t) => save.tasksDone.includes(t.id)).length;
            return (
              <button key={room.id} disabled={!unlocked} onClick={() => onOpenRoom(room.id)}
                className={`flex min-w-[10rem] flex-1 items-center gap-2 rounded-2xl border-2 p-2 shadow-lg backdrop-blur active:scale-95 ${unlocked ? 'border-amber-200/70 bg-white/85' : 'border-white/20 bg-black/40'}`}>
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl md:h-12 md:w-12">
                  <img src={room.image} alt="" className={`h-full w-full object-cover ${unlocked ? '' : 'grayscale'}`} />
                </div>
                <div className="min-w-0 text-left">
                  <div className={`truncate text-xs font-extrabold ${unlocked ? 'text-stone-800' : 'text-white/70'}`}>{room.name}</div>
                  {unlocked ? (
                    <>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${(done / room.tasks.length) * 100}%` }} />
                      </div>
                      <div className="text-[10px] font-bold text-stone-500">{done}/{room.tasks.length} tasks</div>
                    </>
                  ) : (
                    <div className="text-[10px] font-bold text-white/60">🔒 Beat level {room.unlockLevel}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { LEVELS } from '../game/levels';
import { ROOMS, npcById, HELPER_TASKS } from '../data/story';
import { useGame, MAX_LIVES, LIFE_REGEN_MS } from '../state';
import { Pill, Avatar, StarRow } from './ui';
import { useEffect, useState } from 'react';

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

export default function Map({ onPlayLevel, onOpenRoom, openModal }: Props) {
  const { save, starsAvailable, levelsCompleted, dailyRewardAvailable, helperNpcId, helperTaskIdx, eventAvailable } = useGame();
  const helper = npcById(helperNpcId);
  const task = HELPER_TASKS[helperTaskIdx];

  // level node positions along a winding path (percent coords)
  const positions = [
    { x: 50, y: 93 }, { x: 26, y: 86 }, { x: 18, y: 77 }, { x: 38, y: 70 },
    { x: 64, y: 65 }, { x: 80, y: 57 }, { x: 62, y: 49 }, { x: 36, y: 44 },
    { x: 24, y: 35 }, { x: 48, y: 27 },
  ];

  return (
    <div className="relative h-full overflow-hidden">
      <img src="/img/village.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/30" />

      {/* top HUD */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-1 p-3 pt-4">
        <div className="flex flex-col gap-1.5">
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

      {/* Newroz event banner */}
      <button onClick={() => openModal('event')}
        className={`absolute left-3 top-24 z-20 flex items-center gap-2 rounded-2xl border-2 px-3 py-2 shadow-lg backdrop-blur-sm active:scale-95 ${eventAvailable ? 'animate-pulse border-amber-300 bg-gradient-to-r from-rose-500/90 to-orange-500/90' : 'border-white/30 bg-black/40'}`}>
        <span className="text-2xl">🔥</span>
        <div className="text-left">
          <div className="text-[10px] font-black uppercase tracking-wide text-amber-200">Weekly event</div>
          <div className="text-xs font-extrabold text-white">Newroz Festival</div>
        </div>
      </button>

      {/* daily helper */}
      <button onClick={() => openModal('helper')}
        className="absolute right-3 top-24 z-20 flex items-center gap-2 rounded-2xl border-2 border-white/40 bg-black/40 px-2.5 py-1.5 shadow-lg backdrop-blur-sm active:scale-95">
        <Avatar npcId={helper.id} size="sm" />
        <div className="text-left">
          <div className="text-[10px] font-black uppercase tracking-wide text-amber-300">Daily helper</div>
          <div className="text-xs font-extrabold text-white">
            {save.helperClaimed ? 'Done ✓' : `${Math.min(save.helperProgress, task.targetLevels)}/${task.targetLevels} wins`}
          </div>
        </div>
      </button>

      {/* level path */}
      <svg className="absolute inset-0 z-10 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={positions.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none" stroke="rgba(255,248,225,.75)" strokeWidth="1.2" strokeDasharray="2.4 1.6" strokeLinecap="round"
        />
      </svg>

      {LEVELS.map((lvl, i) => {
        const stars = save.levelStars[lvl.id] ?? 0;
        const unlocked = i === 0 || (save.levelStars[LEVELS[i - 1].id] ?? 0) > 0;
        const current = unlocked && stars === 0;
        const p = positions[i];
        return (
          <button key={lvl.id} disabled={!unlocked}
            onClick={() => onPlayLevel(lvl.id)}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            <div className={`relative flex h-12 w-12 items-center justify-center rounded-full border-4 text-lg font-black shadow-lg transition active:scale-90 ${
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

      {/* room buttons */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex gap-2 bg-gradient-to-t from-black/60 to-transparent p-3 pb-4">
        {ROOMS.map((room) => {
          const unlocked = levelsCompleted >= room.unlockLevel;
          const done = room.tasks.filter((t) => save.tasksDone.includes(t.id)).length;
          return (
            <button key={room.id} disabled={!unlocked} onClick={() => onOpenRoom(room.id)}
              className={`flex flex-1 items-center gap-2 rounded-2xl border-2 p-2 shadow-lg backdrop-blur active:scale-95 ${unlocked ? 'border-amber-200/70 bg-white/85' : 'border-white/20 bg-black/40'}`}>
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl">
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

      {/* total stars badge */}
      <div className="absolute bottom-24 left-1/2 z-10 -translate-x-1/2">
        <div className="rounded-full bg-black/40 px-4 py-1 backdrop-blur-sm">
          <StarRow count={3} size="hidden" />
          <span className="text-xs font-extrabold text-amber-200">⭐ {Object.values(save.levelStars).reduce((a, b) => a + b, 0) + save.bonusStars} stars earned</span>
        </div>
      </div>
    </div>
  );
}

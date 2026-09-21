import { useState } from 'react';
import { roomById, npcById, OPENING, DAILY_REWARDS, HELPER_TASKS, FRIEND_LEADERBOARD } from '../data/story';
import { useGame, todayStr, MAX_LIVES } from '../state';
import { IMG } from '../assets/images';
import { Avatar, BigButton, Modal, AdModal } from './ui';

// ---------- Cutscene (opening + room completions) ----------

export function Cutscene({ sceneId, onDone }: { sceneId: string; onDone: () => void }) {
  const { update } = useGame();
  const scene = sceneId === 'opening'
    ? { lines: OPENING, image: IMG.village, title: 'Coming Home' }
    : { lines: roomById(sceneId).cutscene, image: roomById(sceneId).image, title: `${roomById(sceneId).name} — Restored` };
  const [i, setI] = useState(0);
  const line = scene.lines[i];
  const isRojan = line.speaker === 'Rojan';

  const advance = () => {
    if (i < scene.lines.length - 1) setI(i + 1);
    else {
      if (sceneId !== 'opening') {
        update((s) => ({
          cutscenesSeen: [...s.cutscenesSeen, sceneId],
          gems: s.gems + 10,
          coins: s.coins + 300,
        }));
      } else {
        update((s) => ({ cutscenesSeen: [...s.cutscenesSeen, 'opening'] }));
      }
      onDone();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black" onClick={advance}>
      <div className="relative flex-1 overflow-hidden">
        <img src={scene.image} alt="" className="h-full w-full animate-[kenburns_14s_ease-in-out_infinite_alternate] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
        <div className="absolute left-0 right-0 top-8 text-center">
          <span className="rounded-full bg-black/50 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-amber-300">{scene.title}</span>
        </div>
      </div>
      <div className="relative -mt-28 px-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-sm animate-[popin_.25s_ease-out] rounded-3xl border-4 border-amber-200/80 bg-gradient-to-b from-amber-50 to-orange-100 p-4 shadow-2xl" key={i}>
          <div className="flex items-start gap-3">
            {isRojan ? (
              <img src={IMG.rojan} alt="Rojan" className="h-16 w-16 shrink-0 rounded-full object-cover shadow-md ring-2 ring-amber-300" />
            ) : (
              <Avatar npcId={npcIdFromName(line.speaker)} size="lg" />
            )}
            <div>
              <div className="text-sm font-black text-orange-700">{line.speaker}</div>
              <p className="mt-1 text-sm font-medium leading-relaxed text-stone-700">{line.text}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex gap-1">
              {scene.lines.map((_, j) => <span key={j} className={`h-1.5 w-1.5 rounded-full ${j <= i ? 'bg-orange-500' : 'bg-stone-300'}`} />)}
            </div>
            <span className="text-xs font-bold text-stone-400">tap ▸</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function npcIdFromName(name: string): string {
  const map: Record<string, string> = {
    'Xalê Ferhad': 'ferhad', 'Dayê Gulê': 'gule', 'Zîlan': 'zilan', 'Soran': 'soran',
    'Berfîn': 'berfin', 'Kawa': 'kawa', 'Şêrîn': 'sherin',
  };
  return map[name] ?? 'zilan';
}

// ---------- Daily reward ----------

export function DailyRewardModal({ onClose }: { onClose: () => void }) {
  const { save, update, dailyRewardAvailable } = useGame();
  const day = dailyRewardAvailable ? (save.loginStreak % 7) : ((save.loginStreak - 1 + 7) % 7);

  const claim = () => {
    const r = DAILY_REWARDS[save.loginStreak % 7];
    update((s) => ({
      lastLoginDay: todayStr(),
      loginStreak: s.loginStreak + 1,
      coins: s.coins + (r.coins ?? 0),
      gems: s.gems + (r.gems ?? 0),
      lives: r.lives ? MAX_LIVES : s.lives,
      boosters: r.booster ? { ...s.boosters, [r.booster]: s.boosters[r.booster] + 1 } : s.boosters,
    }));
    onClose();
  };

  return (
    <Modal onClose={onClose} wide>
      <h2 className="text-center text-xl font-black text-stone-800">🎁 Daily Gifts from the Village</h2>
      <p className="mt-1 text-center text-xs font-semibold text-stone-500">Come back every day — the villagers never forget a friend.</p>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {DAILY_REWARDS.map((r, i) => {
          const claimed = dailyRewardAvailable ? i < day : i <= day;
          const isToday = dailyRewardAvailable && i === day;
          return (
            <div key={i} className={`rounded-xl border-2 p-2 text-center ${isToday ? 'animate-pulse border-orange-400 bg-orange-100' : claimed ? 'border-emerald-200 bg-emerald-50' : 'border-stone-200 bg-white'} ${i === 6 ? 'col-span-2' : ''}`}>
              <div className="text-[9px] font-black uppercase text-stone-400">Day {i + 1}</div>
              <div className="text-lg">{claimed && !isToday ? '✅' : r.gems ? '💎' : r.booster ? (r.booster === 'hammer' ? '🔨' : r.booster === 'moves' ? '➕' : '🔀') : '🪙'}</div>
              <div className="text-[9px] font-bold text-stone-600">{r.label}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-4">
        {dailyRewardAvailable
          ? <BigButton onClick={claim}>Claim Day {day + 1} gift!</BigButton>
          : <BigButton color="gray" disabled>Come back tomorrow!</BigButton>}
      </div>
    </Modal>
  );
}

// ---------- Shop ----------

export function ShopModal({ onClose }: { onClose: () => void }) {
  const { save, update } = useGame();
  const [toast, setToast] = useState<string | null>(null);
  const say = (t: string) => { setToast(t); setTimeout(() => setToast(null), 1600); };

  return (
    <Modal onClose={onClose} wide>
      <h2 className="text-center text-xl font-black text-stone-800">🛍️ Village Market</h2>
      <div className="mt-1 text-center text-xs font-bold text-stone-500">🪙 {save.coins} · 💎 {save.gems}</div>

      <div className="mt-3 text-xs font-black uppercase tracking-wide text-orange-600">Gems (simulated IAP)</div>
      <div className="mt-1 grid grid-cols-3 gap-2">
        {[{ g: 10, p: '$0.99' }, { g: 60, p: '$4.99' }, { g: 140, p: '$9.99' }].map((pack) => (
          <button key={pack.g} onClick={() => { update((s) => ({ gems: s.gems + pack.g })); say(`Purchase simulated: +${pack.g} 💎`); }}
            className="rounded-xl border-2 border-sky-200 bg-sky-50 p-2 text-center shadow-sm active:scale-95">
            <div className="text-xl">💎</div>
            <div className="text-sm font-black text-stone-700">{pack.g}</div>
            <div className="text-[10px] font-bold text-sky-600">{pack.p}</div>
          </button>
        ))}
      </div>

      <div className="mt-3 text-xs font-black uppercase tracking-wide text-orange-600">Spend gems</div>
      <div className="mt-1 space-y-2">
        <button disabled={save.gems < 5} onClick={() => { update((s) => ({ gems: s.gems - 5, coins: s.coins + 500 })); say('+500 🪙'); }}
          className="flex w-full items-center justify-between rounded-xl border-2 border-amber-200 bg-white p-2.5 font-extrabold text-stone-700 shadow-sm active:scale-[.98] disabled:opacity-40">
          <span>🪙 500 coins</span><span className="text-sky-600">💎 5</span>
        </button>
        <button disabled={save.gems < 4} onClick={() => { update((s) => ({ gems: s.gems - 4, boosters: { hammer: s.boosters.hammer + 1, moves: s.boosters.moves + 1, shuffle: s.boosters.shuffle + 1 } })); say('Booster pack added!'); }}
          className="flex w-full items-center justify-between rounded-xl border-2 border-amber-200 bg-white p-2.5 font-extrabold text-stone-700 shadow-sm active:scale-[.98] disabled:opacity-40">
          <span>🔨➕🔀 Booster pack</span><span className="text-sky-600">💎 4</span>
        </button>
      </div>

      {toast && <div className="mt-3 rounded-xl bg-emerald-100 p-2 text-center text-sm font-extrabold text-emerald-700">{toast}</div>}
    </Modal>
  );
}

// ---------- Lives ----------

export function LivesModal({ onClose }: { onClose: () => void }) {
  const { save, update, refillLives } = useGame();
  const [ad, setAd] = useState(false);
  return (
    <>
      <Modal onClose={onClose}>
        <h2 className="text-center text-xl font-black text-stone-800">❤️ Lives</h2>
        <div className="my-3 text-center text-3xl">{'❤️'.repeat(save.lives)}{'🖤'.repeat(MAX_LIVES - save.lives)}</div>
        <p className="mb-3 text-center text-xs font-semibold text-stone-500">A life refills every 30 minutes. Each puzzle attempt costs one life.</p>
        <div className="space-y-2">
          <BigButton color="sky" disabled={save.gems < 8 || save.lives >= MAX_LIVES} onClick={() => { update((s) => ({ gems: s.gems - 8 })); refillLives(); onClose(); }}>
            Full refill — 💎 8
          </BigButton>
          <BigButton color="amber" disabled={save.lives >= MAX_LIVES} onClick={() => setAd(true)}>📺 Watch ad for +1 life</BigButton>
        </div>
      </Modal>
      {ad && <AdModal label="+1 ❤️" onDone={() => { update((s) => ({ lives: Math.min(MAX_LIVES, s.lives + 1) })); setAd(false); onClose(); }} onClose={() => setAd(false)} />}
    </>
  );
}

// ---------- Leaderboard ----------

export function LeaderboardModal({ onClose }: { onClose: () => void }) {
  const { starsEarned } = useGame();
  const rows = [...FRIEND_LEADERBOARD, { name: 'Rojan (you)', stars: starsEarned, emoji: '🌷' }]
    .sort((a, b) => b.stars - a.stars);
  return (
    <Modal onClose={onClose}>
      <h2 className="text-center text-xl font-black text-stone-800">🏆 Friends Leaderboard</h2>
      <p className="mt-1 text-center text-xs font-semibold text-stone-500">Weekly star count among friends</p>
      <div className="mt-3 space-y-1.5">
        {rows.map((r, i) => {
          const me = r.name.includes('you');
          return (
            <div key={r.name} className={`flex items-center gap-3 rounded-xl p-2 ${me ? 'border-2 border-orange-300 bg-orange-50' : 'bg-white/70'}`}>
              <span className="w-6 text-center font-black text-stone-400">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
              <span className="text-xl">{r.emoji}</span>
              <span className={`flex-1 text-sm font-extrabold ${me ? 'text-orange-700' : 'text-stone-700'}`}>{r.name}</span>
              <span className="text-sm font-black text-yellow-600">⭐ {r.stars}</span>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

// ---------- Weekly event ----------

export function EventModal({ onClose, onPlay }: { onClose: () => void; onPlay: () => void }) {
  const { save, eventAvailable } = useGame();
  const playable = eventAvailable && save.lives > 0;
  return (
    <Modal onClose={onClose}>
      <div className="text-center">
        <div className="text-4xl">🔥🌷</div>
        <h2 className="mt-1 text-xl font-black text-stone-800">Newroz Festival</h2>
        <p className="mt-2 text-sm font-medium text-stone-600">
          The spring new year approaches! Help build the festival bonfire in a special level. Big rewards: <b>🪙 +200 bonus</b> and event ⭐ stars.
        </p>
        <p className="mt-2 text-xs font-bold text-orange-600">Resets every week · one attempt rewards per week</p>
        <div className="mt-4 space-y-2">
          {eventAvailable
            ? <BigButton color="amber" disabled={!playable} onClick={onPlay}>{save.lives > 0 ? 'Play event level! (❤️ 1)' : 'No lives left'}</BigButton>
            : <BigButton color="gray" disabled>Completed — see you next week!</BigButton>}
        </div>
      </div>
    </Modal>
  );
}

// ---------- Daily helper ----------

export function HelperModal({ onClose }: { onClose: () => void }) {
  const { save, update, helperNpcId, helperTaskIdx } = useGame();
  const npc = npcById(helperNpcId);
  const task = HELPER_TASKS[helperTaskIdx];
  const done = save.helperProgress >= task.targetLevels;
  return (
    <Modal onClose={onClose}>
      <div className="flex items-center gap-3">
        <Avatar npcId={npc.id} size="lg" />
        <div>
          <div className="text-xs font-black uppercase tracking-wide text-orange-500">Today's helper</div>
          <div className="text-lg font-black text-stone-800">{npc.name}</div>
          <div className="text-xs font-semibold text-stone-500">{npc.role}</div>
        </div>
      </div>
      <p className="mt-3 rounded-xl bg-white/70 p-3 text-sm font-medium text-stone-700">
        <b>{npc.name}</b> {task.desc}
      </p>
      <div className="mt-2 text-center text-sm font-extrabold text-stone-600">
        Progress: {Math.min(save.helperProgress, task.targetLevels)}/{task.targetLevels} levels won today
      </div>
      <div className="mt-3">
        {save.helperClaimed
          ? <BigButton color="gray" disabled>Reward claimed — thank you!</BigButton>
          : done
            ? <BigButton onClick={() => { update((s) => ({ helperClaimed: true, coins: s.coins + task.rewardCoins, gems: s.gems + task.rewardGems })); onClose(); }}>
                Claim 🪙 {task.rewardCoins} + 💎 {task.rewardGems}
              </BigButton>
            : <BigButton color="gray" disabled>Win {task.targetLevels - save.helperProgress} more to claim</BigButton>}
      </div>
    </Modal>
  );
}

// ---------- Settings / cloud sync ----------

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { save, update, cloudSyncNow } = useGame();
  return (
    <Modal onClose={onClose}>
      <h2 className="text-center text-xl font-black text-stone-800">⚙️ Settings</h2>
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between rounded-xl bg-white/70 p-3">
          <div>
            <div className="text-sm font-extrabold text-stone-700">☁️ Cloud sync</div>
            <div className="text-[10px] font-semibold text-stone-400">
              {save.cloudSync ? (save.lastSyncedAt ? `Last synced ${new Date(save.lastSyncedAt).toLocaleTimeString()}` : 'Enabled') : 'Save progress across devices'}
            </div>
          </div>
          <button onClick={() => { update({ cloudSync: !save.cloudSync }); if (!save.cloudSync) cloudSyncNow(); }}
            className={`h-7 w-12 rounded-full p-1 transition ${save.cloudSync ? 'bg-emerald-500' : 'bg-stone-300'}`}>
            <span className={`block h-5 w-5 rounded-full bg-white shadow transition ${save.cloudSync ? 'translate-x-5' : ''}`} />
          </button>
        </div>
        {save.cloudSync && <BigButton color="sky" onClick={() => cloudSyncNow()}>Sync now</BigButton>}
        <BigButton color="gray" onClick={() => { localStorage.clear(); location.reload(); }}>Reset all progress</BigButton>
      </div>
      <p className="mt-3 text-center text-[10px] font-semibold text-stone-400">Rojan's Village — prototype build · progress saves automatically on this device</p>
    </Modal>
  );
}

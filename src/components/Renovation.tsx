import { useState } from 'react';
import { roomById, npcById } from '../data/story';
import type { RoomTask } from '../data/story';
import { useGame } from '../state';
import { Avatar, Modal, Pill } from './ui';

interface Props {
  roomId: string;
  onBack: () => void;
  onCutscene: (roomId: string) => void;
}

export default function Renovation({ roomId, onBack, onCutscene }: Props) {
  const { save, update, starsAvailable } = useGame();
  const room = roomById(roomId);
  const npc = npcById(room.npcId);
  const [choosing, setChoosing] = useState<RoomTask | null>(null);
  const [dialogue, setDialogue] = useState<{ npcId: string; lines: string[] } | null>(null);
  const [lineIdx, setLineIdx] = useState(0);

  const doneCount = room.tasks.filter((t) => save.tasksDone.includes(t.id)).length;
  const allDone = doneCount === room.tasks.length;

  const completeTask = (task: RoomTask, choiceId?: string) => {
    update((s) => ({
      coins: s.coins - task.costCoins,
      starsSpent: s.starsSpent + task.costStars,
      tasksDone: [...s.tasksDone, task.id],
      choices: choiceId ? { ...s.choices, [task.id]: choiceId } : s.choices,
    }));
    setChoosing(null);
    if (task.dialogue) {
      setDialogue(task.dialogue);
      setLineIdx(0);
    }
    // if this was the last task, fire cutscene after dialogue closes
  };

  const closeDialogue = () => {
    setDialogue(null);
    const nowDone = room.tasks.every((t) => save.tasksDone.includes(t.id));
    if (nowDone && !save.cutscenesSeen.includes(room.id)) onCutscene(room.id);
  };

  const startTask = (task: RoomTask) => {
    if (task.choices) setChoosing(task);
    else completeTask(task);
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-amber-100 to-orange-50">
      {/* header image */}
      <div className="relative h-52 shrink-0 overflow-hidden">
        <img src={room.image} alt={room.name} className={`h-full w-full object-cover transition-all duration-700 ${doneCount === 0 ? 'saturate-[.45] brightness-[.75]' : doneCount < room.tasks.length ? 'saturate-[.8]' : ''}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        <button onClick={onBack} className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur active:scale-95">←</button>
        <div className="absolute right-3 top-3 flex gap-1.5">
          <Pill icon="🪙" value={save.coins} />
          <Pill icon="⭐" value={starsAvailable} />
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <h2 className="text-xl font-black text-white drop-shadow">{room.name}</h2>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/30">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-400 transition-all duration-500" style={{ width: `${(doneCount / room.tasks.length) * 100}%` }} />
            </div>
            <span className="text-xs font-extrabold text-white">{doneCount}/{room.tasks.length}</span>
          </div>
        </div>
        {allDone && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="animate-[popin_.4s_ease-out] rounded-2xl bg-emerald-500/90 px-4 py-2 text-lg font-black text-white shadow-xl">✨ Fully restored! ✨</span>
          </div>
        )}
      </div>

      {/* NPC strip */}
      <div className="flex items-center gap-3 border-b border-amber-200 bg-white/70 px-4 py-2.5">
        <Avatar npcId={npc.id} />
        <div>
          <div className="text-sm font-extrabold text-stone-800">{npc.name}</div>
          <div className="text-xs font-medium text-stone-500">{npc.role}</div>
        </div>
        <div className="ml-auto text-2xl">{allDone ? '🥰' : '🙂'}</div>
      </div>

      {/* task list */}
      <div className="flex-1 space-y-2.5 overflow-y-auto p-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
        {room.tasks.map((task, i) => {
          const done = save.tasksDone.includes(task.id);
          const prevDone = i === 0 || save.tasksDone.includes(room.tasks[i - 1].id);
          const affordable = save.coins >= task.costCoins && starsAvailable >= task.costStars;
          const choice = task.choices?.find((c) => c.id === save.choices[task.id]);
          return (
            <div key={task.id} className={`rounded-2xl border-2 p-3 shadow-sm transition ${done ? 'border-emerald-200 bg-emerald-50' : prevDone ? 'border-amber-200 bg-white' : 'border-stone-200 bg-stone-100 opacity-60'}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${done ? 'bg-emerald-200' : 'bg-amber-100'}`}>
                  {done ? '✅' : prevDone ? task.icon : '🔒'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-extrabold text-stone-800">{task.name}</div>
                  {done && choice && (
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-stone-500">
                      <span className={`inline-block h-3 w-3 rounded-full ${choice.swatch}`} /> {choice.name}
                    </div>
                  )}
                  {!done && (
                    <div className="mt-0.5 flex gap-2 text-xs font-bold">
                      <span className={save.coins >= task.costCoins ? 'text-amber-600' : 'text-rose-500'}>🪙 {task.costCoins}</span>
                      <span className={starsAvailable >= task.costStars ? 'text-yellow-600' : 'text-rose-500'}>⭐ {task.costStars}</span>
                    </div>
                  )}
                </div>
                {!done && prevDone && (
                  <button
                    disabled={!affordable}
                    onClick={() => startTask(task)}
                    className="rounded-xl border-b-4 border-green-700 bg-gradient-to-b from-emerald-400 to-green-600 px-4 py-2 text-sm font-black text-white shadow active:translate-y-0.5 active:border-b-2 disabled:opacity-40">
                    {task.choices ? 'Choose' : 'Build'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {!allDone && (
          <p className="pt-1 text-center text-xs font-semibold text-stone-400">
            Earn 🪙 coins and ⭐ stars by winning puzzle levels on the village map.
          </p>
        )}
      </div>

      {/* design choice modal */}
      {choosing && (
        <Modal onClose={() => setChoosing(null)}>
          <h3 className="text-center text-lg font-black text-stone-800">{choosing.icon} {choosing.name}</h3>
          <p className="mb-3 mt-1 text-center text-xs font-semibold text-stone-500">Pick a style — this is your village now, Rojan.</p>
          <div className="space-y-2">
            {choosing.choices!.map((c) => (
              <button key={c.id} onClick={() => completeTask(choosing, c.id)}
                className="flex w-full items-center gap-3 rounded-2xl border-2 border-amber-200 bg-white p-3 shadow-sm transition active:scale-[.98]">
                <span className={`h-8 w-8 rounded-full ring-2 ring-white shadow ${c.swatch}`} />
                <span className="font-extrabold text-stone-700">{c.name}</span>
                <span className="ml-auto text-xs font-bold text-stone-400">🪙 {choosing.costCoins} · ⭐ {choosing.costStars}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* NPC dialogue */}
      {dialogue && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 pb-8" onClick={() => (lineIdx < dialogue.lines.length - 1 ? setLineIdx(lineIdx + 1) : closeDialogue())}>
          <div className="w-full max-w-sm animate-[popin_.25s_ease-out] rounded-3xl border-4 border-amber-200 bg-gradient-to-b from-amber-50 to-orange-100 p-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <Avatar npcId={dialogue.npcId} size="lg" />
              <div>
                <div className="text-sm font-black text-orange-700">{npcById(dialogue.npcId).name}</div>
                <p className="mt-1 text-sm font-medium leading-relaxed text-stone-700">{dialogue.lines[lineIdx]}</p>
              </div>
            </div>
            <div className="mt-2 text-right text-xs font-bold text-stone-400">tap to continue ▸</div>
          </div>
        </div>
      )}
    </div>
  );
}

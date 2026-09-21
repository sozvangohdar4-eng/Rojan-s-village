import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Color } from '../game/types';
import { npcById } from '../data/story';

// ---------- Tile visuals ----------

export const TILE_STYLE: Record<Color, { bg: string; icon: string; name: string }> = {
  tulip: { bg: 'from-rose-400 to-rose-600', icon: '🌷', name: 'Tulip' },
  sun: { bg: 'from-amber-300 to-amber-500', icon: '☀️', name: 'Sun' },
  leaf: { bg: 'from-emerald-400 to-emerald-600', icon: '🌿', name: 'Leaf' },
  eye: { bg: 'from-sky-400 to-blue-600', icon: '🧿', name: 'Bead' },
  grape: { bg: 'from-purple-400 to-purple-600', icon: '🍇', name: 'Grape' },
  tea: { bg: 'from-teal-400 to-teal-600', icon: '🫖', name: 'Tea' },
};

// ---------- Small bits ----------

export function Pill({ icon, value, onClick, pulse }: { icon: string; value: ReactNode; onClick?: () => void; pulse?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm ${pulse ? 'animate-pulse' : ''} ${onClick ? 'active:scale-95' : 'cursor-default'}`}
    >
      <span className="text-sm leading-none">{icon}</span>
      <span>{value}</span>
    </button>
  );
}

export function Avatar({ npcId, size = 'md' }: { npcId: string; size?: 'sm' | 'md' | 'lg' }) {
  const npc = npcById(npcId);
  const sz = size === 'sm' ? 'h-9 w-9 text-lg' : size === 'lg' ? 'h-16 w-16 text-3xl' : 'h-12 w-12 text-2xl';
  return (
    <div className={`${sz} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${npc.hue} shadow-md ring-2 ring-white/70`}>
      <span className="drop-shadow">{npc.emoji}</span>
    </div>
  );
}

export function Modal({ children, onClose, wide }: { children: ReactNode; onClose?: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`w-full ${wide ? 'max-w-md' : 'max-w-sm'} animate-[popin_.25s_ease-out] rounded-3xl border-4 border-amber-200/80 bg-gradient-to-b from-amber-50 to-orange-100 p-5 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function BigButton({ children, onClick, color = 'green', disabled }: { children: ReactNode; onClick?: () => void; color?: 'green' | 'amber' | 'sky' | 'gray'; disabled?: boolean }) {
  const colors = {
    green: 'from-emerald-500 to-green-600 border-green-700 text-white',
    amber: 'from-amber-400 to-orange-500 border-orange-600 text-white',
    sky: 'from-sky-400 to-blue-500 border-blue-600 text-white',
    gray: 'from-stone-300 to-stone-400 border-stone-500 text-stone-600',
  };
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-2xl border-b-4 bg-gradient-to-b px-4 py-3 text-base font-extrabold shadow-lg transition active:translate-y-0.5 active:border-b-2 disabled:opacity-50 ${colors[color]}`}
    >
      {children}
    </button>
  );
}

/** Simulated rewarded video ad */
export function AdModal({ onDone, onClose, label }: { onDone: () => void; onClose: () => void; label: string }) {
  const [t, setT] = useState(4);
  useEffect(() => {
    if (t <= 0) return;
    const id = setTimeout(() => setT(t - 1), 1000);
    return () => clearTimeout(id);
  }, [t]);
  return (
    <Modal>
      <div className="text-center">
        <div className="mb-3 flex h-40 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white">
          <div className="text-4xl">{t > 0 ? '📺' : '✅'}</div>
          <div className="mt-2 text-sm font-semibold opacity-80">
            {t > 0 ? `Ad playing… ${t}s` : 'Thanks for watching!'}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-widest opacity-40">simulated rewarded ad</div>
        </div>
        {t <= 0 ? (
          <BigButton color="green" onClick={onDone}>Claim: {label}</BigButton>
        ) : (
          <button onClick={onClose} className="text-xs font-semibold text-stone-400">Skip (no reward)</button>
        )}
      </div>
    </Modal>
  );
}

export function StarRow({ count, size = 'text-3xl' }: { count: number; size?: string }) {
  return (
    <div className={`flex justify-center gap-1 ${size}`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= count ? 'drop-shadow' : 'opacity-25 grayscale'}>⭐</span>
      ))}
    </div>
  );
}

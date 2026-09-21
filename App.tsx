import { useState } from 'react';
import { GameProvider, useGame } from './state';
import { getLevel, EVENT_LEVEL } from './game/levels';
import Map from './components/Map';
import Puzzle from './components/Puzzle';
import type { PuzzleExit } from './components/Puzzle';
import Renovation from './components/Renovation';
import {
  Cutscene, DailyRewardModal, ShopModal, LivesModal,
  LeaderboardModal, EventModal, HelperModal, SettingsModal,
} from './components/Overlays';
import { BigButton } from './components/ui';

type Screen =
  | { name: 'title' }
  | { name: 'map' }
  | { name: 'puzzle'; levelId: string; attempt: number }
  | { name: 'room'; roomId: string };

function Game() {
  const { save, spendLife } = useGame();
  const [screen, setScreen] = useState<Screen>({ name: 'title' });
  const [modal, setModal] = useState<string | null>(null);
  const [cutscene, setCutscene] = useState<string | null>(null);

  const startGame = () => {
    setScreen({ name: 'map' });
    if (!save.cutscenesSeen.includes('opening')) setCutscene('opening');
    else if (save.lastLoginDay !== new Date().toISOString().slice(0, 10)) setModal('daily');
  };

  const playLevel = (levelId: string) => {
    if (save.lives <= 0) { setModal('lives'); return; }
    if (!spendLife()) return;
    setScreen({ name: 'puzzle', levelId, attempt: Date.now() });
  };

  const onPuzzleExit = (result: PuzzleExit) => {
    if (screen.name !== 'puzzle') return;
    if (result === 'retry') {
      // life already spent inside puzzle — relaunch the same level fresh
      setScreen({ name: 'puzzle', levelId: screen.levelId, attempt: Date.now() });
      return;
    }
    setScreen({ name: 'map' });
  };

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col overflow-hidden bg-stone-900 font-sans shadow-2xl">
      {screen.name === 'title' && (
        <div className="relative flex h-full flex-col">
          <img src="/img/village.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
          <div className="relative z-10 mt-auto p-6 pb-12 text-center">
            <img src="/img/rojan.png" alt="Rojan" className="mx-auto mb-4 h-28 w-28 rounded-full border-4 border-amber-300 object-cover shadow-2xl" />
            <h1 className="text-4xl font-black tracking-tight text-amber-100 drop-shadow-lg">Rojan's Village</h1>
            <p className="mx-auto mt-2 max-w-[260px] text-sm font-semibold text-amber-50/85">
              Match, rebuild, and bring a mountain village back to life — one story at a time.
            </p>
            <div className="mx-auto mt-6 max-w-[240px]">
              <BigButton color="amber" onClick={startGame}>
                {Object.keys(save.levelStars).length > 0 ? 'Continue' : 'Begin the journey'}
              </BigButton>
            </div>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-amber-200/60">match-3 · renovation · story</p>
          </div>
        </div>
      )}

      {screen.name === 'map' && (
        <Map
          onPlayLevel={playLevel}
          onOpenRoom={(roomId) => setScreen({ name: 'room', roomId })}
          openModal={setModal}
        />
      )}

      {screen.name === 'puzzle' && (
        <Puzzle
          key={screen.attempt}
          level={getLevel(screen.levelId)!}
          onExit={onPuzzleExit}
        />
      )}

      {screen.name === 'room' && (
        <Renovation
          roomId={screen.roomId}
          onBack={() => setScreen({ name: 'map' })}
          onCutscene={(roomId) => setCutscene(roomId)}
        />
      )}

      {/* modals */}
      {modal === 'daily' && <DailyRewardModal onClose={() => setModal(null)} />}
      {modal === 'shop' && <ShopModal onClose={() => setModal(null)} />}
      {modal === 'lives' && <LivesModal onClose={() => setModal(null)} />}
      {modal === 'leaderboard' && <LeaderboardModal onClose={() => setModal(null)} />}
      {modal === 'settings' && <SettingsModal onClose={() => setModal(null)} />}
      {modal === 'helper' && <HelperModal onClose={() => setModal(null)} />}
      {modal === 'event' && (
        <EventModal
          onClose={() => setModal(null)}
          onPlay={() => { setModal(null); playLevel(EVENT_LEVEL.id); }}
        />
      )}

      {cutscene && <Cutscene sceneId={cutscene} onDone={() => setCutscene(null)} />}
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <Game />
    </GameProvider>
  );
}

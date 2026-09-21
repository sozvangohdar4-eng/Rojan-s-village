import { IMG } from '../assets/images';

// ---------- NPCs ----------

export interface NPC {
  id: string;
  name: string;
  role: string;
  emoji: string;
  hue: string; // tailwind gradient classes for avatar
  roomId?: string;
}

export const NPCS: NPC[] = [
  { id: 'ferhad', name: 'Xalê Ferhad', role: 'The old baker', emoji: '🍞', hue: 'from-amber-400 to-orange-600', roomId: 'bakery' },
  { id: 'gule', name: 'Dayê Gulê', role: 'Tea house keeper', emoji: '🫖', hue: 'from-sky-400 to-teal-600', roomId: 'teahouse' },
  { id: 'zilan', name: 'Zîlan', role: 'Curious schoolgirl', emoji: '🪁', hue: 'from-rose-400 to-pink-600' },
  { id: 'soran', name: 'Soran', role: 'Stone mason', emoji: '🧱', hue: 'from-stone-400 to-stone-600' },
  { id: 'berfin', name: 'Berfîn', role: 'Weaver of kilims', emoji: '🧶', hue: 'from-violet-400 to-purple-600' },
  { id: 'kawa', name: 'Kawa', role: 'Shepherd & storyteller', emoji: '🪕', hue: 'from-emerald-400 to-green-700' },
  { id: 'sherin', name: 'Şêrîn', role: 'Beekeeper', emoji: '🐝', hue: 'from-yellow-300 to-amber-500' },
];

export const npcById = (id: string) => NPCS.find((n) => n.id === id)!;

// ---------- Rooms & renovation tasks ----------

export interface TaskChoice { id: string; name: string; swatch: string; }
export interface RoomTask {
  id: string;
  name: string;
  icon: string;
  costCoins: number;
  costStars: number;
  choices?: TaskChoice[];
  dialogue?: { npcId: string; lines: string[] }; // beat unlocked when task done
}
export interface Room {
  id: string;
  name: string;
  npcId: string;
  image: string;
  unlockLevel: number; // levels completed required
  tasks: RoomTask[];
  cutscene: { speaker: string; text: string }[];
}

export const ROOMS: Room[] = [
  {
    id: 'bakery',
    name: 'The Old Bakery',
    npcId: 'ferhad',
    image: IMG.bakery,
    unlockLevel: 1,
    cutscene: [
      { speaker: 'Xalê Ferhad', text: 'Smell that? First bread from this tandoor in eleven years. Your grandmother Xezal used to stand right there, tapping her foot until I gave her the crust.' },
      { speaker: 'Rojan', text: 'She never told me she came here every morning. She never told me much about the village at all…' },
      { speaker: 'Xalê Ferhad', text: 'Xezal had her reasons for leaving, child. The night of the great storm, she took something from the old well and never looked back.' },
      { speaker: 'Rojan', text: 'The well? Then that\u2019s where I need to look next. But first — the tea house. Dayê Gulê is waiting.' },
    ],
    tasks: [
      {
        id: 'bakery-oven', name: 'Rebuild the tandoor oven', icon: '🔥', costCoins: 120, costStars: 1,
        dialogue: { npcId: 'ferhad', lines: ['Careful with the clay, Rojan! A tandoor is like a heart — crack it and the whole bakery goes cold.', 'You lay stones like Xezal kneaded dough. It runs in the family.'] },
      },
      {
        id: 'bakery-walls', name: 'Repaint the stone walls', icon: '🖌️', costCoins: 160, costStars: 1,
        choices: [
          { id: 'ochre', name: 'Warm ochre', swatch: 'bg-amber-500' },
          { id: 'terracotta', name: 'Terracotta', swatch: 'bg-orange-700' },
          { id: 'sky', name: 'Whitewash & sky blue', swatch: 'bg-sky-400' },
        ],
        dialogue: { npcId: 'ferhad', lines: ['Ha! The walls haven\u2019t looked this alive since the wedding of Soran\u2019s father.'] },
      },
      {
        id: 'bakery-shelves', name: 'Carve new bread shelves', icon: '🪵', costCoins: 200, costStars: 1,
        choices: [
          { id: 'walnut', name: 'Dark walnut', swatch: 'bg-amber-900' },
          { id: 'poplar', name: 'Light poplar', swatch: 'bg-amber-200' },
        ],
        dialogue: { npcId: 'ferhad', lines: ['Walnut or poplar, as long as they hold sixty loaves by sunrise. The whole village is coming, you know.'] },
      },
      {
        id: 'bakery-door', name: 'Restore the arched doorway', icon: '🚪', costCoins: 240, costStars: 2,
        dialogue: { npcId: 'ferhad', lines: ['Through that arch came three generations of hungry children. Your mother was the fastest of them all.'] },
      },
      {
        id: 'bakery-sign', name: 'Hang the old copper sign', icon: '✨', costCoins: 280, costStars: 2,
        dialogue: { npcId: 'ferhad', lines: ['I kept the sign under my bed all these years. I always knew someone would come back to hang it. I hoped it would be one of Xezal\u2019s.'] },
      },
    ],
  },
  {
    id: 'teahouse',
    name: 'The Tea House',
    npcId: 'gule',
    image: IMG.teahouse,
    unlockLevel: 4,
    cutscene: [
      { speaker: 'Dayê Gulê', text: 'Sit, sit! First glass is yours, Rojan. In this çayxane, news travels faster than the samovar boils.' },
      { speaker: 'Rojan', text: 'Dayê Gulê… Ferhad said my grandmother took something from the well the night she left. Do you know what it was?' },
      { speaker: 'Dayê Gulê', text: 'A tin box. Sealed with wax. Some say letters, some say deeds to the orchard. Only Kawa saw her that night — and he only tells stories when the music hall has a roof again.' },
      { speaker: 'Rojan', text: 'Then we keep building. Room by room, story by story, until this village gives up all its secrets.' },
    ],
    tasks: [
      {
        id: 'tea-samovar', name: 'Polish the brass samovar', icon: '🫖', costCoins: 140, costStars: 1,
        dialogue: { npcId: 'gule', lines: ['This samovar outlived two kings and one bad marriage. A little polish and it will outlive us too.'] },
      },
      {
        id: 'tea-cushions', name: 'Weave new kilim cushions', icon: '🧶', costCoins: 180, costStars: 1,
        choices: [
          { id: 'ruby', name: 'Ruby & saffron', swatch: 'bg-rose-600' },
          { id: 'indigo', name: 'Indigo & cream', swatch: 'bg-indigo-600' },
          { id: 'meadow', name: 'Meadow green', swatch: 'bg-emerald-600' },
        ],
        dialogue: { npcId: 'gule', lines: ['Berfîn wove patterns like these for your grandmother\u2019s dowry. She remembers every knot.'] },
      },
      {
        id: 'tea-windows', name: 'Repair the arched windows', icon: '🪟', costCoins: 220, costStars: 1,
        dialogue: { npcId: 'gule', lines: ['Now the mountain can watch us gossip again. It has missed eleven years of scandal!'] },
      },
      {
        id: 'tea-lamps', name: 'Hang the oil lamps', icon: '🏮', costCoins: 260, costStars: 2,
        choices: [
          { id: 'brass', name: 'Brass lanterns', swatch: 'bg-yellow-600' },
          { id: 'glass', name: 'Coloured glass', swatch: 'bg-cyan-500' },
        ],
        dialogue: { npcId: 'gule', lines: ['In lamplight, even Soran\u2019s grumbling sounds like poetry.'] },
      },
      {
        id: 'tea-garden', name: 'Plant the courtyard garden', icon: '🌷', costCoins: 300, costStars: 2,
        dialogue: { npcId: 'gule', lines: ['Tulips by the door, mint by the step — exactly how Xezal planted it in 1974. I watched you do it and my heart forgot to beat.'] },
      },
    ],
  },
];

export const roomById = (id: string) => ROOMS.find((r) => r.id === id)!;

// ---------- Opening scene ----------

export const OPENING = [
  { speaker: 'Rojan', text: 'Eleven years abroad, three degrees in architecture… and the key to grandmother Xezal\u2019s house still fits like it was yesterday.' },
  { speaker: 'Rojan', text: 'The village is so quiet. Broken roofs, an empty bakery, the tea house boarded up. But the mountains — the mountains are exactly the same.' },
  { speaker: 'Zîlan', text: 'You\u2019re HER, aren\u2019t you? Xezal\u2019s granddaughter! Xalê Ferhad said an architect was coming. Can you REALLY fix the whole village?' },
  { speaker: 'Rojan', text: 'One room at a time, little one. One room at a time. Let\u2019s start where every village begins — with bread.' },
];

// ---------- Daily rewards, helper, leaderboard ----------

export interface DailyReward { label: string; coins?: number; gems?: number; lives?: number; booster?: 'hammer' | 'moves' | 'shuffle'; }

export const DAILY_REWARDS: DailyReward[] = [
  { label: '100 coins', coins: 100 },
  { label: '1 hammer', booster: 'hammer' },
  { label: '150 coins', coins: 150 },
  { label: '2 gems', gems: 2 },
  { label: '+5 moves booster', booster: 'moves' },
  { label: '250 coins', coins: 250 },
  { label: '5 gems + full lives', gems: 5, lives: 5 },
];

export interface HelperTask { desc: string; targetLevels: number; rewardCoins: number; rewardGems: number; }

export const HELPER_TASKS: HelperTask[] = [
  { desc: 'needs firewood carried up the hill. Win 1 level to help out!', targetLevels: 1, rewardCoins: 80, rewardGems: 1 },
  { desc: 'is fixing a fence before dark. Win 2 levels to lend a hand!', targetLevels: 2, rewardCoins: 150, rewardGems: 2 },
  { desc: 'lost a lamb near the spring. Win 1 level to help search!', targetLevels: 1, rewardCoins: 100, rewardGems: 1 },
  { desc: 'is drying herbs for winter. Win 2 levels to help gather!', targetLevels: 2, rewardCoins: 160, rewardGems: 2 },
];

export const FRIEND_LEADERBOARD = [
  { name: 'Dilan', stars: 21, emoji: '🦅' },
  { name: 'Aram', stars: 17, emoji: '🐎' },
  { name: 'Rojda', stars: 14, emoji: '🌙' },
  { name: 'Hêlîn', stars: 9, emoji: '🕊️' },
  { name: 'Baran', stars: 5, emoji: '⛰️' },
];

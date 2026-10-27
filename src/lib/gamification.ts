import { EXERCISE_MAP } from '../data/exercises';
import type { Category } from '../data/types';
import type { AppState, SetLog, WorkoutLog } from './state';

// ---------------------------------------------------------------------------
// Datas

export function dayKey(d: Date | string = new Date()) {
  const date = typeof d === 'string' ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(key: string, n: number) {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + n));
}

// ---------------------------------------------------------------------------
// Níveis e estágios do mascote

export const xpToNext = (level: number) => 100 + 50 * (level - 1);

export function levelInfo(xp: number) {
  let level = 1;
  let rest = Math.max(0, Math.floor(xp));
  while (rest >= xpToNext(level)) {
    rest -= xpToNext(level);
    level++;
  }
  const needed = xpToNext(level);
  return { level, into: rest, needed, progress: rest / needed, stage: stageFor(level) };
}

export interface Stage {
  id: 'ovo' | 'pintinho' | 'frango' | 'sarado' | 'galo' | 'lendario';
  name: string;
  minLevel: number;
  blurb: string;
}

export const STAGES: Stage[] = [
  { id: 'ovo', name: 'Ovo', minLevel: 1, blurb: 'Tudo começa aqui. Algo está se mexendo aí dentro…' },
  { id: 'pintinho', name: 'Pintinho', minLevel: 3, blurb: 'Saiu da casca! Pequeno, mas cheio de vontade.' },
  { id: 'frango', name: 'Frango', minLevel: 6, blurb: 'O famoso frango. Todo mundo começa assim — e você está evoluindo.' },
  { id: 'sarado', name: 'Frango Sarado', minLevel: 10, blurb: 'As penas já não escondem os músculos.' },
  { id: 'galo', name: 'Galo', minLevel: 15, blurb: 'Dono do terreiro. Acorda cedo e treina pesado.' },
  { id: 'lendario', name: 'Galo Lendário', minLevel: 22, blurb: 'Uma lenda viva da calistenia. Brilha no escuro.' },
];

export function stageFor(level: number): Stage {
  return [...STAGES].reverse().find((s) => level >= s.minLevel) ?? STAGES[0];
}

// ---------------------------------------------------------------------------
// Recompensas do treino

const DIFF_MULT = [0, 1, 1.3, 1.6, 2, 2.5];

export function setXp(set: SetLog) {
  const ex = EXERCISE_MAP[set.exerciseId];
  if (!ex) return 0;
  const units = ex.mode === 'time' ? set.value / 3 : set.value;
  return units * DIFF_MULT[ex.difficulty] * (ex.perSide ? 2 : 1) * (ex.category === 'aquecimento' || ex.category === 'alongamento' ? 0.4 : 1);
}

export function workoutRewards(sets: SetLog[], opts: { streak: number; recovery?: boolean }) {
  if (opts.recovery) return { xp: 30, corn: 8, streakBonus: 0 };
  const base = sets.reduce((s, x) => s + setXp(x), 0) + 30;
  const streakBonus = Math.min(0.5, Math.max(0, opts.streak) * 0.05);
  const xp = Math.round(base * (1 + streakBonus));
  return { xp, corn: 5 + Math.floor(xp / 15), streakBonus };
}

// ---------------------------------------------------------------------------
// Sequência (streak)

export function activeDays(state: Pick<AppState, 'history' | 'frozenDays'>) {
  return new Set([...state.history.map((h) => dayKey(h.date)), ...state.frozenDays]);
}

export function currentStreak(state: Pick<AppState, 'history' | 'frozenDays'>, today = dayKey()) {
  const days = activeDays(state);
  let cursor = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(cursor)) {
    n++;
    cursor = addDays(cursor, -1);
  }
  return n;
}

export function bestStreak(state: Pick<AppState, 'history' | 'frozenDays'>) {
  const days = [...activeDays(state)].sort();
  let best = 0;
  let run = 0;
  let prev = '';
  for (const d of days) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/**
 * Se a pessoa faltou e tem Ovos Protetores suficientes para cobrir todos os
 * dias perdidos, eles são usados automaticamente e a sequência é salva.
 */
export function applyFreezes(state: AppState, today = dayKey()): AppState {
  if (state.freezes <= 0 || state.history.length === 0) return state;
  const days = activeDays(state);
  const yesterday = addDays(today, -1);
  if (days.has(yesterday) || days.has(today)) return state;
  const missing: string[] = [];
  let cursor = yesterday;
  while (!days.has(cursor) && missing.length <= state.freezes) {
    missing.push(cursor);
    cursor = addDays(cursor, -1);
  }
  if (missing.length > state.freezes || !days.has(cursor)) return state;
  return { ...state, freezes: state.freezes - missing.length, frozenDays: [...state.frozenDays, ...missing] };
}

export function weekProgress(state: Pick<AppState, 'history'>, today = new Date()) {
  const start = new Date(today);
  const dow = (start.getDay() + 6) % 7; // segunda = 0
  start.setDate(start.getDate() - dow);
  const keys = new Set<string>();
  for (const h of state.history) {
    if (h.recovery) continue;
    const d = new Date(h.date);
    if (d >= new Date(start.getFullYear(), start.getMonth(), start.getDate())) keys.add(dayKey(d));
  }
  return keys.size;
}

// ---------------------------------------------------------------------------
// Totais (para missões e conquistas)

export function categoryReps(sets: SetLog[], cat: Category) {
  return sets.reduce((s, x) => {
    const ex = EXERCISE_MAP[x.exerciseId];
    return ex && ex.category === cat && ex.mode === 'reps' ? s + x.value * (ex.perSide ? 2 : 1) : s;
  }, 0);
}

export function holdSeconds(sets: SetLog[], cats: Category[]) {
  return sets.reduce((s, x) => {
    const ex = EXERCISE_MAP[x.exerciseId];
    return ex && cats.includes(ex.category) && ex.mode === 'time' ? s + x.value * (ex.perSide ? 2 : 1) : s;
  }, 0);
}

export function lifetimeTotals(history: WorkoutLog[]) {
  const all = history.flatMap((h) => h.sets);
  return {
    workouts: history.filter((h) => !h.recovery).length,
    recoveries: history.filter((h) => h.recovery).length,
    seconds: history.reduce((s, h) => s + h.durationSec, 0),
    push: categoryReps(all, 'empurrar'),
    pull: categoryReps(all, 'puxar'),
    legs: categoryReps(all, 'pernas'),
    core: categoryReps(all, 'core') + holdSeconds(all, ['core']),
    sets: all.length,
    distinct: new Set(all.map((s) => s.exerciseId)).size,
  };
}

// ---------------------------------------------------------------------------
// Missões diárias

export interface MissionDef {
  id: string;
  title: string;
  icon: string;
  target: number;
  /** progresso que um treino gera nessa missão */
  measure: (log: WorkoutLog, history: WorkoutLog[]) => number;
}

export const MISSION_REWARD = { xp: 40, corn: 15 };
export const MISSION_BONUS_CORN = 30;

export const MISSIONS: MissionDef[] = [
  { id: 'treino', title: 'Complete 1 treino', icon: '✅', target: 1, measure: (l) => (l.recovery ? 0 : 1) },
  { id: 'empurrar', title: 'Faça 30 repetições de empurrar', icon: '💪', target: 30, measure: (l) => categoryReps(l.sets, 'empurrar') },
  { id: 'pernas', title: 'Faça 50 repetições de pernas', icon: '🦵', target: 50, measure: (l) => categoryReps(l.sets, 'pernas') },
  { id: 'puxar', title: 'Faça 20 repetições de puxar', icon: '🪢', target: 20, measure: (l) => categoryReps(l.sets, 'puxar') },
  { id: 'isometria', title: 'Acumule 90s de isometria de core', icon: '🧱', target: 90, measure: (l) => holdSeconds(l.sets, ['core', 'habilidade']) },
  { id: 'series', title: 'Complete 15 séries', icon: '🔁', target: 15, measure: (l) => l.sets.length },
  { id: 'minutos', title: 'Treine por 15 minutos', icon: '⏱️', target: 15, measure: (l) => Math.floor(l.durationSec / 60) },
  {
    id: 'novo',
    title: 'Faça um exercício que você nunca fez',
    icon: '🆕',
    target: 1,
    measure: (l, history) => {
      const before = new Set(history.filter((h) => h.id !== l.id).flatMap((h) => h.sets.map((s) => s.exerciseId)));
      return l.sets.some((s) => !before.has(s.exerciseId)) ? 1 : 0;
    },
  },
  {
    id: 'alongar',
    title: 'Alongue-se depois de treinar',
    icon: '🧘',
    target: 1,
    measure: (l) => (l.sets.some((s) => EXERCISE_MAP[s.exerciseId]?.category === 'alongamento') ? 1 : 0),
  },
];

export const MISSION_MAP: Record<string, MissionDef> = Object.fromEntries(MISSIONS.map((m) => [m.id, m]));

function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Sempre 3 missões por dia, sorteadas de forma determinística pela data. */
export function missionsForDay(key: string) {
  const pool = MISSIONS.filter((m) => m.id !== 'treino');
  let h = hashString(key);
  const chosen: MissionDef[] = [MISSION_MAP.treino];
  for (let tries = 0; chosen.length < 3 && tries < 64; tries++) {
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0;
    const m = pool[h % pool.length];
    if (!chosen.includes(m)) chosen.push(m);
  }
  for (const m of pool) if (chosen.length < 3 && !chosen.includes(m)) chosen.push(m);
  return chosen;
}

export function ensureMissions(state: AppState, today = dayKey()): AppState {
  if (state.missions.date === today) return state;
  return {
    ...state,
    missions: {
      date: today,
      bonusClaimed: false,
      items: missionsForDay(today).map((m) => ({ id: m.id, progress: 0, claimed: false })),
    },
  };
}

// ---------------------------------------------------------------------------
// Conquistas

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  check: (s: AppState, t: ReturnType<typeof lifetimeTotals>) => boolean;
}

export const ACHIEVEMENT_CORN = 25;

const bestSet = (s: AppState, ids: string[]) => Math.max(0, ...ids.map((id) => s.records[id]?.value ?? 0));

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'primeiro-treino', name: 'Quebrou a casca', desc: 'Complete seu primeiro treino.', icon: '🐣', check: (_, t) => t.workouts >= 1 },
  { id: 'treinos-5', name: 'Pintinho dedicado', desc: 'Complete 5 treinos.', icon: '🐥', check: (_, t) => t.workouts >= 5 },
  { id: 'treinos-25', name: 'Frequentador do galinheiro', desc: 'Complete 25 treinos.', icon: '🏠', check: (_, t) => t.workouts >= 25 },
  { id: 'treinos-50', name: 'Meio século', desc: 'Complete 50 treinos.', icon: '🎖️', check: (_, t) => t.workouts >= 50 },
  { id: 'treinos-100', name: 'Centenário', desc: 'Complete 100 treinos.', icon: '💯', check: (_, t) => t.workouts >= 100 },
  { id: 'streak-3', name: 'Esquentando', desc: 'Sequência de 3 dias.', icon: '🔥', check: (s) => bestStreak(s) >= 3 },
  { id: 'streak-7', name: 'Semana perfeita', desc: 'Sequência de 7 dias.', icon: '📅', check: (s) => bestStreak(s) >= 7 },
  { id: 'streak-30', name: 'Mês de ferro', desc: 'Sequência de 30 dias.', icon: '🛡️', check: (s) => bestStreak(s) >= 30 },
  { id: 'empurrar-100', name: 'Cem empurradas', desc: '100 repetições de empurrar no total.', icon: '💪', check: (_, t) => t.push >= 100 },
  { id: 'empurrar-1000', name: 'Mil empurradas', desc: '1.000 repetições de empurrar no total.', icon: '🦾', check: (_, t) => t.push >= 1000 },
  { id: 'pernas-500', name: 'Coxa de frango', desc: '500 repetições de pernas no total.', icon: '🍗', check: (_, t) => t.legs >= 500 },
  { id: 'puxar-300', name: 'Costas largas', desc: '300 repetições de puxar no total.', icon: '🪽', check: (_, t) => t.pull >= 300 },
  { id: 'prancha-60', name: 'Tábua humana', desc: 'Segure 60s de prancha numa série.', icon: '🪵', check: (s) => bestSet(s, ['prancha']) >= 60 },
  { id: 'flexao-10', name: 'Dez de verdade', desc: '10 flexões completas numa série.', icon: '🔟', check: (s) => bestSet(s, ['flexao', 'flexao-aberta', 'flexao-diamante', 'flexao-declinada']) >= 10 },
  { id: 'primeira-barra', name: 'Primeira barra!', desc: 'Faça sua primeira barra fixa completa.', icon: '🏆', check: (s) => bestSet(s, ['barra-fixa', 'barra-supinada']) >= 1 },
  { id: 'barra-10', name: 'Rei da barra', desc: '10 barras pronadas numa série.', icon: '👑', check: (s) => bestSet(s, ['barra-fixa']) >= 10 },
  { id: 'pistola', name: 'Pistoleiro', desc: 'Um agachamento pistola completo.', icon: '🎯', check: (s) => bestSet(s, ['agachamento-pistola']) >= 1 },
  { id: 'parada', name: 'De ponta-cabeça', desc: '30s de parada de mãos na parede.', icon: '🙃', check: (s) => bestSet(s, ['parada-maos-parede']) >= 30 },
  { id: 'explorador', name: 'Explorador', desc: 'Faça 15 exercícios diferentes.', icon: '🧭', check: (_, t) => t.distinct >= 15 },
  { id: 'hora-1', name: 'Uma hora suada', desc: '1 hora de treino acumulada.', icon: '⏳', check: (_, t) => t.seconds >= 3600 },
  { id: 'hora-10', name: 'Dez horas de galinheiro', desc: '10 horas de treino acumuladas.', icon: '⌛', check: (_, t) => t.seconds >= 36000 },
  {
    id: 'madrugador',
    name: 'Galo madrugador',
    desc: 'Termine um treino antes das 7h.',
    icon: '🌅',
    check: (s) => s.history.some((h) => new Date(h.date).getHours() < 7),
  },
  {
    id: 'coruja',
    name: 'Frango coruja',
    desc: 'Termine um treino depois das 22h.',
    icon: '🦉',
    check: (s) => s.history.some((h) => new Date(h.date).getHours() >= 22),
  },
  { id: 'recuperacao', name: 'Sabedoria do descanso', desc: 'Faça uma Recuperação Ativa.', icon: '🧘', check: (_, t) => t.recoveries >= 1 },
  { id: 'formado', name: 'Formado', desc: 'Conclua um programa inteiro.', icon: '🎓', check: (s) => s.completedPrograms.length >= 1 },
  { id: 'missoes', name: 'Caçador de missões', desc: 'Complete as 3 missões de um dia.', icon: '🎯', check: (s) => s.missions.bonusClaimed },
  { id: 'teste', name: 'Conhece-te a ti mesmo', desc: 'Registre um Teste do Frangão.', icon: '📋', check: (s) => s.tests.length >= 1 },
  { id: 'estilo', name: 'Frango estiloso', desc: 'Compre seu primeiro item.', icon: '🕶️', check: (s) => s.owned.length >= 1 },
  { id: 'colecionador', name: 'Colecionador', desc: 'Tenha 6 itens no galinheiro.', icon: '🧺', check: (s) => s.owned.filter((id) => id !== 'ovo-protetor').length >= 6 },
  { id: 'pintinho', name: 'Pintinho!', desc: 'Chegue ao nível 3.', icon: '🐤', check: (s) => levelInfo(s.xp).level >= 3 },
  { id: 'frango', name: 'Virou frango', desc: 'Chegue ao nível 6.', icon: '🐔', check: (s) => levelInfo(s.xp).level >= 6 },
  { id: 'galo', name: 'Dono do terreiro', desc: 'Chegue ao nível 15.', icon: '🐓', check: (s) => levelInfo(s.xp).level >= 15 },
  { id: 'lendario', name: 'Lenda viva', desc: 'Chegue ao nível 22.', icon: '✨', check: (s) => levelInfo(s.xp).level >= 22 },
];

/** Desbloqueia conquistas novas e paga o milho de cada uma. */
export function unlockAchievements(state: AppState, now = new Date().toISOString()) {
  const totals = lifetimeTotals(state.history);
  const unlocked: AchievementDef[] = [];
  let next = state;
  // repete porque uma conquista pode liberar outra (ex.: milho → item → colecionador não, mas nível sim)
  for (let pass = 0; pass < 3; pass++) {
    const fresh = ACHIEVEMENTS.filter((a) => !next.achievements[a.id] && a.check(next, totals));
    if (fresh.length === 0) break;
    unlocked.push(...fresh);
    next = {
      ...next,
      corn: next.corn + fresh.length * ACHIEVEMENT_CORN,
      achievements: { ...next.achievements, ...Object.fromEntries(fresh.map((a) => [a.id, now])) },
    };
  }
  return { state: next, unlocked };
}

// ---------------------------------------------------------------------------
// Loja do galinheiro

export type Slot = 'head' | 'face' | 'neck' | 'back' | 'color' | 'consumable';

export interface ShopItem {
  id: string;
  name: string;
  slot: Slot;
  price: number;
  minLevel?: number;
  desc: string;
}

export const MAX_FREEZES = 3;

export const SHOP: ShopItem[] = [
  { id: 'ovo-protetor', name: 'Ovo Protetor', slot: 'consumable', price: 80, desc: `Salva sua sequência se você faltar um dia. Máx. ${MAX_FREEZES}.` },
  { id: 'faixa', name: 'Faixa de suor', slot: 'head', price: 60, desc: 'Clássica dos anos 80. Segura o suor e aumenta o estilo.' },
  { id: 'bone', name: 'Boné', slot: 'head', price: 120, desc: 'Aba reta, atitude de quem treina na rua.' },
  { id: 'palha', name: 'Chapéu de palha', slot: 'head', price: 150, desc: 'Direto da festa junina para o treino.' },
  { id: 'viking', name: 'Capacete viking', slot: 'head', price: 300, minLevel: 8, desc: 'Para os guerreiros do terreiro.' },
  { id: 'coroa', name: 'Coroa', slot: 'head', price: 600, minLevel: 15, desc: 'Só para a realeza da calistenia.' },
  { id: 'oculos', name: 'Óculos escuros', slot: 'face', price: 100, desc: 'Nem o sol nem os haters atrapalham.' },
  { id: 'apito', name: 'Apito de treinador', slot: 'neck', price: 90, desc: 'Priiii! Mais uma série!' },
  { id: 'medalha', name: 'Medalha', slot: 'neck', price: 200, minLevel: 5, desc: 'Lembrança de cada gota de suor.' },
  { id: 'corrente', name: 'Corrente de ouro', slot: 'neck', price: 280, minLevel: 6, desc: 'Brilha mais que o abdômen.' },
  { id: 'capa', name: 'Capa de herói', slot: 'back', price: 400, minLevel: 10, desc: 'Super-Frango chegou.' },
  { id: 'cor-caipira', name: 'Penas caipiras', slot: 'color', price: 150, desc: 'Plumagem ruiva de galinha de quintal.' },
  { id: 'cor-carijo', name: 'Penas carijó', slot: 'color', price: 220, desc: 'Pintadinho, cheio de personalidade.' },
  { id: 'cor-azul', name: 'Penas azuis', slot: 'color', price: 300, minLevel: 8, desc: 'Um frango raro e misterioso.' },
  { id: 'cor-dourada', name: 'Penas douradas', slot: 'color', price: 800, minLevel: 18, desc: 'Ouro puro. Para os mais dedicados.' },
];

export const SHOP_MAP: Record<string, ShopItem> = Object.fromEntries(SHOP.map((i) => [i.id, i]));

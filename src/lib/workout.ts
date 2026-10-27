import { EXERCISES, getExercise } from '../data/exercises';
import { COOLDOWN, PROGRAM_MAP, RECOVERY, WARMUP } from '../data/programs';
import type { Category, Equipment, Exercise, Program, Workout, WorkoutItem } from '../data/types';

export function programSessionCount(p: Program) {
  return p.weeks * p.perWeek;
}

/** Monta o treino número `index` (0-based) de um programa, já com a progressão da semana. */
export function buildProgramWorkout(program: Program, index: number, withWarmup = true): Workout {
  const total = programSessionCount(program);
  const i = Math.min(Math.max(index, 0), total - 1);
  const week = Math.floor(i / program.perWeek);
  const session = program.sessions[i % program.sessions.length];
  const main: WorkoutItem[] = session.items.map(({ inc = 0, ...item }) => ({
    ...item,
    target: Math.max(1, Math.round(item.target + inc * week)),
  }));
  return {
    title: session.name,
    subtitle: `${program.name} · Semana ${week + 1} · Treino ${i + 1}/${total}`,
    programId: program.id,
    sessionNumber: i,
    warmup: withWarmup ? WARMUP : [],
    main,
    cooldown: withWarmup ? COOLDOWN : [],
  };
}

export function buildProgramWorkoutById(id: string, index: number, withWarmup = true) {
  const p = PROGRAM_MAP[id];
  return p ? buildProgramWorkout(p, index, withWarmup) : null;
}

export function recoveryWorkout(): Workout {
  return {
    title: 'Recuperação Ativa',
    subtitle: '6 minutos de mobilidade — mantém sua sequência no dia de descanso',
    warmup: [],
    main: RECOVERY,
    cooldown: [],
  };
}

export function singleExerciseWorkout(ex: Exercise): Workout {
  return {
    title: ex.name,
    subtitle: 'Treino avulso',
    warmup: [],
    main: [{ exerciseId: ex.id, sets: 3, target: ex.mode === 'time' ? 30 : 10, rest: 60 }],
    cooldown: [],
  };
}

// ---------------------------------------------------------------------------
// Gerador de treino rápido

export type Focus = 'corpo' | 'empurrar' | 'puxar' | 'pernas' | 'core';

export const FOCUS_LABEL: Record<Focus, string> = {
  corpo: 'Corpo todo',
  empurrar: 'Empurrar',
  puxar: 'Puxar',
  pernas: 'Pernas',
  core: 'Core',
};

export interface GeneratorOptions {
  minutes: 10 | 20 | 30;
  focus: Focus;
  equipment: Equipment[];
  /** nível do usuário de 1 a 5 */
  level: number;
  seed: number;
}

const FOCUS_CATEGORIES: Record<Focus, Category[][]> = {
  // cada posição do treino sorteia de uma lista de categorias
  corpo: [['empurrar'], ['pernas'], ['puxar'], ['core'], ['cardio', 'pernas'], ['empurrar', 'puxar']],
  empurrar: [['empurrar'], ['empurrar'], ['core'], ['empurrar'], ['empurrar', 'habilidade'], ['core']],
  puxar: [['puxar'], ['puxar'], ['core'], ['puxar'], ['puxar'], ['core']],
  pernas: [['pernas'], ['pernas'], ['core'], ['pernas'], ['cardio'], ['pernas']],
  core: [['core'], ['core'], ['cardio'], ['core'], ['core'], ['cardio']],
};

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function isAvailable(ex: Exercise, equipment: Equipment[]) {
  return ex.equipment.every((e) => equipment.includes(e));
}

/** Alvo sugerido de reps/segundos para um exercício, dado o nível do usuário. */
export function suggestedTarget(ex: Exercise, level: number) {
  const gap = Math.max(0, level - ex.difficulty); // quanto o exercício é "fácil" para a pessoa
  if (ex.mode === 'time') return Math.min(60, 20 + gap * 10);
  const base = ex.difficulty >= 4 ? 4 : ex.difficulty === 3 ? 6 : 8;
  return Math.min(25, base + gap * 3);
}

export function generateWorkout(opts: GeneratorOptions): Workout {
  const rand = mulberry32(opts.seed);
  const slots = opts.minutes === 10 ? 3 : opts.minutes === 20 ? 4 : 6;
  const sets = opts.minutes === 10 ? 2 : 3;
  const rest = opts.minutes === 10 ? 30 : 60;
  const used = new Set<string>();
  const main: WorkoutItem[] = [];

  const pick = (cats: Category[], strict: boolean) => {
    const pool = EXERCISES.filter(
      (e) =>
        cats.includes(e.category) &&
        !used.has(e.id) &&
        isAvailable(e, opts.equipment) &&
        e.difficulty <= opts.level + (strict ? 0 : 1) &&
        e.difficulty >= opts.level - (strict ? 2 : 4),
    );
    return pool.length ? pool[Math.floor(rand() * pool.length)] : undefined;
  };

  for (const cats of FOCUS_CATEGORIES[opts.focus].slice(0, slots)) {
    const ex = pick(cats, true) ?? pick(cats, false);
    if (!ex) continue;
    used.add(ex.id);
    main.push({ exerciseId: ex.id, sets, target: suggestedTarget(ex, opts.level), rest });
  }

  return {
    title: `Treino rápido · ${FOCUS_LABEL[opts.focus]}`,
    subtitle: `${opts.minutes} min · gerado para você`,
    warmup: opts.minutes === 10 ? WARMUP.slice(0, 2) : WARMUP,
    main,
    cooldown: opts.minutes === 10 ? COOLDOWN.slice(0, 2) : COOLDOWN,
  };
}

// ---------------------------------------------------------------------------
// Passos do player

export type Phase = 'warmup' | 'main' | 'cooldown';

export interface ExerciseStep {
  kind: 'exercise';
  phase: Phase;
  exerciseId: string;
  set: number;
  sets: number;
  target: number;
  itemIndex: number;
}

export interface RestStep {
  kind: 'rest';
  phase: Phase;
  seconds: number;
  nextExerciseId: string | null;
}

export type Step = ExerciseStep | RestStep;

export function workoutSteps(w: Workout): Step[] {
  const steps: Step[] = [];
  const phases: [Phase, WorkoutItem[]][] = [
    ['warmup', w.warmup],
    ['main', w.main],
    ['cooldown', w.cooldown],
  ];
  const flat = phases.flatMap(([phase, items]) => items.map((item, itemIndex) => ({ phase, item, itemIndex })));
  flat.forEach(({ phase, item, itemIndex }, fi) => {
    for (let s = 1; s <= item.sets; s++) {
      steps.push({ kind: 'exercise', phase, exerciseId: item.exerciseId, set: s, sets: item.sets, target: item.target, itemIndex });
      const isLastOverall = fi === flat.length - 1 && s === item.sets;
      if (!isLastOverall && item.rest > 0) {
        const next = s < item.sets ? item.exerciseId : flat[fi + 1]?.item.exerciseId ?? null;
        steps.push({ kind: 'rest', phase, seconds: item.rest, nextExerciseId: next });
      }
    }
  });
  return steps;
}

/** Duração estimada em minutos (3s por repetição). */
export function estimateMinutes(w: Workout) {
  let sec = 0;
  for (const item of [...w.warmup, ...w.main, ...w.cooldown]) {
    const ex = getExercise(item.exerciseId);
    const work = ex.mode === 'time' ? item.target : item.target * 3;
    sec += (work * (ex.perSide ? 2 : 1) + item.rest) * item.sets;
  }
  return Math.max(1, Math.round(sec / 60));
}

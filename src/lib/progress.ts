import { EXERCISE_MAP } from '../data/exercises';
import { PROGRAM_MAP } from '../data/programs';
import {
  MISSION_MAP,
  currentStreak,
  dayKey,
  ensureMissions,
  levelInfo,
  unlockAchievements,
  workoutRewards,
  type AchievementDef,
} from './gamification';
import type { AppState, SetLog, WorkoutLog } from './state';
import { programSessionCount } from './workout';

export interface FinishInput {
  title: string;
  programId?: string;
  sessionNumber?: number;
  recovery?: boolean;
  durationSec: number;
  sets: SetLog[];
  date?: Date;
}

export interface WorkoutSummary {
  log: WorkoutLog;
  xpBefore: number;
  levelBefore: number;
  levelAfter: number;
  stageChanged: boolean;
  streak: number;
  streakBonus: number;
  newRecords: SetLog[];
  unlocked: AchievementDef[];
  missionsReady: string[];
  programCompleted: boolean;
}

export function completeWorkout(prev: AppState, input: FinishInput): { state: AppState; summary: WorkoutSummary } {
  const date = input.date ?? new Date();
  const today = dayKey(date);
  let state = ensureMissions(prev, today);

  const streakBefore = currentStreak(state, today);
  const trainedToday = state.history.some((h) => dayKey(h.date) === today);
  const { xp, corn, streakBonus } = workoutRewards(input.sets, { streak: streakBefore, recovery: input.recovery });

  const log: WorkoutLog = {
    id: `${date.getTime().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    date: date.toISOString(),
    title: input.title,
    programId: input.programId,
    sessionNumber: input.sessionNumber,
    recovery: input.recovery,
    durationSec: Math.round(input.durationSec),
    sets: input.sets,
    xp,
    corn,
  };

  const levelBefore = levelInfo(state.xp);
  state = { ...state, history: [...state.history, log], xp: state.xp + xp, corn: state.corn + corn };

  // recordes pessoais (melhor série)
  const records = { ...state.records };
  const newRecords: SetLog[] = [];
  for (const s of input.sets) {
    const ex = EXERCISE_MAP[s.exerciseId];
    if (!ex || ex.category === 'aquecimento' || ex.category === 'alongamento') continue;
    const prevBest = records[s.exerciseId]?.value ?? 0;
    if (s.value > prevBest) {
      records[s.exerciseId] = { value: s.value, date: log.date };
      const already = newRecords.find((r) => r.exerciseId === s.exerciseId);
      if (already) already.value = s.value;
      else newRecords.push({ ...s });
    }
  }
  state = { ...state, records };

  // progresso no programa
  let programCompleted = false;
  if (input.programId && input.sessionNumber !== undefined) {
    const program = PROGRAM_MAP[input.programId];
    const done = state.programProgress[input.programId] ?? 0;
    if (program && input.sessionNumber === done) {
      const total = programSessionCount(program);
      const next = done + 1;
      state = { ...state, programProgress: { ...state.programProgress, [program.id]: next } };
      if (next >= total && !state.completedPrograms.includes(program.id)) {
        programCompleted = true;
        state = { ...state, completedPrograms: [...state.completedPrograms, program.id] };
      }
    }
  }

  // missões
  const missionsReady: string[] = [];
  const items = state.missions.items.map((m) => {
    const def = MISSION_MAP[m.id];
    if (!def || m.claimed) return m;
    const progress = Math.min(def.target, m.progress + def.measure(log, state.history));
    if (progress >= def.target && m.progress < def.target) missionsReady.push(m.id);
    return { ...m, progress };
  });
  state = { ...state, missions: { ...state.missions, items } };

  const { state: withAchievements, unlocked } = unlockAchievements(state, log.date);
  state = withAchievements;

  const levelAfter = levelInfo(state.xp);
  return {
    state,
    summary: {
      log,
      xpBefore: prev.xp,
      levelBefore: levelBefore.level,
      levelAfter: levelAfter.level,
      stageChanged: levelBefore.stage.id !== levelAfter.stage.id,
      streak: trainedToday ? streakBefore : streakBefore + 1,
      streakBonus,
      newRecords,
      unlocked,
      missionsReady,
      programCompleted,
    },
  };
}

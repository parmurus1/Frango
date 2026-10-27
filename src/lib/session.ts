import type { NavigateFunction } from 'react-router-dom';
import type { Workout } from '../data/types';
import { levelInfo } from './gamification';
import type { AppState } from './state';

const KEY = 'frango:workout';

/** Guarda o treino escolhido (sobrevive a um recarregamento da página) e abre o player. */
export function startWorkout(navigate: NavigateFunction, workout: Workout, opts: { recovery?: boolean } = {}) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ workout, recovery: !!opts.recovery }));
  } catch {
    // sem sessionStorage: o player ainda recebe pelo state da navegação
  }
  navigate('/treino', { state: { workout, recovery: !!opts.recovery } });
}

export function readPendingWorkout(navState: unknown): { workout: Workout; recovery: boolean } | null {
  const s = navState as { workout?: Workout; recovery?: boolean } | null;
  if (s?.workout) return { workout: s.workout, recovery: !!s.recovery };
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingWorkout() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // nada a fazer
  }
}

export function mascotProps(state: AppState) {
  const { stage } = levelInfo(state.xp);
  const { color, ...equipped } = state.equipped;
  return { stage: stage.id, color, equipped };
}

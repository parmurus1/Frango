import type { Animation } from '../lib/figure';

export type Equipment = 'cadeira' | 'mesa' | 'toalha' | 'barra';

export type Category =
  | 'aquecimento'
  | 'empurrar'
  | 'puxar'
  | 'pernas'
  | 'core'
  | 'cardio'
  | 'habilidade'
  | 'alongamento';

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export interface Exercise {
  id: string;
  name: string;
  category: Category;
  difficulty: Difficulty;
  /** vazio = não precisa de nada */
  equipment: Equipment[];
  muscles: string[];
  mode: 'reps' | 'time';
  /** feito de um lado e depois do outro */
  perSide?: boolean;
  summary: string;
  steps: string[];
  tips: string[];
  mistakes: string[];
  /** variação mais fácil / mais difícil (ids) */
  easier?: string;
  harder?: string;
  anim: Animation;
}

export interface WorkoutItem {
  exerciseId: string;
  sets: number;
  /** repetições (modo reps) ou segundos (modo time) */
  target: number;
  /** descanso depois de cada série, em segundos */
  rest: number;
}

export interface ProgramSession {
  name: string;
  focus: string;
  items: (WorkoutItem & { inc?: number })[];
}

export interface Program {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  difficulty: Difficulty;
  equipment: Equipment[];
  weeks: number;
  perWeek: number;
  minutes: number;
  sessions: ProgramSession[];
}

export interface Workout {
  title: string;
  subtitle?: string;
  programId?: string;
  sessionNumber?: number;
  warmup: WorkoutItem[];
  main: WorkoutItem[];
  cooldown: WorkoutItem[];
}

export const CATEGORY_LABEL: Record<Category, string> = {
  aquecimento: 'Aquecimento',
  empurrar: 'Empurrar',
  puxar: 'Puxar',
  pernas: 'Pernas',
  core: 'Core',
  cardio: 'Cardio',
  habilidade: 'Habilidade',
  alongamento: 'Alongamento',
};

export const CATEGORY_ICON: Record<Category, string> = {
  aquecimento: '🔥',
  empurrar: '💪',
  puxar: '🪢',
  pernas: '🦵',
  core: '🧱',
  cardio: '⚡',
  habilidade: '🤸',
  alongamento: '🧘',
};

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  cadeira: 'Cadeira firme',
  mesa: 'Mesa resistente',
  toalha: 'Toalha + porta',
  barra: 'Barra fixa',
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  1: 'Ovo',
  2: 'Pintinho',
  3: 'Frango',
  4: 'Galo',
  5: 'Galo Lendário',
};

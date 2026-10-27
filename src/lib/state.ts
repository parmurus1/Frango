import type { Equipment } from '../data/types';

export type Goal = 'comecar' | 'forca' | 'emagrecer' | 'habilidades';

export interface Profile {
  name: string;
  goal: Goal;
  /** 1 a 5, usado pelo gerador de treinos */
  level: number;
  equipment: Equipment[];
  daysPerWeek: number;
  createdAt: string;
}

export interface SetLog {
  exerciseId: string;
  /** repetições feitas ou segundos segurados */
  value: number;
}

export interface WorkoutLog {
  id: string;
  date: string; // ISO
  title: string;
  programId?: string;
  sessionNumber?: number;
  recovery?: boolean;
  durationSec: number;
  sets: SetLog[];
  xp: number;
  corn: number;
  rating?: 'facil' | 'ok' | 'dificil';
}

export interface MissionState {
  id: string;
  progress: number;
  claimed: boolean;
}

export interface FitnessTest {
  date: string;
  pushups: number;
  squats: number;
  plankSec: number;
}

export interface Settings {
  sound: boolean;
  voice: boolean;
  vibration: boolean;
  warmup: boolean;
  theme: 'auto' | 'light' | 'dark';
}

export interface AppState {
  version: 1;
  profile: Profile | null;
  xp: number;
  corn: number;
  history: WorkoutLog[];
  activeProgramId: string | null;
  /** quantos treinos de cada programa já foram concluídos */
  programProgress: Record<string, number>;
  completedPrograms: string[];
  achievements: Record<string, string>;
  missions: { date: string; items: MissionState[]; bonusClaimed: boolean };
  owned: string[];
  equipped: Partial<Record<'head' | 'face' | 'neck' | 'back' | 'color', string>>;
  freezes: number;
  /** dias (YYYY-MM-DD) salvos por um Ovo Protetor */
  frozenDays: string[];
  /** melhor série por exercício */
  records: Record<string, { value: number; date: string }>;
  tests: FitnessTest[];
  settings: Settings;
  /** última alteração feita neste aparelho (ISO), usada para sincronizar */
  updatedAt: string;
}

export const initialState = (): AppState => ({
  version: 1,
  profile: null,
  xp: 0,
  corn: 0,
  history: [],
  activeProgramId: null,
  programProgress: {},
  completedPrograms: [],
  achievements: {},
  missions: { date: '', items: [], bonusClaimed: false },
  owned: [],
  equipped: {},
  freezes: 0,
  frozenDays: [],
  records: {},
  tests: [],
  settings: { sound: true, voice: false, vibration: true, warmup: true, theme: 'auto' },
  updatedAt: '',
});

export const STORAGE_KEY = 'frango:v1';

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    return migrate(JSON.parse(raw));
  } catch {
    return initialState();
  }
}

export function saveState(s: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // armazenamento cheio ou bloqueado: o app continua funcionando na memória
  }
}

/** Garante que dados antigos ou importados tenham todos os campos. */
export function migrate(data: unknown): AppState {
  const base = initialState();
  if (!data || typeof data !== 'object') return base;
  const d = data as Partial<AppState>;
  return {
    ...base,
    ...d,
    version: 1,
    missions: { ...base.missions, ...(d.missions ?? {}) },
    settings: { ...base.settings, ...(d.settings ?? {}) },
    equipped: { ...(d.equipped ?? {}) },
    history: Array.isArray(d.history) ? d.history : [],
    owned: Array.isArray(d.owned) ? d.owned : [],
    frozenDays: Array.isArray(d.frozenDays) ? d.frozenDays : [],
    tests: Array.isArray(d.tests) ? d.tests : [],
    completedPrograms: Array.isArray(d.completedPrograms) ? d.completedPrograms : [],
  };
}

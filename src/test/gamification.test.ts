import { describe, expect, it } from 'vitest';
import { EXERCISE_MAP } from '../data/exercises';
import { PROGRAM_MAP } from '../data/programs';
import {
  addDays,
  applyFreezes,
  bestStreak,
  currentStreak,
  ensureMissions,
  levelInfo,
  missionsForDay,
  stageFor,
  workoutRewards,
  xpToNext,
} from '../lib/gamification';
import { completeWorkout } from '../lib/progress';
import { initialState, migrate, type AppState, type WorkoutLog } from '../lib/state';
import { buildProgramWorkout, generateWorkout, workoutSteps } from '../lib/workout';
import { recommendProgram } from '../pages/Onboarding';

const log = (date: string, extra: Partial<WorkoutLog> = {}): WorkoutLog => ({
  id: date,
  date: new Date(`${date}T12:00:00`).toISOString(),
  title: 't',
  durationSec: 600,
  sets: [],
  xp: 0,
  corn: 0,
  ...extra,
});

const withProfile = (s: AppState): AppState => ({
  ...s,
  profile: { name: 'Teste', goal: 'comecar', level: 1, equipment: [], daysPerWeek: 3, createdAt: '' },
});

describe('níveis', () => {
  it('começa no nível 1 como Ovo', () => {
    const info = levelInfo(0);
    expect(info.level).toBe(1);
    expect(info.stage.id).toBe('ovo');
  });

  it('sobe de nível no limite exato', () => {
    expect(levelInfo(xpToNext(1) - 1).level).toBe(1);
    expect(levelInfo(xpToNext(1)).level).toBe(2);
    expect(levelInfo(xpToNext(1) + xpToNext(2)).level).toBe(3);
  });

  it('evolui o mascote pelos estágios', () => {
    expect(stageFor(3).id).toBe('pintinho');
    expect(stageFor(6).id).toBe('frango');
    expect(stageFor(15).id).toBe('galo');
    expect(stageFor(40).id).toBe('lendario');
  });
});

describe('sequência', () => {
  it('conta dias seguidos até hoje ou ontem', () => {
    const s = { history: [log('2026-03-01'), log('2026-03-02'), log('2026-03-03')], frozenDays: [] };
    expect(currentStreak(s, '2026-03-03')).toBe(3);
    expect(currentStreak(s, '2026-03-04')).toBe(3);
    expect(currentStreak(s, '2026-03-05')).toBe(0);
  });

  it('calcula o recorde', () => {
    const s = { history: [log('2026-03-01'), log('2026-03-02'), log('2026-03-05')], frozenDays: [] };
    expect(bestStreak(s)).toBe(2);
  });

  it('usa Ovo Protetor para cobrir um dia perdido', () => {
    const s: AppState = { ...initialState(), freezes: 1, history: [log('2026-03-01'), log('2026-03-02')] };
    const next = applyFreezes(s, '2026-03-04');
    expect(next.freezes).toBe(0);
    expect(next.frozenDays).toEqual(['2026-03-03']);
    expect(currentStreak(next, '2026-03-04')).toBe(3);
  });

  it('não gasta Ovo Protetor quando não dá para salvar', () => {
    const s: AppState = { ...initialState(), freezes: 1, history: [log('2026-03-01')] };
    expect(applyFreezes(s, '2026-03-05')).toBe(s);
  });

  it('addDays atravessa meses', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('missões', () => {
  it('são 3, sem repetir, e sempre incluem treinar', () => {
    for (let i = 0; i < 60; i++) {
      const m = missionsForDay(addDays('2026-01-01', i));
      expect(m).toHaveLength(3);
      expect(new Set(m.map((x) => x.id)).size).toBe(3);
      expect(m[0].id).toBe('treino');
    }
  });

  it('são as mesmas para o mesmo dia', () => {
    expect(missionsForDay('2026-05-10').map((m) => m.id)).toEqual(missionsForDay('2026-05-10').map((m) => m.id));
  });
});

describe('recompensas', () => {
  it('exercícios mais difíceis valem mais XP', () => {
    const easy = workoutRewards([{ exerciseId: 'flexao-parede', value: 10 }], { streak: 0 });
    const hard = workoutRewards([{ exerciseId: 'flexao-diamante', value: 10 }], { streak: 0 });
    expect(hard.xp).toBeGreaterThan(easy.xp);
  });

  it('sequência dá bônus com teto de 50%', () => {
    const sets = [{ exerciseId: 'agachamento', value: 20 }];
    const base = workoutRewards(sets, { streak: 0 }).xp;
    expect(workoutRewards(sets, { streak: 4 }).xp).toBeGreaterThan(base);
    expect(workoutRewards(sets, { streak: 100 }).streakBonus).toBe(0.5);
  });
});

describe('completeWorkout', () => {
  const program = PROGRAM_MAP['do-ovo-ao-pintinho'];

  it('dá XP, milho, recordes, avança o programa e desbloqueia a primeira conquista', () => {
    const start = ensureMissions(withProfile({ ...initialState(), activeProgramId: program.id }), '2026-04-01');
    const { state, summary } = completeWorkout(start, {
      title: 'Corpo todo A',
      programId: program.id,
      sessionNumber: 0,
      durationSec: 900,
      sets: [
        { exerciseId: 'flexao-parede', value: 8 },
        { exerciseId: 'flexao-parede', value: 10 },
        { exerciseId: 'prancha', value: 20 },
      ],
      date: new Date('2026-04-01T18:00:00'),
    });
    expect(state.xp).toBeGreaterThan(0);
    expect(state.corn).toBeGreaterThan(0);
    expect(state.history).toHaveLength(1);
    expect(state.records['flexao-parede'].value).toBe(10);
    expect(state.programProgress[program.id]).toBe(1);
    expect(state.achievements['primeiro-treino']).toBeDefined();
    expect(summary.unlocked.map((a) => a.id)).toContain('primeiro-treino');
    expect(summary.newRecords.find((r) => r.exerciseId === 'flexao-parede')?.value).toBe(10);
    const treino = state.missions.items.find((m) => m.id === 'treino');
    expect(treino?.progress).toBe(1);
  });

  it('não avança o programa ao refazer um treino antigo', () => {
    const start = withProfile({ ...initialState(), programProgress: { [program.id]: 3 } });
    const { state } = completeWorkout(start, { title: 'x', programId: program.id, sessionNumber: 1, durationSec: 60, sets: [] });
    expect(state.programProgress[program.id]).toBe(3);
  });

  it('marca o programa como concluído no último treino', () => {
    const total = program.weeks * program.perWeek;
    const start = withProfile({ ...initialState(), programProgress: { [program.id]: total - 1 } });
    const { state, summary } = completeWorkout(start, {
      title: 'x',
      programId: program.id,
      sessionNumber: total - 1,
      durationSec: 60,
      sets: [],
    });
    expect(summary.programCompleted).toBe(true);
    expect(state.completedPrograms).toContain(program.id);
    expect(state.achievements['formado']).toBeDefined();
  });
});

describe('montagem de treinos', () => {
  it('aumenta o volume a cada semana', () => {
    const p = PROGRAM_MAP['do-ovo-ao-pintinho'];
    const w1 = buildProgramWorkout(p, 0);
    const w3 = buildProgramWorkout(p, p.perWeek * 2);
    expect(w3.main[0].target).toBeGreaterThan(w1.main[0].target);
  });

  it('gera passos com descanso entre as séries e sem descanso no fim', () => {
    const steps = workoutSteps({
      title: 't',
      warmup: [],
      main: [{ exerciseId: 'flexao', sets: 2, target: 10, rest: 60 }],
      cooldown: [],
    });
    expect(steps.map((s) => s.kind)).toEqual(['exercise', 'rest', 'exercise']);
  });

  it('o gerador só usa equipamento disponível', () => {
    for (let seed = 1; seed < 40; seed++) {
      for (const focus of ['corpo', 'empurrar', 'puxar', 'pernas', 'core'] as const) {
        const w = generateWorkout({ minutes: 30, focus, equipment: [], level: 3, seed });
        expect(w.main.length).toBeGreaterThan(0);
        for (const it of w.main) expect(EXERCISE_MAP[it.exerciseId].equipment).toEqual([]);
      }
    }
  });

  it('recomenda o programa de iniciante para quem nunca treinou', () => {
    expect(recommendProgram(1, ['barra'], 'forca')).toBe('do-ovo-ao-pintinho');
    expect(recommendProgram(3, ['barra'], 'forca')).toBe('rumo-a-barra');
    expect(recommendProgram(3, [], 'forca')).toBe('frango-raiz');
  });
});

describe('persistência', () => {
  it('migrate completa campos faltando de backups antigos', () => {
    const s = migrate({ xp: 50, settings: { sound: false } });
    expect(s.xp).toBe(50);
    expect(s.settings.sound).toBe(false);
    expect(s.settings.warmup).toBe(true);
    expect(s.history).toEqual([]);
  });

  it('migrate ignora lixo', () => {
    expect(migrate('lixo').xp).toBe(0);
  });
});

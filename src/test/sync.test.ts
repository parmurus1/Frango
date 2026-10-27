import { describe, expect, it } from 'vitest';
import { initialState, type AppState, type WorkoutLog } from '../lib/state';
import { mergeStates } from '../lib/sync';

const log = (id: string, date: string, xp = 100, corn = 10): WorkoutLog => ({
  id,
  date,
  title: id,
  durationSec: 600,
  sets: [],
  xp,
  corn,
});

const profile = { name: 'Murilo', goal: 'forca' as const, level: 2, equipment: [], daysPerWeek: 3, createdAt: '' };

function device(over: Partial<AppState>): AppState {
  return { ...initialState(), profile, ...over };
}

describe('mergeStates', () => {
  it('soma treinos feitos em aparelhos diferentes sem duplicar os comuns', () => {
    const shared = log('a', '2026-10-01T10:00:00Z', 100, 10);
    const phone = device({ history: [shared, log('cel', '2026-10-02T10:00:00Z', 50, 5)], xp: 150, corn: 15, updatedAt: '2026-10-02' });
    const pc = device({ history: [shared, log('pc', '2026-10-03T10:00:00Z', 70, 7)], xp: 170, corn: 17, updatedAt: '2026-10-03' });
    const m = mergeStates(phone, pc);
    expect(m.history.map((h) => h.id)).toEqual(['a', 'cel', 'pc']);
    expect(m.xp).toBe(220);
    expect(m.corn).toBe(22);
  });

  it('é estável: juntar de novo o resultado não muda nada', () => {
    const phone = device({ history: [log('cel', '2026-10-02T10:00:00Z')], xp: 100, updatedAt: '2026-10-02' });
    const pc = device({ history: [log('pc', '2026-10-03T10:00:00Z')], xp: 100, updatedAt: '2026-10-03' });
    const once = mergeStates(phone, pc);
    expect(mergeStates(once, pc)).toEqual(once);
    expect(mergeStates(phone, once)).toEqual(once);
  });

  it('aparelho novo recebe o perfil e o progresso da nuvem', () => {
    const fresh = { ...initialState(), updatedAt: '' };
    const cloud = device({ history: [log('a', '2026-10-01T10:00:00Z')], xp: 500, corn: 80, owned: ['bone'], updatedAt: '2026-10-01' });
    const m = mergeStates(fresh, cloud);
    expect(m.profile?.name).toBe('Murilo');
    expect(m.xp).toBe(500);
    expect(m.owned).toEqual(['bone']);
  });

  it('fica com o melhor de recordes, conquistas, itens e programas', () => {
    const a = device({
      records: { flexao: { value: 10, date: '2026-10-01' } },
      achievements: { 'primeiro-treino': '2026-10-01' },
      owned: ['bone'],
      programProgress: { 'frango-raiz': 4 },
      updatedAt: '2026-10-05',
    });
    const b = device({
      records: { flexao: { value: 12, date: '2026-10-04' }, prancha: { value: 60, date: '2026-10-04' } },
      achievements: { 'primeiro-treino': '2026-09-30', 'streak-3': '2026-10-03' },
      owned: ['oculos'],
      programProgress: { 'frango-raiz': 6 },
      updatedAt: '2026-10-04',
    });
    const m = mergeStates(a, b);
    expect(m.records.flexao.value).toBe(12);
    expect(m.records.prancha.value).toBe(60);
    expect(m.achievements).toEqual({ 'primeiro-treino': '2026-09-30', 'streak-3': '2026-10-03' });
    expect(m.owned.sort()).toEqual(['bone', 'oculos']);
    expect(m.programProgress['frango-raiz']).toBe(6);
  });

  it('não paga duas vezes a missão resgatada nos dois aparelhos', () => {
    const missions = { date: '2026-10-05', bonusClaimed: false, items: [{ id: 'treino', progress: 1, claimed: true }] };
    const a = device({ missions, xp: 140, updatedAt: '2026-10-05T10:00' });
    const b = device({ missions, xp: 140, updatedAt: '2026-10-05T09:00' });
    expect(mergeStates(a, b).xp).toBe(140);
  });
});

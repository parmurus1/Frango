import { describe, expect, it } from 'vitest';
import { EXERCISES, EXERCISE_MAP } from '../data/exercises';
import { COOLDOWN, PROGRAMS, RECOVERY, WARMUP } from '../data/programs';
import { BONES, buildSkeleton, dist, shoulderOf, type Pose } from '../lib/figure';

describe('biblioteca de exercícios', () => {
  it('tem ids únicos', () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
  });

  it.each(EXERCISES.map((e) => [e.id, e] as const))('%s tem conteúdo completo', (_, e) => {
    expect(e.steps.length).toBeGreaterThanOrEqual(3);
    expect(e.tips.length).toBeGreaterThanOrEqual(1);
    expect(e.mistakes.length).toBeGreaterThanOrEqual(1);
    expect(e.muscles.length).toBeGreaterThanOrEqual(1);
    expect(e.anim.frames.length).toBeGreaterThanOrEqual(1);
    if (e.easier) expect(EXERCISE_MAP[e.easier], `easier de ${e.id}`).toBeDefined();
    if (e.harder) expect(EXERCISE_MAP[e.harder], `harder de ${e.id}`).toBeDefined();
  });

  it('tem bastante opção sem equipamento em cada grupo', () => {
    const free = EXERCISES.filter((e) => e.equipment.length === 0);
    for (const cat of ['empurrar', 'puxar', 'pernas', 'core'] as const) {
      expect(free.filter((e) => e.category === cat).length, cat).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('animações', () => {
  const reach = (base: readonly [number, number], target: readonly [number, number], l1: number, l2: number) =>
    dist(base, target) - (l1 + l2);

  it.each(EXERCISES.map((e) => [e.id, e] as const))('%s: mãos e pés alcançam os alvos', (_, e) => {
    e.anim.frames.forEach((f: Pose, i) => {
      const sk = buildSkeleton(f);
      const arm = BONES.upperArm + BONES.foreArm;
      const leg = BONES.thigh + BONES.shin;
      // uma folga de 2 unidades: membros quase esticados são intencionais
      expect(reach(sk.shoulders[0], f.hand, 0, arm), `mão, frame ${i}`).toBeLessThan(2);
      expect(reach(sk.hips[0], f.foot, 0, leg), `pé, frame ${i}`).toBeLessThan(2);
      if (f.hand2) expect(reach(sk.shoulders[1], f.hand2, 0, arm), `mão 2, frame ${i}`).toBeLessThan(2);
      if (f.foot2) expect(reach(sk.hips[1], f.foot2, 0, leg), `pé 2, frame ${i}`).toBeLessThan(2);
    });
  });

  it('nenhuma pose atravessa o chão', () => {
    for (const e of EXERCISES) {
      e.anim.frames.forEach((f, i) => {
        const sk = buildSkeleton(f);
        const points = [shoulderOf(f), sk.elbow, sk.elbow2, sk.knee, sk.knee2, sk.hand, sk.foot];
        for (const p of points) expect(p[1], `${e.id} frame ${i}`).toBeLessThanOrEqual(161.5);
        expect(sk.head[1] + BONES.head, `cabeça ${e.id} frame ${i}`).toBeLessThanOrEqual(161.5);
      });
    }
  });
});

describe('programas', () => {
  it('só usam exercícios que existem', () => {
    const items = [...WARMUP, ...COOLDOWN, ...RECOVERY, ...PROGRAMS.flatMap((p) => p.sessions.flatMap((s) => s.items))];
    for (const it of items) expect(EXERCISE_MAP[it.exerciseId], it.exerciseId).toBeDefined();
  });

  it('respeitam o equipamento declarado', () => {
    for (const p of PROGRAMS) {
      for (const s of p.sessions) {
        for (const it of s.items) {
          for (const eq of EXERCISE_MAP[it.exerciseId].equipment) {
            expect(p.equipment, `${p.id} usa ${it.exerciseId}`).toContain(eq);
          }
        }
      }
    }
  });

  it('existe pelo menos um programa completo sem equipamento para iniciante', () => {
    expect(PROGRAMS.some((p) => p.equipment.length === 0 && p.difficulty === 1)).toBe(true);
  });
});

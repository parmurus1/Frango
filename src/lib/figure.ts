/**
 * Motor do boneco animado dos exercícios.
 *
 * Cada pose descreve só o essencial (quadril, ângulo do tronco e onde as mãos e
 * os pés devem ficar). Cotovelos e joelhos são resolvidos por cinemática inversa
 * de dois ossos, então o tamanho dos membros nunca muda durante a animação.
 *
 * Sistema de coordenadas: viewBox 0 0 200 170, eixo y para baixo, chão em y = 160.
 * Ângulos em graus no padrão matemático (0 = direita, 90 = para cima).
 */

export type Pt = readonly [number, number];

export const FLOOR = 160;
export const BAR_Y = 14;

export const BONES = {
  torso: 34,
  neck: 12,
  head: 8,
  upperArm: 19,
  foreArm: 17,
  thigh: 27,
  shin: 27,
} as const;

export const ARM = BONES.upperArm + BONES.foreArm;
export const LEG = BONES.thigh + BONES.shin;

export interface Pose {
  hip: Pt;
  /** direção quadril → ombro */
  torso: number;
  /** inclinação da cabeça relativa ao tronco */
  headTilt?: number;
  /** curvatura da coluna (positivo = costas arredondadas para cima) */
  arch?: number;
  hand: Pt;
  hand2?: Pt;
  foot: Pt;
  foot2?: Pt;
  /** lado da dobra do cotovelo/joelho na cinemática inversa (1 ou -1) */
  elbow?: number;
  elbow2?: number;
  knee?: number;
  knee2?: number;
  /** ângulo do pé (graus para baixo a partir da horizontal); null = não desenha */
  toe?: number | null;
  toe2?: number | null;
  /** 1 = de perfil, 0 = de frente para a tela */
  face?: 0 | 1;
  /** de perfil, mas com o rosto do outro lado do tronco (ex.: deitado de barriga para cima com a cabeça à direita) */
  flip?: boolean;
}

export type PropKind =
  | { kind: 'bar' }
  | { kind: 'chair'; x: number; flip?: boolean }
  | { kind: 'wall'; x: number }
  | { kind: 'table'; x: number }
  | { kind: 'door'; x: number }
  | { kind: 'towel'; to: Pt; from: 'hand' | 'foot' };

export interface Animation {
  frames: Pose[];
  /** duração (s) de cada transição frame[i] → frame[i+1]; a última volta ao início */
  durations?: number[];
  /** pausa (s) em cada frame */
  holds?: number[];
  props?: PropKind[];
}

export interface Skeleton {
  head: Pt;
  neck: Pt;
  shoulder: Pt;
  hip: Pt;
  shoulders: [Pt, Pt];
  hips: [Pt, Pt];
  spineCtrl: Pt;
  elbow: Pt;
  hand: Pt;
  elbow2: Pt;
  hand2: Pt;
  knee: Pt;
  foot: Pt;
  knee2: Pt;
  foot2: Pt;
  toe: Pt | null;
  toe2: Pt | null;
  headDir: number;
  beakAngle: number;
  combAngle: number;
  face: 0 | 1;
}

export const rad = (deg: number) => (deg * Math.PI) / 180;

export function polar(origin: Pt, len: number, deg: number): Pt {
  return [origin[0] + len * Math.cos(rad(deg)), origin[1] - len * Math.sin(rad(deg))];
}

export function dist(a: Pt, b: Pt) {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

/** Cinemática inversa de dois ossos. Retorna [articulação do meio, ponta]. */
export function solveLimb(base: Pt, target: Pt, l1: number, l2: number, bend: number): [Pt, Pt] {
  const dx = target[0] - base[0];
  const dy = target[1] - base[1];
  const raw = Math.hypot(dx, dy) || 0.0001;
  const d = Math.min(Math.max(raw, Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.01);
  const ux = dx / raw;
  const uy = dy / raw;
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(l1 * l1 - a * a, 0));
  const px = -uy;
  const py = ux;
  const mid: Pt = [base[0] + ux * a + px * h * bend, base[1] + uy * a + py * h * bend];
  const end: Pt = [base[0] + ux * d, base[1] + uy * d];
  return [mid, end];
}

export function shoulderOf(p: Pick<Pose, 'hip' | 'torso'>): Pt {
  return polar(p.hip, BONES.torso, p.torso);
}

export function buildSkeleton(p: Pose): Skeleton {
  const shoulder = shoulderOf(p);
  const headDir = p.torso + (p.headTilt ?? 0);
  const neck = polar(shoulder, 3, headDir);
  const head = polar(shoulder, BONES.neck, headDir);
  const arch = p.arch ?? 0;
  const mid: Pt = [(p.hip[0] + shoulder[0]) / 2, (p.hip[1] + shoulder[1]) / 2];
  // perpendicular "para cima" do tronco
  const spineCtrl = polar(mid, arch, p.torso + 90 * (Math.cos(rad(p.torso)) >= 0 ? 1 : -1));

  const face = p.face ?? 1;
  const side = p.flip ? -1 : 1;
  // de frente, braços e pernas saem de pontos afastados do eixo do corpo
  const offset = (len: number): Pt => (face === 0 ? polar([0, 0], len, p.torso + 90) : [0, 0]);
  const so = offset(8);
  const ho = offset(5);
  const sh1: Pt = [shoulder[0] + so[0], shoulder[1] + so[1]];
  const sh2: Pt = [shoulder[0] - so[0], shoulder[1] - so[1]];
  const hp1: Pt = [p.hip[0] + ho[0], p.hip[1] + ho[1]];
  const hp2: Pt = [p.hip[0] - ho[0], p.hip[1] - ho[1]];

  const [elbow, hand] = solveLimb(sh1, p.hand, BONES.upperArm, BONES.foreArm, p.elbow ?? 1);
  const [elbow2, hand2] = solveLimb(
    sh2,
    p.hand2 ?? p.hand,
    BONES.upperArm,
    BONES.foreArm,
    p.elbow2 ?? p.elbow ?? 1,
  );
  const [knee, foot] = solveLimb(hp1, p.foot, BONES.thigh, BONES.shin, p.knee ?? -1);
  const [knee2, foot2] = solveLimb(hp2, p.foot2 ?? p.foot, BONES.thigh, BONES.shin, p.knee2 ?? p.knee ?? -1);

  const toeOf = (ankle: Pt, angle: number | null | undefined): Pt | null => {
    if (face === 0 || angle === null) return null;
    const a = angle ?? 0;
    return [ankle[0] + 7 * Math.cos(rad(a)), ankle[1] + 7 * Math.sin(rad(a))];
  };

  return {
    head,
    neck,
    shoulder,
    hip: p.hip,
    shoulders: [sh1, sh2],
    hips: [hp1, hp2],
    spineCtrl,
    elbow,
    hand,
    elbow2,
    hand2,
    knee,
    foot,
    knee2,
    foot2,
    toe: toeOf(foot, p.toe),
    toe2: toeOf(foot2, p.toe2 === undefined ? p.toe : p.toe2),
    headDir,
    beakAngle: headDir - 90 * side,
    combAngle: headDir + (face ? 14 * side : 0),
    face,
  };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpPt = (a: Pt, b: Pt, t: number): Pt => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const lerpOpt = (a: number | null | undefined, b: number | null | undefined, t: number) => {
  if (a === null || b === null) return t < 0.5 ? a : b;
  return lerp(a ?? 0, b ?? 0, t);
};

export function interpolatePose(a: Pose, b: Pose, t: number): Pose {
  return {
    hip: lerpPt(a.hip, b.hip, t),
    torso: lerp(a.torso, b.torso, t),
    headTilt: lerp(a.headTilt ?? 0, b.headTilt ?? 0, t),
    arch: lerp(a.arch ?? 0, b.arch ?? 0, t),
    hand: lerpPt(a.hand, b.hand, t),
    hand2: lerpPt(a.hand2 ?? a.hand, b.hand2 ?? b.hand, t),
    foot: lerpPt(a.foot, b.foot, t),
    foot2: lerpPt(a.foot2 ?? a.foot, b.foot2 ?? b.foot, t),
    elbow: t < 0.5 ? a.elbow : b.elbow,
    elbow2: t < 0.5 ? a.elbow2 : b.elbow2,
    knee: t < 0.5 ? a.knee : b.knee,
    knee2: t < 0.5 ? a.knee2 : b.knee2,
    toe: lerpOpt(a.toe, b.toe, t),
    toe2: lerpOpt(a.toe2 === undefined ? a.toe : a.toe2, b.toe2 === undefined ? b.toe : b.toe2, t),
    face: t < 0.5 ? a.face : b.face,
    flip: t < 0.5 ? a.flip : b.flip,
  };
}

export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** Pose no instante `time` (s) de uma animação em loop. */
export function poseAt(anim: Animation, time: number): Pose {
  const { frames } = anim;
  if (frames.length === 1) {
    // isometria: respiração leve para o boneco não parecer congelado
    const f = frames[0];
    const breathe = Math.sin(time * 2.2) * 0.6;
    return { ...f, hip: [f.hip[0], f.hip[1] + breathe] };
  }
  const n = frames.length;
  const segs = frames.map((_, i) => ({
    hold: anim.holds?.[i] ?? 0.25,
    move: anim.durations?.[i] ?? 1,
  }));
  const total = segs.reduce((s, x) => s + x.hold + x.move, 0);
  let t = time % total;
  for (let i = 0; i < n; i++) {
    const { hold, move } = segs[i];
    if (t < hold) return frames[i];
    t -= hold;
    if (t < move) return interpolatePose(frames[i], frames[(i + 1) % n], easeInOut(t / move));
    t -= move;
  }
  return frames[0];
}

// ---------------------------------------------------------------------------
// Ajudantes de autoria

/** Pose em pé, de lado, olhando para a direita. */
export function standing(x = 100, extra: Partial<Pose> = {}): Pose {
  const hip: Pt = [x, FLOOR - LEG + 0.6];
  return {
    hip,
    torso: 90,
    hand: [x + 3, hip[1] + 1],
    foot: [x, FLOOR],
    ...extra,
  };
}

/**
 * Corpo em linha reta apoiado num pivô (pés ou joelhos) com o ombro a uma
 * certa altura do chão — base para flexões, pranchas e remadas.
 */
export function plank(opts: {
  pivot: Pt;
  shoulderY: number;
  /** distância pivô → quadril (perna inteira ou só a coxa) */
  lower?: number;
  /** pivô fica à esquerda (padrão) ou à direita do ombro */
  dir?: 1 | -1;
}): { hip: Pt; torso: number; shoulder: Pt; pivot: Pt } {
  const lower = opts.lower ?? LEG - 0.5;
  const dir = opts.dir ?? 1;
  const total = lower + BONES.torso;
  const rise = opts.pivot[1] - opts.shoulderY;
  const ang = Math.asin(Math.max(-1, Math.min(1, rise / total))) * (180 / Math.PI);
  const angle = dir === 1 ? ang : 180 - ang;
  const hip = polar(opts.pivot, lower, angle);
  return { hip, torso: angle, shoulder: polar(hip, BONES.torso, angle), pivot: opts.pivot };
}

/** Mesma linha reta do `plank`, mas posicionada a partir de onde o ombro deve ficar. */
export function plankAtShoulder(shoulder: Pt, opts: { pivotY?: number; lower?: number } = {}) {
  const lower = opts.lower ?? LEG - 0.5;
  const pivotY = opts.pivotY ?? FLOOR;
  const total = lower + BONES.torso;
  const rise = pivotY - shoulder[1];
  const run = Math.sqrt(Math.max(total * total - rise * rise, 0));
  return plank({ pivot: [shoulder[0] - run, pivotY], shoulderY: shoulder[1], lower });
}

/** Linha reta a partir de um pivô com ângulo fixo (ex.: corpo inclinado na parede). */
export function lineAt(pivot: Pt, angle: number, lower = LEG - 0.5) {
  const hip = polar(pivot, lower, angle);
  return { hip, torso: angle, shoulder: polar(hip, BONES.torso, angle), pivot };
}

const VIEW_RATIO = 200 / 130;

/**
 * Enquadra a animação: calcula a caixa que contém o boneco (em todos os
 * instantes) e os objetos, e devolve um viewBox com proporção fixa,
 * apoiado no chão. Assim uma flexão aparece grande, e uma barra fixa inteira.
 */
export function frameViewBox(anim: Animation): string {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = FLOOR + 3;
  const add = (x: number, y: number) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  };
  const total = anim.frames.reduce((s, _, i) => s + (anim.holds?.[i] ?? 0.25) + (anim.durations?.[i] ?? 1), 0);
  for (let i = 0; i <= 40; i++) {
    const sk = buildSkeleton(poseAt(anim, (total * i) / 40));
    for (const p of [sk.neck, sk.shoulder, sk.hip, sk.elbow, sk.hand, sk.elbow2, sk.hand2, sk.knee, sk.foot, sk.knee2, sk.foot2, sk.toe, sk.toe2]) {
      if (p) add(p[0], p[1]);
    }
    add(sk.head[0] - 12, sk.head[1] - 13);
    add(sk.head[0] + 12, sk.head[1] + 9);
  }
  for (const prop of anim.props ?? []) {
    if (prop.kind === 'bar') {
      add(40, BAR_Y - 6);
      add(160, BAR_Y + 6);
    } else if (prop.kind === 'chair') {
      add(prop.x, 90);
      add(prop.x + 34, FLOOR);
    } else if (prop.kind === 'table') {
      add(prop.x, 102);
      add(prop.x + 60, FLOOR);
    } else if (prop.kind === 'wall') {
      add(prop.x, FLOOR);
      add(prop.x + 8, FLOOR);
    } else if (prop.kind === 'door') {
      add(prop.x, FLOOR);
      add(prop.x + 5, FLOOR);
    }
  }
  const pad = 10;
  minX -= pad;
  maxX += pad;
  minY -= pad;
  let w = Math.max(maxX - minX, 110);
  let h = maxY - minY;
  const cx = (minX + maxX) / 2;
  if (w / h < VIEW_RATIO) w = h * VIEW_RATIO;
  else h = w / VIEW_RATIO;
  return `${(cx - w / 2).toFixed(1)} ${(maxY - h).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`;
}

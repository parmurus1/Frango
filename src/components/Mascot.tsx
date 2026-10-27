import type { Stage } from '../lib/gamification';

export type Mood = 'idle' | 'happy' | 'cheer' | 'flex' | 'sleep' | 'tired';

interface Props {
  stage: Stage['id'];
  mood?: Mood;
  color?: string;
  equipped?: Partial<Record<'head' | 'face' | 'neck' | 'back', string>>;
  size?: number;
  className?: string;
  title?: string;
}

interface Palette {
  body: string;
  shade: string;
  spots?: string;
}

const PALETTES: Record<string, Palette> = {
  default: { body: '#fffaf0', shade: '#eadfca' },
  'cor-caipira': { body: '#d9822b', shade: '#b4621b' },
  'cor-carijo': { body: '#8c8c8c', shade: '#6b6b6b', spots: '#f2f2f2' },
  'cor-azul': { body: '#6f9be0', shade: '#4d77bd' },
  'cor-dourada': { body: '#f6c945', shade: '#d9a520' },
};

const CHICK: Palette = { body: '#ffd84d', shade: '#f2b92a' };

interface Geo {
  head: { x: number; y: number; r: number };
  eyeDx: number;
  eyeY: number;
  eyeR: number;
  beakY: number;
  beakW: number;
  chestY: number;
}

const GEO: Record<Stage['id'], Geo> = {
  ovo: { head: { x: 100, y: 108, r: 46 }, eyeDx: 17, eyeY: 120, eyeR: 7, beakY: 134, beakW: 8, chestY: 160 },
  pintinho: { head: { x: 100, y: 118, r: 40 }, eyeDx: 17, eyeY: 124, eyeR: 7.5, beakY: 138, beakW: 9, chestY: 160 },
  frango: { head: { x: 100, y: 76, r: 30 }, eyeDx: 12, eyeY: 72, eyeR: 6, beakY: 84, beakW: 8, chestY: 132 },
  sarado: { head: { x: 100, y: 72, r: 30 }, eyeDx: 12, eyeY: 68, eyeR: 6, beakY: 80, beakW: 8, chestY: 130 },
  galo: { head: { x: 100, y: 66, r: 30 }, eyeDx: 12, eyeY: 62, eyeR: 6, beakY: 74, beakW: 9, chestY: 126 },
  lendario: { head: { x: 100, y: 66, r: 30 }, eyeDx: 12, eyeY: 62, eyeR: 6, beakY: 74, beakW: 9, chestY: 126 },
};

export function Mascot({ stage, mood = 'idle', color, equipped = {}, size = 180, className, title }: Props) {
  const g = GEO[stage];
  const pal = stage === 'pintinho' && color !== 'cor-dourada' ? CHICK : PALETTES[color ?? 'default'] ?? PALETTES.default;
  const flexing = mood === 'flex' || mood === 'cheer';

  return (
    <svg
      className={`mascot mascot-${mood} ${className ?? ''}`}
      viewBox="0 0 200 220"
      width={size}
      height={size * 1.1}
      role="img"
      aria-label={title ?? `Mascote Frango (${stage})`}
    >
      <defs>
        <radialGradient id="aura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffe27a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffe27a" stopOpacity="0" />
        </radialGradient>
        <pattern id="spots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="2.2" fill={pal.spots ?? 'transparent'} />
          <circle cx="11" cy="10" r="1.8" fill={pal.spots ?? 'transparent'} />
        </pattern>
      </defs>

      <ellipse className="mascot-shadow" cx="100" cy="212" rx="48" ry="6" />

      <g className="mascot-rig">
        {stage === 'lendario' && <circle className="mascot-aura" cx="100" cy="110" r="100" fill="url(#aura)" />}
        {equipped.back === 'capa' && stage !== 'ovo' && <Cape stage={stage} />}

        {stage === 'ovo' && <Egg pal={pal} />}
        {stage === 'pintinho' && <Chick pal={pal} flexing={flexing} />}
        {(stage === 'frango' || stage === 'sarado' || stage === 'galo' || stage === 'lendario') && (
          <Chicken stage={stage} pal={pal} flexing={flexing} />
        )}

        {stage !== 'ovo' && stage !== 'pintinho' && <Comb g={g} big={stage === 'galo' || stage === 'lendario'} />}
        {stage === 'pintinho' && <path d="M96 80 q4 -14 8 0 q6 -10 6 4" className="mascot-tuft" stroke={pal.shade} />}

        <Eyes g={g} mood={mood} fierce={stage === 'galo' || stage === 'lendario'} />
        <Beak g={g} open={mood === 'cheer' || mood === 'happy'} />
        {stage !== 'ovo' && stage !== 'pintinho' && <Wattle g={g} big={stage === 'galo' || stage === 'lendario'} />}

        {mood === 'tired' && <path className="mascot-sweat" d={`M${g.head.x + g.head.r - 4} ${g.head.y - 10} q6 10 0 14 q-6 -4 0 -14z`} />}
        {mood === 'sleep' && (
          <text className="mascot-zzz" x={g.head.x + g.head.r} y={g.head.y - g.head.r + 4}>
            z<tspan dx="2" dy="-8" fontSize="14">z</tspan>
          </text>
        )}

        <Accessories g={g} stage={stage} equipped={equipped} />
        {stage === 'lendario' && <Sparkles />}
      </g>
    </svg>
  );
}

// --------------------------------------------------------------------------- partes

function Egg({ pal }: { pal: Palette }) {
  const fill = pal === PALETTES.default ? '#fff6e5' : pal.body;
  return (
    <g>
      <path className="mascot-feet" d="M84 196 l-6 10 M84 196 l0 11 M84 196 l6 10 M116 196 l-6 10 M116 196 l0 11 M116 196 l6 10" />
      <path d="M100 52 C 142 52 156 120 154 150 C 152 186 128 204 100 204 C 72 204 48 186 46 150 C 44 120 58 52 100 52 Z" fill={fill} stroke="#e2cfa8" strokeWidth="3" />
      {pal.spots && <path d="M100 52 C 142 52 156 120 154 150 C 152 186 128 204 100 204 C 72 204 48 186 46 150 C 44 120 58 52 100 52 Z" fill="url(#spots)" />}
      <path d="M58 104 l12 8 l10 -10 l12 10 l10 -9 l12 10 l10 -9 l14 8" fill="none" stroke="#c9b48c" strokeWidth="3" strokeLinejoin="round" />
      <ellipse cx="78" cy="150" rx="9" ry="6" fill="#ffb3a7" opacity="0.6" />
      <ellipse cx="122" cy="150" rx="9" ry="6" fill="#ffb3a7" opacity="0.6" />
    </g>
  );
}

function Chick({ pal, flexing }: { pal: Palette; flexing: boolean }) {
  return (
    <g>
      <path className="mascot-feet" d="M88 190 l0 14 m0 0 l-7 4 m7 -4 l0 6 m0 -6 l7 4 M112 190 l0 14 m0 0 l-7 4 m7 -4 l0 6 m0 -6 l7 4" />
      <g className={`mascot-wing mascot-wing-l ${flexing ? 'up' : ''}`} style={{ transformOrigin: '66px 136px' }}>
        <ellipse cx="58" cy="150" rx="16" ry="22" fill={pal.shade} transform="rotate(25 58 150)" />
      </g>
      <g className={`mascot-wing mascot-wing-r ${flexing ? 'up' : ''}`} style={{ transformOrigin: '134px 136px' }}>
        <ellipse cx="142" cy="150" rx="16" ry="22" fill={pal.shade} transform="rotate(-25 142 150)" />
      </g>
      <circle cx="100" cy="135" r="58" fill={pal.body} />
      {pal.spots && <circle cx="100" cy="135" r="58" fill="url(#spots)" />}
      <ellipse cx="100" cy="166" rx="30" ry="18" fill="#fff3b0" opacity="0.6" />
      <ellipse cx="74" cy="140" rx="8" ry="5" fill="#ff9e8a" opacity="0.5" />
      <ellipse cx="126" cy="140" rx="8" ry="5" fill="#ff9e8a" opacity="0.5" />
    </g>
  );
}

function Chicken({ stage, pal, flexing }: { stage: 'frango' | 'sarado' | 'galo' | 'lendario'; pal: Palette; flexing: boolean }) {
  const buff = stage !== 'frango';
  const rooster = stage === 'galo' || stage === 'lendario';
  const bodyRx = stage === 'frango' ? 40 : buff && !rooster ? 50 : 54;
  const bodyCy = stage === 'frango' ? 150 : 146;
  const legW = stage === 'frango' ? 3.5 : 5.5;
  return (
    <g>
      {rooster && (
        <g className="mascot-tail">
          <path d="M60 140 C 20 120 18 70 40 52 C 40 90 56 110 72 124 Z" fill="#2e7d5b" />
          <path d="M62 136 C 30 110 34 70 58 58 C 52 92 64 110 78 122 Z" fill="#c0392b" />
          <path d="M66 138 C 44 116 50 86 70 76 C 64 100 72 114 84 124 Z" fill="#1f4e8c" />
        </g>
      )}
      <path
        className="mascot-feet"
        strokeWidth={legW}
        d={`M88 ${bodyCy + 40} l-2 22 m0 0 l-9 5 m9 -5 l1 7 m-1 -7 l9 4 M112 ${bodyCy + 40} l2 22 m0 0 l-9 4 m9 -4 l-1 7 m1 -7 l9 5`}
      />
      {rooster && <path d={`M86 ${bodyCy + 54} l-6 -3 M114 ${bodyCy + 54} l6 -3`} className="mascot-feet" strokeWidth="3" />}

      <Wing side="l" stage={stage} pal={pal} flexing={flexing} cy={bodyCy - 4} rx={bodyRx} />
      <Wing side="r" stage={stage} pal={pal} flexing={flexing} cy={bodyCy - 4} rx={bodyRx} />

      {/* pescoço */}
      <path d={`M84 ${bodyCy - 40} Q100 ${bodyCy - 70} 116 ${bodyCy - 40} Z`} fill={pal.body} />
      <ellipse cx="100" cy={bodyCy} rx={bodyRx} ry="48" fill={pal.body} />
      {pal.spots && <ellipse cx="100" cy={bodyCy} rx={bodyRx} ry="48" fill="url(#spots)" />}
      {buff ? (
        <g className="mascot-pecs" stroke={pal.shade} strokeWidth="3" fill="none" strokeLinecap="round">
          <path d={`M78 ${bodyCy - 16} q11 14 22 4 q11 10 22 -4`} />
          <path d={`M100 ${bodyCy - 12} l0 34`} opacity="0.6" />
          {rooster && <path d={`M90 ${bodyCy + 10} h20 M90 ${bodyCy + 22} h20`} opacity="0.5" />}
        </g>
      ) : (
        <ellipse cx="100" cy={bodyCy + 14} rx="22" ry="24" fill="#ffffff" opacity="0.35" />
      )}
      <circle cx="100" cy={GEO[stage].head.y} r={GEO[stage].head.r} fill={pal.body} />
      {pal.spots && <circle cx="100" cy={GEO[stage].head.y} r={GEO[stage].head.r} fill="url(#spots)" />}
      <ellipse cx="80" cy={GEO[stage].eyeY + 12} rx="6" ry="4" fill="#ff9e8a" opacity="0.45" />
      <ellipse cx="120" cy={GEO[stage].eyeY + 12} rx="6" ry="4" fill="#ff9e8a" opacity="0.45" />
    </g>
  );
}

function Wing({
  side,
  stage,
  pal,
  flexing,
  cy,
  rx,
}: {
  side: 'l' | 'r';
  stage: string;
  pal: Palette;
  flexing: boolean;
  cy: number;
  rx: number;
}) {
  const s = side === 'l' ? -1 : 1;
  const x = 100 + s * (rx - 6);
  const buff = stage !== 'frango';
  return (
    <g className={`mascot-wing mascot-wing-${side} ${flexing ? 'up' : ''}`} style={{ transformOrigin: `${x}px ${cy - 10}px` }}>
      <path
        d={`M${x} ${cy - 18} C ${x + s * 26} ${cy - 10} ${x + s * 26} ${cy + 26} ${x + s * 4} ${cy + 34} C ${x - s * 6} ${cy + 20} ${x - s * 6} ${cy} ${x} ${cy - 18} Z`}
        fill={pal.shade}
      />
      {buff && flexing && <circle cx={x + s * 14} cy={cy + 2} r="9" fill={pal.body} stroke={pal.shade} strokeWidth="2" />}
    </g>
  );
}

function Comb({ g, big }: { g: Geo; big: boolean }) {
  const { x, y, r } = g.head;
  const k = big ? 1.35 : 1;
  return (
    <g className="mascot-comb">
      <circle cx={x - 12 * k} cy={y - r + 2} r={7 * k} />
      <circle cx={x} cy={y - r - 4 * k} r={9 * k} />
      <circle cx={x + 12 * k} cy={y - r + 2} r={7 * k} />
    </g>
  );
}

function Wattle({ g, big }: { g: Geo; big: boolean }) {
  return <ellipse className="mascot-comb" cx={g.head.x} cy={g.beakY + (big ? 14 : 11)} rx={big ? 6 : 4.5} ry={big ? 9 : 6} />;
}

function Beak({ g, open }: { g: Geo; open: boolean }) {
  const { x } = g.head;
  const w = g.beakW;
  return open ? (
    <g className="mascot-beak">
      <path d={`M${x - w} ${g.beakY - 3} L${x + w} ${g.beakY - 3} L${x} ${g.beakY + 4} Z`} />
      <path d={`M${x - w * 0.7} ${g.beakY + 3} L${x + w * 0.7} ${g.beakY + 3} L${x} ${g.beakY + 9} Z`} opacity="0.85" />
    </g>
  ) : (
    <path className="mascot-beak" d={`M${x - w} ${g.beakY - 3} L${x + w} ${g.beakY - 3} L${x} ${g.beakY + 8} Z`} />
  );
}

function Eyes({ g, mood, fierce }: { g: Geo; mood: Mood; fierce: boolean }) {
  const { x } = g.head;
  const ys = g.eyeY;
  const eye = (cx: number) => {
    if (mood === 'happy' || mood === 'cheer')
      return <path key={cx} className="mascot-eye-line" d={`M${cx - g.eyeR} ${ys + 2} q${g.eyeR} ${-g.eyeR * 1.6} ${g.eyeR * 2} 0`} />;
    if (mood === 'sleep') return <path key={cx} className="mascot-eye-line" d={`M${cx - g.eyeR} ${ys} q${g.eyeR} ${g.eyeR} ${g.eyeR * 2} 0`} />;
    return (
      <g key={cx} className="mascot-eye">
        <circle cx={cx} cy={ys} r={g.eyeR} fill="#fff" />
        <circle cx={cx + 1} cy={ys + 0.5} r={g.eyeR * 0.6} fill="#1d1d1f" />
        <circle cx={cx + 2.5} cy={ys - 1.5} r={g.eyeR * 0.22} fill="#fff" />
      </g>
    );
  };
  return (
    <g>
      {eye(x - g.eyeDx)}
      {eye(x + g.eyeDx)}
      {(fierce || mood === 'flex' || mood === 'tired') && (
        <path
          className="mascot-eye-line"
          d={
            mood === 'tired'
              ? `M${x - g.eyeDx - 7} ${ys - 9} l12 -3 M${x + g.eyeDx + 7} ${ys - 9} l-12 -3`
              : `M${x - g.eyeDx - 7} ${ys - 12} l12 4 M${x + g.eyeDx + 7} ${ys - 12} l-12 4`
          }
        />
      )}
    </g>
  );
}

function Cape({ stage }: { stage: Stage['id'] }) {
  const top = stage === 'pintinho' ? 110 : GEO[stage].head.y + 34;
  return <path className="mascot-cape" d={`M70 ${top} C 40 ${top + 40} 34 170 30 206 L170 206 C 166 170 160 ${top + 40} 130 ${top} Z`} />;
}

function Sparkles() {
  return (
    <g className="mascot-sparkles">
      <path d="M30 60 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3z" />
      <path d="M168 40 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2z" />
      <path d="M172 150 l2.5 7 l7 2.5 l-7 2.5 l-2.5 7 l-2.5 -7 l-7 -2.5 l7 -2.5z" />
    </g>
  );
}

function Accessories({ g, stage, equipped }: { g: Geo; stage: Stage['id']; equipped: Props['equipped'] }) {
  const { x, y, r } = g.head;
  const top = y - r;
  const items = equipped ?? {};
  const neckY = stage === 'ovo' || stage === 'pintinho' ? g.chestY : g.head.y + r + 6;
  return (
    <g>
      {items.face === 'oculos' && (
        <g className="acc-glasses">
          <rect x={x - g.eyeDx - 10} y={g.eyeY - 7} width="20" height="13" rx="4" />
          <rect x={x + g.eyeDx - 10} y={g.eyeY - 7} width="20" height="13" rx="4" />
          <path d={`M${x - g.eyeDx + 10} ${g.eyeY - 2} h${g.eyeDx * 2 - 20}`} strokeWidth="3" stroke="#111" />
        </g>
      )}
      {items.neck === 'apito' && (
        <g>
          <path d={`M${x - 16} ${neckY - 8} L${x} ${neckY + 18} L${x + 16} ${neckY - 8}`} fill="none" stroke="#e53935" strokeWidth="2.5" />
          <rect x={x - 6} y={neckY + 16} width="14" height="9" rx="3" fill="#b0bec5" stroke="#78909c" strokeWidth="1.5" />
        </g>
      )}
      {items.neck === 'medalha' && (
        <g>
          <path d={`M${x - 14} ${neckY - 8} L${x - 4} ${neckY + 18} M${x + 14} ${neckY - 8} L${x + 4} ${neckY + 18}`} stroke="#1e88e5" strokeWidth="5" />
          <circle cx={x} cy={neckY + 24} r="10" fill="#ffc107" stroke="#e0a000" strokeWidth="2.5" />
          <path d={`M${x - 3} ${neckY + 24} l3 -5 l3 5 l-6 -2 h6z`} fill="#fff59d" />
        </g>
      )}
      {items.neck === 'corrente' && (
        <g>
          <path d={`M${x - 26} ${neckY - 6} Q${x} ${neckY + 26} ${x + 26} ${neckY - 6}`} fill="none" stroke="#f9c22e" strokeWidth="5" strokeDasharray="5 2" />
          <rect x={x - 7} y={neckY + 9} width="14" height="14" rx="2" fill="#f9c22e" stroke="#d39e00" strokeWidth="2" />
          <text x={x} y={neckY + 20} textAnchor="middle" fontSize="10" fontWeight="900" fill="#7a5600">F</text>
        </g>
      )}
      {items.head === 'faixa' && (
        <g>
          <rect x={x - r + 1} y={top + r * 0.28} width={r * 2 - 2} height={r * 0.32} rx="3" fill="#e53935" />
          <rect x={x - r + 1} y={top + r * 0.39} width={r * 2 - 2} height={r * 0.08} fill="#fff" />
          <path d={`M${x + r - 2} ${top + r * 0.4} l14 6 l-3 8 z`} fill="#e53935" />
        </g>
      )}
      {items.head === 'bone' && (
        <g>
          <path d={`M${x - r + 2} ${top + r * 0.45} A ${r - 2} ${r * 0.75} 0 0 1 ${x + r - 2} ${top + r * 0.45} Z`} fill="#1e88e5" />
          <path d={`M${x + 4} ${top + r * 0.42} q ${r} -2 ${r + 14} 8 l-${r + 10} 0 z`} fill="#1565c0" />
          <circle cx={x} cy={top - r * 0.28} r="3.5" fill="#1565c0" />
        </g>
      )}
      {items.head === 'palha' && (
        <g>
          <ellipse cx={x} cy={top + r * 0.32} rx={r + 22} ry="9" fill="#e9c46a" stroke="#c9a227" strokeWidth="2" />
          <path d={`M${x - r * 0.75} ${top + r * 0.32} Q${x - r * 0.7} ${top - r * 0.55} ${x} ${top - r * 0.6} Q${x + r * 0.7} ${top - r * 0.55} ${x + r * 0.75} ${top + r * 0.32} Z`} fill="#f4d58d" stroke="#c9a227" strokeWidth="2" />
          <rect x={x - r * 0.75} y={top + r * 0.05} width={r * 1.5} height="6" fill="#e53935" />
        </g>
      )}
      {items.head === 'viking' && (
        <g>
          <path d={`M${x - r * 0.95} ${top + r * 0.42} C ${x - r - 22} ${top + 6} ${x - r - 18} ${top - 26} ${x - r - 8} ${top - 30} C ${x - r - 6} ${top - 12} ${x - r + 2} ${top + 2} ${x - r * 0.6} ${top + r * 0.2} Z`} fill="#f5f0e1" stroke="#cbbf9f" strokeWidth="2" />
          <path d={`M${x + r * 0.95} ${top + r * 0.42} C ${x + r + 22} ${top + 6} ${x + r + 18} ${top - 26} ${x + r + 8} ${top - 30} C ${x + r + 6} ${top - 12} ${x + r - 2} ${top + 2} ${x + r * 0.6} ${top + r * 0.2} Z`} fill="#f5f0e1" stroke="#cbbf9f" strokeWidth="2" />
          <path d={`M${x - r} ${top + r * 0.5} A ${r} ${r * 0.85} 0 0 1 ${x + r} ${top + r * 0.5} Z`} fill="#9e9e9e" stroke="#6d6d6d" strokeWidth="2" />
          <rect x={x - r} y={top + r * 0.4} width={r * 2} height="7" fill="#795548" />
        </g>
      )}
      {items.head === 'coroa' && (
        <g>
          <path d={`M${x - 20} ${top + 4} L${x - 22} ${top - 22} L${x - 10} ${top - 8} L${x} ${top - 28} L${x + 10} ${top - 8} L${x + 22} ${top - 22} L${x + 20} ${top + 4} Z`} fill="#ffd54f" stroke="#e0a000" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx={x} cy={top - 6} r="3.5" fill="#e53935" />
          <circle cx={x - 13} cy={top - 3} r="2.5" fill="#1e88e5" />
          <circle cx={x + 13} cy={top - 3} r="2.5" fill="#43a047" />
        </g>
      )}
    </g>
  );
}

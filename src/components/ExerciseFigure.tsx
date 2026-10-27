import { useEffect, useMemo, useRef, useState } from 'react';
import { BAR_Y, FLOOR, buildSkeleton, frameViewBox, poseAt, polar, type Animation, type PropKind, type Pt, type Skeleton } from '../lib/figure';

interface Props {
  anim: Animation;
  playing?: boolean;
  speed?: number;
  className?: string;
  label?: string;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function ExerciseFigure({ anim, playing = true, speed = 1, className, label }: Props) {
  const [time, setTime] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    if (!playing || prefersReducedMotion()) return;
    let last = performance.now();
    const tick = (now: number) => {
      setTime((t) => t + ((now - last) / 1000) * speed);
      last = now;
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, speed, anim]);

  const sk = buildSkeleton(poseAt(anim, time));
  const viewBox = useMemo(() => frameViewBox(anim), [anim]);

  return (
    <svg
      className={`figure ${className ?? ''}`}
      viewBox={viewBox}
      role="img"
      aria-label={label ?? 'Demonstração do exercício'}
    >
      <line className="fig-floor" x1="-100" y1={FLOOR + 1.5} x2="300" y2={FLOOR + 1.5} />
      {anim.props?.map((p, i) => <PropShape key={i} prop={p} sk={sk} />)}
      <Body sk={sk} />
    </svg>
  );
}

const path = (...pts: Pt[]) => 'M' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L');

function Body({ sk }: { sk: Skeleton }) {
  const spine = `M${sk.hip[0].toFixed(1)} ${sk.hip[1].toFixed(1)} Q${sk.spineCtrl[0].toFixed(1)} ${sk.spineCtrl[1].toFixed(
    1,
  )} ${sk.neck[0].toFixed(1)} ${sk.neck[1].toFixed(1)}`;
  const comb = [-26, 0, 26].map((o) => polar(sk.head, 8.5, sk.combAngle + o));
  const [sh1, sh2] = sk.shoulders;
  const [hp1, hp2] = sk.hips;

  return (
    <g className="fig-body">
      {/* membros de trás, mais claros */}
      <path className="fig-limb fig-far" d={path(sh2, sk.elbow2, sk.hand2)} />
      <path className="fig-limb fig-far" d={path(hp2, sk.knee2, sk.foot2, ...(sk.toe2 ? [sk.toe2] : []))} />
      <path className="fig-limb fig-torso" d={spine} />
      {sk.face === 0 && (
        <>
          <path className="fig-limb fig-torso" d={path(sh1, sh2)} />
          <path className="fig-limb fig-torso" d={path(hp1, hp2)} />
        </>
      )}
      <path className="fig-limb" d={path(hp1, sk.knee, sk.foot, ...(sk.toe ? [sk.toe] : []))} />
      <path className="fig-limb" d={path(sh1, sk.elbow, sk.hand)} />
      {comb.map((c, i) => (
        <circle key={i} className="fig-comb" cx={c[0]} cy={c[1]} r={3.3} />
      ))}
      <circle className="fig-head" cx={sk.head[0]} cy={sk.head[1]} r={8} />
      {sk.face ? <SideFace sk={sk} /> : <FrontFace sk={sk} />}
    </g>
  );
}

function SideFace({ sk }: { sk: Skeleton }) {
  const base = polar(sk.head, 6.5, sk.beakAngle);
  const tip = polar(sk.head, 12, sk.beakAngle);
  const a = polar(base, 2.6, sk.beakAngle + 90);
  const b = polar(base, 2.6, sk.beakAngle - 90);
  const eye = polar(sk.head, 3.6, (sk.beakAngle + sk.headDir) / 2);
  return (
    <>
      <path className="fig-beak" d={`${path(a, tip, b)} Z`} />
      <circle className="fig-eye" cx={eye[0]} cy={eye[1]} r={1.3} />
    </>
  );
}

function FrontFace({ sk }: { sk: Skeleton }) {
  const [x, y] = sk.head;
  return (
    <g transform={`rotate(${(90 - sk.headDir).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})`}>
      <circle className="fig-eye" cx={x - 3} cy={y - 1} r={1.3} />
      <circle className="fig-eye" cx={x + 3} cy={y - 1} r={1.3} />
      <path className="fig-beak" d={`M${x - 2.4} ${y + 1.6} L${x} ${y + 5.4} L${x + 2.4} ${y + 1.6} Z`} />
    </g>
  );
}

function PropShape({ prop, sk }: { prop: PropKind; sk: Skeleton }) {
  switch (prop.kind) {
    case 'bar':
      return (
        <g className="fig-prop">
          <line x1="40" y1={BAR_Y} x2="160" y2={BAR_Y} strokeWidth="3.5" />
          <line x1="40" y1={BAR_Y - 6} x2="40" y2={BAR_Y + 6} strokeWidth="3" />
          <line x1="160" y1={BAR_Y - 6} x2="160" y2={BAR_Y + 6} strokeWidth="3" />
        </g>
      );
    case 'chair': {
      // assento em y = 128, encosto do lado oposto à pessoa
      const { x } = prop;
      const back = prop.flip ? x + 34 : x;
      return (
        <g className="fig-prop">
          <rect x={x} y={126} width={34} height={4} rx={1.5} className="fig-prop-fill" />
          <line x1={x + 3} y1={130} x2={x + 3} y2={FLOOR} />
          <line x1={x + 31} y1={130} x2={x + 31} y2={FLOOR} />
          <line x1={back} y1={128} x2={back} y2={90} strokeWidth="3" />
        </g>
      );
    }
    case 'table': {
      const { x } = prop;
      return (
        <g className="fig-prop">
          <rect x={x} y={102} width={60} height={4} rx={1.5} className="fig-prop-fill" />
          <line x1={x + 56} y1={106} x2={x + 56} y2={FLOOR} />
        </g>
      );
    }
    case 'wall':
      return (
        <g className="fig-prop">
          <rect x={prop.x} y={10} width={8} height={FLOOR - 10} className="fig-prop-fill" />
        </g>
      );
    case 'door':
      return (
        <g className="fig-prop">
          <rect x={prop.x} y={18} width={5} height={FLOOR - 18} className="fig-prop-fill" />
          <circle cx={prop.x - 1} cy={104} r={2.5} />
        </g>
      );
    case 'towel': {
      const from = prop.from === 'hand' ? sk.hand : sk.foot;
      return <path className="fig-towel" d={path(from, prop.to)} />;
    }
  }
}

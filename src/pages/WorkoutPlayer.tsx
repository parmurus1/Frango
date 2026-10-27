import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ExerciseFigure } from '../components/ExerciseFigure';
import { Mascot } from '../components/Mascot';
import { ProgressBar, Ring, Stepper, formatDuration } from '../components/ui';
import { EXERCISE_MAP, getExercise } from '../data/exercises';
import { REST_PHRASES, pick } from '../data/phrases';
import type { Workout } from '../data/types';
import { beep, keepAwake, speak, vibrate } from '../lib/feedback';
import { clearPendingWorkout, mascotProps, readPendingWorkout } from '../lib/session';
import type { SetLog } from '../lib/state';
import { useStore } from '../lib/store';
import { workoutSteps, type ExerciseStep, type Phase, type RestStep, type Step } from '../lib/workout';

const PHASE_LABEL: Record<Phase, string> = { warmup: 'Aquecimento', main: 'Treino', cooldown: 'Alongamento' };

export function WorkoutPlayer() {
  const location = useLocation();
  // lê uma vez só: o treino não muda enquanto o player está aberto
  const [pending] = useState(() => readPendingWorkout(location.state));
  if (!pending) return <Navigate to="/" replace />;
  return <Player workout={pending.workout} recovery={pending.recovery} />;
}

function useFeedback() {
  const { state } = useStore();
  const s = state.settings;
  return useMemo(
    () => ({
      beep: (k: Parameters<typeof beep>[0]) => s.sound && beep(k),
      speak: (t: string) => s.voice && speak(t),
      vibrate: (p: number | number[]) => s.vibration && vibrate(p),
    }),
    [s.sound, s.voice, s.vibration],
  );
}

function targetLabel(step: ExerciseStep) {
  const ex = getExercise(step.exerciseId);
  const unit = ex.mode === 'time' ? 'segundos' : 'repetições';
  return `${step.target} ${unit}${ex.perSide ? ' por lado' : ''}`;
}

function Player({ workout, recovery }: { workout: Workout; recovery: boolean }) {
  const { state, finishWorkout } = useStore();
  const navigate = useNavigate();
  const fb = useFeedback();
  const [steps, setSteps] = useState<Step[]>(() => workoutSteps(workout));
  const [index, setIndex] = useState(0);
  const [logs, setLogs] = useState<SetLog[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [quitting, setQuitting] = useState(false);
  const startedAt = useRef(Date.now());
  const step = steps[index];

  useEffect(() => {
    let release = () => {};
    void keepAwake().then((r) => (release = r));
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);
    return () => {
      clearInterval(t);
      release();
    };
  }, []);

  // anúncio por voz a cada passo
  useEffect(() => {
    if (!step) return;
    if (step.kind === 'exercise') {
      fb.speak(`${getExercise(step.exerciseId).name}. ${targetLabel(step)}.`);
    } else {
      const next = step.nextExerciseId ? getExercise(step.nextExerciseId).name : '';
      fb.speak(`Descanse ${step.seconds} segundos.${next ? ` Depois: ${next}.` : ''}`);
    }
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = useCallback(
    (finalLogs: SetLog[]) => {
      finishWorkout({
        title: workout.title,
        programId: workout.programId,
        sessionNumber: workout.sessionNumber,
        recovery,
        durationSec: (Date.now() - startedAt.current) / 1000,
        sets: finalLogs,
      });
      clearPendingWorkout();
      fb.beep('done');
      fb.vibrate([80, 60, 160]);
      navigate('/resumo', { replace: true });
    },
    [finishWorkout, workout, recovery, navigate, fb],
  );

  const advance = useCallback(
    (log?: SetLog) => {
      const nextLogs = log ? [...logs, log] : logs;
      setLogs(nextLogs);
      if (index + 1 >= steps.length) finish(nextLogs);
      else setIndex(index + 1);
    },
    [logs, index, steps.length, finish],
  );

  /** Troca o exercício atual (e as séries que faltam dele) por uma variação. */
  const swap = (newId: string) => {
    if (step.kind !== 'exercise') return;
    const { itemIndex, phase, exerciseId } = step;
    setSteps((list) =>
      list.map((s, i) => {
        if (i < index) return s;
        if (s.kind === 'exercise' && s.itemIndex === itemIndex && s.phase === phase && s.exerciseId === exerciseId)
          return { ...s, exerciseId: newId };
        if (s.kind === 'rest' && s.nextExerciseId === exerciseId && i < list.length - 1) {
          const nxt = list[i + 1];
          if (nxt.kind === 'exercise' && nxt.itemIndex === itemIndex && nxt.phase === phase) return { ...s, nextExerciseId: newId };
        }
        return s;
      }),
    );
  };

  if (!step) return null;
  const progress = index / steps.length;

  return (
    <div className={`player phase-${step.phase} ${step.kind === 'rest' ? 'is-rest' : ''}`}>
      <header className="player-top">
        <button className="icon-btn" aria-label="Sair do treino" onClick={() => setQuitting(true)}>
          ✕
        </button>
        <div className="player-top-mid">
          <span className="player-phase">{PHASE_LABEL[step.phase]}</span>
          <ProgressBar value={progress} label="Progresso do treino" />
        </div>
        <span className="player-clock" aria-label="Tempo de treino">
          {formatDuration(elapsed)}
        </span>
      </header>

      {step.kind === 'exercise' ? (
        <ExerciseView key={`${index}-${step.exerciseId}`} step={step} onDone={advance} onSwap={swap} />
      ) : (
        <RestView key={index} step={step} onDone={() => advance()} />
      )}

      {quitting && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Sair do treino">
          <div className="modal">
            <Mascot {...mascotProps(state)} mood="tired" size={110} />
            <h2>Vai largar o treino?</h2>
            <p className="muted">
              {logs.length > 0
                ? `Você já fez ${logs.length} séries. Dá para salvar o que fez até aqui.`
                : 'Nada foi feito ainda, então nada será salvo.'}
            </p>
            <button className="btn btn-primary btn-block" onClick={() => setQuitting(false)}>
              Continuar treinando 💪
            </button>
            {logs.length > 0 && (
              <button className="btn btn-soft btn-block" onClick={() => finish(logs)}>
                Encerrar e salvar
              </button>
            )}
            <button
              className="btn btn-ghost btn-block"
              onClick={() => {
                clearPendingWorkout();
                navigate(-1);
              }}
            >
              Sair sem salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExerciseView({ step, onDone, onSwap }: { step: ExerciseStep; onDone: (log?: SetLog) => void; onSwap: (id: string) => void }) {
  const ex = getExercise(step.exerciseId);
  const [showHow, setShowHow] = useState(false);
  const easier = ex.easier ? EXERCISE_MAP[ex.easier] : undefined;
  const harder = ex.harder ? EXERCISE_MAP[ex.harder] : undefined;

  return (
    <section className="player-body">
      <div className="player-figure">
        <ExerciseFigure anim={ex.anim} label={`Demonstração: ${ex.name}`} />
      </div>
      <div className="player-info">
        <p className="player-set">
          Série {step.set} de {step.sets}
        </p>
        <h1 className="player-name">{ex.name}</h1>
        <p className="player-target">{targetLabel(step)}</p>
      </div>

      {ex.mode === 'reps' ? (
        <RepsControl key={step.target} target={step.target} perSide={!!ex.perSide} onDone={(v) => onDone({ exerciseId: ex.id, value: v })} />
      ) : (
        <TimeControl
          target={step.target}
          perSide={!!ex.perSide}
          autoStart={step.phase !== 'main'}
          onDone={(v) => onDone({ exerciseId: ex.id, value: v })}
        />
      )}

      <div className="player-links">
        <button className="link-btn" onClick={() => setShowHow((s) => !s)}>
          {showHow ? 'Esconder' : '📖 Como fazer'}
        </button>
        {easier && (
          <button className="link-btn" onClick={() => onSwap(easier.id)}>
            ⬇ Mais fácil
          </button>
        )}
        {harder && (
          <button className="link-btn" onClick={() => onSwap(harder.id)}>
            ⬆ Mais difícil
          </button>
        )}
        <button className="link-btn muted" onClick={() => onDone()}>
          Pular
        </button>
      </div>

      {showHow && (
        <div className="card how">
          <ol className="steps">
            {ex.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          <p className="small">
            <strong>Dica:</strong> {ex.tips[0]}
          </p>
        </div>
      )}
    </section>
  );
}

function RepsControl({ target, perSide, onDone }: { target: number; perSide: boolean; onDone: (v: number) => void }) {
  const [value, setValue] = useState(target);
  return (
    <div className="player-controls">
      <p className="small muted">Quantas você fez{perSide ? ' (por lado)' : ''}? Ajuste se precisar.</p>
      <Stepper value={value} onChange={setValue} min={0} max={200} unit="reps" />
      <button className="btn btn-primary btn-lg btn-block" onClick={() => onDone(value)}>
        Série feita ✓
      </button>
    </div>
  );
}

function TimeControl({
  target,
  perSide,
  autoStart,
  onDone,
}: {
  target: number;
  perSide: boolean;
  autoStart: boolean;
  onDone: (v: number) => void;
}) {
  const fb = useFeedback();
  const total = target * (perSide ? 2 : 1);
  const [phase, setPhase] = useState<'ready' | 'countdown' | 'running' | 'paused'>(autoStart ? 'countdown' : 'ready');
  const [count, setCount] = useState(3);
  const [left, setLeft] = useState(total);
  const endAt = useRef(0);
  const switched = useRef(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  // contagem regressiva 3-2-1
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (count === 0) {
      fb.beep('go');
      endAt.current = Date.now() + left * 1000;
      setPhase('running');
      return;
    }
    fb.beep('tick');
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, count]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== 'running') return;
    const t = setInterval(() => {
      const remaining = Math.max(0, (endAt.current - Date.now()) / 1000);
      setLeft(remaining);
      if (perSide && !switched.current && remaining <= total / 2) {
        switched.current = true;
        fb.beep('go');
        fb.vibrate(200);
        fb.speak('Troque de lado');
      }
      if (remaining <= 0) {
        clearInterval(t);
        fb.vibrate([100, 50, 100]);
        doneRef.current(target);
      }
    }, 200);
    return () => clearInterval(t);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const secs = Math.ceil(left);
  const showSwitch = perSide && left <= total / 2 && left > total / 2 - 2.5 && phase === 'running';

  return (
    <div className="player-controls">
      <Ring value={1 - left / total} size={170} stroke={12}>
        {phase === 'countdown' ? (
          <span className="ring-big pop" key={count}>
            {count || 'Já!'}
          </span>
        ) : (
          <>
            <span className="ring-big">{secs}</span>
            <small>{showSwitch ? 'Troque de lado!' : perSide ? (left > total / 2 ? '1º lado' : '2º lado') : 'segundos'}</small>
          </>
        )}
      </Ring>
      {phase === 'ready' && (
        <button className="btn btn-primary btn-lg btn-block" onClick={() => setPhase('countdown')}>
          Começar ▶
        </button>
      )}
      {phase === 'running' && (
        <div className="btn-row">
          <button className="btn btn-soft" onClick={() => setPhase('paused')}>
            ⏸ Pausar
          </button>
          <button
            className="btn btn-primary"
            onClick={() => doneRef.current(Math.max(1, Math.round((total - left) / (perSide ? 2 : 1))))}
          >
            Terminei ✓
          </button>
        </div>
      )}
      {phase === 'paused' && (
        <button
          className="btn btn-primary btn-lg btn-block"
          onClick={() => {
            endAt.current = Date.now() + left * 1000;
            setPhase('running');
          }}
        >
          ▶ Continuar
        </button>
      )}
    </div>
  );
}

function RestView({ step, onDone }: { step: RestStep; onDone: () => void }) {
  const { state } = useStore();
  const fb = useFeedback();
  const [left, setLeft] = useState(step.seconds);
  const endAt = useRef(Date.now() + step.seconds * 1000);
  const lastBeep = useRef(99);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const [phrase] = useState(() => pick(REST_PHRASES, Math.floor(Math.random() * 1000)));
  const next = step.nextExerciseId ? getExercise(step.nextExerciseId) : null;

  useEffect(() => {
    const t = setInterval(() => {
      const remaining = Math.max(0, (endAt.current - Date.now()) / 1000);
      setLeft(remaining);
      const s = Math.ceil(remaining);
      if (s <= 3 && s > 0 && s < lastBeep.current) {
        lastBeep.current = s;
        fb.beep('tick');
      }
      if (remaining <= 0) {
        clearInterval(t);
        fb.beep('go');
        fb.vibrate(120);
        doneRef.current();
      }
    }, 200);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="player-body rest">
      <div className="rest-top">
        <Mascot {...mascotProps(state)} mood="happy" size={110} />
        <p className="speech">{phrase}</p>
      </div>
      <Ring value={left / step.seconds} size={190} stroke={12}>
        <span className="ring-big">{Math.ceil(left)}</span>
        <small>descanso</small>
      </Ring>
      <div className="btn-row">
        <button
          className="btn btn-soft"
          onClick={() => {
            endAt.current += 15000;
            lastBeep.current = 99;
          }}
        >
          +15s
        </button>
        <button className="btn btn-primary" onClick={() => doneRef.current()}>
          Pular descanso ⏭
        </button>
      </div>
      {next && (
        <div className="card next-up">
          <ExerciseFigure anim={next.anim} label={`Próximo: ${next.name}`} />
          <div>
            <small className="muted">A seguir</small>
            <strong>{next.name}</strong>
          </div>
        </div>
      )}
    </section>
  );
}

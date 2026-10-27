import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExerciseFigure } from '../components/ExerciseFigure';
import { Mascot } from '../components/Mascot';
import { PageHeader, Ring, Stepper } from '../components/ui';
import { getExercise } from '../data/exercises';
import { beep } from '../lib/feedback';
import { mascotProps } from '../lib/session';
import { useStore } from '../lib/store';

type Stage = 'intro' | 'pushups' | 'squats' | 'plank' | 'done';

export function FitnessTestPage() {
  const { state, recordTest } = useStore();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('intro');
  const [pushups, setPushups] = useState(0);
  const [squats, setSquats] = useState(0);
  const [plank, setPlank] = useState(0);
  const last = state.tests[state.tests.length - 1];

  const save = () => {
    recordTest({ date: new Date().toISOString(), pushups, squats, plankSec: plank });
    setStage('done');
  };

  return (
    <div className="fitness-test">
      <PageHeader title="Teste do Frango" back="/progresso" />

      {stage === 'intro' && (
        <section className="card center">
          <Mascot {...mascotProps(state)} mood="flex" size={140} />
          <h2>3 desafios para medir sua força</h2>
          <ol className="steps left">
            <li>
              <strong>Flexões máximas</strong> seguidas, com boa forma (pode ser com joelhos se ainda não faz a normal — anote sempre a mesma
              variação).
            </li>
            <li>
              <strong>Agachamentos em 1 minuto</strong>, descendo até a coxa ficar paralela ao chão.
            </li>
            <li>
              <strong>Prancha máxima</strong>, até perder o alinhamento do corpo.
            </li>
          </ol>
          <p className="small muted">Descanse 2 minutos entre cada desafio. Aqueça antes!</p>
          <button className="btn btn-primary btn-lg btn-block" onClick={() => setStage('pushups')}>
            Começar
          </button>
        </section>
      )}

      {stage === 'pushups' && (
        <section className="card center">
          <ExerciseFigure anim={getExercise('flexao').anim} />
          <h2>1. Flexões máximas</h2>
          <p className="muted">Faça quantas conseguir sem parar. Depois anote.</p>
          {last && <p className="small">Último teste: {last.pushups}</p>}
          <Stepper value={pushups} onChange={setPushups} unit="flexões" />
          <button className="btn btn-primary btn-block" onClick={() => setStage('squats')}>
            Próximo
          </button>
        </section>
      )}

      {stage === 'squats' && (
        <section className="card center">
          <ExerciseFigure anim={getExercise('agachamento').anim} />
          <h2>2. Agachamentos em 1 minuto</h2>
          <Countdown seconds={60} />
          {last && <p className="small">Último teste: {last.squats}</p>}
          <Stepper value={squats} onChange={setSquats} unit="agachamentos" />
          <button className="btn btn-primary btn-block" onClick={() => setStage('plank')}>
            Próximo
          </button>
        </section>
      )}

      {stage === 'plank' && (
        <section className="card center">
          <ExerciseFigure anim={getExercise('prancha').anim} />
          <h2>3. Prancha máxima</h2>
          <Stopwatch onStop={setPlank} />
          {last && <p className="small">Último teste: {last.plankSec}s</p>}
          <Stepper value={plank} onChange={setPlank} step={5} unit="segundos" />
          <button className="btn btn-primary btn-block" onClick={save}>
            Salvar resultado
          </button>
        </section>
      )}

      {stage === 'done' && (
        <section className="card center">
          <Mascot {...mascotProps(state)} mood="cheer" size={150} />
          <h2>Teste registrado!</h2>
          <p>
            {pushups} flexões · {squats} agachamentos · {plank}s de prancha
          </p>
          {last && (
            <p className="lead">
              {pushups + squats + plank > last.pushups + last.squats + last.plankSec
                ? 'Você evoluiu desde o último teste! 📈'
                : 'Segue firme — evolução não é linear. 💪'}
            </p>
          )}
          <button className="btn btn-primary btn-block" onClick={() => navigate('/progresso')}>
            Ver progresso
          </button>
        </section>
      )}
    </div>
  );
}

function Countdown({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(false);
  const endAt = useRef(0);
  useEffect(() => {
    if (!running) return;
    endAt.current = Date.now() + left * 1000;
    const t = setInterval(() => {
      const r = Math.max(0, (endAt.current - Date.now()) / 1000);
      setLeft(r);
      if (r <= 0) {
        clearInterval(t);
        setRunning(false);
        beep('done');
      }
    }, 200);
    return () => clearInterval(t);
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="timer-block">
      <Ring value={1 - left / seconds} size={130}>
        <span className="ring-big">{Math.ceil(left)}</span>
      </Ring>
      {left > 0 && (
        <button className="btn btn-soft" onClick={() => setRunning((r) => !r)}>
          {running ? '⏸ Pausar' : left === seconds ? '▶ Iniciar 1 minuto' : '▶ Continuar'}
        </button>
      )}
    </div>
  );
}

function Stopwatch({ onStop }: { onStop: (s: number) => void }) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const start = useRef(0);
  useEffect(() => {
    if (!running) return;
    start.current = Date.now() - elapsed * 1000;
    const t = setInterval(() => setElapsed((Date.now() - start.current) / 1000), 200);
    return () => clearInterval(t);
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="timer-block">
      <Ring value={(elapsed % 60) / 60} size={130}>
        <span className="ring-big">{Math.floor(elapsed)}</span>
        <small>segundos</small>
      </Ring>
      <button
        className="btn btn-soft"
        onClick={() => {
          if (running) onStop(Math.floor(elapsed));
          else beep('go');
          setRunning(!running);
        }}
      >
        {running ? '⏹ Parar' : elapsed ? '▶ Continuar' : '▶ Iniciar cronômetro'}
      </button>
    </div>
  );
}

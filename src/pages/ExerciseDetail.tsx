import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ExerciseFigure } from '../components/ExerciseFigure';
import { DifficultyEggs, PageHeader } from '../components/ui';
import { EXERCISE_MAP } from '../data/exercises';
import { CATEGORY_ICON, CATEGORY_LABEL, EQUIPMENT_LABEL, type Exercise } from '../data/types';
import { startWorkout } from '../lib/session';
import { useStore } from '../lib/store';
import { singleExerciseWorkout } from '../lib/workout';

/** Cadeia de progressão: do mais fácil ao mais difícil, passando pelo exercício atual. */
export function progressionChain(ex: Exercise) {
  const before: Exercise[] = [];
  const after: Exercise[] = [];
  const seen = new Set([ex.id]);
  for (let e = ex.easier ? EXERCISE_MAP[ex.easier] : undefined; e && !seen.has(e.id); e = e.easier ? EXERCISE_MAP[e.easier] : undefined) {
    seen.add(e.id);
    before.unshift(e);
  }
  for (let e = ex.harder ? EXERCISE_MAP[ex.harder] : undefined; e && !seen.has(e.id); e = e.harder ? EXERCISE_MAP[e.harder] : undefined) {
    seen.add(e.id);
    after.push(e);
  }
  return [...before, ex, ...after];
}

export function ExerciseDetail() {
  const { id = '' } = useParams();
  const { state } = useStore();
  const navigate = useNavigate();
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const ex = EXERCISE_MAP[id];
  if (!ex) return <Navigate to="/exercicios" replace />;

  const record = state.records[ex.id];
  const chain = progressionChain(ex);

  return (
    <div className="exercise-detail">
      <PageHeader title={ex.name} back />

      <section className="card figure-card">
        <ExerciseFigure anim={ex.anim} playing={playing} speed={speed} label={`Demonstração animada: ${ex.name}`} />
        <div className="figure-controls">
          <button className="btn btn-small btn-soft" onClick={() => setPlaying((p) => !p)}>
            {playing ? '⏸ Pausar' : '▶ Animar'}
          </button>
          <div className="seg seg-small" role="group" aria-label="Velocidade">
            {[0.5, 1].map((s) => (
              <button key={s} className={`seg-btn ${speed === s ? 'on' : ''}`} onClick={() => setSpeed(s)}>
                {s === 0.5 ? 'Câmera lenta' : 'Normal'}
              </button>
            ))}
          </div>
        </div>
      </section>

      <p className="lead">{ex.summary}</p>

      <div className="info-grid">
        <div className="info">
          <small>Categoria</small>
          <strong>
            {CATEGORY_ICON[ex.category]} {CATEGORY_LABEL[ex.category]}
          </strong>
        </div>
        <div className="info">
          <small>Dificuldade</small>
          <DifficultyEggs value={ex.difficulty} showLabel />
        </div>
        <div className="info">
          <small>Equipamento</small>
          <strong>{ex.equipment.length ? ex.equipment.map((e) => EQUIPMENT_LABEL[e]).join(', ') : 'Nenhum 🙌'}</strong>
        </div>
        <div className="info">
          <small>Seu recorde</small>
          <strong>{record ? `${record.value}${ex.mode === 'time' ? ' s' : ' reps'}` : '—'}</strong>
        </div>
      </div>

      <div className="chip-row">
        {ex.muscles.map((m) => (
          <span key={m} className="chip">
            {m}
          </span>
        ))}
        {ex.perSide && <span className="chip chip-warn">Cada lado</span>}
      </div>

      <section className="card">
        <h2>Como fazer</h2>
        <ol className="steps">
          {ex.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </section>

      <section className="card card-good">
        <h2>✅ Dicas</h2>
        <ul className="bullets">
          {ex.tips.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </section>

      <section className="card card-warn">
        <h2>⚠️ Erros comuns</h2>
        <ul className="bullets">
          {ex.mistakes.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </section>

      {chain.length > 1 && (
        <section className="card">
          <h2>Progressão</h2>
          <p className="small muted">Do mais fácil ao mais difícil. Domine um degrau antes de subir o próximo.</p>
          <ol className="ladder">
            {chain.map((e) => (
              <li key={e.id} className={e.id === ex.id ? 'current' : ''}>
                {e.id === ex.id ? (
                  <strong>{e.name}</strong>
                ) : (
                  <Link to={`/exercicios/${e.id}`}>{e.name}</Link>
                )}
                <DifficultyEggs value={e.difficulty} />
              </li>
            ))}
          </ol>
        </section>
      )}

      <button className="btn btn-primary btn-lg btn-block" onClick={() => startWorkout(navigate, singleExerciseWorkout(ex))}>
        Treinar só este exercício (3 séries) ▶
      </button>
    </div>
  );
}

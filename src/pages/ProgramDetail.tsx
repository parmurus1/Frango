import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { DifficultyEggs, PageHeader, ProgressBar } from '../components/ui';
import { getExercise } from '../data/exercises';
import { PROGRAM_MAP } from '../data/programs';
import { EQUIPMENT_LABEL } from '../data/types';
import { startWorkout } from '../lib/session';
import { useStore } from '../lib/store';
import { buildProgramWorkout, estimateMinutes, programSessionCount } from '../lib/workout';

export function ProgramDetail() {
  const { id = '' } = useParams();
  const { state, startProgram, restartProgram } = useStore();
  const navigate = useNavigate();
  const program = PROGRAM_MAP[id];
  const [preview, setPreview] = useState<number | null>(null);
  if (!program) return <Navigate to="/treinos" replace />;

  const total = programSessionCount(program);
  const done = Math.min(state.programProgress[program.id] ?? 0, total);
  const active = state.activeProgramId === program.id;
  const finished = done >= total;
  const shown = preview ?? Math.min(done, total - 1);
  const workout = buildProgramWorkout(program, shown, state.settings.warmup);
  const missing = program.equipment.filter((e) => !(state.profile?.equipment ?? []).includes(e));

  const start = () => {
    if (!active) startProgram(program.id);
    startWorkout(navigate, buildProgramWorkout(program, done, state.settings.warmup));
  };

  return (
    <div>
      <PageHeader title={program.name} back="/treinos" />
      <section className="card program-hero">
        <div className="program-emoji big">{program.emoji}</div>
        <p className="lead">{program.tagline}</p>
        <p>{program.description}</p>
        <div className="program-meta">
          <DifficultyEggs value={program.difficulty} showLabel />
          <span>{program.weeks} semanas</span>
          <span>{program.perWeek}x por semana</span>
          <span>~{program.minutes} min</span>
        </div>
        <div className="chip-row">
          {program.equipment.length === 0 ? (
            <span className="chip chip-good">Sem equipamento</span>
          ) : (
            program.equipment.map((e) => (
              <span key={e} className="chip">
                {EQUIPMENT_LABEL[e]}
              </span>
            ))
          )}
        </div>
        {missing.length > 0 && (
          <p className="warn small">
            Você marcou que não tem: {missing.map((e) => EQUIPMENT_LABEL[e]).join(', ')}. Dá para trocar nas Configurações, ou escolha um
            programa sem equipamento.
          </p>
        )}
        <ProgressBar value={done / total} tone="good" label="Progresso" />
        <p className="small muted">
          {done}/{total} treinos concluídos
        </p>
        {finished ? (
          <button className="btn btn-primary btn-block" onClick={() => restartProgram(program.id)}>
            🔁 Recomeçar programa
          </button>
        ) : (
          <button className="btn btn-primary btn-lg btn-block" onClick={start}>
            {done === 0 ? 'Começar programa' : `Continuar — treino ${done + 1}`} ▶
          </button>
        )}
        {!active && !finished && done === 0 && (
          <button className="btn btn-ghost btn-block" onClick={() => startProgram(program.id)}>
            Definir como programa ativo sem treinar agora
          </button>
        )}
      </section>

      <section className="card">
        <h2>Calendário</h2>
        <div className="session-grid" style={{ gridTemplateColumns: `repeat(${program.perWeek}, 1fr)` }}>
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              className={`session-cell ${i < done ? 'done' : i === done ? 'next' : ''} ${shown === i ? 'shown' : ''}`}
              onClick={() => setPreview(i)}
              aria-label={`Treino ${i + 1}`}
            >
              {i < done ? '✓' : i + 1}
            </button>
          ))}
        </div>
        <p className="small muted">Semanas em linhas. Toque num treino para ver o que tem nele.</p>
      </section>

      <section className="card">
        <div className="section-title">
          <h2>{workout.title}</h2>
          <span className="muted small">~{estimateMinutes(workout)} min</span>
        </div>
        <p className="small muted">{workout.subtitle}</p>
        <ul className="exercise-rows">
          {workout.main.map((it, i) => {
            const ex = getExercise(it.exerciseId);
            return (
              <li key={i}>
                <Link to={`/exercicios/${ex.id}`}>
                  <strong>{ex.name}</strong>
                  <span className="muted">
                    {it.sets} séries × {it.target}
                    {ex.mode === 'time' ? ' s' : ' reps'}
                    {ex.perSide ? ' por lado' : ''} · descanso {it.rest}s
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        {workout.warmup.length > 0 && <p className="small muted">+ aquecimento de 2 min e alongamento no final.</p>}
      </section>
    </div>
  );
}

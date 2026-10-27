import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { DifficultyEggs, PageHeader, ProgressBar, StatusBar } from '../components/ui';
import { getExercise } from '../data/exercises';
import { PROGRAMS } from '../data/programs';
import { EQUIPMENT_LABEL, type Equipment } from '../data/types';
import { startWorkout } from '../lib/session';
import { useStore } from '../lib/store';
import { FOCUS_LABEL, estimateMinutes, generateWorkout, programSessionCount, type Focus } from '../lib/workout';

export function Programs() {
  const { state } = useStore();
  const { hash } = useLocation();
  const [onlyNoGear, setOnlyNoGear] = useState(false);
  const mine = state.profile?.equipment ?? [];

  useEffect(() => {
    if (hash === '#rapido') document.getElementById('rapido')?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  const list = PROGRAMS.filter((p) => !onlyNoGear || p.equipment.length === 0);

  return (
    <div>
      <StatusBar />
      <PageHeader title="Treinos" />

      <QuickGenerator />

      <div className="section-title">
        <h2>Programas</h2>
        <label className="toggle-inline">
          <input type="checkbox" checked={onlyNoGear} onChange={(e) => setOnlyNoGear(e.target.checked)} />
          Só sem equipamento
        </label>
      </div>

      <div className="program-list">
        {list.map((p) => {
          const done = state.programProgress[p.id] ?? 0;
          const total = programSessionCount(p);
          const missing = p.equipment.filter((e) => !mine.includes(e));
          const active = state.activeProgramId === p.id;
          return (
            <Link key={p.id} to={`/treinos/${p.id}`} className={`card program-card ${active ? 'active' : ''}`}>
              <div className="program-emoji">{p.emoji}</div>
              <div className="program-info">
                <div className="program-top">
                  <h3>{p.name}</h3>
                  {active && <span className="badge">Ativo</span>}
                  {state.completedPrograms.includes(p.id) && <span className="badge badge-good">Concluído</span>}
                </div>
                <p className="small">{p.tagline}</p>
                <div className="program-meta">
                  <DifficultyEggs value={p.difficulty} />
                  <span>{p.weeks} sem</span>
                  <span>{p.perWeek}x/sem</span>
                  <span>~{p.minutes} min</span>
                </div>
                <div className="chip-row">
                  {p.equipment.length === 0 ? (
                    <span className="chip chip-good">Sem equipamento</span>
                  ) : (
                    p.equipment.map((e) => (
                      <span key={e} className={`chip ${missing.includes(e) ? 'chip-warn' : ''}`}>
                        {EQUIPMENT_LABEL[e]}
                      </span>
                    ))
                  )}
                </div>
                {done > 0 && <ProgressBar value={done / total} tone="good" label="Progresso" />}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function QuickGenerator() {
  const { state } = useStore();
  const navigate = useNavigate();
  const [minutes, setMinutes] = useState<10 | 20 | 30>(20);
  const [focus, setFocus] = useState<Focus>('corpo');
  const [gear, setGear] = useState<Equipment[]>([]);
  const [seed, setSeed] = useState(() => Date.now());
  const level = state.profile?.level ?? 1;
  const owned = state.profile?.equipment ?? [];

  const workout = useMemo(() => generateWorkout({ minutes, focus, equipment: gear, level, seed }), [minutes, focus, gear, level, seed]);

  return (
    <section className="card generator" id="rapido">
      <div className="section-title">
        <h2>⚡ Treino rápido</h2>
        <button className="btn btn-small btn-soft" onClick={() => setSeed(Date.now())}>
          🎲 Sortear outro
        </button>
      </div>
      <div className="gen-row">
        <span className="gen-label">Tempo</span>
        <div className="seg">
          {([10, 20, 30] as const).map((m) => (
            <button key={m} className={`seg-btn ${minutes === m ? 'on' : ''}`} onClick={() => setMinutes(m)}>
              {m} min
            </button>
          ))}
        </div>
      </div>
      <div className="gen-row">
        <span className="gen-label">Foco</span>
        <div className="chip-row">
          {(Object.keys(FOCUS_LABEL) as Focus[]).map((f) => (
            <button key={f} className={`chip chip-btn ${focus === f ? 'on' : ''}`} onClick={() => setFocus(f)}>
              {FOCUS_LABEL[f]}
            </button>
          ))}
        </div>
      </div>
      {owned.length > 0 && (
        <div className="gen-row">
          <span className="gen-label">Usar</span>
          <div className="chip-row">
            {owned.map((e) => (
              <button
                key={e}
                className={`chip chip-btn ${gear.includes(e) ? 'on' : ''}`}
                onClick={() => setGear((g) => (g.includes(e) ? g.filter((x) => x !== e) : [...g, e]))}
              >
                {EQUIPMENT_LABEL[e]}
              </button>
            ))}
          </div>
        </div>
      )}
      <ol className="gen-list">
        {workout.main.map((it, i) => {
          const ex = getExercise(it.exerciseId);
          return (
            <li key={i}>
              <Link to={`/exercicios/${ex.id}`}>{ex.name}</Link>
              <span className="muted">
                {it.sets}× {it.target}
                {ex.mode === 'time' ? 's' : ''}
                {ex.perSide ? ' /lado' : ''}
              </span>
            </li>
          );
        })}
      </ol>
      <button className="btn btn-primary btn-block" disabled={workout.main.length === 0} onClick={() => startWorkout(navigate, workout)}>
        Começar (~{estimateMinutes(workout)} min) ▶
      </button>
    </section>
  );
}

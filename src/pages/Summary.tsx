import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Mascot } from '../components/Mascot';
import { ProgressBar, formatMinutes } from '../components/ui';
import { getExercise } from '../data/exercises';
import { FINISH_PHRASES, pick } from '../data/phrases';
import { PROGRAM_MAP } from '../data/programs';
import { MISSION_MAP, levelInfo } from '../lib/gamification';
import { mascotProps } from '../lib/session';
import type { WorkoutLog } from '../lib/state';
import { useStore } from '../lib/store';

function useCountUp(target: number, ms = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

const RATINGS: { id: NonNullable<WorkoutLog['rating']>; label: string }[] = [
  { id: 'facil', label: '😌 Fácil' },
  { id: 'ok', label: '🙂 Na medida' },
  { id: 'dificil', label: '🥵 Difícil' },
];

export function Summary() {
  const { state, summary, rateLog } = useStore();
  const navigate = useNavigate();
  const xp = useCountUp(summary?.log.xp ?? 0);
  const [phrase] = useState(() => pick(FINISH_PHRASES, Math.floor(Math.random() * 100)));
  if (!summary) return <Navigate to="/" replace />;

  const { log } = summary;
  const info = levelInfo(state.xp);
  const leveledUp = summary.levelAfter > summary.levelBefore;
  const rating = state.history.find((h) => h.id === log.id)?.rating;
  const reps = log.sets.reduce((s, x) => (getExercise(x.exerciseId).mode === 'reps' ? s + x.value : s), 0);

  return (
    <div className="summary">
      {(leveledUp || summary.programCompleted) && <Confetti />}
      <div className="summary-hero">
        <Mascot {...mascotProps(state)} mood={leveledUp ? 'flex' : 'cheer'} size={170} />
        <h1>{summary.stageChanged ? `Evoluiu para ${info.stage.name}!` : leveledUp ? `Nível ${summary.levelAfter}!` : phrase}</h1>
        {summary.stageChanged && <p className="lead">{info.stage.blurb}</p>}
      </div>

      <div className="reward-row">
        <div className="reward">
          <span className="reward-value">+{xp}</span>
          <small>XP</small>
        </div>
        <div className="reward">
          <span className="reward-value">+{log.corn}</span>
          <small>🌽 milho</small>
        </div>
        <div className="reward">
          <span className="reward-value">🔥 {summary.streak}</span>
          <small>{summary.streak === 1 ? 'dia' : 'dias'} seguidos</small>
        </div>
      </div>
      {summary.streakBonus > 0 && <p className="small center muted">Inclui bônus de sequência de +{Math.round(summary.streakBonus * 100)}% 🔥</p>}

      <section className="card">
        <div className="section-title">
          <h2>Nível {info.level}</h2>
          <span className="small muted">
            {info.into}/{info.needed} XP
          </span>
        </div>
        <ProgressBar value={info.progress} tone="xp" label="XP" />
      </section>

      <section className="card stats-mini">
        <div>
          <strong>{formatMinutes(log.durationSec)}</strong>
          <small>duração</small>
        </div>
        <div>
          <strong>{log.sets.length}</strong>
          <small>séries</small>
        </div>
        <div>
          <strong>{reps}</strong>
          <small>repetições</small>
        </div>
      </section>

      {summary.programCompleted && log.programId && (
        <section className="card card-gold">
          <h2>🎓 Programa concluído!</h2>
          <p>Você terminou o {PROGRAM_MAP[log.programId]?.name}. Que orgulho desse frango!</p>
        </section>
      )}

      {summary.newRecords.length > 0 && (
        <section className="card">
          <h2>🏅 Novos recordes</h2>
          <ul className="bullets">
            {summary.newRecords.map((r) => {
              const ex = getExercise(r.exerciseId);
              return (
                <li key={r.exerciseId}>
                  {ex.name}: <strong>{r.value}</strong> {ex.mode === 'time' ? 's' : 'reps'}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {summary.unlocked.length > 0 && (
        <section className="card">
          <h2>Conquistas desbloqueadas</h2>
          <div className="badge-grid">
            {summary.unlocked.map((a) => (
              <div key={a.id} className="achievement on pop">
                <span className="achievement-icon">{a.icon}</span>
                <strong>{a.name}</strong>
                <small>{a.desc}</small>
              </div>
            ))}
          </div>
        </section>
      )}

      {summary.missionsReady.length > 0 && (
        <section className="card">
          <h2>🎯 Missões prontas para resgatar</h2>
          <ul className="bullets">
            {summary.missionsReady.map((id) => (
              <li key={id}>{MISSION_MAP[id]?.title}</li>
            ))}
          </ul>
        </section>
      )}

      {!log.recovery && (
        <section className="card">
          <h2>Como foi o treino?</h2>
          <div className="seg">
            {RATINGS.map((r) => (
              <button key={r.id} className={`seg-btn ${rating === r.id ? 'on' : ''}`} onClick={() => rateLog(log.id, r.id)}>
                {r.label}
              </button>
            ))}
          </div>
          {rating === 'facil' && <p className="small muted">Boa! No próximo treino use o botão "⬆ Mais difícil" nos exercícios que ficaram fáceis.</p>}
          {rating === 'dificil' && <p className="small muted">Normal no começo. Se algum exercício não sair, use "⬇ Mais fácil" — progredir devagar é progredir.</p>}
        </section>
      )}

      <button className="btn btn-primary btn-lg btn-block" onClick={() => navigate('/', { replace: true })}>
        Voltar ao início
      </button>
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => i);
  const emojis = ['🌽', '⭐', '🪶', '🎉', '🥚'];
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((i) => (
        <span
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            animationDelay: `${(i % 7) * 0.15}s`,
            animationDuration: `${2.2 + (i % 5) * 0.3}s`,
          }}
        >
          {emojis[i % emojis.length]}
        </span>
      ))}
    </div>
  );
}

import { Link, useNavigate } from 'react-router-dom';
import { Mascot, type Mood } from '../components/Mascot';
import { ProgressBar, StatusBar } from '../components/ui';
import { getExercise } from '../data/exercises';
import { TIPS, pick } from '../data/phrases';
import { PROGRAM_MAP } from '../data/programs';
import {
  MISSION_BONUS_CORN,
  MISSION_MAP,
  MISSION_REWARD,
  currentStreak,
  dayKey,
  levelInfo,
  weekProgress,
} from '../lib/gamification';
import { mascotProps, startWorkout } from '../lib/session';
import { useStore } from '../lib/store';
import { buildProgramWorkout, estimateMinutes, programSessionCount, recoveryWorkout } from '../lib/workout';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Boa madrugada';
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function Home() {
  const { state, claimMission, claimMissionBonus } = useStore();
  const navigate = useNavigate();
  const info = levelInfo(state.xp);
  const streak = currentStreak(state);
  const today = dayKey();
  const trainedToday = state.history.some((h) => dayKey(h.date) === today);
  const week = weekProgress(state);
  const goal = state.profile?.daysPerWeek ?? 3;

  const program = state.activeProgramId ? PROGRAM_MAP[state.activeProgramId] : null;
  const done = program ? state.programProgress[program.id] ?? 0 : 0;
  const total = program ? programSessionCount(program) : 0;
  const finished = program && done >= total;
  const next = program && !finished ? buildProgramWorkout(program, done, state.settings.warmup) : null;

  const mood: Mood = trainedToday ? 'happy' : streak === 0 && state.history.length > 0 ? 'tired' : 'idle';
  const allClaimed = state.missions.items.length > 0 && state.missions.items.every((m) => m.claimed);
  const tip = pick(TIPS, Number(today.replaceAll('-', '')));

  return (
    <div className="home">
      <StatusBar />

      <section className="hero card card-hero">
        <div className="hero-text">
          <p className="muted">{greeting()},</p>
          <h1>{state.profile?.name}!</h1>
          <p className="hero-stage">
            {info.stage.name} · Nível {info.level}
          </p>
          <ProgressBar value={info.progress} tone="xp" label="XP para o próximo nível" />
          <p className="small muted">
            {info.into}/{info.needed} XP para o nível {info.level + 1}
          </p>
        </div>
        <Link to="/galinheiro" className="hero-mascot" aria-label="Abrir galinheiro">
          <Mascot {...mascotProps(state)} mood={mood} size={130} />
        </Link>
      </section>

      <section className="card today">
        <div className="section-title">
          <h2>{trainedToday ? 'Treino feito hoje! ✅' : 'Treino de hoje'}</h2>
          {program && (
            <Link to={`/treinos/${program.id}`} className="link">
              {program.emoji} {program.name}
            </Link>
          )}
        </div>

        {next && (
          <>
            <h3 className="today-title">{next.title}</h3>
            <p className="muted small">
              {next.subtitle} · ~{estimateMinutes(next)} min
            </p>
            <div className="chip-row">
              {next.main.map((it, i) => (
                <span className="chip" key={i}>
                  {getExercise(it.exerciseId).name}
                </span>
              ))}
            </div>
            <ProgressBar value={done / total} label="Progresso no programa" tone="good" />
            <button className="btn btn-primary btn-lg btn-block" onClick={() => startWorkout(navigate, next)}>
              {trainedToday ? 'Treinar de novo' : 'Começar treino'} ▶
            </button>
          </>
        )}

        {finished && (
          <div className="empty">
            <p>🎓 Você concluiu o programa {program.name}! Escolha o próximo desafio.</p>
            <Link className="btn btn-primary" to="/treinos">
              Ver programas
            </Link>
          </div>
        )}

        {!program && (
          <div className="empty">
            <p>Você ainda não escolheu um programa. Escolha um ou faça um treino rápido.</p>
            <Link className="btn btn-primary" to="/treinos">
              Escolher programa
            </Link>
          </div>
        )}

        <div className="quick-row">
          <Link className="btn btn-soft" to="/treinos#rapido">
            ⚡ Treino rápido
          </Link>
          <button className="btn btn-soft" onClick={() => startWorkout(navigate, recoveryWorkout(), { recovery: true })}>
            🧘 Recuperação ativa
          </button>
        </div>
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Meta da semana</h2>
          <span className="muted small">
            {Math.min(week, goal)}/{goal} treinos
          </span>
        </div>
        <WeekDots />
        <p className="small muted">
          {week >= goal ? 'Meta batida! Descanse ou faça uma Recuperação Ativa. 🎉' : `Faltam ${goal - week} treinos para bater a meta.`}
        </p>
      </section>

      <section className="card missions">
        <div className="section-title">
          <h2>Missões do dia</h2>
          <span className="muted small">renovam à meia-noite</span>
        </div>
        <ul className="mission-list">
          {state.missions.items.map((m) => {
            const def = MISSION_MAP[m.id];
            if (!def) return null;
            const ready = m.progress >= def.target;
            return (
              <li key={m.id} className={`mission ${m.claimed ? 'claimed' : ready ? 'ready' : ''}`}>
                <span className="mission-icon">{def.icon}</span>
                <div className="mission-body">
                  <strong>{def.title}</strong>
                  <ProgressBar value={m.progress / def.target} label={def.title} />
                  <small className="muted">
                    {Math.min(m.progress, def.target)}/{def.target} · +{MISSION_REWARD.xp} XP · +{MISSION_REWARD.corn} 🌽
                  </small>
                </div>
                {m.claimed ? (
                  <span className="mission-done" aria-label="Resgatada">
                    ✓
                  </span>
                ) : (
                  <button className="btn btn-small btn-primary" disabled={!ready} onClick={() => claimMission(m.id)}>
                    Pegar
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {allClaimed && !state.missions.bonusClaimed && (
          <button className="btn btn-gold btn-block" onClick={claimMissionBonus}>
            🎁 Bônus de missões completas: +{MISSION_BONUS_CORN} 🌽
          </button>
        )}
      </section>

      <section className="card tip">
        <span className="tip-icon">💡</span>
        <p>{tip}</p>
      </section>
    </div>
  );
}

function WeekDots() {
  const { state } = useStore();
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const trained = new Set(state.history.filter((h) => !h.recovery).map((h) => dayKey(h.date)));
  const recovered = new Set(state.history.filter((h) => h.recovery).map((h) => dayKey(h.date)));
  const labels = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
  const today = dayKey(now);
  return (
    <div className="week-dots">
      {labels.map((l, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const k = dayKey(d);
        const cls = trained.has(k) ? 'done' : recovered.has(k) || state.frozenDays.includes(k) ? 'soft' : '';
        return (
          <div key={i} className={`week-dot ${cls} ${k === today ? 'today' : ''}`}>
            <span className="week-dot-circle">{trained.has(k) ? '🔥' : recovered.has(k) ? '🧘' : state.frozenDays.includes(k) ? '🛡️' : ''}</span>
            <small>{l}</small>
          </div>
        );
      })}
    </div>
  );
}

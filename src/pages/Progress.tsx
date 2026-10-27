import { Link } from 'react-router-dom';
import { PageHeader, StatusBar, formatMinutes } from '../components/ui';
import { getExercise, EXERCISE_MAP } from '../data/exercises';
import { ACHIEVEMENTS, addDays, bestStreak, currentStreak, dayKey, lifetimeTotals } from '../lib/gamification';
import { useStore } from '../lib/store';

const WEEKS = 16;

export function Progress() {
  const { state } = useStore();
  const totals = lifetimeTotals(state.history);
  const streak = currentStreak(state);
  const best = bestStreak(state);
  const unlocked = ACHIEVEMENTS.filter((a) => state.achievements[a.id]).length;
  const records = Object.entries(state.records)
    .filter(([id]) => EXERCISE_MAP[id])
    .sort((a, b) => b[1].date.localeCompare(a[1].date));
  const history = [...state.history].reverse().slice(0, 30);

  return (
    <div>
      <StatusBar />
      <PageHeader title="Progresso" />

      <div className="stat-grid">
        <Stat icon="🏋️" value={totals.workouts} label="treinos" />
        <Stat icon="⏱️" value={formatMinutes(totals.seconds)} label="treinando" />
        <Stat icon="🔥" value={streak} label={`sequência (recorde ${best})`} />
        <Stat icon="🏅" value={`${unlocked}/${ACHIEVEMENTS.length}`} label="conquistas" />
        <Stat icon="💪" value={totals.push} label="reps de empurrar" />
        <Stat icon="🦵" value={totals.legs} label="reps de pernas" />
        <Stat icon="🪢" value={totals.pull} label="reps de puxar" />
        <Stat icon="🧱" value={totals.core} label="core (reps + s)" />
      </div>

      <section className="card">
        <h2>Calendário</h2>
        <Heatmap />
        <div className="legend small muted">
          <span>
            <i className="heat-cell l0" /> nada
          </span>
          <span>
            <i className="heat-cell soft" /> recuperação/protegido
          </span>
          <span>
            <i className="heat-cell l2" /> treino
          </span>
        </div>
      </section>

      <section className="card">
        <div className="section-title">
          <h2>📋 Teste do Frango</h2>
          <Link to="/teste" className="btn btn-small btn-primary">
            Fazer teste
          </Link>
        </div>
        <p className="small muted">Flexões máximas, agachamentos em 1 minuto e prancha máxima. Repita a cada 4 semanas para ver sua evolução.</p>
        {state.tests.length === 0 ? (
          <p className="empty small">Nenhum teste ainda.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Flexões</th>
                <th>Agach./min</th>
                <th>Prancha</th>
              </tr>
            </thead>
            <tbody>
              {[...state.tests].reverse().map((t, i, arr) => {
                const prev = arr[i + 1];
                const delta = (a: number, b?: number) => (b === undefined || a === b ? '' : a > b ? ` ▲${a - b}` : ` ▼${b - a}`);
                return (
                  <tr key={t.date}>
                    <td>{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                    <td>
                      {t.pushups}
                      <small className="delta">{delta(t.pushups, prev?.pushups)}</small>
                    </td>
                    <td>
                      {t.squats}
                      <small className="delta">{delta(t.squats, prev?.squats)}</small>
                    </td>
                    <td>
                      {t.plankSec}s<small className="delta">{delta(t.plankSec, prev?.plankSec)}</small>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h2>🏅 Recordes pessoais</h2>
        {records.length === 0 ? (
          <p className="empty small">Complete um treino para registrar seus recordes.</p>
        ) : (
          <ul className="record-list">
            {records.map(([id, r]) => {
              const ex = getExercise(id);
              return (
                <li key={id}>
                  <Link to={`/exercicios/${id}`}>{ex.name}</Link>
                  <strong>
                    {r.value} {ex.mode === 'time' ? 's' : 'reps'}
                  </strong>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Conquistas</h2>
        <div className="badge-grid">
          {ACHIEVEMENTS.map((a) => {
            const on = !!state.achievements[a.id];
            return (
              <div key={a.id} className={`achievement ${on ? 'on' : ''}`} title={a.desc}>
                <span className="achievement-icon">{on ? a.icon : '🔒'}</span>
                <strong>{a.name}</strong>
                <small>{a.desc}</small>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <h2>Histórico</h2>
        {history.length === 0 ? (
          <p className="empty small">Seu histórico aparece aqui depois do primeiro treino. 🥚</p>
        ) : (
          <ul className="history">
            {history.map((h) => (
              <li key={h.id}>
                <div>
                  <strong>
                    {h.recovery ? '🧘 ' : ''}
                    {h.title}
                  </strong>
                  <small className="muted">
                    {new Date(h.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })} ·{' '}
                    {formatMinutes(h.durationSec)} · {h.sets.length} séries
                  </small>
                </div>
                <span className="history-xp">+{h.xp} XP</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <div className="stat">
      <span className="stat-icon">{icon}</span>
      <strong>{value}</strong>
      <small>{label}</small>
    </div>
  );
}

function Heatmap() {
  const { state } = useStore();
  const counts = new Map<string, number>();
  const soft = new Set(state.frozenDays);
  for (const h of state.history) {
    const k = dayKey(h.date);
    if (h.recovery) soft.add(k);
    else counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const today = dayKey();
  const now = new Date();
  // começa numa segunda-feira, WEEKS semanas atrás
  const start = addDays(today, -((now.getDay() + 6) % 7) - (WEEKS - 1) * 7);
  const cells = Array.from({ length: WEEKS * 7 }, (_, i) => addDays(start, i));
  return (
    <div className="heatmap" style={{ gridTemplateColumns: `repeat(${WEEKS}, 1fr)` }}>
      {cells.map((k) => {
        const n = counts.get(k) ?? 0;
        const cls = k > today ? 'future' : n >= 2 ? 'l3' : n === 1 ? 'l2' : soft.has(k) ? 'soft' : 'l0';
        return <i key={k} className={`heat-cell ${cls} ${k === today ? 'today' : ''}`} title={`${k}${n ? ` · ${n} treino(s)` : ''}`} />;
      })}
    </div>
  );
}

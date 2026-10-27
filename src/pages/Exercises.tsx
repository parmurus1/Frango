import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExerciseFigure } from '../components/ExerciseFigure';
import { DifficultyEggs, PageHeader, StatusBar } from '../components/ui';
import { EXERCISES } from '../data/exercises';
import { CATEGORY_ICON, CATEGORY_LABEL, EQUIPMENT_LABEL, type Category } from '../data/types';

const CATS = Object.keys(CATEGORY_LABEL) as Category[];

function normalize(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function Exercises() {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<Category | 'todos'>('todos');
  const [noGear, setNoGear] = useState(false);
  const [hover, setHover] = useState<string | null>(null);

  const list = useMemo(() => {
    const q = normalize(query.trim());
    return EXERCISES.filter(
      (e) =>
        (cat === 'todos' || e.category === cat) &&
        (!noGear || e.equipment.length === 0) &&
        (!q || normalize(`${e.name} ${e.muscles.join(' ')}`).includes(q)),
    );
  }, [query, cat, noGear]);

  return (
    <div>
      <StatusBar />
      <PageHeader title="Exercícios" />
      <p className="muted">{EXERCISES.length} exercícios com animação, passo a passo, dicas e erros comuns.</p>

      <div className="filters">
        <input
          className="input"
          type="search"
          placeholder="Buscar por nome ou músculo…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="chip-row scroll-x">
          <button className={`chip chip-btn ${cat === 'todos' ? 'on' : ''}`} onClick={() => setCat('todos')}>
            Todos
          </button>
          {CATS.map((c) => (
            <button key={c} className={`chip chip-btn ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>
              {CATEGORY_ICON[c]} {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
        <label className="toggle-inline">
          <input type="checkbox" checked={noGear} onChange={(e) => setNoGear(e.target.checked)} />
          Só sem equipamento
        </label>
      </div>

      <div className="exercise-grid">
        {list.map((e) => (
          <Link
            key={e.id}
            to={`/exercicios/${e.id}`}
            className="card exercise-card"
            onMouseEnter={() => setHover(e.id)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(e.id)}
            onBlur={() => setHover(null)}
          >
            <ExerciseFigure anim={e.anim} playing={hover === e.id} label={`Demonstração: ${e.name}`} />
            <div className="exercise-card-body">
              <strong>{e.name}</strong>
              <div className="exercise-card-meta">
                <span className="small muted">
                  {CATEGORY_ICON[e.category]} {CATEGORY_LABEL[e.category]}
                </span>
                <DifficultyEggs value={e.difficulty} />
              </div>
              {e.equipment.length > 0 && <span className="chip chip-small">{e.equipment.map((q) => EQUIPMENT_LABEL[q]).join(' + ')}</span>}
            </div>
          </Link>
        ))}
        {list.length === 0 && <p className="empty">Nenhum exercício encontrado. Tente outra busca. 🐔</p>}
      </div>
    </div>
  );
}

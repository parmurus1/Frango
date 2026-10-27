import { useEffect, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { DIFFICULTY_LABEL, type Difficulty } from '../data/types';
import { currentStreak, levelInfo } from '../lib/gamification';
import { useStore } from '../lib/store';

export function BottomNav() {
  const links = [
    { to: '/', label: 'Início', icon: '🏠' },
    { to: '/treinos', label: 'Treinos', icon: '🏋️' },
    { to: '/exercicios', label: 'Exercícios', icon: '📖' },
    { to: '/progresso', label: 'Progresso', icon: '📈' },
    { to: '/galinheiro', label: 'Galinheiro', icon: '🐔' },
  ];
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {links.map((l) => (
        <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon" aria-hidden>
            {l.icon}
          </span>
          <span className="nav-label">{l.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

/** Barra superior com nível, milho e sequência. */
export function StatusBar() {
  const { state } = useStore();
  const info = levelInfo(state.xp);
  const streak = currentStreak(state);
  return (
    <div className="status-bar">
      <NavLink to="/galinheiro" className="pill pill-level" aria-label={`Nível ${info.level}`}>
        <span className="pill-icon">⭐</span> Nv {info.level}
      </NavLink>
      <NavLink to="/progresso" className={`pill pill-streak ${streak > 0 ? 'on' : ''}`} aria-label={`Sequência de ${streak} dias`}>
        <span className="pill-icon">🔥</span> {streak}
      </NavLink>
      <NavLink to="/galinheiro" className="pill pill-corn" aria-label={`${state.corn} milhos`}>
        <span className="pill-icon">🌽</span> {state.corn}
      </NavLink>
      {state.freezes > 0 && (
        <span className="pill pill-freeze" title="Ovos Protetores">
          <span className="pill-icon">🛡️</span> {state.freezes}
        </span>
      )}
    </div>
  );
}

export function PageHeader({ title, back, right }: { title: string; back?: boolean | string; right?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <header className="page-header">
      {back && (
        <button
          className="icon-btn"
          aria-label="Voltar"
          onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
        >
          ←
        </button>
      )}
      <h1>{title}</h1>
      <div className="page-header-right">{right}</div>
    </header>
  );
}

export function ProgressBar({ value, label, tone = 'brand' }: { value: number; label?: string; tone?: 'brand' | 'xp' | 'good' }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className={`progress progress-${tone}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function DifficultyEggs({ value, showLabel = false }: { value: Difficulty; showLabel?: boolean }) {
  return (
    <span className="eggs" title={`Dificuldade: ${DIFFICULTY_LABEL[value]}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`egg ${i <= value ? 'on' : ''}`} aria-hidden>
          ●
        </span>
      ))}
      {showLabel && <span className="eggs-label">{DIFFICULTY_LABEL[value]}</span>}
      <span className="sr-only">Dificuldade {value} de 5</span>
    </span>
  );
}

export function Toasts() {
  const { toasts, dismissToast } = useStore();
  const first = toasts[0];
  useEffect(() => {
    if (!first) return;
    const t = setTimeout(() => dismissToast(first.id), 3500);
    return () => clearTimeout(t);
  }, [first, dismissToast]);
  if (!first) return null;
  return (
    <div className="toast" role="status" onClick={() => dismissToast(first.id)}>
      <span className="toast-icon">{first.icon}</span>
      <div>
        <strong>{first.title}</strong>
        {first.text && <p>{first.text}</p>}
      </div>
    </div>
  );
}

export function Stepper({ value, onChange, min = 0, max = 999, step = 1, unit }: { value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number; unit?: string }) {
  return (
    <div className="stepper">
      <button className="stepper-btn" aria-label="Diminuir" onClick={() => onChange(Math.max(min, value - step))}>
        −
      </button>
      <div className="stepper-value">
        <span>{value}</span>
        {unit && <small>{unit}</small>}
      </div>
      <button className="stepper-btn" aria-label="Aumentar" onClick={() => onChange(Math.min(max, value + step))}>
        +
      </button>
    </div>
  );
}

export function Ring({ value, size = 120, stroke = 10, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(1, Math.max(0, value));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" />
        <circle
          className="ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-content">{children}</div>
    </div>
  );
}

export function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatMinutes(sec: number) {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}min`;
}

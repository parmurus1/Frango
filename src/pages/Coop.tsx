import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mascot, type Mood } from '../components/Mascot';
import { PageHeader, ProgressBar, StatusBar } from '../components/ui';
import { MAX_FREEZES, SHOP, STAGES, levelInfo, type ShopItem, type Slot } from '../lib/gamification';
import { mascotProps } from '../lib/session';
import { useStore } from '../lib/store';

const SLOT_LABEL: Record<Slot, string> = {
  consumable: 'Proteção',
  head: 'Cabeça',
  face: 'Rosto',
  neck: 'Pescoço',
  back: 'Costas',
  color: 'Cor das penas',
};

const MOODS: Mood[] = ['idle', 'happy', 'flex', 'cheer', 'sleep'];

export function Coop() {
  const { state, buy, equip } = useStore();
  const info = levelInfo(state.xp);
  const [mood, setMood] = useState(0);
  const [preview, setPreview] = useState<ShopItem | null>(null);
  const props = mascotProps(state);

  // pré-visualização: veste o item temporariamente
  const shown = preview
    ? preview.slot === 'color'
      ? { ...props, color: preview.id }
      : preview.slot === 'consumable'
        ? props
        : { ...props, equipped: { ...props.equipped, [preview.slot]: preview.id } }
    : props;

  const slots: Slot[] = ['consumable', 'head', 'face', 'neck', 'back', 'color'];

  return (
    <div className="coop">
      <StatusBar />
      <PageHeader
        title="Galinheiro"
        right={
          <Link to="/ajustes" className="icon-btn" aria-label="Configurações">
            ⚙️
          </Link>
        }
      />

      <section className="card coop-hero">
        <button className="coop-mascot" onClick={() => setMood((m) => (m + 1) % MOODS.length)} aria-label="Fazer carinho no frango">
          <Mascot {...shown} mood={MOODS[mood]} size={200} />
        </button>
        <h2>{info.stage.name}</h2>
        <p className="muted small">{info.stage.blurb}</p>
        <ProgressBar value={info.progress} tone="xp" label="XP" />
        <p className="small muted">
          Nível {info.level} · {info.into}/{info.needed} XP
        </p>
        {preview && (
          <p className="small preview-note">
            Provando: <strong>{preview.name}</strong>{' '}
            <button className="link-btn" onClick={() => setPreview(null)}>
              tirar
            </button>
          </p>
        )}
      </section>

      <section className="card">
        <h2>Evolução</h2>
        <ol className="evolution">
          {STAGES.map((s) => {
            const reached = info.level >= s.minLevel;
            return (
              <li key={s.id} className={`${reached ? 'reached' : ''} ${info.stage.id === s.id ? 'current' : ''}`}>
                <div className="evo-mascot">{reached ? <Mascot stage={s.id} size={56} /> : <span className="evo-lock">?</span>}</div>
                <strong>{s.name}</strong>
                <small>Nv {s.minLevel}</small>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="shop">
        <div className="section-title">
          <h2>Loja</h2>
          <span className="pill pill-corn">🌽 {state.corn}</span>
        </div>
        <p className="small muted">Ganhe milho treinando, completando missões e desbloqueando conquistas. Toque num item para provar.</p>
        {slots.map((slot) => (
          <div key={slot} className="shop-section">
            <h3>{SLOT_LABEL[slot]}</h3>
            <div className="shop-grid">
              {SHOP.filter((i) => i.slot === slot).map((item) => {
                const owned = state.owned.includes(item.id);
                const locked = !!item.minLevel && info.level < item.minLevel;
                const equipped =
                  slot !== 'consumable' && (state.equipped as Record<string, string | undefined>)[slot] === item.id;
                const full = item.slot === 'consumable' && state.freezes >= MAX_FREEZES;
                return (
                  <div
                    key={item.id}
                    className={`shop-item ${owned ? 'owned' : ''} ${equipped ? 'equipped' : ''} ${locked ? 'locked' : ''}`}
                    onMouseEnter={() => !owned && setPreview(item)}
                    onClick={() => setPreview(item)}
                  >
                    <strong>{item.name}</strong>
                    <small>{item.desc}</small>
                    {item.slot === 'consumable' ? (
                      <button
                        className="btn btn-small btn-gold"
                        disabled={full || state.corn < item.price}
                        onClick={(e) => {
                          e.stopPropagation();
                          buy(item.id);
                        }}
                      >
                        {full ? `Máximo (${state.freezes})` : `🌽 ${item.price} · tem ${state.freezes}`}
                      </button>
                    ) : owned ? (
                      <button
                        className={`btn btn-small ${equipped ? 'btn-soft' : 'btn-primary'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreview(null);
                          equip(slot as Exclude<Slot, 'consumable'>, equipped ? null : item.id);
                        }}
                      >
                        {equipped ? 'Tirar' : 'Usar'}
                      </button>
                    ) : locked ? (
                      <span className="small muted">🔒 Nível {item.minLevel}</span>
                    ) : (
                      <button
                        className="btn btn-small btn-gold"
                        disabled={state.corn < item.price}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (buy(item.id)) setPreview(null);
                        }}
                      >
                        🌽 {item.price}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

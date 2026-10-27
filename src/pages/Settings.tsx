import { useRef, useState } from 'react';
import { PageHeader } from '../components/ui';
import { EQUIPMENT_LABEL, type Equipment } from '../data/types';
import { beep, speak } from '../lib/feedback';
import type { Settings as SettingsT } from '../lib/state';
import { useStore } from '../lib/store';

const LEVEL_LABEL = ['', 'Iniciante absoluto', 'Iniciante', 'Intermediário', 'Avançado', 'Elite'];

export function Settings() {
  const { state, updateProfile, updateSettings, importData, reset } = useStore();
  const profile = state.profile!;
  const s = state.settings;
  const file = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const toggle = (key: keyof Omit<SettingsT, 'theme'>, label: string, hint: string, test?: () => void) => (
    <label className="setting">
      <div>
        <strong>{label}</strong>
        <small>{hint}</small>
      </div>
      <input
        type="checkbox"
        className="switch"
        checked={s[key]}
        onChange={(e) => {
          updateSettings({ [key]: e.target.checked });
          if (e.target.checked) test?.();
        }}
      />
    </label>
  );

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `frango-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onImport = async (f: File | undefined) => {
    if (!f) return;
    const ok = importData(await f.text());
    setMessage(ok ? 'Backup restaurado! 🐔' : 'Arquivo inválido.');
  };

  const toggleEq = (e: Equipment) =>
    updateProfile({ equipment: profile.equipment.includes(e) ? profile.equipment.filter((x) => x !== e) : [...profile.equipment, e] });

  return (
    <div className="settings">
      <PageHeader title="Configurações" back />

      <section className="card">
        <h2>Perfil</h2>
        <label className="field">
          <span>Nome</span>
          <input className="input" value={profile.name} maxLength={24} onChange={(e) => updateProfile({ name: e.target.value })} />
        </label>
        <label className="field">
          <span>Nível de força: {LEVEL_LABEL[profile.level]}</span>
          <input type="range" min={1} max={5} value={profile.level} onChange={(e) => updateProfile({ level: Number(e.target.value) })} />
          <small className="muted">Usado pelo gerador de treino rápido para escolher exercícios e repetições.</small>
        </label>
        <div className="field">
          <span>Meta de treinos por semana</span>
          <div className="seg">
            {[2, 3, 4, 5, 6].map((d) => (
              <button key={d} className={`seg-btn ${profile.daysPerWeek === d ? 'on' : ''}`} onClick={() => updateProfile({ daysPerWeek: d })}>
                {d}x
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span>Equipamentos que você tem</span>
          <div className="chip-row">
            {(Object.keys(EQUIPMENT_LABEL) as Equipment[]).map((e) => (
              <button key={e} className={`chip chip-btn ${profile.equipment.includes(e) ? 'on' : ''}`} onClick={() => toggleEq(e)}>
                {EQUIPMENT_LABEL[e]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Treino</h2>
        {toggle('warmup', 'Aquecimento e alongamento', 'Inclui 2 min de aquecimento antes e alongamento depois dos programas.')}
        {toggle('sound', 'Sons', 'Bipes na contagem regressiva e no fim do descanso.', () => beep('done'))}
        {toggle('voice', 'Voz do treinador', 'Fala o nome do exercício e o descanso (usa a voz do aparelho).', () => speak('Bora, frango!'))}
        {toggle('vibration', 'Vibração', 'Vibra quando o tempo acaba (no celular).')}
      </section>

      <section className="card">
        <h2>Aparência</h2>
        <div className="seg">
          {(
            [
              ['auto', 'Automático'],
              ['light', 'Claro'],
              ['dark', 'Escuro'],
            ] as const
          ).map(([id, label]) => (
            <button key={id} className={`seg-btn ${s.theme === id ? 'on' : ''}`} onClick={() => updateSettings({ theme: id })}>
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Seus dados</h2>
        <p className="small muted">Tudo fica salvo só neste aparelho. Faça um backup para trocar de celular ou não perder nada.</p>
        <div className="btn-row">
          <button className="btn btn-soft" onClick={exportData}>
            ⬇ Exportar backup
          </button>
          <button className="btn btn-soft" onClick={() => file.current?.click()}>
            ⬆ Importar backup
          </button>
          <input ref={file} type="file" accept="application/json" hidden onChange={(e) => onImport(e.target.files?.[0])} />
        </div>
        {message && <p className="small">{message}</p>}
        {confirmReset ? (
          <div className="danger-zone">
            <p>
              <strong>Tem certeza?</strong> Isso apaga XP, histórico, itens e conquistas. Não dá para desfazer.
            </p>
            <div className="btn-row">
              <button className="btn btn-danger" onClick={reset}>
                Apagar tudo
              </button>
              <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button className="btn btn-ghost btn-danger-text" onClick={() => setConfirmReset(true)}>
            Recomeçar do ovo (apagar dados)
          </button>
        )}
      </section>

      <section className="card about">
        <h2>Sobre</h2>
        <p className="small">
          <strong>Frango</strong> é um app de calistenia em casa, gratuito e sem anúncios. Funciona offline e pode ser instalado na tela
          inicial do celular ("Adicionar à tela de início").
        </p>
        <p className="disclaimer">
          ⚠️ As orientações do app são educativas e não substituem um profissional de educação física ou de saúde. Se tiver dor, lesão ou
          alguma condição médica, procure orientação antes de treinar. Pare se sentir dor aguda, tontura ou falta de ar fora do normal.
        </p>
      </section>
    </div>
  );
}

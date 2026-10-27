import { useState } from 'react';
import { CloudSync } from '../components/CloudSync';
import { Mascot } from '../components/Mascot';
import { PROGRAM_MAP } from '../data/programs';
import { EQUIPMENT_LABEL, type Equipment } from '../data/types';
import type { Goal } from '../lib/state';
import { useStore } from '../lib/store';

const GOALS: { id: Goal; icon: string; title: string; text: string }[] = [
  { id: 'comecar', icon: '🌱', title: 'Começar do zero', text: 'Criar o hábito e sair do sedentarismo' },
  { id: 'forca', icon: '💪', title: 'Ganhar força', text: 'Ficar mais forte e definido' },
  { id: 'emagrecer', icon: '🔥', title: 'Condicionamento', text: 'Mais fôlego e queimar calorias' },
  { id: 'habilidades', icon: '🤸', title: 'Habilidades', text: 'Barra, parada de mãos e afins' },
];

const LEVELS = [
  { level: 1, title: 'Nenhuma ainda', text: 'Tudo bem! É para isso que o Frangão existe.' },
  { level: 2, title: '1 a 5 flexões', text: 'Já tem uma base para construir.' },
  { level: 3, title: '6 a 15 flexões', text: 'Você está no caminho certo.' },
  { level: 4, title: 'Mais de 15', text: 'Pronto para coisas avançadas.' },
];

/** Recomenda um programa de acordo com as respostas. */
export function recommendProgram(level: number, equipment: Equipment[], goal: Goal) {
  if (level <= 1) return 'do-ovo-ao-pintinho';
  if (goal === 'habilidades' && level >= 4) return 'rumo-a-parada';
  if (equipment.includes('barra') && (goal === 'forca' || goal === 'habilidades')) return 'rumo-a-barra';
  if (equipment.includes('mesa') || equipment.includes('toalha')) return 'casa-adaptada';
  if (goal === 'emagrecer' && level <= 2) return 'expresso';
  return 'frango-raiz';
}

export function Onboarding() {
  const { onboard, cloud } = useStore();
  const [restoring, setRestoring] = useState(false);
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<Goal>('comecar');
  const [level, setLevel] = useState(1);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [days, setDays] = useState(3);

  const program = PROGRAM_MAP[recommendProgram(level, equipment, goal)];
  const toggleEq = (e: Equipment) => setEquipment((list) => (list.includes(e) ? list.filter((x) => x !== e) : [...list, e]));

  const finish = (withProgram: boolean) =>
    onboard(
      { name: name.trim() || 'Frango', goal, level, equipment, daysPerWeek: days, createdAt: new Date().toISOString() },
      withProgram ? program.id : null,
    );

  const steps = [
    <div className="onb-step onb-hero" key="hello">
      <Mascot stage="ovo" mood="happy" size={190} />
      <h1>
        Bem-vindo ao <span className="brand">Frangão</span>!
      </h1>
      <p className="lead">
        Calistenia em casa, do zero, sem precisar de academia nem de barra. Você treina, ganha XP e milho, e o seu ovo vai
        chocar, virar pintinho, frango… até virar <strong>Galo Lendário</strong>.
      </p>
      <button className="btn btn-primary btn-lg" onClick={() => setStep(1)}>
        Bora começar 🐣
      </button>
      {cloud.configured && (
        <button className="btn btn-ghost" onClick={() => setRestoring(true)}>
          Já uso o Frangão em outro aparelho
        </button>
      )}
    </div>,

    <div className="onb-step" key="name">
      <h2>Como posso te chamar?</h2>
      <input
        className="input input-lg"
        value={name}
        maxLength={24}
        placeholder="Seu nome ou apelido"
        autoFocus
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && setStep(2)}
      />
      <h2>Qual é o seu objetivo?</h2>
      <div className="choice-grid">
        {GOALS.map((g) => (
          <button key={g.id} className={`choice ${goal === g.id ? 'selected' : ''}`} onClick={() => setGoal(g.id)}>
            <span className="choice-icon">{g.icon}</span>
            <strong>{g.title}</strong>
            <small>{g.text}</small>
          </button>
        ))}
      </div>
    </div>,

    <div className="onb-step" key="level">
      <h2>Quantas flexões no chão você consegue fazer seguidas?</h2>
      <p className="muted">Seja sincero: é isso que define por onde começar. Joelho no chão não conta aqui.</p>
      <div className="choice-list">
        {LEVELS.map((l) => (
          <button key={l.level} className={`choice row ${level === l.level ? 'selected' : ''}`} onClick={() => setLevel(l.level)}>
            <strong>{l.title}</strong>
            <small>{l.text}</small>
          </button>
        ))}
      </div>
    </div>,

    <div className="onb-step" key="equip">
      <h2>O que você tem em casa?</h2>
      <p className="muted">
        Não tem nada? Perfeito — todo o Frangão funciona <strong>sem equipamento nenhum</strong>. Marque só se quiser variações extras.
      </p>
      <div className="choice-list">
        {(Object.keys(EQUIPMENT_LABEL) as Equipment[]).map((e) => (
          <button key={e} className={`choice row check ${equipment.includes(e) ? 'selected' : ''}`} onClick={() => toggleEq(e)}>
            <span className="checkbox" aria-hidden>
              {equipment.includes(e) ? '✓' : ''}
            </span>
            <strong>{EQUIPMENT_LABEL[e]}</strong>
          </button>
        ))}
      </div>
      <h2>Quantos dias por semana quer treinar?</h2>
      <div className="seg">
        {[2, 3, 4, 5].map((d) => (
          <button key={d} className={`seg-btn ${days === d ? 'on' : ''}`} onClick={() => setDays(d)}>
            {d}x
          </button>
        ))}
      </div>
    </div>,

    <div className="onb-step onb-hero" key="result">
      <Mascot stage="ovo" mood="cheer" size={150} />
      <h2>Seu plano, {name.trim() || 'Frango'}:</h2>
      <div className="card program-reco">
        <div className="program-emoji">{program.emoji}</div>
        <h3>{program.name}</h3>
        <p>{program.tagline}</p>
        <p className="muted small">
          {program.weeks} semanas · {program.perWeek}x por semana · ~{program.minutes} min
        </p>
      </div>
      <button className="btn btn-primary btn-lg" onClick={() => finish(true)}>
        Começar esse programa
      </button>
      <button className="btn btn-ghost" onClick={() => finish(false)}>
        Prefiro escolher depois
      </button>
      <p className="disclaimer">
        ⚠️ Se você tem alguma condição de saúde, dor ou lesão, consulte um profissional antes de começar. Pare o exercício se sentir
        dor aguda, tontura ou falta de ar fora do normal.
      </p>
    </div>,
  ];

  if (restoring) {
    return (
      <div className="onboarding">
        <div className="onb-top">
          <button className="icon-btn" aria-label="Voltar" onClick={() => setRestoring(false)}>
            ←
          </button>
        </div>
        <div className="onb-step">
          <h2>Entrar na sua conta</h2>
          <CloudSync />
          {cloud.email && cloud.status !== 'syncing' && (
            <>
              <p className="small muted">
                {cloud.status === 'error'
                  ? 'Não deu para baixar seu progresso agora.'
                  : 'Essa conta ainda não tem progresso salvo. Monte seu plano e ele fica guardado nela.'}
              </p>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => {
                  setRestoring(false);
                  setStep(1);
                }}
              >
                Montar meu plano
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding">
      {step > 0 && (
        <div className="onb-top">
          <button className="icon-btn" aria-label="Voltar" onClick={() => setStep(step - 1)}>
            ←
          </button>
          <div className="onb-dots">
            {steps.slice(1).map((_, i) => (
              <span key={i} className={`dot ${i + 1 <= step ? 'on' : ''}`} />
            ))}
          </div>
        </div>
      )}
      {steps[step]}
      {step > 0 && step < steps.length - 1 && (
        <div className="onb-actions">
          <button className="btn btn-primary btn-lg" onClick={() => setStep(step + 1)}>
            Continuar
          </button>
        </div>
      )}
    </div>
  );
}

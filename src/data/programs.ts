import type { Program, WorkoutItem } from './types';

const it = (exerciseId: string, sets: number, target: number, rest: number, inc = 0) => ({
  exerciseId,
  sets,
  target,
  rest,
  inc,
});

export const WARMUP: WorkoutItem[] = [
  { exerciseId: 'polichinelo', sets: 1, target: 30, rest: 10 },
  { exerciseId: 'rotacao-bracos', sets: 1, target: 30, rest: 10 },
  { exerciseId: 'corrida-parada', sets: 1, target: 30, rest: 10 },
  { exerciseId: 'gato-vaca', sets: 1, target: 30, rest: 15 },
];

export const COOLDOWN: WorkoutItem[] = [
  { exerciseId: 'alongamento-posterior', sets: 1, target: 30, rest: 5 },
  { exerciseId: 'alongamento-quadriceps', sets: 1, target: 40, rest: 5 },
  { exerciseId: 'alongamento-peitoral', sets: 1, target: 30, rest: 5 },
  { exerciseId: 'postura-crianca', sets: 1, target: 40, rest: 0 },
];

/** Sessão curta de mobilidade que mantém a sequência viva em dias de descanso. */
export const RECOVERY: WorkoutItem[] = [
  { exerciseId: 'gato-vaca', sets: 1, target: 45, rest: 5 },
  { exerciseId: 'rotacao-bracos', sets: 1, target: 30, rest: 5 },
  { exerciseId: 'alongamento-posterior', sets: 1, target: 40, rest: 5 },
  { exerciseId: 'alongamento-quadriceps', sets: 1, target: 40, rest: 5 },
  { exerciseId: 'alongamento-peitoral', sets: 1, target: 30, rest: 5 },
  { exerciseId: 'postura-crianca', sets: 1, target: 60, rest: 0 },
];

export const PROGRAMS: Program[] = [
  {
    id: 'do-ovo-ao-pintinho',
    name: 'Do Ovo ao Pintinho',
    emoji: '🥚',
    tagline: 'Primeiro programa: zero experiência, zero equipamento.',
    description:
      'Feito para quem nunca treinou ou está parado há muito tempo. Ensina os movimentos básicos com variações fáceis e aumenta o volume um pouquinho a cada semana. Três treinos por semana, com um dia de descanso entre eles.',
    difficulty: 1,
    equipment: [],
    weeks: 4,
    perWeek: 3,
    minutes: 20,
    sessions: [
      {
        name: 'Corpo todo A',
        focus: 'Empurrar, pernas e lombar',
        items: [
          it('flexao-parede', 3, 8, 60, 2),
          it('agachamento', 3, 10, 60, 2),
          it('superman', 3, 8, 45, 2),
          it('ponte-gluteo', 3, 10, 45, 2),
          it('prancha', 3, 20, 45, 5),
        ],
      },
      {
        name: 'Corpo todo B',
        focus: 'Flexão no chão, equilíbrio e costas',
        items: [
          it('flexao-joelhos', 3, 5, 60, 1),
          it('afundo', 3, 6, 60, 1),
          it('anjo-reverso', 3, 8, 45, 2),
          it('dead-bug', 3, 6, 45, 1),
          it('elevacao-panturrilha', 3, 12, 30, 3),
        ],
      },
    ],
  },
  {
    id: 'frango-raiz',
    name: 'Frango Raiz',
    emoji: '🐔',
    tagline: 'Sem barra, sem cadeira, sem nada. Só você e o chão.',
    description:
      'O programa completo para treinar 100% sem equipamento. Divide a semana em empurrar + pernas, costas + core e um dia de condicionamento. As costas são trabalhadas com exercícios no chão (Super-Homem, Y-T-W, anjo reverso) — a alternativa honesta para quem não tem onde puxar.',
    difficulty: 2,
    equipment: [],
    weeks: 6,
    perWeek: 3,
    minutes: 30,
    sessions: [
      {
        name: 'Empurrar + Pernas',
        focus: 'Peito, ombro, tríceps e coxas',
        items: [
          it('flexao', 4, 8, 75, 1),
          it('flexao-pike', 3, 6, 75, 1),
          it('agachamento-salto', 3, 8, 60, 1),
          it('afundo', 3, 10, 60, 1),
          it('canoa', 3, 20, 45, 5),
        ],
      },
      {
        name: 'Costas + Core',
        focus: 'Postura, lombar e abdômen',
        items: [
          it('superman', 3, 12, 45, 1),
          it('ytw', 3, 6, 60, 1),
          it('anjo-reverso', 3, 12, 45, 1),
          it('prancha-lateral', 3, 25, 45, 5),
          it('elevacao-pernas', 3, 10, 45, 1),
        ],
      },
      {
        name: 'Condicionamento',
        focus: 'Corpo todo e fôlego',
        items: [
          it('flexao-diamante', 3, 6, 60, 1),
          it('ponte-unilateral', 3, 10, 45, 1),
          it('agachamento-isometrico', 3, 40, 45, 5),
          it('burpee', 3, 8, 60, 1),
          it('escalador', 3, 30, 45, 5),
        ],
      },
    ],
  },
  {
    id: 'casa-adaptada',
    name: 'Casa Adaptada',
    emoji: '🪑',
    tagline: 'Cadeira, mesa e toalha viram sua academia.',
    description:
      'Usa móveis firmes da casa para conseguir treinar de verdade a puxada (remada na mesa e com toalha na porta) e o tríceps (mergulho na cadeira). Ideal para quem quer evoluir costas e braços sem comprar barra.',
    difficulty: 2,
    equipment: ['cadeira', 'mesa', 'toalha'],
    weeks: 6,
    perWeek: 3,
    minutes: 35,
    sessions: [
      {
        name: 'Superior A',
        focus: 'Puxar e empurrar',
        items: [
          it('remada-mesa', 4, 6, 75, 1),
          it('flexao', 4, 8, 75, 1),
          it('mergulho-cadeira', 3, 8, 60, 1),
          it('remada-isometrica-toalha', 3, 20, 45, 5),
          it('prancha', 3, 30, 45, 5),
        ],
      },
      {
        name: 'Pernas + Core',
        focus: 'Uma perna de cada vez',
        items: [
          it('agachamento-bulgaro', 3, 8, 75, 1),
          it('ponte-unilateral', 3, 10, 45, 1),
          it('elevacao-panturrilha', 3, 15, 30, 2),
          it('dead-bug', 3, 10, 45, 1),
          it('prancha-lateral', 3, 25, 45, 5),
        ],
      },
      {
        name: 'Superior B',
        focus: 'Ombros e costas',
        items: [
          it('remada-toalha', 4, 10, 60, 1),
          it('flexao-declinada', 3, 6, 75, 1),
          it('flexao-pike', 3, 6, 75, 1),
          it('ytw', 3, 6, 45, 1),
          it('canoa', 3, 20, 45, 5),
        ],
      },
    ],
  },
  {
    id: 'rumo-a-barra',
    name: 'Rumo à Barra Fixa',
    emoji: '🏆',
    tagline: 'Da pendurada à primeira barra completa.',
    description:
      'Para quem tem uma barra de porta ou no quintal e quer conquistar a primeira barra fixa. Constrói a pegada, ensina a ativar as costas e usa negativas para criar força. No treino C você testa sua barra — se ainda não sair, tudo bem: faça negativas no lugar.',
    difficulty: 3,
    equipment: ['barra'],
    weeks: 8,
    perWeek: 3,
    minutes: 35,
    sessions: [
      {
        name: 'Pegada + Escápulas',
        focus: 'Base da puxada',
        items: [
          it('pendurada', 3, 20, 60, 5),
          it('escapula-barra', 3, 8, 60, 1),
          it('negativa-barra', 4, 3, 90, 0.5),
          it('flexao', 3, 10, 60, 1),
          it('elevacao-joelhos-barra', 3, 6, 60, 1),
        ],
      },
      {
        name: 'Força',
        focus: 'Negativas e corpo todo',
        items: [
          it('escapula-barra', 3, 10, 60, 1),
          it('negativa-barra', 4, 4, 90, 0.5),
          it('flexao-pike', 3, 8, 60, 1),
          it('agachamento', 3, 15, 60, 2),
          it('prancha', 3, 40, 45, 5),
        ],
      },
      {
        name: 'Teste da Barra',
        focus: 'Hora da verdade!',
        items: [
          it('barra-supinada', 5, 1, 120, 0.5),
          it('pendurada', 3, 30, 60, 5),
          it('flexao-diamante', 3, 8, 60, 1),
          it('ponte-unilateral', 3, 10, 45, 1),
          it('canoa', 3, 25, 45, 5),
        ],
      },
    ],
  },
  {
    id: 'core-de-aco',
    name: 'Core de Aço',
    emoji: '🧱',
    tagline: '15 minutos de abdômen e lombar, 4x por semana.',
    description:
      'Programa curto e focado no centro do corpo. Combina com qualquer outro programa nos dias livres ou funciona sozinho para quem quer melhorar postura e dor nas costas.',
    difficulty: 2,
    equipment: [],
    weeks: 3,
    perWeek: 4,
    minutes: 15,
    sessions: [
      {
        name: 'Estabilidade',
        focus: 'Anti-extensão e anti-rotação',
        items: [
          it('prancha', 3, 30, 30, 10),
          it('dead-bug', 3, 8, 30, 2),
          it('prancha-lateral', 3, 20, 30, 5),
          it('superman', 3, 10, 30, 2),
        ],
      },
      {
        name: 'Força',
        focus: 'Abdômen e flexores',
        items: [
          it('canoa', 3, 15, 30, 5),
          it('abdominal', 3, 15, 30, 3),
          it('elevacao-pernas', 3, 8, 30, 2),
          it('escalador', 3, 30, 30, 5),
        ],
      },
    ],
  },
  {
    id: 'expresso',
    name: 'Expresso 10',
    emoji: '⚡',
    tagline: 'Sem tempo? 10 minutos em circuito, todo dia útil.',
    description:
      'Um circuito rápido para os dias corridos. Pouco descanso, corpo todo e coração acelerado. Pode ser feito todos os dias úteis porque o volume é baixo.',
    difficulty: 1,
    equipment: [],
    weeks: 4,
    perWeek: 5,
    minutes: 10,
    sessions: [
      {
        name: 'Circuito',
        focus: 'Corpo todo',
        items: [
          it('polichinelo', 1, 40, 15, 5),
          it('agachamento', 2, 15, 20, 2),
          it('flexao-joelhos', 2, 8, 20, 1),
          it('escalador', 2, 30, 20, 5),
          it('ponte-gluteo', 2, 15, 20, 2),
          it('prancha', 1, 40, 0, 5),
        ],
      },
    ],
  },
  {
    id: 'rumo-a-parada',
    name: 'Rumo à Parada de Mãos',
    emoji: '🤸',
    tagline: 'Habilidades: corvo, parada na parede e pseudo-planche.',
    description:
      'Para quem já faz 15 flexões seguidas e quer aprender habilidades. Fortalece ombros, punhos e core e treina o equilíbrio de cabeça para baixo com segurança, sempre usando a parede.',
    difficulty: 4,
    equipment: [],
    weeks: 6,
    perWeek: 3,
    minutes: 35,
    sessions: [
      {
        name: 'Ombros',
        focus: 'Força vertical',
        items: [
          it('flexao-pike', 4, 8, 90, 1),
          it('parada-maos-parede', 4, 20, 90, 5),
          it('canoa', 3, 30, 45, 5),
        ],
      },
      {
        name: 'Equilíbrio',
        focus: 'Corvo e controle',
        items: [
          it('corvo', 5, 10, 60, 3),
          it('pseudo-planche', 3, 6, 90, 1),
          it('flexao-arqueiro', 3, 4, 90, 1),
          it('prancha-lateral', 3, 30, 45, 5),
        ],
      },
      {
        name: 'Potência',
        focus: 'Explosão e pernas',
        items: [
          it('flexao-explosiva', 4, 5, 90, 1),
          it('agachamento-pistola', 3, 3, 90, 1),
          it('parada-maos-parede', 3, 25, 90, 5),
          it('elevacao-pernas', 3, 12, 45, 1),
        ],
      },
    ],
  },
];

export const PROGRAM_MAP: Record<string, Program> = Object.fromEntries(PROGRAMS.map((p) => [p.id, p]));

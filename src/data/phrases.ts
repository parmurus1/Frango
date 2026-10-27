export const REST_PHRASES = [
  'Respira, frango. Você está mandando bem!',
  'Bebe uma água. O próximo vem aí.',
  'Cada série te deixa menos frango.',
  'Descanso também é treino. Aproveita!',
  'Postura boa vale mais que repetição rápida.',
  'Pó-pó-pó! Bora pra próxima!',
  'O galo de amanhã agradece o frango de hoje.',
  'Sacode os braços e solta os ombros.',
  'Lembra: qualidade antes de quantidade.',
  'Tá cansado? Ótimo, é aí que você cresce.',
];

export const FINISH_PHRASES = [
  'Treino concluído! Cocoricó!',
  'Mais um tijolo no seu galinheiro.',
  'Isso aí! Consistência é o segredo.',
  'Frango que treina vira galo.',
];

export const TIPS = [
  'Dor muscular leve no dia seguinte é normal. Dor aguda nas articulações não — pare e descanse.',
  'Faça o movimento completo. 8 repetições bem feitas valem mais que 15 pela metade.',
  'Durma bem: é no descanso que o músculo cresce.',
  'Beba água ao longo do dia, não só durante o treino.',
  'Coma proteína em todas as refeições: ovo, frango, feijão, iogurte…',
  'Ficou fácil? Use a variação "mais difícil" do exercício. É assim que se progride na calistenia.',
  'Ficou difícil demais? Use a variação "mais fácil". Isso não é trapaça, é estratégia.',
  'Treinar 3 vezes por semana por um ano vale mais que 7 vezes por semana por um mês.',
  'Em dias de descanso, a Recuperação Ativa mantém sua sequência e solta o corpo.',
  'Respire: solte o ar no esforço (subida) e puxe na volta.',
  'Faça o Teste do Frangão a cada 4 semanas para ver sua evolução em números.',
  'Treine num chão firme e antiderrapante. Um tapete de yoga ou toalha ajuda.',
];

export function pick<T>(list: T[], seed = Date.now()) {
  return list[Math.abs(seed) % list.length];
}

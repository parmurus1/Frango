let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Bipe curto. `kind` muda o tom: tick (contagem), go (início), done (fim). */
export function beep(kind: 'tick' | 'go' | 'done' = 'tick') {
  const a = audio();
  if (!a) return;
  const notes = kind === 'tick' ? [660] : kind === 'go' ? [880] : [660, 880, 1175];
  notes.forEach((freq, i) => {
    const osc = a.createOscillator();
    const gain = a.createGain();
    const t = a.currentTime + i * 0.12;
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 'tick' ? 0.12 : 0.22));
    osc.connect(gain).connect(a.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  });
}

export function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'pt-BR';
  u.rate = 1.05;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('pt'));
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}

export function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern);
}

type Sentinel = { release(): Promise<void> };

/** Mantém a tela ligada durante o treino (quando o navegador permite). */
export async function keepAwake(): Promise<() => void> {
  try {
    const nav = navigator as Navigator & { wakeLock?: { request(type: 'screen'): Promise<Sentinel> } };
    const lock = await nav.wakeLock?.request('screen');
    return () => void lock?.release().catch(() => {});
  } catch {
    return () => {};
  }
}

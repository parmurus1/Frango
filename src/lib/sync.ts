import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { migrate, type AppState } from './state';

// ---------------------------------------------------------------------------
// Junção de progresso entre aparelhos

/**
 * Junta o progresso de dois aparelhos sem perder treinos.
 *
 * A "base" é o lado com mais treinos (empate: o alterado por último); dela vêm
 * perfil, configurações e itens equipados. Treinos que só existem no outro lado
 * entram no histórico e somam o XP e o milho que deram. Recordes, conquistas,
 * itens e programas ficam com o melhor dos dois.
 */
export function mergeStates(a: AppState, b: AppState): AppState {
  const aWins =
    a.history.length !== b.history.length ? a.history.length > b.history.length : (a.updatedAt ?? '') >= (b.updatedAt ?? '');
  const base = aWins ? a : b;
  const other = aWins ? b : a;

  const known = new Set(base.history.map((h) => h.id));
  const extra = other.history.filter((h) => !known.has(h.id));
  const history = [...base.history, ...extra].sort((x, y) => x.date.localeCompare(y.date));

  const records = { ...other.records };
  for (const [id, r] of Object.entries(base.records)) {
    if (!records[id] || r.value >= records[id].value) records[id] = r;
  }

  const achievements = { ...base.achievements };
  for (const [id, date] of Object.entries(other.achievements)) {
    if (!achievements[id] || date < achievements[id]) achievements[id] = date;
  }

  const programProgress = { ...other.programProgress };
  for (const [id, n] of Object.entries(base.programProgress)) programProgress[id] = Math.max(n, programProgress[id] ?? 0);

  const tests = [...base.tests];
  for (const t of other.tests) if (!tests.some((x) => x.date === t.date)) tests.push(t);
  tests.sort((x, y) => x.date.localeCompare(y.date));

  let missions = base.missions;
  if (other.missions.date > base.missions.date) missions = other.missions;
  else if (other.missions.date === base.missions.date) {
    missions = {
      ...base.missions,
      bonusClaimed: base.missions.bonusClaimed || other.missions.bonusClaimed,
      items: base.missions.items.map((m) => {
        const o = other.missions.items.find((x) => x.id === m.id);
        return o ? { ...m, progress: Math.max(m.progress, o.progress), claimed: m.claimed || o.claimed } : m;
      }),
    };
  }

  const union = (x: string[], y: string[]) => [...new Set([...x, ...y])];

  return {
    ...base,
    profile: base.profile ?? other.profile,
    xp: base.xp + extra.reduce((s, h) => s + h.xp, 0),
    corn: base.corn + extra.reduce((s, h) => s + h.corn, 0),
    history,
    records,
    achievements,
    programProgress,
    completedPrograms: union(base.completedPrograms, other.completedPrograms),
    owned: union(base.owned, other.owned),
    frozenDays: union(base.frozenDays, other.frozenDays).sort(),
    tests,
    missions,
    updatedAt: (a.updatedAt ?? '') > (b.updatedAt ?? '') ? a.updatedAt : b.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Supabase

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

/** A sincronização só aparece quando o build tem as chaves do Supabase. */
export const cloudConfigured = Boolean(URL && KEY);

const TABLE = 'progress';
let client: Promise<SupabaseClient> | null = null;

/** Carrega o Supabase sob demanda: quem não usa a nuvem não baixa a biblioteca. */
export function getClient(): Promise<SupabaseClient> {
  if (!cloudConfigured) return Promise.reject(new Error('Sincronização não configurada.'));
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(URL!, KEY!, {
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'frangao:auth' },
    }),
  );
  return client;
}

/** Mensagens do Supabase traduzidas para o que a pessoa precisa fazer. */
export function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  if (/expired|invalid/i.test(msg) && /token|otp|code/i.test(msg)) return 'Código errado ou vencido. Peça um novo código.';
  const wait = msg.match(/after (\d+) seconds?/i);
  if (wait) return `Aguarde ${wait[1]} segundos para pedir outro código.`;
  if (/rate limit/i.test(msg)) return 'Muitos pedidos seguidos. Espere alguns minutos e tente de novo.';
  if (/invalid.*email|email.*invalid/i.test(msg)) return 'Esse e-mail parece inválido. Confira e tente de novo.';
  if (/fetch|network|Failed to/i.test(msg)) return 'Sem conexão com o servidor. Confira a internet e tente de novo.';
  return msg || 'Algo deu errado. Tente de novo.';
}

export async function sendLoginCode(email: string) {
  const sb = await getClient();
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: window.location.origin + window.location.pathname },
  });
  if (error) throw error;
}

export async function verifyLoginCode(email: string, code: string) {
  const sb = await getClient();
  const { error } = await sb.auth.verifyOtp({ email, token: code, type: 'email' });
  if (error) throw error;
}

export async function signOutCloud() {
  const sb = await getClient();
  await sb.auth.signOut();
}

export async function currentSession(): Promise<Session | null> {
  const sb = await getClient();
  const { data } = await sb.auth.getSession();
  return data.session;
}

export async function onSessionChange(cb: (s: Session | null) => void) {
  const sb = await getClient();
  const { data } = sb.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

export async function pullRemote(userId: string): Promise<AppState | null> {
  const sb = await getClient();
  const { data, error } = await sb.from(TABLE).select('state').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data ? migrate(data.state) : null;
}

export async function pushRemote(userId: string, state: AppState) {
  const sb = await getClient();
  const { error } = await sb.from(TABLE).upsert({ user_id: userId, state, updated_at: new Date().toISOString() });
  if (error) throw error;
}

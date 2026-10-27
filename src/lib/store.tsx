import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  MAX_FREEZES,
  MISSION_BONUS_CORN,
  MISSION_MAP,
  MISSION_REWARD,
  SHOP_MAP,
  applyFreezes,
  ensureMissions,
  levelInfo,
  unlockAchievements,
  type AchievementDef,
  type Slot,
} from './gamification';
import { completeWorkout, type FinishInput, type WorkoutSummary } from './progress';
import { initialState, loadState, migrate, saveState, type AppState, type FitnessTest, type Profile, type Settings, type WorkoutLog } from './state';
import {
  cloudConfigured,
  currentSession,
  friendlyError,
  mergeStates,
  onSessionChange,
  pullRemote,
  pushRemote,
  signOutCloud,
} from './sync';

export interface Toast {
  id: number;
  icon: string;
  title: string;
  text?: string;
}

export interface CloudState {
  configured: boolean;
  /** e-mail da conta conectada, ou null */
  email: string | null;
  status: 'idle' | 'syncing' | 'error';
  lastSync: string | null;
  error: string | null;
}

interface Store {
  state: AppState;
  cloud: CloudState;
  syncNow(): Promise<void>;
  cloudSignOut(): Promise<void>;
  summary: WorkoutSummary | null;
  toasts: Toast[];
  onboard(profile: Profile, programId: string | null): void;
  updateProfile(p: Partial<Profile>): void;
  updateSettings(s: Partial<Settings>): void;
  startProgram(id: string | null): void;
  restartProgram(id: string): void;
  finishWorkout(input: FinishInput): WorkoutSummary;
  claimMission(id: string): void;
  claimMissionBonus(): void;
  buy(itemId: string): boolean;
  equip(slot: Exclude<Slot, 'consumable'>, itemId: string | null): void;
  recordTest(t: FitnessTest): void;
  rateLog(id: string, rating: WorkoutLog['rating']): void;
  importData(json: string): boolean;
  reset(): void;
  dismissToast(id: number): void;
}

const Ctx = createContext<Store | null>(null);

function refresh(s: AppState) {
  return ensureMissions(applyFreezes(s));
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => refresh(loadState()));
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const ref = useRef(state);
  ref.current = state;
  const toastId = useRef(0);
  const [cloud, setCloud] = useState<CloudState>({
    configured: cloudConfigured,
    email: null,
    status: 'idle',
    lastSync: null,
    error: null,
  });
  const userId = useRef<string | null>(null);
  const lastPushed = useRef('');
  const syncing = useRef(false);

  useEffect(() => saveState(state), [state]);

  /** Baixa o progresso da nuvem, junta com o deste aparelho e envia o resultado. */
  const syncNow = useCallback(async () => {
    const uid = userId.current;
    if (!uid || syncing.current) return;
    syncing.current = true;
    setCloud((c) => ({ ...c, status: 'syncing', error: null }));
    try {
      const remote = await pullRemote(uid);
      const local = ref.current;
      const merged = remote ? refresh(mergeStates(local, remote)) : local;
      const json = JSON.stringify(merged);
      // só troca o estado se a nuvem trouxe algo novo (evita sincronizar em loop)
      if (json !== JSON.stringify(local)) {
        ref.current = merged;
        setState(merged);
      }
      if (json !== lastPushed.current) {
        await pushRemote(uid, merged);
        lastPushed.current = json;
      }
      setCloud((c) => ({ ...c, status: 'idle', lastSync: new Date().toISOString() }));
    } catch (err) {
      setCloud((c) => ({ ...c, status: 'error', error: friendlyError(err) }));
    } finally {
      syncing.current = false;
    }
  }, []);

  // acompanha o login: ao entrar, sincroniza na hora
  useEffect(() => {
    if (!cloudConfigured) return;
    let alive = true;
    let unsubscribe = () => {};
    const apply = (session: Awaited<ReturnType<typeof currentSession>>) => {
      const id = session?.user.id ?? null;
      if (id === userId.current) return;
      userId.current = id;
      lastPushed.current = '';
      setCloud((c) => ({ ...c, email: session?.user.email ?? null, status: 'idle', error: null, lastSync: id ? c.lastSync : null }));
      if (id) void syncNow();
    };
    currentSession()
      .then((s) => alive && apply(s))
      .catch(() => {});
    onSessionChange(apply)
      .then((u) => (alive ? (unsubscribe = u) : u()))
      .catch(() => {});
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [syncNow]);

  // depois de cada mudança, envia para a nuvem (com uma pausa para juntar várias)
  useEffect(() => {
    if (!userId.current) return;
    const t = setTimeout(() => void syncNow(), 2500);
    return () => clearTimeout(t);
  }, [state, syncNow]);

  // vira o dia com o app aberto? renova missões e confere a sequência
  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === 'hidden') return;
      const next = refresh(ref.current);
      if (next !== ref.current) setState(next);
      void syncNow();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [syncNow]);

  const pushToasts = useCallback((items: Omit<Toast, 'id'>[]) => {
    if (!items.length) return;
    setToasts((t) => [...t, ...items.map((i) => ({ ...i, id: ++toastId.current }))]);
  }, []);

  const achievementToasts = (list: AchievementDef[]) =>
    list.map((a) => ({ icon: a.icon, title: `Conquista: ${a.name}`, text: a.desc }));

  /** aplica uma mudança, confere conquistas e mostra toasts das novas */
  const commit = useCallback(
    (fn: (s: AppState) => AppState) => {
      const changed = fn(ref.current);
      if (changed === ref.current) return;
      const { state: next, unlocked } = unlockAchievements({ ...changed, updatedAt: new Date().toISOString() });
      ref.current = next;
      setState(next);
      pushToasts(achievementToasts(unlocked));
    },
    [pushToasts],
  );

  const store = useMemo<Store>(
    () => ({
      state,
      summary,
      toasts,
      cloud,
      syncNow,
      async cloudSignOut() {
        await signOutCloud().catch(() => {});
      },
      onboard(profile, programId) {
        commit((s) => ({ ...s, profile, activeProgramId: programId }));
      },
      updateProfile(p) {
        commit((s) => (s.profile ? { ...s, profile: { ...s.profile, ...p } } : s));
      },
      updateSettings(p) {
        commit((s) => ({ ...s, settings: { ...s.settings, ...p } }));
      },
      startProgram(id) {
        commit((s) => ({ ...s, activeProgramId: id }));
      },
      restartProgram(id) {
        commit((s) => ({ ...s, activeProgramId: id, programProgress: { ...s.programProgress, [id]: 0 } }));
      },
      finishWorkout(input) {
        const { state: done, summary: sum } = completeWorkout(ref.current, input);
        const next = { ...done, updatedAt: new Date().toISOString() };
        ref.current = next;
        setState(next);
        setSummary(sum);
        return sum;
      },
      claimMission(id) {
        commit((s) => {
          const m = s.missions.items.find((x) => x.id === id);
          const def = MISSION_MAP[id];
          if (!m || !def || m.claimed || m.progress < def.target) return s;
          return {
            ...s,
            xp: s.xp + MISSION_REWARD.xp,
            corn: s.corn + MISSION_REWARD.corn,
            missions: { ...s.missions, items: s.missions.items.map((x) => (x.id === id ? { ...x, claimed: true } : x)) },
          };
        });
      },
      claimMissionBonus() {
        commit((s) => {
          if (s.missions.bonusClaimed || !s.missions.items.every((m) => m.claimed)) return s;
          return { ...s, corn: s.corn + MISSION_BONUS_CORN, missions: { ...s.missions, bonusClaimed: true } };
        });
      },
      buy(itemId) {
        const s = ref.current;
        const item = SHOP_MAP[itemId];
        if (!item || s.corn < item.price) return false;
        if (item.minLevel && levelInfo(s.xp).level < item.minLevel) return false;
        if (item.slot === 'consumable') {
          if (s.freezes >= MAX_FREEZES) return false;
          commit((x) => ({ ...x, corn: x.corn - item.price, freezes: x.freezes + 1 }));
          return true;
        }
        if (s.owned.includes(itemId)) return false;
        commit((x) => ({
          ...x,
          corn: x.corn - item.price,
          owned: [...x.owned, itemId],
          equipped: { ...x.equipped, [item.slot]: itemId },
        }));
        return true;
      },
      equip(slot, itemId) {
        commit((s) => ({ ...s, equipped: { ...s.equipped, [slot]: itemId ?? undefined } }));
      },
      recordTest(t) {
        commit((s) => ({ ...s, tests: [...s.tests, t] }));
      },
      rateLog(id, rating) {
        commit((s) => ({ ...s, history: s.history.map((h) => (h.id === id ? { ...h, rating } : h)) }));
      },
      importData(json) {
        try {
          const next = refresh(migrate(JSON.parse(json)));
          ref.current = next;
          setState(next);
          return true;
        } catch {
          return false;
        }
      },
      reset() {
        // sai da conta antes, senão a sincronização traria o progresso de volta
        if (userId.current) {
          userId.current = null;
          setCloud((c) => ({ ...c, email: null, status: 'idle', lastSync: null }));
          void signOutCloud().catch(() => {});
        }
        const next = refresh(initialState());
        ref.current = next;
        setState(next);
        setSummary(null);
      },
      dismissToast(id) {
        setToasts((t) => t.filter((x) => x.id !== id));
      },
    }),
    [state, summary, toasts, cloud, syncNow, commit],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore fora do StoreProvider');
  return s;
}


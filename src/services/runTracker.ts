import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { RunPoint } from '@/store/corrida';

// Gravação de corrida com GPS. No Android/iOS o rastreio roda como serviço em
// primeiro plano (continua com a tela apagada); se a permissão "o tempo todo"
// for negada ou o aparelho não suportar, cai pro rastreio comum, que só vale
// com o app aberto.

const RUN_TASK = 'lifequest-run-location';
const STORAGE_KEY = 'lifequest_active_run';
const PRECISAO_MAXIMA_M = 30;

export type ActiveRun = {
  status: 'running' | 'paused';
  startedAt: number;
  accumulatedSec: number;
  runningSince: number | null;
  seg: number;
  points: RunPoint[];
  /** true quando o rastreio continua com o app em segundo plano */
  background: boolean;
};

export type StartResult =
  | { ok: true; background: boolean }
  | { ok: false; reason: 'permission' | 'gps-off' | 'error'; message?: string };

let current: ActiveRun | null = null;
let loaded = false;
let foregroundSub: Location.LocationSubscription | null = null;
let escrita: Promise<void> = Promise.resolve();
const listeners = new Set<(run: ActiveRun | null) => void>();

// cópia nova a cada aviso: `current` é alterado no lugar, e o React ignora o mesmo objeto
function notificar() {
  const copia = current ? { ...current } : null;
  listeners.forEach((fn) => fn(copia));
}

function persistir() {
  escrita = escrita
    .then(() => (current ? AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current)) : AsyncStorage.removeItem(STORAGE_KEY)))
    .catch(() => {});
}

async function carregar() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw && !current) current = JSON.parse(raw);
  } catch {
    // sem sessão salva
  }
}

async function ingerir(locations: Location.LocationObject[]) {
  await carregar();
  if (!current || current.status !== 'running') return;
  for (const loc of locations) {
    const acc = loc.coords.accuracy;
    if (acc !== null && acc > PRECISAO_MAXIMA_M) continue;
    const last = current.points[current.points.length - 1];
    if (last && loc.timestamp <= last.t) continue;
    current.points.push({ lat: loc.coords.latitude, lon: loc.coords.longitude, t: loc.timestamp, seg: current.seg });
  }
  persistir();
  notificar();
}

// A tarefa precisa ser definida no escopo global do módulo (o sistema a chama de
// novo mesmo com o app em segundo plano).
if (Platform.OS !== 'web') {
  try {
    TaskManager.defineTask<{ locations: Location.LocationObject[] }>(RUN_TASK, async ({ data, error }) => {
      if (error || !data) return;
      await ingerir(data.locations);
    });
  } catch {
    // TaskManager indisponível (ex.: Expo Go) — o rastreio comum cobre
  }
}

async function iniciarRastreio() {
  if (!current) return;
  const opcoes = {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 2000,
    distanceInterval: 3,
  };
  if (current.background) {
    try {
      await Location.startLocationUpdatesAsync(RUN_TASK, {
        ...opcoes,
        showsBackgroundLocationIndicator: true,
        pausesUpdatesAutomatically: false,
        activityType: Location.ActivityType.Fitness,
        foregroundService: {
          notificationTitle: 'Life Quest · corrida em andamento',
          notificationBody: 'Gravando o seu percurso.',
          notificationColor: '#FF5C29',
        },
      });
      return;
    } catch {
      current.background = false;
      persistir();
    }
  }
  foregroundSub = await Location.watchPositionAsync(opcoes, (loc) => {
    void ingerir([loc]);
  });
}

async function pararRastreio() {
  foregroundSub?.remove();
  foregroundSub = null;
  try {
    if (await Location.hasStartedLocationUpdatesAsync(RUN_TASK)) await Location.stopLocationUpdatesAsync(RUN_TASK);
  } catch {
    // não estava rodando
  }
}

export function subscribe(fn: (run: ActiveRun | null) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function duracaoSeg(run: ActiveRun, agora = Date.now()): number {
  return run.accumulatedSec + (run.runningSince ? (agora - run.runningSince) / 1000 : 0);
}

// Recupera uma corrida que ficou em andamento (app fechado/reiniciado) e religa o rastreio.
export async function restaurarSessao(): Promise<ActiveRun | null> {
  await carregar();
  if (current?.status === 'running' && !foregroundSub) {
    let ativo = false;
    try {
      ativo = await Location.hasStartedLocationUpdatesAsync(RUN_TASK);
    } catch {
      ativo = false;
    }
    if (!ativo) await iniciarRastreio().catch(() => {});
  }
  return current;
}

export async function startRun(): Promise<StartResult> {
  try {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== 'granted') return { ok: false, reason: 'permission' };
    if (!(await Location.hasServicesEnabledAsync())) return { ok: false, reason: 'gps-off' };

    let background = false;
    if (Platform.OS !== 'web') {
      const bg = await Location.requestBackgroundPermissionsAsync().catch(() => null);
      background = bg?.status === 'granted' && (await TaskManager.isAvailableAsync().catch(() => false));
    }

    const agora = Date.now();
    current = { status: 'running', startedAt: agora, accumulatedSec: 0, runningSince: agora, seg: 0, points: [], background };
    loaded = true;
    persistir();
    await iniciarRastreio();
    notificar();
    return { ok: true, background: current.background };
  } catch (err: any) {
    current = null;
    persistir();
    return { ok: false, reason: 'error', message: err?.message ?? String(err) };
  }
}

export async function pauseRun() {
  await carregar();
  if (!current || current.status !== 'running') return;
  current.accumulatedSec = duracaoSeg(current);
  current.runningSince = null;
  current.status = 'paused';
  await pararRastreio();
  persistir();
  notificar();
}

export async function resumeRun() {
  await carregar();
  if (!current || current.status !== 'paused') return;
  current.seg += 1;
  current.runningSince = Date.now();
  current.status = 'running';
  persistir();
  notificar();
  await iniciarRastreio().catch(() => {});
}

// Encerra e devolve a corrida (ou null se não havia nenhuma).
export async function finishRun(): Promise<ActiveRun | null> {
  await carregar();
  if (!current) return null;
  const run: ActiveRun = { ...current, accumulatedSec: duracaoSeg(current), runningSince: null };
  await pararRastreio();
  current = null;
  persistir();
  notificar();
  return run;
}

export async function discardRun() {
  await carregar();
  await pararRastreio();
  current = null;
  persistir();
  notificar();
}

export async function getActiveRun(): Promise<ActiveRun | null> {
  await carregar();
  return current;
}

import { Platform } from 'react-native';

export type HealthMetrics = {
  steps: number;
  calories: number;
  exerciseMinutes: number;
  exerciseEstimated: boolean;
};

const RECORD_TYPES = ['Steps', 'ActiveCaloriesBurned', 'TotalCaloriesBurned', 'BasalMetabolicRate', 'ExerciseSession'] as const;

// Filtra a agregação pra vir só do Samsung Health, em vez de somar todas as
// fontes que escrevem no Health Connect — evita contagem duplicada quando
// mais de um app/relógio contribui com os mesmos dados.
const SAMSUNG_HEALTH_PACKAGE = 'com.sec.android.app.shealth';

// Acima disso (passos/min) o trecho conta como caminhada ativa na estimativa.
const ACTIVE_CADENCE_SPM = 100;

// react-native-health-connect requires a native module that Expo Go doesn't ship.
// Loading it lazily (only when actually called, on Android) keeps Expo Go usable
// for everything else instead of crashing the whole bundle on import.
let hcModule: typeof import('react-native-health-connect') | null | undefined;

function loadModule() {
  if (Platform.OS !== 'android') return null;
  if (hcModule === undefined) {
    try {
      hcModule = require('react-native-health-connect');
    } catch {
      hcModule = null;
    }
  }
  return hcModule;
}

function startOfToday() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}

function range(start: Date, end: Date) {
  return { operator: 'between' as const, startTime: start.toISOString(), endTime: end.toISOString() };
}

// O Samsung Health grava os passos do dia como um único registro que cobre o
// dia inteiro (00:00–24:00). Agregar só até "agora" prorrateia esse registro
// pelo tempo decorrido (às 13h vinham ~55% dos passos), então a janela vai até
// o fim do dia.
function fullDayRange() {
  const start = startOfToday();
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return range(start, end);
}

function untilNowRange() {
  return range(startOfToday(), new Date());
}

export async function isHealthConnectSupported(): Promise<boolean> {
  const hc = loadModule();
  if (!hc) return false;
  try {
    const status = await hc.getSdkStatus();
    return status === hc.SdkAvailabilityStatus.SDK_AVAILABLE;
  } catch {
    return false;
  }
}

export async function hasHealthPermissions(): Promise<boolean> {
  const hc = loadModule();
  if (!hc) return false;
  try {
    const granted = await hc.getGrantedPermissions();
    const grantedTypes = new Set(granted.map((p) => p.recordType));
    return RECORD_TYPES.every((t) => grantedTypes.has(t));
  } catch {
    return false;
  }
}

export type PermissionResult =
  | { granted: true }
  | { granted: false; reason: 'unsupported' | 'denied' | 'error'; error?: string };

export async function requestHealthPermissions(): Promise<PermissionResult> {
  const hc = loadModule();
  if (!hc) return { granted: false, reason: 'unsupported' };
  try {
    await hc.initialize();
    const granted = await hc.requestPermission(RECORD_TYPES.map((recordType) => ({ accessType: 'read', recordType })));
    const grantedTypes = new Set(granted.map((p) => p.recordType));
    const allGranted = RECORD_TYPES.every((t) => grantedTypes.has(t));
    return allGranted ? { granted: true } : { granted: false, reason: 'denied' };
  } catch (err: any) {
    return { granted: false, reason: 'error', error: err?.message ?? String(err) };
  }
}

// O Samsung Health não expõe "tempo ativo" no Health Connect (só treinos
// iniciados por ele viram ExerciseSession), então estimamos pelos trechos de
// passos com cadência de caminhada ativa, unindo intervalos sobrepostos.
async function estimateActiveMinutes(hc: NonNullable<ReturnType<typeof loadModule>>): Promise<number> {
  const { records } = await hc.readRecords('Steps', { timeRangeFilter: untilNowRange(), pageSize: 5000 });
  const intervals: [number, number][] = [];
  for (const r of records) {
    const from = new Date(r.startTime).getTime();
    const to = new Date(r.endTime).getTime();
    const minutes = (to - from) / 60000;
    if (minutes <= 0 || minutes > 30) continue;
    if (r.count / minutes >= ACTIVE_CADENCE_SPM) intervals.push([from, to]);
  }
  intervals.sort((a, b) => a[0] - b[0]);
  let totalMs = 0;
  let cursor = -Infinity;
  for (const [from, to] of intervals) {
    const effectiveFrom = Math.max(from, cursor);
    if (to > effectiveFrom) totalMs += to - effectiveFrom;
    cursor = Math.max(cursor, to);
  }
  return Math.round(totalMs / 60000);
}

export async function fetchTodayHealthMetrics(): Promise<HealthMetrics | null> {
  const hc = loadModule();
  if (!hc) return null;
  const fullDay = fullDayRange();
  const dataOriginFilter = [SAMSUNG_HEALTH_PACKAGE];
  const orNull = <T>(p: Promise<T>) => p.catch(() => null);

  const [steps, active, total, basal, exercise] = await Promise.all([
    orNull(hc.aggregateRecord({ recordType: 'Steps', timeRangeFilter: fullDay, dataOriginFilter })),
    orNull(hc.aggregateRecord({ recordType: 'ActiveCaloriesBurned', timeRangeFilter: fullDay, dataOriginFilter })),
    orNull(hc.aggregateRecord({ recordType: 'TotalCaloriesBurned', timeRangeFilter: fullDay, dataOriginFilter })),
    orNull(hc.aggregateRecord({ recordType: 'BasalMetabolicRate', timeRangeFilter: untilNowRange(), dataOriginFilter })),
    orNull(hc.aggregateRecord({ recordType: 'ExerciseSession', timeRangeFilter: fullDay, dataOriginFilter })),
  ]);
  if (!steps && !active && !total && !exercise) return null;

  // O Samsung Health só grava calorias ativas diretas em treinos; no dia a dia
  // vem só o total (que inclui o gasto basal). Ativas = total − basal.
  let calories = active?.ACTIVE_CALORIES_TOTAL?.inKilocalories ?? 0;
  if (calories <= 0) {
    const totalKcal = total?.ENERGY_TOTAL?.inKilocalories ?? 0;
    const basalKcal = basal?.BASAL_CALORIES_TOTAL?.inKilocalories ?? 0;
    if (basalKcal > 0 && totalKcal > basalKcal) calories = totalKcal - basalKcal;
  }

  let exerciseMinutes = Math.round((exercise?.EXERCISE_DURATION_TOTAL?.inSeconds ?? 0) / 60);
  let exerciseEstimated = false;
  if (exerciseMinutes <= 0) {
    try {
      exerciseMinutes = await estimateActiveMinutes(hc);
      exerciseEstimated = exerciseMinutes > 0;
    } catch {
      // sem estimativa disponível; mantém 0
    }
  }

  return {
    steps: steps?.COUNT_TOTAL ?? 0,
    calories: Math.round(calories),
    exerciseMinutes,
    exerciseEstimated,
  };
}

function clock(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Mostra o que o Health Connect tem de hoje por app de origem, sem o filtro do
// Samsung Health, pra descobrir por que uma métrica aparece zerada ou baixa.
export async function fetchHealthDiagnostics(): Promise<string> {
  const hc = loadModule();
  if (!hc) return 'Health Connect indisponível neste aparelho.';
  const timeRangeFilter = fullDayRange();
  const lines: string[] = [];

  for (const recordType of RECORD_TYPES) {
    try {
      const { records } = await hc.readRecords(recordType, { timeRangeFilter, pageSize: 5000 });
      const byOrigin = new Map<string, { count: number; total: number; from: string; to: string }>();
      for (const r of records as any[]) {
        const origin = r.metadata?.dataOrigin ?? 'origem desconhecida';
        const from = r.startTime ?? r.time;
        const to = r.endTime ?? r.time;
        const entry = byOrigin.get(origin) ?? { count: 0, total: 0, from, to };
        entry.count += 1;
        if (from < entry.from) entry.from = from;
        if (to > entry.to) entry.to = to;
        if (recordType === 'Steps') entry.total += r.count ?? 0;
        else if (recordType === 'ActiveCaloriesBurned' || recordType === 'TotalCaloriesBurned') {
          entry.total += r.energy?.inKilocalories ?? 0;
        } else if (recordType === 'BasalMetabolicRate') {
          entry.total = r.basalMetabolicRate?.inKilocaloriesPerDay ?? entry.total;
        } else entry.total += (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000;
        byOrigin.set(origin, entry);
      }
      const unit =
        recordType === 'Steps' ? 'passos' : recordType === 'BasalMetabolicRate' ? 'kcal/dia' : recordType === 'ExerciseSession' ? 'min' : 'kcal';
      lines.push(`${recordType}: ${records.length} registro(s)`);
      byOrigin.forEach((v, origin) =>
        lines.push(`  • ${origin}: ${v.count}x, ${Math.round(v.total)} ${unit} (${clock(v.from)}–${clock(v.to)})`)
      );
    } catch (err: any) {
      lines.push(`${recordType}: erro — ${err?.message ?? String(err)}`);
    }
  }

  const metrics = await fetchTodayHealthMetrics();
  if (metrics) {
    lines.push(
      `Card: ${metrics.steps} passos, ${metrics.calories} kcal, ${metrics.exerciseMinutes} min` +
        (metrics.exerciseEstimated ? ' (estimado)' : '')
    );
  }

  return lines.join('\n');
}

export function openHealthConnectSettings() {
  const hc = loadModule();
  if (!hc) return;
  try {
    hc.openHealthConnectSettings();
  } catch {
    // ignora se o Health Connect não estiver instalado
  }
}

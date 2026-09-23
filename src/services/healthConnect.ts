import { Platform } from 'react-native';

export type HealthMetrics = { steps: number; calories: number; exerciseMinutes: number };

const RECORD_TYPES = ['Steps', 'ActiveCaloriesBurned', 'ExerciseSession'] as const;

// Filtra a agregação pra vir só do Samsung Health, em vez de somar todas as
// fontes que escrevem no Health Connect — evita contagem duplicada quando
// mais de um app/relógio contribui com os mesmos dados.
const SAMSUNG_HEALTH_PACKAGE = 'com.sec.android.app.shealth';

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

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return {
    operator: 'between' as const,
    startTime: start.toISOString(),
    endTime: new Date().toISOString(),
  };
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

export async function fetchTodayHealthMetrics(): Promise<HealthMetrics | null> {
  const hc = loadModule();
  if (!hc) return null;
  const timeRangeFilter = todayRange();
  try {
    const dataOriginFilter = [SAMSUNG_HEALTH_PACKAGE];
    const [stepsRes, caloriesRes, exerciseRes] = await Promise.all([
      hc.aggregateRecord({ recordType: 'Steps', timeRangeFilter, dataOriginFilter }),
      hc.aggregateRecord({ recordType: 'ActiveCaloriesBurned', timeRangeFilter, dataOriginFilter }),
      hc.aggregateRecord({ recordType: 'ExerciseSession', timeRangeFilter, dataOriginFilter }),
    ]);
    return {
      steps: stepsRes.COUNT_TOTAL ?? 0,
      calories: Math.round(caloriesRes.ACTIVE_CALORIES_TOTAL?.inKilocalories ?? 0),
      exerciseMinutes: Math.round((exerciseRes.EXERCISE_DURATION_TOTAL?.inSeconds ?? 0) / 60),
    };
  } catch {
    return null;
  }
}

// Mostra o que o Health Connect tem de hoje por app de origem, sem o filtro do
// Samsung Health, pra descobrir por que uma métrica aparece zerada.
export async function fetchHealthDiagnostics(): Promise<string> {
  const hc = loadModule();
  if (!hc) return 'Health Connect indisponível neste aparelho.';
  const timeRangeFilter = todayRange();
  const lines: string[] = [];

  for (const recordType of RECORD_TYPES) {
    try {
      const { records } = await hc.readRecords(recordType, { timeRangeFilter, pageSize: 5000 });
      const byOrigin = new Map<string, { count: number; total: number }>();
      for (const r of records as any[]) {
        const origin = r.metadata?.dataOrigin ?? 'origem desconhecida';
        const entry = byOrigin.get(origin) ?? { count: 0, total: 0 };
        entry.count += 1;
        if (recordType === 'Steps') entry.total += r.count ?? 0;
        else if (recordType === 'ActiveCaloriesBurned') entry.total += r.energy?.inKilocalories ?? 0;
        else entry.total += (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000;
        byOrigin.set(origin, entry);
      }
      const unit = recordType === 'Steps' ? 'passos' : recordType === 'ActiveCaloriesBurned' ? 'kcal' : 'min';
      lines.push(`${recordType}: ${records.length} registro(s)`);
      byOrigin.forEach((v, origin) => lines.push(`  • ${origin}: ${v.count}x, ${Math.round(v.total)} ${unit}`));
    } catch (err: any) {
      lines.push(`${recordType}: erro — ${err?.message ?? String(err)}`);
    }
  }

  try {
    const [cal, ex] = await Promise.all([
      hc.aggregateRecord({ recordType: 'ActiveCaloriesBurned', timeRangeFilter }),
      hc.aggregateRecord({ recordType: 'ExerciseSession', timeRangeFilter }),
    ]);
    lines.push(
      `Agregado sem filtro: ${Math.round(cal.ACTIVE_CALORIES_TOTAL?.inKilocalories ?? 0)} kcal, ` +
        `${Math.round((ex.EXERCISE_DURATION_TOTAL?.inSeconds ?? 0) / 60)} min`
    );
  } catch (err: any) {
    lines.push(`Agregado sem filtro: erro — ${err?.message ?? String(err)}`);
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

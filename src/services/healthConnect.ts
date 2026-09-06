import { Platform } from 'react-native';

export type HealthMetrics = { steps: number; calories: number; exerciseMinutes: number };

const RECORD_TYPES = ['Steps', 'ActiveCaloriesBurned', 'ExerciseSession'] as const;

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
    const [stepsRes, caloriesRes, exerciseRes] = await Promise.all([
      hc.aggregateRecord({ recordType: 'Steps', timeRangeFilter }),
      hc.aggregateRecord({ recordType: 'ActiveCaloriesBurned', timeRangeFilter }),
      hc.aggregateRecord({ recordType: 'ExerciseSession', timeRangeFilter }),
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

export function openHealthConnectSettings() {
  const hc = loadModule();
  if (!hc) return;
  try {
    hc.openHealthConnectSettings();
  } catch {
    // ignora se o Health Connect não estiver instalado
  }
}

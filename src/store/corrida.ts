// Lógica pura de corrida: nada aqui toca em GPS, rede ou estado do app.

export type RunPoint = {
  lat: number;
  lon: number;
  /** timestamp em ms */
  t: number;
  /** trecho contínuo (muda a cada retomada depois de uma pausa) */
  seg: number;
};

export type RunRecord = {
  id: string;
  date: string;
  startedAt: number;
  distanceM: number;
  durationSec: number;
  /** [lat, lon] simplificados pra caber no estado salvo */
  route: [number, number][];
  /** segundos por km, só km completos */
  splits: number[];
  xp: number;
};

const R_TERRA_M = 6371000;
const MAX_VELOCIDADE_MS = 12; // ~43 km/h: acima disso é salto de GPS, não corrida
export const DISTANCIA_MINIMA_M = 100;

const rad = (g: number) => (g * Math.PI) / 180;

export function haversineM(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_TERRA_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

// distância percorrida entre dois pontos consecutivos, ou 0 se não vale (outro trecho, salto de GPS)
function passo(a: RunPoint, b: RunPoint): { d: number; dt: number } {
  if (a.seg !== b.seg) return { d: 0, dt: 0 };
  const dt = (b.t - a.t) / 1000;
  if (dt <= 0) return { d: 0, dt: 0 };
  const d = haversineM(a, b);
  if (d / dt > MAX_VELOCIDADE_MS) return { d: 0, dt };
  return { d, dt };
}

export type RunMetrics = {
  distanceM: number;
  /** ritmo dos últimos ~30 s (seg/km), ou null se parado */
  paceAtual: number | null;
  splits: number[];
};

export function calcularMetricas(points: RunPoint[]): RunMetrics {
  let distanceM = 0;
  let movimento = 0; // segundos em movimento (soma dos dt válidos)
  const acumulado: { dist: number; tempo: number }[] = [{ dist: 0, tempo: 0 }];

  for (let i = 1; i < points.length; i++) {
    const { d, dt } = passo(points[i - 1], points[i]);
    distanceM += d;
    movimento += d > 0 ? dt : 0;
    acumulado.push({ dist: distanceM, tempo: movimento });
  }

  // parciais: tempo em que cada km completo foi cruzado (interpolado entre os pontos)
  const splits: number[] = [];
  let anterior = 0;
  for (let km = 1; km * 1000 <= distanceM; km++) {
    const alvo = km * 1000;
    const j = acumulado.findIndex((p) => p.dist >= alvo);
    if (j <= 0) break;
    const a = acumulado[j - 1];
    const b = acumulado[j];
    const frac = b.dist === a.dist ? 0 : (alvo - a.dist) / (b.dist - a.dist);
    const tempoNoKm = a.tempo + frac * (b.tempo - a.tempo);
    splits.push(Math.round(tempoNoKm - anterior));
    anterior = tempoNoKm;
  }

  // ritmo atual: janela dos últimos 30 s
  let paceAtual: number | null = null;
  const ultimo = points[points.length - 1];
  if (ultimo) {
    let dist = 0;
    let tempo = 0;
    for (let i = points.length - 1; i > 0; i--) {
      if (ultimo.t - points[i - 1].t > 30000) break;
      const { d, dt } = passo(points[i - 1], points[i]);
      dist += d;
      tempo += dt;
    }
    if (dist >= 15 && tempo > 0) paceAtual = tempo / (dist / 1000);
  }

  return { distanceM, paceAtual, splits };
}

// no máximo `max` pontos, sempre mantendo o primeiro e o último
export function simplificarRota(points: RunPoint[], max = 250): [number, number][] {
  const arred = (n: number) => Math.round(n * 1e5) / 1e5;
  if (points.length <= max) return points.map((p) => [arred(p.lat), arred(p.lon)]);
  const passoIdx = (points.length - 1) / (max - 1);
  const saida: [number, number][] = [];
  for (let i = 0; i < max; i++) {
    const p = points[Math.round(i * passoIdx)];
    saida.push([arred(p.lat), arred(p.lon)]);
  }
  return saida;
}

export function xpDaCorrida(distanceM: number): number {
  return Math.min(120, 10 + Math.round((distanceM / 1000) * 10));
}

// ---- formatação ----
export function fmtDistanciaKm(m: number): string {
  return (m / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtTempo(seg: number): string {
  const s = Math.max(0, Math.round(seg));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const dois = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${dois(m)}:${dois(ss)}` : `${dois(m)}:${dois(ss)}`;
}

/** segundos por km -> "5:32" */
export function fmtPace(segPorKm: number | null): string {
  if (segPorKm === null || !isFinite(segPorKm) || segPorKm <= 0 || segPorKm > 3600) return '--:--';
  const s = Math.round(segPorKm);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function paceMedio(distanceM: number, durationSec: number): number | null {
  return distanceM > 0 ? durationSec / (distanceM / 1000) : null;
}

/** data local (YYYY-MM-DD) de um timestamp em ms */
export function dataLocal(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

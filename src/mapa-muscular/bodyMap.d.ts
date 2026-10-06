export type GrupoMuscular =
  | 'peito'
  | 'costas'
  | 'ombros'
  | 'trapezio'
  | 'biceps'
  | 'triceps'
  | 'antebraco'
  | 'abdomen'
  | 'obliquos'
  | 'lombar'
  | 'gluteos'
  | 'quadriceps'
  | 'adutores'
  | 'posterior'
  | 'panturrilha';

export type TemaBoneco = 'escuro' | 'claro' | 'lifequest';
export type SexoBoneco = 'homem' | 'mulher';

export const GRUPOS: Record<GrupoMuscular, string>;
export const SLUGS: Record<GrupoMuscular, string[]>;
export const SLUG_PARA_GRUPO: Record<string, GrupoMuscular>;
export const SEXO_PARA_GENERO: Record<SexoBoneco, 'male' | 'female'>;
export const LADO_PARA_SIDE: Record<'frente' | 'costas', 'front' | 'back'>;
export const CORES: Record<GrupoMuscular, string>;
export const TEMAS: Record<TemaBoneco, { palco: string; neutro: string; parado: string; cabelo: string }>;
export const PRESETS: Record<string, { principais: GrupoMuscular[]; secundarios: GrupoMuscular[] }>;

export function misturar(hexA: string, hexB: string, t: number): string;

export function montarDados(args?: {
  principais?: GrupoMuscular[];
  secundarios?: GrupoMuscular[];
  tema?: TemaBoneco;
}): { slug: string; color: string }[];

export function normalizarGrupos(entrada: unknown): GrupoMuscular[];

export function gruposDoTreino(
  exercicios?: { principal?: unknown; musculo?: unknown; grupo?: unknown; secundarios?: unknown; secundario?: unknown }[]
): { principais: GrupoMuscular[]; secundarios: GrupoMuscular[] };

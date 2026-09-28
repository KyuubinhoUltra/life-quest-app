// Declarações de tipo pro treino-engine.js — o arquivo em si não é tocado
// (só importado), mas isso dá tipagem correta no resto do app.
import { TreinoMissaoConfig, TreinoMissaoResultado } from '@/store/types';

export type Exercicio = {
  id: string;
  nome: string;
  categoria: string;
  equipamento: string[];
  nivel: 'iniciante' | 'intermediario' | 'avancado';
  tipo: 'forca' | 'cardio';
};

export const EXERCICIOS: Exercicio[];
export const CLASSES: Record<
  'guerreiro' | 'ranger' | 'monge',
  {
    nome: string;
    foco: string;
    setsRepsRange: string;
    restRange: string;
    seriesOpcoes: number[];
    repsMin: number;
    repsMax: number;
    descansoSeg: number[];
  }
>;
export const EQUIPAMENTOS: { key: string; label: string }[];
export const NIVEIS: { key: string; label: string }[];
export const GRUPOS_MUSCULARES: { key: string; label: string; cats: string[] }[];
export const CATEGORIA_LABEL: Record<string, string>;
export const PLANOS: Record<string, any>;

export function gerarSplit(
  classeKey: 'guerreiro' | 'ranger' | 'monge',
  dias: number
): { label: string; cat: string[]; tipo: string }[];

export function montarSemanaComExclusoes(
  splitOriginal: { label: string; cat: string[]; tipo: string }[],
  gruposExcluidos: string[],
  focoKey: string | null
): { label: string; cat: string[]; tipo: string }[];

export function obterPool(categorias: string[], equipamento: string, nivel: string): Exercicio[];

export function gerarMissao(args: {
  dia: { label: string; cat: string[]; tipo: string };
  classeKey: 'guerreiro' | 'ranger' | 'monge';
  config: TreinoMissaoConfig;
}): { ok: true; dados: TreinoMissaoResultado } | { ok: false; erro: string };

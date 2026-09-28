// Declarações de tipo pro dieta-engine.js — o arquivo em si não é tocado
// (só importado), mas isso dá tipagem correta no resto do app.
import { DietaAtividade, DietaDiaResultado, DietaDiaSlot, DietaObjetivo, DietaRestricao, DietaSexo } from '@/store/types';

export type Receita = {
  id: string;
  nome: string;
  porcao: string;
  tipos: string[];
  calorias: number;
  proteina: number;
  carboidrato: number;
  gordura: number;
  vegetariano: boolean;
  vegano: boolean;
  sem_lactose: boolean;
  sem_gluten: boolean;
};

export const RECEITAS: Receita[];
export const SEXO_BIOLOGICO: { key: DietaSexo; label: string }[];
export const ATIVIDADES: { key: DietaAtividade; label: string; descricao: string }[];
export const OBJETIVOS: { key: DietaObjetivo; label: string }[];
export const RESTRICOES_ALIMENTARES: { key: DietaRestricao; label: string }[];
export const OPCOES_REFEICOES_DIA: number[];
export const LABEL_SLOT: Record<string, string>;
export const PISO_CALORICO_SEGURANCA: number;

export function calcularTDEE(perfil: {
  peso: number;
  altura: number;
  idade: number;
  sexo: DietaSexo;
  atividade: DietaAtividade;
}): number;

export function calcularMetaCalorica(tdee: number, objetivo: DietaObjetivo): number;

export function calcularMacros(
  metaCalorica: number,
  objetivo: DietaObjetivo
): { proteina: number; carboidrato: number; gordura: number };

export function gerarSemanaDieta(refeicoesPorDia: number): { diaLabel: string; slots: DietaDiaSlot[] }[];

export function obterPoolReceitas(tipoPool: string, restricoes: DietaRestricao[]): Receita[];

export function gerarCardapio(args: {
  dia: { diaLabel: string; slots: DietaDiaSlot[] };
  config: {
    perfil: { peso: number; altura: number; idade: number; sexo: DietaSexo; atividade: DietaAtividade };
    objetivo: DietaObjetivo;
    restricoesAlimentares: DietaRestricao[];
  };
  usadasNaSemana?: Set<string>;
}): { ok: true; dados: DietaDiaResultado } | { ok: false; erro: string };

// LifeQuest – Boneco muscular (React Native / Expo)
// Base anatômica: react-native-body-highlighter (MIT, © 2022 ELABBASSI Hicham)
import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Body, { Slug } from 'react-native-body-highlighter';

import {
  GrupoMuscular,
  LADO_PARA_SIDE,
  SEXO_PARA_GENERO,
  SexoBoneco,
  SLUG_PARA_GRUPO,
  TEMAS,
  TemaBoneco,
  montarDados,
} from './bodyMap';

type BonecoProps = {
  sexo?: SexoBoneco;
  lado?: 'frente' | 'costas';
  principais?: GrupoMuscular[];
  secundarios?: GrupoMuscular[];
  tema?: TemaBoneco;
  /** tamanho (1 = 200x400 px) */
  scale?: number;
  onPressGrupo?: (grupo: GrupoMuscular) => void;
};

/** Um boneco (frente OU costas). */
export default function BonecoMuscular({
  sexo = 'homem',
  lado = 'frente',
  principais = [],
  secundarios = [],
  tema = 'escuro',
  scale = 1,
  onPressGrupo,
}: BonecoProps) {
  const t = TEMAS[tema] || TEMAS.escuro;

  const dados = useMemo(
    () => montarDados({ principais, secundarios, tema }),
    [principais, secundarios, tema]
  );

  return (
    <Body
      data={dados as { slug: Slug; color: string }[]}
      gender={SEXO_PARA_GENERO[sexo] || 'male'}
      side={LADO_PARA_SIDE[lado] || 'front'}
      scale={scale}
      border="none"
      defaultFill={t.neutro}
      defaultStroke={t.palco}
      defaultStrokeWidth={3}
      onBodyPartPress={(parte) => {
        const grupo = parte?.slug ? SLUG_PARA_GRUPO[parte.slug] : undefined;
        if (grupo && onPressGrupo) onPressGrupo(grupo);
      }}
    />
  );
}

/**
 * Frente e costas lado a lado, com um espaço no meio para os números do treino
 * (exercícios, volume, recordes, duração). Ajusta o tamanho à largura da tela.
 */
export function BonecoFrenteCostas({
  centro = null,
  larguraCentro = 96,
  margem = 16,
  ...props
}: BonecoProps & { centro?: React.ReactNode; larguraCentro?: number; margem?: number }) {
  const { width } = useWindowDimensions();
  const larguraUtil = Math.min(width, 480) - margem * 2;
  const scale = Math.max(0.5, (larguraUtil - larguraCentro) / 2 / 200);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
      <BonecoMuscular {...props} lado="frente" scale={scale} />
      <View style={{ width: larguraCentro, alignItems: 'center' }}>{centro}</View>
      <BonecoMuscular {...props} lado="costas" scale={scale} />
    </View>
  );
}

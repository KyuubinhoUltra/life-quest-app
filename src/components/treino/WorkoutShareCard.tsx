import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { fmtDuracaoCurta, ResumoTreino } from '@/components/treino/workout-summary';
import { LQ } from '@/constants/life-quest-theme';
import { CORES, GRUPOS, SexoBoneco } from '@/mapa-muscular/bodyMap';
import BonecoMuscular from '@/mapa-muscular/BonecoMuscular';

const LARGURA_CENTRO = 92;

function Numero({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={styles.numeroValor}>{valor}</Text>
      <Text style={styles.numeroRotulo}>{rotulo}</Text>
    </View>
  );
}

// Cartão que vira imagem (post na Comunidade / compartilhar). Fundo sólido e
// largura fixa pra o resultado sair igual em qualquer tela.
export const WorkoutShareCard = forwardRef<View, { resumo: ResumoTreino; sexo: SexoBoneco; largura: number; data: string }>(
  function WorkoutShareCard({ resumo, sexo, largura, data }, ref) {
    const padding = 16;
    const scale = Math.max(0.5, (largura - padding * 2 - LARGURA_CENTRO) / 2 / 200);

    return (
      <View ref={ref} collapsable={false} style={[styles.card, { width: largura, padding }]}>
        <View style={styles.topRow}>
          <Text style={styles.marca}>LIFE QUEST</Text>
          <Text style={styles.data}>{data}</Text>
        </View>
        <Text style={styles.titulo} numberOfLines={2}>
          {resumo.titulo}
        </Text>

        <View style={styles.bonecos}>
          <BonecoMuscular
            sexo={sexo}
            lado="frente"
            principais={resumo.principais}
            secundarios={resumo.secundarios}
            tema="lifequest"
            scale={scale}
          />
          <View style={{ width: LARGURA_CENTRO, alignItems: 'center', gap: 14 }}>
            <Numero valor={String(resumo.exercicios)} rotulo="Exercícios" />
            <Numero valor={resumo.volumeKg > 0 ? resumo.volumeKg.toLocaleString('pt-BR') : '—'} rotulo="Volume (kg)" />
            <Numero valor={fmtDuracaoCurta(resumo.duracaoSeg)} rotulo="Duração" />
          </View>
          <BonecoMuscular
            sexo={sexo}
            lado="costas"
            principais={resumo.principais}
            secundarios={resumo.secundarios}
            tema="lifequest"
            scale={scale}
          />
        </View>

        {resumo.principais.length > 0 && (
          <View style={styles.legenda}>
            {resumo.principais.map((g) => (
              <View key={g} style={styles.legendaItem}>
                <View style={[styles.legendaDot, { backgroundColor: CORES[g] }]} />
                <Text style={styles.legendaTxt}>{GRUPOS[g]}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  card: { backgroundColor: LQ.paperRaised, borderRadius: 20, borderWidth: 1, borderColor: LQ.line, gap: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  marca: { color: LQ.gold, fontFamily: LQ.fontDisplay, fontSize: 18, letterSpacing: 1 },
  data: { color: LQ.inkFaint, fontFamily: LQ.fontMono, fontSize: 11 },
  titulo: { color: LQ.ink, fontFamily: LQ.fontDisplay, fontSize: 22, textTransform: 'uppercase', letterSpacing: 0.5 },
  bonecos: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  numeroValor: { color: LQ.ink, fontFamily: LQ.fontMono, fontSize: 20 },
  numeroRotulo: { color: LQ.inkFaint, fontSize: 11 },
  legenda: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 4 },
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendaDot: { width: 8, height: 8, borderRadius: 4 },
  legendaTxt: { color: LQ.inkSoft, fontSize: 11 },
});

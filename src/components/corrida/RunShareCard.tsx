import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { RouteMap } from '@/components/corrida/RouteMap';
import { LQ } from '@/constants/life-quest-theme';
import { fmtDistanciaKm, fmtPace, fmtTempo, paceMedio, RunRecord } from '@/store/corrida';

function Numero({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={styles.valor}>{valor}</Text>
      <Text style={styles.rotulo}>{rotulo}</Text>
    </View>
  );
}

// Cartão que vira imagem (post na Comunidade / compartilhar). Fundo sólido e largura
// fixa pra a imagem sair igual em qualquer tela.
export const RunShareCard = forwardRef<View, { run: RunRecord; largura: number }>(function RunShareCard({ run, largura }, ref) {
  const padding = 16;
  const data = new Date(run.date + 'T00:00:00').toLocaleDateString('pt-BR');

  return (
    <View ref={ref} collapsable={false} style={[styles.card, { width: largura, padding }]}>
      <View style={styles.topRow}>
        <Text style={styles.marca}>LIFE QUEST</Text>
        <Text style={styles.data}>{data}</Text>
      </View>
      <Text style={styles.titulo}>Corrida</Text>

      <RouteMap route={run.route} width={largura - padding * 2} height={Math.round((largura - padding * 2) * 0.8)} />

      <View style={styles.stats}>
        <Numero valor={fmtDistanciaKm(run.distanceM)} rotulo="km" />
        <Numero valor={fmtTempo(run.durationSec)} rotulo="Tempo" />
        <Numero valor={fmtPace(paceMedio(run.distanceM, run.durationSec))} rotulo="Ritmo /km" />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { backgroundColor: LQ.paperRaised, borderRadius: 20, borderWidth: 1, borderColor: LQ.line, gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  marca: { color: LQ.gold, fontFamily: LQ.fontDisplay, fontSize: 18, letterSpacing: 1 },
  data: { color: LQ.inkFaint, fontFamily: LQ.fontMono, fontSize: 11 },
  titulo: { color: LQ.ink, fontFamily: LQ.fontDisplay, fontSize: 22, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: -2 },
  stats: { flexDirection: 'row', marginTop: 2 },
  valor: { color: LQ.ink, fontFamily: LQ.fontMono, fontSize: 20 },
  rotulo: { color: LQ.inkFaint, fontSize: 11 },
});

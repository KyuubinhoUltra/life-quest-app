import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';
import { ACHIEVEMENTS, AREA_LABEL, AREA_ORDER, estatisticas } from '@/store/achievements';
import { useLifeQuest } from '@/store/LifeQuestStore';

export function ConquistasTab() {
  const { state } = useLifeQuest();
  const stats = estatisticas(state);
  const desbloqueadas = state.achievements.unlocked;
  const total = ACHIEVEMENTS.length;
  const feitas = Object.keys(desbloqueadas).length;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.resumo}>
        {feitas} de {total} conquistas
      </Text>
      <ProgressBar pct={(feitas / total) * 100} />

      {AREA_ORDER.map((area) => (
        <View key={area} style={{ gap: 8 }}>
          <Text style={styles.area}>{AREA_LABEL[area]}</Text>
          {ACHIEVEMENTS.filter((a) => a.area === area).map((a) => {
            const data = desbloqueadas[a.id];
            const atual = Math.min(stats[a.stat], a.meta);
            return (
              <View key={a.id} style={[styles.item, !data && styles.itemBloqueado]}>
                <View style={[styles.icone, !!data && styles.iconeAtivo]}>
                  <Text style={{ fontSize: 22, opacity: data ? 1 : 0.4 }}>{a.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nome, !data && { color: LQ.inkSoft }]}>{a.nome}</Text>
                  <Text style={styles.descricao}>{a.descricao}</Text>
                  {!data && a.meta > 1 && (
                    <>
                      <ProgressBar pct={(atual / a.meta) * 100} />
                      <Text style={styles.progresso}>
                        {atual.toLocaleString('pt-BR')} / {a.meta.toLocaleString('pt-BR')}
                      </Text>
                    </>
                  )}
                  {!!data && (
                    <Text style={styles.data}>
                      Desbloqueada em {new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </Text>
                  )}
                </View>
                <Text style={[styles.xp, !data && { color: LQ.inkFaint }]}>+{a.xp} XP</Text>
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  resumo: { color: LQ.ink, fontFamily: LQ.fontBodySemiBold, fontSize: 14, marginBottom: -8 },
  area: { color: LQ.inkFaint, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontFamily: LQ.fontBodySemiBold },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: LQ.paperRaised,
    borderWidth: 1,
    borderColor: LQ.gold,
    borderRadius: LQ.radius,
    padding: 12,
  },
  itemBloqueado: { borderColor: LQ.line },
  icone: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: LQ.lineSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeAtivo: { backgroundColor: LQ.goldSoft },
  nome: { color: LQ.ink, fontFamily: LQ.fontBodySemiBold, fontSize: 14 },
  descricao: { color: LQ.inkFaint, fontSize: 12, marginTop: 2 },
  progresso: { color: LQ.inkFaint, fontSize: 10, fontFamily: LQ.fontMono, marginTop: 4 },
  data: { color: LQ.goldInk, fontSize: 11, marginTop: 4 },
  xp: { color: LQ.goldInk, fontFamily: LQ.fontMono, fontSize: 11 },
});

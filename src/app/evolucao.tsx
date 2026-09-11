import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CorpoTab } from '@/components/hub/CorpoTab';
import { FinanceiroTab } from '@/components/hub/FinanceiroTab';
import { RefeicoesTab } from '@/components/hub/RefeicoesTab';
import { TreinoTab } from '@/components/hub/TreinoTab';
import { LQ } from '@/constants/life-quest-theme';

type TabKey = 'treino' | 'corpo' | 'refeicoes' | 'financeiro';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'treino', label: 'Treino' },
  { key: 'corpo', label: 'Corpo' },
  { key: 'refeicoes', label: 'Refeições' },
  { key: 'financeiro', label: 'Saúde Financeira' },
];

export default function EvolucaoScreen() {
  const [tab, setTab] = useState<TabKey>('treino');

  return (
    <View style={styles.screen}>
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <Pressable key={t.key} onPress={() => setTab(t.key)} style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}>
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]} numberOfLines={1}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'treino' && <TreinoTab />}
      {tab === 'corpo' && <CorpoTab />}
      {tab === 'refeicoes' && <RefeicoesTab />}
      {tab === 'financeiro' && <FinanceiroTab />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: LQ.paper },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: LQ.line, paddingHorizontal: 4 },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: LQ.gold },
  tabLabel: { color: LQ.inkFaint, fontSize: 11, fontFamily: LQ.fontBodySemiBold },
  tabLabelActive: { color: LQ.gold },
});

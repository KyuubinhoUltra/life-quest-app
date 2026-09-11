import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Card, SectionTitle, SubText } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';

export function RefeicoesTab() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionTitle>Refeições</SectionTitle>
      <Card>
        <SubText>Em breve: registro de refeições e acompanhamento nutricional.</SubText>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: LQ.paper },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
});

import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { LQ } from '@/constants/life-quest-theme';
import { EXERCISE_CATEGORIES, EXERCISE_LIBRARY, LibraryExercise } from '@/store/exercise-library';

type Props = {
  visible: boolean;
  weekdayLabel: string;
  existingNames: string[];
  onClose: () => void;
  onAdd: (ex: LibraryExercise) => void;
};

export function ExercisePickerModal({ visible, weekdayLabel, existingNames, onClose, onAdd }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof EXERCISE_CATEGORIES)[number]>('Todos');

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXERCISE_LIBRARY.filter((ex) => {
      const matchesCat = category === 'Todos' || ex.cat === category;
      const matchesQuery = !q || ex.name.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [query, category]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
            <Text style={styles.title}>Adicionar Exercício</Text>
            <View style={{ width: 34 }} />
          </View>
          <Text style={styles.day}>Adicionando ao treino de {weekdayLabel}</Text>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar exercício..."
            placeholderTextColor={LQ.inkFaint}
            style={styles.search}
          />

          <View style={styles.catRow}>
            <FlatList
              horizontal
              data={EXERCISE_CATEGORIES as unknown as string[]}
              keyExtractor={(c) => c}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setCategory(item as (typeof EXERCISE_CATEGORIES)[number])}
                  style={[styles.catPill, category === item && styles.catPillActive]}>
                  <Text style={[styles.catPillText, category === item && styles.catPillTextActive]}>{item}</Text>
                </Pressable>
              )}
            />
          </View>

          <FlatList
            data={items}
            keyExtractor={(ex) => ex.name}
            style={styles.list}
            contentContainerStyle={{ gap: 8 }}
            ListEmptyComponent={<Text style={styles.empty}>Nenhum exercício encontrado.</Text>}
            renderItem={({ item }) => {
              const already = existingNames.includes(item.name);
              return (
                <View style={styles.item}>
                  <View style={styles.itemIcon}>
                    <Text style={{ fontSize: 18 }}>🏋️</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemCat}>
                      {item.cat} · {item.target}
                    </Text>
                  </View>
                  <Pressable
                    disabled={already}
                    onPress={() => onAdd(item)}
                    style={[styles.addBtn, already && styles.addBtnDone]}>
                    <Text style={styles.addBtnText}>{already ? '✓' : '+'}</Text>
                  </Pressable>
                </View>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  panel: {
    maxHeight: '88%',
    backgroundColor: LQ.paperRaised,
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: LQ.radius,
    padding: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: LQ.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: LQ.ink, fontSize: 14 },
  title: { color: LQ.ink, fontWeight: '700', fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  day: { color: LQ.inkFaint, fontSize: 12, textAlign: 'center', marginTop: 6, marginBottom: 14 },
  search: {
    backgroundColor: LQ.paper,
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: 999,
    color: LQ.ink,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  catRow: { marginTop: 12, marginBottom: 12 },
  catPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: LQ.line,
    backgroundColor: LQ.paper,
  },
  catPillActive: { backgroundColor: LQ.gold, borderColor: LQ.gold },
  catPillText: { color: LQ.inkSoft, fontSize: 12, fontWeight: '600' },
  catPillTextActive: { color: '#fff' },
  list: {},
  empty: { color: LQ.inkFaint, textAlign: 'center', paddingVertical: 24 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: 12,
    backgroundColor: LQ.paper,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: LQ.lineSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: { color: LQ.ink, fontWeight: '600', fontSize: 14 },
  itemCat: { color: LQ.inkFaint, fontSize: 11, marginTop: 2 },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: LQ.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDone: { backgroundColor: LQ.lineSoft },
  addBtnText: { color: '#fff', fontSize: 18, fontWeight: '600', lineHeight: 20 },
});

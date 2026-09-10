import React, { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PillButton } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';
import { createClub } from '@/services/community';
import { useCommunityAuth } from '@/store/CommunityAuthContext';

const CLUB_ICONS = ['🏆', '🏋️', '🏃', '🚴', '🧘', '⚽', '🥊', '🏊'];

export function CreateClubModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { session } = useCommunityAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState(CLUB_ICONS[0]);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName('');
    setDescription('');
    setIcon(CLUB_ICONS[0]);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    if (!name.trim() || !session) return;
    setSubmitting(true);
    try {
      await createClub(session.user.id, name, icon, description);
      onCreated();
      close();
    } catch (err: any) {
      Alert.alert('Erro ao criar clube', err?.message ?? 'Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Novo clube</Text>
            <Pressable onPress={close} style={styles.closeBtn} hitSlop={8}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.iconRow}>
            {CLUB_ICONS.map((ic) => (
              <Pressable key={ic} onPress={() => setIcon(ic)} style={[styles.iconOption, icon === ic && styles.iconOptionActive]}>
                <Text style={{ fontSize: 18 }}>{ic}</Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nome do clube"
            placeholderTextColor={LQ.inkFaint}
            style={styles.input}
          />
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Descrição (opcional)"
            placeholderTextColor={LQ.inkFaint}
            style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
            multiline
          />

          <PillButton
            label={submitting ? 'Criando…' : 'Criar clube'}
            onPress={submit}
            disabled={submitting || !name.trim()}
            style={{ marginTop: 8 }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  panel: { backgroundColor: LQ.paperRaised, borderWidth: 1, borderColor: LQ.line, borderRadius: LQ.radius, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { color: LQ.ink, fontFamily: LQ.fontDisplay, fontSize: 18, textTransform: 'uppercase', letterSpacing: 0.5 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LQ.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: LQ.ink, fontSize: 14 },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  iconOption: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: LQ.line,
    backgroundColor: LQ.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOptionActive: { borderColor: LQ.gold, backgroundColor: LQ.goldSoft },
  input: {
    backgroundColor: LQ.paper,
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: LQ.radius,
    color: LQ.ink,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
});

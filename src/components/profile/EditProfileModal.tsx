import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PillButton } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';
import { Profile, updateProfile } from '@/services/community';

const AVATAR_ICONS = ['💪', '🙂', '🏃', '🧘', '🔥', '😎', '🦾', '📈', '🌙', '🥗'];

export function EditProfileModal({
  visible,
  profile,
  onClose,
  onSaved,
}: {
  visible: boolean;
  profile: Profile | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState(AVATAR_ICONS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setAvatar(profile.avatar);
    }
  }, [profile]);

  if (!profile) return null;

  const save = async () => {
    if (!username.trim()) return;
    setSaving(true);
    try {
      await updateProfile(profile.id, { username: username.trim(), avatar });
      onSaved();
      onClose();
    } catch (err: any) {
      Alert.alert('Erro ao salvar', err?.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Editar perfil</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.avatarRow}>
            {AVATAR_ICONS.map((ic) => (
              <Pressable
                key={ic}
                onPress={() => setAvatar(ic)}
                style={[styles.avatarOption, avatar === ic && styles.avatarOptionActive]}>
                <Text style={{ fontSize: 18 }}>{ic}</Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Nome de usuário"
            placeholderTextColor={LQ.inkFaint}
            autoCapitalize="none"
            style={styles.input}
          />

          <PillButton
            label={saving ? 'Salvando…' : 'Salvar'}
            onPress={save}
            disabled={saving || !username.trim()}
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
  avatarRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  avatarOption: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: LQ.line,
    backgroundColor: LQ.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOptionActive: { borderColor: LQ.gold, backgroundColor: LQ.goldSoft },
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

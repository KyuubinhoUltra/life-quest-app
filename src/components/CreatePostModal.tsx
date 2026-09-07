import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PillButton } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';
import { createPost } from '@/services/community';
import { useCommunityAuth } from '@/store/CommunityAuthContext';

export function CreatePostModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { session } = useCommunityAuth();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setPhotoUri(null);
    setCaption('');
  };

  const close = () => {
    reset();
    onClose();
  };

  const pickImage = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso para continuar.');
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: true, aspect: [4, 3] })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, allowsEditing: true, aspect: [4, 3] });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const submit = async () => {
    if (!photoUri || !session) return;
    setSubmitting(true);
    try {
      await createPost(session.user.id, photoUri, caption);
      onCreated();
      close();
    } catch (err: any) {
      Alert.alert('Erro ao publicar', err?.message ?? 'Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Novo post</Text>
            <Pressable onPress={close} style={styles.closeBtn} hitSlop={8}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.preview} />
          ) : (
            <View style={styles.pickRow}>
              <PillButton label="Tirar foto" variant="ghost" onPress={() => pickImage(true)} style={{ flex: 1 }} />
              <PillButton label="Galeria" variant="ghost" onPress={() => pickImage(false)} style={{ flex: 1 }} />
            </View>
          )}

          {!!photoUri && (
            <>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Legenda (opcional)"
                placeholderTextColor={LQ.inkFaint}
                style={styles.captionInput}
                multiline
              />
              <View style={styles.actionsRow}>
                <PillButton label="Trocar foto" variant="ghost" onPress={() => setPhotoUri(null)} style={{ flex: 1 }} />
                <PillButton
                  label={submitting ? 'Publicando…' : 'Publicar'}
                  onPress={submit}
                  disabled={submitting}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          )}
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
  pickRow: { flexDirection: 'row', gap: 8 },
  preview: { width: '100%', aspectRatio: 4 / 3, borderRadius: LQ.radius, backgroundColor: LQ.paper },
  captionInput: {
    backgroundColor: LQ.paper,
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: LQ.radius,
    color: LQ.ink,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 12,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
});

import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { AuthModal } from '@/components/AuthModal';
import { PillButton } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';
import { createPost } from '@/services/community';
import { useCommunityAuth } from '@/store/CommunityAuthContext';
import { useLifeQuest } from '@/store/LifeQuestStore';

// Legenda + botões pra transformar um cartão (View) em imagem e então postar na
// Comunidade ou abrir o menu de compartilhar do sistema.
export function ShareActions({
  cardRef,
  defaultCaption,
  postedTitle,
  dialogTitle,
  onPosted,
}: {
  cardRef: React.RefObject<View | null>;
  defaultCaption: string;
  postedTitle: string;
  dialogTitle: string;
  onPosted?: () => void;
}) {
  const { bumpCounter } = useLifeQuest();
  const { session } = useCommunityAuth();
  const [caption, setCaption] = useState(defaultCaption);
  const [busy, setBusy] = useState<'post' | 'share' | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  async function capturar(): Promise<string | null> {
    try {
      return await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
    } catch (err: any) {
      Alert.alert('Não foi possível gerar a imagem', err?.message ?? 'Tente novamente.');
      return null;
    }
  }

  async function postar() {
    if (!session) {
      setAuthOpen(true);
      return;
    }
    setBusy('post');
    try {
      const uri = await capturar();
      if (!uri) return;
      await createPost(session.user.id, uri, caption);
      bumpCounter('posts');
      Alert.alert(postedTitle, 'Seu resultado já está no feed da Comunidade.');
      onPosted?.();
    } catch (err: any) {
      Alert.alert('Erro ao postar', err?.message ?? 'Tente novamente.');
    } finally {
      setBusy(null);
    }
  }

  async function compartilhar() {
    setBusy('share');
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Compartilhamento indisponível', 'Este aparelho não oferece o menu de compartilhar.');
        return;
      }
      const uri = await capturar();
      if (!uri) return;
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle });
      bumpCounter('shares');
    } catch (err: any) {
      Alert.alert('Erro ao compartilhar', err?.message ?? 'Tente novamente.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={{ width: '100%', gap: 10 }}>
      <TextInput
        value={caption}
        onChangeText={setCaption}
        placeholder="Legenda do post (opcional)"
        placeholderTextColor={LQ.inkFaint}
        style={styles.input}
      />
      <PillButton label={busy === 'post' ? 'Postando…' : 'Postar na Comunidade'} onPress={postar} disabled={!!busy} />
      <PillButton
        label={busy === 'share' ? 'Abrindo…' : 'Compartilhar em outras redes'}
        variant="ghost"
        onPress={compartilhar}
        disabled={!!busy}
      />
      <AuthModal visible={authOpen} onClose={() => setAuthOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    backgroundColor: LQ.paper,
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: LQ.radius,
    color: LQ.ink,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
});

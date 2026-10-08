import * as Sharing from 'expo-sharing';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { AuthModal } from '@/components/AuthModal';
import { WorkoutShareCard } from '@/components/treino/WorkoutShareCard';
import { resumirTreinoDeHoje } from '@/components/treino/workout-summary';
import { PillButton, SubText } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';
import { SexoBoneco } from '@/mapa-muscular/bodyMap';
import { createPost } from '@/services/community';
import { useCommunityAuth } from '@/store/CommunityAuthContext';
import { useLifeQuest } from '@/store/LifeQuestStore';

export function ShareWorkoutModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { state, today, currentWeekdayKey, setBonecoSexo, bumpCounter } = useLifeQuest();
  const { session } = useCommunityAuth();
  const { width } = useWindowDimensions();
  const cardRef = useRef<View>(null);

  const resumo = useMemo(() => resumirTreinoDeHoje(state, today, currentWeekdayKey), [state, today, currentWeekdayKey]);
  const sexo: SexoBoneco = state.profile.bonecoSexo ?? (state.dietaPerfil.sexo === 'feminino' ? 'mulher' : 'homem');
  const largura = Math.min(340, width - 40 - 32 - 2);
  const data = new Date(today + 'T00:00:00').toLocaleDateString('pt-BR');

  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState<'post' | 'share' | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (visible) setCaption(`${resumo.titulo} · ${resumo.exercicios} exercício${resumo.exercicios === 1 ? '' : 's'} 💪`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const vazio = resumo.exercicios === 0;

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
      Alert.alert('Treino postado!', 'Seu resultado já está no feed da Comunidade.');
      onClose();
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
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Compartilhar treino' });
      bumpCounter('shares');
    } catch (err: any) {
      Alert.alert('Erro ao compartilhar', err?.message ?? 'Tente novamente.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Compartilhar treino</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ gap: 12, alignItems: 'center' }}>
            {vazio ? (
              <SubText style={{ textAlign: 'center', paddingVertical: 24 }}>
                Marque os exercícios que você concluiu hoje no Plano semanal pra gerar o cartão do treino.
              </SubText>
            ) : (
              <>
                <WorkoutShareCard ref={cardRef} resumo={resumo} sexo={sexo} largura={largura} data={data} />

                <View style={styles.sexoRow}>
                  {(['homem', 'mulher'] as const).map((s) => (
                    <Pressable key={s} onPress={() => setBonecoSexo(s)} style={[styles.sexoBtn, sexo === s && styles.sexoBtnActive]}>
                      <Text style={[styles.sexoTxt, sexo === s && styles.sexoTxtActive]}>
                        {s === 'homem' ? 'Masculino' : 'Feminino'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <TextInput
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="Legenda do post (opcional)"
                  placeholderTextColor={LQ.inkFaint}
                  style={styles.input}
                />

                <View style={{ width: '100%', gap: 8 }}>
                  <PillButton label={busy === 'post' ? 'Postando…' : 'Postar na Comunidade'} onPress={postar} disabled={!!busy} />
                  <PillButton
                    label={busy === 'share' ? 'Abrindo…' : 'Compartilhar em outras redes'}
                    variant="ghost"
                    onPress={compartilhar}
                    disabled={!!busy}
                  />
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
      <AuthModal visible={authOpen} onClose={() => setAuthOpen(false)} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  panel: { maxHeight: '92%', backgroundColor: LQ.paperRaised, borderWidth: 1, borderColor: LQ.line, borderRadius: LQ.radius, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { color: LQ.ink, fontFamily: LQ.fontDisplay, fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  closeBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: LQ.line, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: LQ.ink, fontSize: 14 },
  sexoRow: { flexDirection: 'row', gap: 8 },
  sexoBtn: { borderRadius: 999, borderWidth: 1, borderColor: LQ.line, paddingVertical: 6, paddingHorizontal: 14, backgroundColor: LQ.paper },
  sexoBtnActive: { backgroundColor: LQ.gold, borderColor: LQ.gold },
  sexoTxt: { color: LQ.inkSoft, fontSize: 12, fontFamily: LQ.fontBodySemiBold },
  sexoTxtActive: { color: '#fff' },
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

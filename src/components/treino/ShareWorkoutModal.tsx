import React, { useMemo, useRef } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { ShareActions } from '@/components/ShareActions';
import { WorkoutShareCard } from '@/components/treino/WorkoutShareCard';
import { resumirTreinoDeHoje } from '@/components/treino/workout-summary';
import { SubText } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';
import { SexoBoneco } from '@/mapa-muscular/bodyMap';
import { useLifeQuest } from '@/store/LifeQuestStore';

export function ShareWorkoutModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { state, today, currentWeekdayKey, setBonecoSexo } = useLifeQuest();
  const { width } = useWindowDimensions();
  const cardRef = useRef<View>(null);

  const resumo = useMemo(() => resumirTreinoDeHoje(state, today, currentWeekdayKey), [state, today, currentWeekdayKey]);
  const sexo: SexoBoneco = state.profile.bonecoSexo ?? (state.dietaPerfil.sexo === 'feminino' ? 'mulher' : 'homem');
  const largura = Math.min(340, Math.max(220, width - 40 - 32 - 2));
  const data = new Date(today + 'T00:00:00').toLocaleDateString('pt-BR');
  const vazio = resumo.exercicios === 0;

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

                <ShareActions
                  cardRef={cardRef}
                  defaultCaption={`${resumo.titulo} · ${resumo.exercicios} exercício${resumo.exercicios === 1 ? '' : 's'} 💪`}
                  postedTitle="Treino postado!"
                  dialogTitle="Compartilhar treino"
                  onPosted={onClose}
                />
              </>
            )}
          </ScrollView>
        </View>
      </View>
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
});

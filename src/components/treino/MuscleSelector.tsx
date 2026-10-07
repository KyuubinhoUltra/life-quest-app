import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { LQ } from '@/constants/life-quest-theme';
import { GRUPOS_MUSCULARES } from '@/engines/treino-engine';
import { GrupoMuscular, SexoBoneco } from '@/mapa-muscular/bodyMap';
import BonecoMuscular from '@/mapa-muscular/BonecoMuscular';
import { useLifeQuest } from '@/store/LifeQuestStore';

// O boneco tem 15 músculos; o gerador de treino trabalha com 6 grupos.
const GRUPO_DO_GERADOR: Record<GrupoMuscular, string> = {
  peito: 'peito',
  costas: 'costas',
  trapezio: 'costas',
  lombar: 'costas',
  ombros: 'ombros',
  biceps: 'bracos',
  triceps: 'bracos',
  antebraco: 'bracos',
  abdomen: 'core',
  obliquos: 'core',
  gluteos: 'pernas',
  quadriceps: 'pernas',
  adutores: 'pernas',
  posterior: 'pernas',
  panturrilha: 'pernas',
};

const MUSCULOS_DO_GRUPO: Record<string, GrupoMuscular[]> = {};
(Object.keys(GRUPO_DO_GERADOR) as GrupoMuscular[]).forEach((m) => {
  (MUSCULOS_DO_GRUPO[GRUPO_DO_GERADOR[m]] ??= []).push(m);
});

// Mesmo boneco do cartão de compartilhar treino, aqui pra escolher grupos do
// gerador: tocar num músculo (ou no chip) liga/desliga o grupo inteiro.
export function MuscleSelector({ selecionados, onToggle }: { selecionados: string[]; onToggle: (grupo: string) => void }) {
  const { state, setBonecoSexo } = useLifeQuest();
  const { width } = useWindowDimensions();
  const sexo: SexoBoneco = state.profile.bonecoSexo ?? (state.dietaPerfil.sexo === 'feminino' ? 'mulher' : 'homem');
  const scale = Math.min(0.9, Math.max(0.5, (width - 74) / 400));
  const principais = useMemo(() => selecionados.flatMap((g) => MUSCULOS_DO_GRUPO[g] ?? []), [selecionados]);

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.bonecos}>
        <BonecoMuscular
          sexo={sexo}
          lado="frente"
          principais={principais}
          tema="lifequest"
          scale={scale}
          onPressGrupo={(m) => onToggle(GRUPO_DO_GERADOR[m])}
        />
        <BonecoMuscular
          sexo={sexo}
          lado="costas"
          principais={principais}
          tema="lifequest"
          scale={scale}
          onPressGrupo={(m) => onToggle(GRUPO_DO_GERADOR[m])}
        />
      </View>

      <View style={styles.chips}>
        {GRUPOS_MUSCULARES.map((g) => {
          const ativo = selecionados.includes(g.key);
          return (
            <Pressable key={g.key} onPress={() => onToggle(g.key)} style={[styles.chip, ativo && styles.chipActive]}>
              <Text style={[styles.chipTxt, ativo && styles.chipTxtActive]}>{g.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sexoRow}>
        {(['homem', 'mulher'] as const).map((s) => (
          <Pressable key={s} onPress={() => setBonecoSexo(s)} style={[styles.chip, sexo === s && styles.chipActive]}>
            <Text style={[styles.chipTxt, sexo === s && styles.chipTxtActive]}>{s === 'homem' ? 'Masculino' : 'Feminino'}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bonecos: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  sexoRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: LQ.line, paddingVertical: 6, paddingHorizontal: 14, backgroundColor: LQ.paper },
  chipActive: { backgroundColor: LQ.gold, borderColor: LQ.gold },
  chipTxt: { color: LQ.inkSoft, fontSize: 12, fontFamily: LQ.fontBodySemiBold },
  chipTxtActive: { color: '#fff' },
});

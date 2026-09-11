import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { QuizFlow } from '@/components/QuizFlow';
import { BigFigure, Card, Eyebrow, PillButton, SectionTitle, SubText } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';
import { ATTR_META, CLASSES, levelFromXp, titleForLevel } from '@/store/character';
import { useLifeQuest } from '@/store/LifeQuestStore';
import { CharacterClass } from '@/store/types';

const AVATAR_ICONS = ['🙂', '💪', '🏃', '🧘', '🔥', '😎', '🦾', '📈', '🌙', '🥗'];

function formatBRL(n: number): string {
  return 'R$' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ProgressoTab() {
  const {
    state,
    latestBodyWeight,
    longestHabitStreak,
    avgSleepLast7d,
    setProfileName,
    setProfileAvatar,
    setCharacterClass,
    respecCharacter,
    resetAllData,
  } = useLifeQuest();

  const [name, setName] = useState(state.profile.name);

  const hasClass = !!state.character.classe;
  const weight = latestBodyWeight();
  const streak = longestHabitStreak();
  const totalSaved = state.goals.reduce((s, g) => s + g.saved, 0);
  const avgSleep = avgSleepLast7d();

  const lvlInfo = levelFromXp(state.character.xpGeral);
  const classInfo = state.character.classe ? CLASSES[state.character.classe as CharacterClass] : null;

  const stats = [
    {
      label: 'Peso atual',
      value: weight ? weight.toLocaleString('pt-BR', { minimumFractionDigits: 1 }) : '—',
      unit: weight ? 'kg' : '',
      sub: weight ? 'último registro em Evolução' : 'sem registro ainda',
    },
    { label: 'Maior sequência', value: String(streak), unit: streak === 1 ? 'dia' : 'dias', sub: 'de hábitos seguidos' },
    { label: 'Guardado nas metas', value: formatBRL(totalSaved), unit: '', sub: `${state.goals.length} meta(s) ativa(s)` },
    {
      label: 'Sono médio (7 dias)',
      value: avgSleep !== null ? avgSleep.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '—',
      unit: avgSleep !== null ? 'h' : '',
      sub: 'média das noites registradas',
    },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Text style={{ fontSize: 30 }}>{state.profile.avatar}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <TextInput
            value={name}
            onChangeText={setName}
            onBlur={() => setProfileName(name)}
            placeholder="Nome do personagem"
            placeholderTextColor={LQ.inkFaint}
            style={styles.nameInput}
          />
          <SubText>
            Usando o Life Quest desde {new Date(state.profile.createdAt + 'T00:00:00').toLocaleDateString('pt-BR')}
          </SubText>
        </View>
      </View>

      <View style={styles.avatarRow}>
        {AVATAR_ICONS.map((ic) => (
          <Pressable
            key={ic}
            onPress={() => setProfileAvatar(ic)}
            style={[styles.avatarOption, state.profile.avatar === ic && styles.avatarOptionActive]}>
            <Text style={{ fontSize: 16 }}>{ic}</Text>
          </Pressable>
        ))}
      </View>

      {!hasClass ? (
        <>
          <SectionTitle>Crie seu personagem</SectionTitle>
          <Card style={{ alignItems: 'center', marginBottom: 8 }}>
            <SubText style={{ textAlign: 'center', marginBottom: 12 }}>
              Responda 4 perguntas rápidas para descobrir sua classe em Life Quest.
            </SubText>
          </Card>
          <QuizFlow onComplete={(classe, afinidade) => setCharacterClass(classe, afinidade)} />
        </>
      ) : (
        <View style={{ gap: 4 }}>
          <View style={styles.classBadge}>
            <Text style={styles.classBadgeText}>
              {classInfo?.icon} {classInfo?.nome} · {titleForLevel(lvlInfo.level)}
            </Text>
          </View>

          <View style={styles.levelRow}>
            <Text style={styles.levelFigure}>Nível {lvlInfo.level}</Text>
            <View style={styles.xpTrack}>
              <View style={[styles.xpFill, { width: `${(lvlInfo.xpInLevel / lvlInfo.xpNeeded) * 100}%` }]} />
            </View>
            <Text style={styles.xpLabel}>
              {lvlInfo.xpInLevel} / {lvlInfo.xpNeeded} XP
            </Text>
          </View>

          <View style={styles.attrGrid}>
            {(Object.keys(ATTR_META) as (keyof typeof ATTR_META)[]).map((key) => {
              const meta = ATTR_META[key];
              const info = levelFromXp(state.character.xp[key]);
              return (
                <Card key={key} style={styles.attrCard}>
                  <View style={styles.attrTop}>
                    <Text style={styles.attrName}>
                      {meta.icon} {meta.label}
                    </Text>
                    <Text style={styles.attrLevel}>nível {info.level}</Text>
                  </View>
                  <View style={styles.attrBarTrack}>
                    <View style={[styles.attrBarFill, { width: `${(info.xpInLevel / info.xpNeeded) * 100}%` }]} />
                  </View>
                </Card>
              );
            })}
          </View>

          <PillButton
            label="Refazer o quiz de classe"
            variant="ghost"
            onPress={() => {
              Alert.alert('Refazer o quiz', 'Isso troca sua classe atual (o XP acumulado é mantido). Continuar?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Refazer', style: 'destructive', onPress: respecCharacter },
              ]);
            }}
            style={{ marginTop: 8 }}
          />
        </View>
      )}

      <SectionTitle>Seus números</SectionTitle>
      <View style={styles.statsGrid}>
        {stats.map((s) => (
          <Card key={s.label} style={styles.statCard}>
            <Eyebrow>{s.label}</Eyebrow>
            <BigFigure>
              {s.value}
              {!!s.unit && <Text style={styles.statUnit}> {s.unit}</Text>}
            </BigFigure>
            <SubText>{s.sub}</SubText>
          </Card>
        ))}
      </View>

      <View style={styles.dangerZone}>
        <SectionTitle>Zona de risco</SectionTitle>
        <SubText style={{ marginBottom: 12 }}>
          Apaga hábitos, treinos, registros de peso, água, sono, metas e o personagem salvos neste dispositivo. Não pode ser
          desfeito.
        </SubText>
        <Pressable
          style={styles.dangerBtn}
          onPress={() => {
            Alert.alert(
              'Apagar todos os dados',
              'Tem certeza que deseja apagar todos os dados do Life Quest neste dispositivo? Essa ação não pode ser desfeita.',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Apagar tudo', style: 'destructive', onPress: () => resetAllData() },
              ]
            );
          }}>
          <Text style={styles.dangerBtnText}>Apagar todos os dados</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: LQ.paper },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: LQ.paperRaised,
    borderWidth: 1,
    borderColor: LQ.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameInput: {
    color: LQ.ink,
    fontFamily: LQ.fontDisplay,
    fontSize: 20,
    textTransform: 'uppercase',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    paddingVertical: 2,
  },
  avatarRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  avatarOption: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: LQ.line,
    backgroundColor: LQ.paperRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOptionActive: { borderColor: LQ.gold, backgroundColor: LQ.goldSoft },
  classBadge: {
    alignSelf: 'flex-start',
    backgroundColor: LQ.goldSoft,
    borderWidth: 1,
    borderColor: LQ.gold,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  classBadgeText: { color: LQ.goldInk, fontFamily: LQ.fontDisplay, fontSize: 14 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  levelFigure: { color: LQ.ink, fontFamily: LQ.fontDisplay, fontSize: 14 },
  xpTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: LQ.lineSoft, overflow: 'hidden' },
  xpFill: { height: '100%', backgroundColor: LQ.gold, borderRadius: 4 },
  xpLabel: { color: LQ.inkSoft, fontSize: 11, fontFamily: LQ.fontMono },
  attrGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  attrCard: { flexBasis: '47%', flexGrow: 1 },
  attrTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  attrName: { color: LQ.ink, fontWeight: '600', fontSize: 13 },
  attrLevel: { color: LQ.inkFaint, fontSize: 11, fontFamily: LQ.fontMono },
  attrBarTrack: { height: 6, borderRadius: 3, backgroundColor: LQ.lineSoft, overflow: 'hidden' },
  attrBarFill: { height: '100%', backgroundColor: LQ.gold, borderRadius: 3 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { flexBasis: '47%', flexGrow: 1 },
  statUnit: { fontSize: 13, color: LQ.inkSoft, fontWeight: '500' },
  dangerZone: { borderTopWidth: 1, borderTopColor: LQ.line, paddingTop: 18, marginTop: 8 },
  dangerBtn: { borderWidth: 1, borderColor: LQ.danger, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  dangerBtnText: { color: LQ.danger, fontWeight: '600', fontSize: 14 },
});

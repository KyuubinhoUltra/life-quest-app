import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MuscleSelector } from '@/components/treino/MuscleSelector';
import { PillButton, SubText } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';
import {
  EQUIPAMENTOS,
  GRUPOS_MUSCULARES,
  CLASSES as TREINO_CLASSES,
  gerarSplit,
  montarSemanaComExclusoes,
  NIVEIS,
} from '@/engines/treino-engine';
import { CLASSES as CHAR_CLASSES } from '@/store/character';
import { MAX_DIAS_TREINO, MIN_DIAS_TREINO } from '@/store/forja-treino';
import { useLifeQuest } from '@/store/LifeQuestStore';
import { TreinoMissaoDia, WEEKDAY_FULL, WEEKDAYS } from '@/store/types';

type ClasseTreino = 'guerreiro' | 'ranger' | 'monge';
const CLASSES_TREINO: ClasseTreino[] = ['guerreiro', 'ranger', 'monge'];

type Step = 'classe' | 'foco' | 'dias' | 'equipamento' | 'nivel' | 'grupos' | 'confirmar' | 'semana';
type SplitDia = { label: string; cat: string[]; tipo: string };

function MissaoCard({ dia, idx, onGerar }: { dia: TreinoMissaoDia; idx: number; onGerar: (idx: number) => void }) {
  const corBorda = { forca: LQ.gold, cardio: LQ.goldInk, mobilidade: LQ.line }[dia.tipo] ?? LQ.gold;
  return (
    <View style={[styles.missaoCard, { borderLeftColor: corBorda }]}>
      <View style={styles.missaoHeader}>
        <Text style={styles.missaoLabel}>
          {dia.weekday ? `${dia.weekday} · ` : ''}
          {dia.label}
        </Text>
      </View>

      {!dia.resultado && !dia.error && (
        <PillButton label="Gerar missão" variant="ghost" onPress={() => onGerar(idx)} style={{ width: '100%' }} />
      )}

      {dia.error && (
        <View style={{ gap: 8 }}>
          <Text style={styles.errorText}>{dia.error}</Text>
          <Pressable onPress={() => onGerar(idx)}>
            <Text style={styles.linkText}>Tentar novamente</Text>
          </Pressable>
        </View>
      )}

      {dia.resultado && (
        <View style={{ gap: 10 }}>
          <View>
            <Text style={styles.missaoTitulo}>{dia.resultado.missao}</Text>
            <SubText style={{ marginTop: 2 }}>{dia.resultado.narrativa}</SubText>
          </View>
          <View>
            {dia.resultado.exercicios.map((ex, i) => (
              <View key={i} style={[styles.exRow, i > 0 && styles.exRowBorder]}>
                <Text style={styles.exNome}>{ex.nome}</Text>
                <Text style={styles.exDetalhe}>
                  {ex.series}x{ex.repeticoes} · {ex.descanso}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.dicaText}>Progressão: {dia.resultado.dica_progressao}</Text>
          <Pressable onPress={() => onGerar(idx)}>
            <Text style={styles.linkText}>↻ Gerar novamente</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export function ForjaTreinoModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { state, setTreinoMissaoConfig, aplicarSemanaTreino, gerarMissaoDoDiaTreino } = useLifeQuest();
  const [step, setStep] = useState<Step>('classe');
  const [tempFoco, setTempFoco] = useState<string | null>(null);
  const [tempGrupos, setTempGrupos] = useState<string[]>([]);
  const [tempDias, setTempDias] = useState<string[]>([]);
  const [splitPendente, setSplitPendente] = useState<SplitDia[]>([]);

  const planoTemExercicios = Object.values(state.workoutPlan).some((p) => p.exercises.length > 0);

  const classePersonagem = state.character.classe;
  const classeFixa = CLASSES_TREINO.includes(classePersonagem as ClasseTreino) ? (classePersonagem as ClasseTreino) : null;

  useEffect(() => {
    if (!visible) return;
    if (state.treinoMissaoSemana.length > 0) {
      setStep('semana');
      return;
    }
    if (classeFixa) {
      setTreinoMissaoConfig({ classe: classeFixa, foco: null, gruposExcluidos: [] });
      setStep(classeFixa === 'guerreiro' ? 'foco' : 'dias');
    } else {
      setStep('classe');
    }
    setTempFoco(null);
    setTempGrupos([]);
    setTempDias(state.treinoMissaoConfig.diasSemana ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function escolherClasse(classe: ClasseTreino) {
    setTreinoMissaoConfig({ classe, foco: null, gruposExcluidos: [] });
    setStep(classe === 'guerreiro' ? 'foco' : 'dias');
  }

  function confirmarFoco() {
    setTreinoMissaoConfig({ foco: tempFoco });
    setTempFoco(null);
    setStep('dias');
  }

  function toggleDia(dia: string) {
    setTempDias((prev) => (prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]));
  }

  function confirmarDias() {
    setTreinoMissaoConfig({ diasSemana: WEEKDAYS.filter((wd) => tempDias.includes(wd)) });
    setStep('equipamento');
  }

  function escolherEquipamento(equipamento: string) {
    setTreinoMissaoConfig({ equipamento });
    setStep('nivel');
  }

  function escolherNivel(nivel: string) {
    const classe = state.treinoMissaoConfig.classe;
    setTreinoMissaoConfig({ nivel });
    if (classe === 'guerreiro') setStep('grupos');
    else finalizar({ ...state.treinoMissaoConfig, nivel, gruposExcluidos: [] });
  }

  function confirmarGrupos() {
    const selecionados = GRUPOS_MUSCULARES.filter((g) => tempGrupos.includes(g.key));
    const cats = selecionados.flatMap((g) => g.cats);
    const conflitaComFoco = state.treinoMissaoConfig.foco && tempGrupos.includes(state.treinoMissaoConfig.foco);
    const foco = conflitaComFoco ? null : state.treinoMissaoConfig.foco;
    setTreinoMissaoConfig({ gruposExcluidos: cats, foco });
    finalizar({ ...state.treinoMissaoConfig, gruposExcluidos: cats, foco });
  }

  function finalizar(config: typeof state.treinoMissaoConfig) {
    const qtdDias = config.diasSemana?.length ?? 0;
    if (!config.classe || qtdDias < MIN_DIAS_TREINO) return;
    let split = gerarSplit(config.classe, qtdDias);
    if (config.classe === 'guerreiro' && config.gruposExcluidos.length > 0) {
      split = montarSemanaComExclusoes(split, config.gruposExcluidos, config.foco);
    }
    if (split.length === 0) {
      setStep('grupos');
      return;
    }
    if (planoTemExercicios) {
      setSplitPendente(split);
      setStep('confirmar');
      return;
    }
    aplicar(split);
  }

  function aplicar(split: SplitDia[]) {
    aplicarSemanaTreino(split);
    setStep('semana');
  }

  function refazer() {
    if (classeFixa) {
      setTreinoMissaoConfig({ classe: classeFixa, foco: null, gruposExcluidos: [] });
      setStep(classeFixa === 'guerreiro' ? 'foco' : 'dias');
    } else {
      setStep('classe');
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>⚔️ Forja de Treinos</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ gap: 12 }}>
            {step === 'classe' && (
              <View style={{ gap: 8 }}>
                <SubText>Qual estilo de treino você quer jogar essa semana?</SubText>
                {CLASSES_TREINO.map((c) => (
                  <Pressable key={c} onPress={() => escolherClasse(c)} style={styles.optionCard}>
                    <Text style={{ fontSize: 20 }}>{CHAR_CLASSES[c].icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.optionTitle}>{CHAR_CLASSES[c].nome}</Text>
                      <SubText>{TREINO_CLASSES[c].foco}</SubText>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {step === 'foco' && (
              <View style={{ gap: 8 }}>
                <SubText>Quer dar ênfase extra em alguma área essa semana?</SubText>
                <MuscleSelector selecionados={tempFoco ? [tempFoco] : []} onToggle={(g) => setTempFoco((p) => (p === g ? null : g))} />
                <PillButton label={tempFoco ? 'Confirmar ênfase' : 'Sem preferência, seguir'} onPress={confirmarFoco} />
              </View>
            )}

            {step === 'dias' && (
              <View style={{ gap: 8 }}>
                <SubText>Em quais dias da semana você pode treinar? Os treinos se ajustam à quantidade de dias.</SubText>
                <View style={styles.gridRow}>
                  {WEEKDAYS.map((wd, i) => {
                    const ativo = tempDias.includes(wd);
                    return (
                      <Pressable
                        key={wd}
                        onPress={() => toggleDia(wd)}
                        accessibilityLabel={WEEKDAY_FULL[i]}
                        style={[styles.gridBtn, ativo && styles.gridBtnActive]}>
                        <Text style={[styles.gridBtnText, ativo && styles.gridBtnTextActive]}>{wd}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <SubText>
                  {tempDias.length === 0
                    ? `Escolha de ${MIN_DIAS_TREINO} a ${MAX_DIAS_TREINO} dias.`
                    : `${tempDias.length} ${tempDias.length === 1 ? 'dia selecionado' : 'dias selecionados'}${
                        tempDias.length < MIN_DIAS_TREINO
                          ? ` — escolha pelo menos ${MIN_DIAS_TREINO}.`
                          : tempDias.length > MAX_DIAS_TREINO
                            ? ` — o máximo é ${MAX_DIAS_TREINO}, pra sobrar um dia de descanso.`
                            : '.'
                      }`}
                </SubText>
                <PillButton
                  label="Continuar"
                  onPress={confirmarDias}
                  disabled={tempDias.length < MIN_DIAS_TREINO || tempDias.length > MAX_DIAS_TREINO}
                />
              </View>
            )}

            {step === 'equipamento' && (
              <View style={{ gap: 8 }}>
                <SubText>Que equipamento você tem disponível?</SubText>
                {EQUIPAMENTOS.map((eq) => (
                  <Pressable key={eq.key} onPress={() => escolherEquipamento(eq.key)} style={styles.listBtn}>
                    <Text style={styles.listBtnText}>{eq.label}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {step === 'nivel' && (
              <View style={{ gap: 8 }}>
                <SubText>Qual seu nível de experiência?</SubText>
                <View style={styles.gridRow}>
                  {NIVEIS.map((nv) => (
                    <Pressable key={nv.key} onPress={() => escolherNivel(nv.key)} style={[styles.gridBtn, { flex: 1 }]}>
                      <Text style={styles.gridBtnText}>{nv.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {step === 'grupos' && (
              <View style={{ gap: 8 }}>
                <SubText>Tem algum grupo muscular que você não treina?</SubText>
                <MuscleSelector selecionados={tempGrupos} onToggle={(g) => setTempGrupos((p) => (p.includes(g) ? p.filter((k) => k !== g) : [...p, g]))} />
                <PillButton label={tempGrupos.length ? 'Confirmar exclusões' : 'Treino todos, seguir'} onPress={confirmarGrupos} />
              </View>
            )}

            {step === 'confirmar' && (
              <View style={{ gap: 10 }}>
                <SubText>
                  Seu treino gerado vai entrar no Plano semanal e substituir o plano atual (exercícios e cargas dos dias da semana).
                </SubText>
                <PillButton label="Substituir meu Plano semanal" onPress={() => aplicar(splitPendente)} />
                <PillButton label="Cancelar" variant="ghost" onPress={onClose} />
              </View>
            )}

            {step === 'semana' && (
              <View style={{ gap: 12 }}>
                <View style={styles.semanaHeader}>
                  <SubText style={{ flex: 1 }}>Seu treino da semana — já está no Plano semanal.</SubText>
                  <Pressable onPress={refazer}>
                    <Text style={styles.linkText}>Refazer perguntas</Text>
                  </Pressable>
                </View>
                {state.treinoMissaoSemana.map((dia, idx) => (
                  <MissaoCard key={idx} dia={dia} idx={idx} onGerar={gerarMissaoDoDiaTreino} />
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  panel: { maxHeight: '88%', backgroundColor: LQ.paperRaised, borderWidth: 1, borderColor: LQ.line, borderRadius: LQ.radius, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { color: LQ.ink, fontFamily: LQ.fontDisplay, fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  closeBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: LQ.line, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: LQ.ink, fontSize: 14 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: LQ.paper,
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: LQ.radius,
    padding: 14,
  },
  optionTitle: { color: LQ.ink, fontFamily: LQ.fontBodySemiBold, fontSize: 14 },
  gridRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  gridBtn: {
    minWidth: 52,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: LQ.radius,
    borderWidth: 1,
    borderColor: LQ.line,
    backgroundColor: LQ.paper,
  },
  gridBtnActive: { backgroundColor: LQ.gold, borderColor: LQ.gold },
  gridBtnText: { color: LQ.ink, fontFamily: LQ.fontBodySemiBold, fontSize: 14 },
  gridBtnTextActive: { color: '#fff' },
  listBtn: { borderWidth: 1, borderColor: LQ.line, backgroundColor: LQ.paper, borderRadius: LQ.radius, paddingVertical: 12, paddingHorizontal: 14 },
  listBtnText: { color: LQ.ink, fontSize: 14 },
  semanaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  linkText: { color: LQ.gold, fontSize: 12, fontFamily: LQ.fontBodySemiBold },
  missaoCard: {
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: LQ.line,
    backgroundColor: LQ.paper,
    borderRadius: LQ.radius,
    padding: 14,
    gap: 10,
  },
  missaoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  missaoLabel: { color: LQ.ink, fontFamily: LQ.fontBodySemiBold, fontSize: 14 },
  missaoTitulo: { color: LQ.goldInk, fontFamily: LQ.fontDisplay, fontSize: 15, textTransform: 'uppercase' },
  errorText: { color: LQ.danger, fontSize: 13 },
  exRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  exRowBorder: { borderTopWidth: 1, borderTopColor: LQ.line },
  exNome: { color: LQ.ink, fontSize: 13 },
  exDetalhe: { color: LQ.inkFaint, fontSize: 12, fontFamily: LQ.fontMono },
  dicaText: { color: LQ.goldInk, fontSize: 12 },
});

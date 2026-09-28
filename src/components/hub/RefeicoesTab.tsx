import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, PillButton, SectionTitle, SubText, XpBadge } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';
import {
  ATIVIDADES,
  LABEL_SLOT,
  OBJETIVOS,
  OPCOES_REFEICOES_DIA,
  RESTRICOES_ALIMENTARES,
  SEXO_BIOLOGICO,
  gerarSemanaDieta,
} from '@/engines/dieta-engine';
import { useLifeQuest } from '@/store/LifeQuestStore';
import { DietaAtividade, DietaDia, DietaObjetivo, DietaRefeicao, DietaRestricao, DietaSexo } from '@/store/types';

type Step = 'peso' | 'altura' | 'idade' | 'sexo' | 'atividade' | 'objetivo' | 'restricoes' | 'refeicoesDia' | 'semana';

function passoInicial(deps: {
  peso: number | null;
  altura: number | null;
  idade: number | null;
  sexo: DietaSexo | null;
  atividade: DietaAtividade | null;
  objetivo: DietaObjetivo | null;
  refeicoesPorDia: number | null;
  temSemana: boolean;
}): Step {
  if (deps.temSemana) return 'semana';
  if (!deps.peso) return 'peso';
  if (!deps.altura) return 'altura';
  if (!deps.idade) return 'idade';
  if (!deps.sexo) return 'sexo';
  if (!deps.atividade) return 'atividade';
  if (!deps.objetivo) return 'objetivo';
  if (!deps.refeicoesPorDia) return 'refeicoesDia';
  return 'restricoes';
}

function DiaCard({
  dia,
  idx,
  jaComeu,
  onGerar,
  onComer,
}: {
  dia: DietaDia;
  idx: number;
  jaComeu: (nome: string) => boolean;
  onGerar: (idx: number) => void;
  onComer: (r: DietaRefeicao) => void;
}) {
  return (
    <View style={styles.diaCard}>
      <View style={styles.diaHeader}>
        <Text style={styles.diaLabel}>{dia.diaLabel}</Text>
        {dia.resultado && <XpBadge amount={dia.resultado.xp} />}
      </View>

      {!dia.resultado && !dia.error && (
        <PillButton label="Gerar cardápio" variant="ghost" onPress={() => onGerar(idx)} style={{ width: '100%' }} />
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
            <Text style={styles.diaTitulo}>{dia.resultado.titulo}</Text>
            <SubText style={{ marginTop: 2 }}>{dia.resultado.narrativa}</SubText>
          </View>

          <View>
            {dia.resultado.refeicoes.map((r, i) => (
              <View key={i} style={[styles.refRow, i > 0 && styles.refRowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.refSlot}>{LABEL_SLOT[r.slot] ?? r.slot}</Text>
                  <Text style={styles.refNome}>{r.nome}</Text>
                  <Text style={styles.refPorcao}>{r.porcao}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={styles.refCalorias}>{r.calorias} kcal</Text>
                  <Pressable onPress={() => onComer(r)} disabled={jaComeu(r.nome)} hitSlop={6}>
                    <Text style={[styles.comerText, jaComeu(r.nome) && styles.comerTextDone]}>
                      {jaComeu(r.nome) ? '✓ Registrado' : 'Comi isso'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.totaisRow}>
            <SubText>
              {dia.resultado.caloriasTotais} kcal · meta {dia.resultado.metaCalorica}
            </SubText>
            <SubText>
              {dia.resultado.proteinaTotal}p / {dia.resultado.carboTotal}c / {dia.resultado.gorduraTotal}g
            </SubText>
          </View>
          <Text style={styles.dicaText}>Dica: {dia.resultado.dica}</Text>
          <Pressable onPress={() => onGerar(idx)}>
            <Text style={styles.linkText}>↻ Gerar novamente</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export function RefeicoesTab() {
  const { state, today, latestBodyWeight, addWeightEntry, setDietaPerfil, setDietaConfig, setDietaSemana, gerarCardapioDoDia, registrarRefeicaoComida } =
    useLifeQuest();

  const peso = latestBodyWeight();
  const [step, setStep] = useState<Step>(() =>
    passoInicial({
      peso,
      altura: state.dietaPerfil.altura,
      idade: state.dietaPerfil.idade,
      sexo: state.dietaPerfil.sexo,
      atividade: state.dietaPerfil.atividade,
      objetivo: state.dietaConfig.objetivo,
      refeicoesPorDia: state.dietaConfig.refeicoesPorDia,
      temSemana: state.dietaSemana.length > 0,
    })
  );
  const [inputValor, setInputValor] = useState('');
  const [erroInput, setErroInput] = useState<string | null>(null);
  const [tempRestricoes, setTempRestricoes] = useState<DietaRestricao[]>(state.dietaConfig.restricoes);

  const hojeComido = new Set((state.nutritionLog[today] ?? []).map((e) => e.nome));

  function enviarPeso() {
    const valor = parseFloat(inputValor.replace(',', '.'));
    if (!valor || valor < 20 || valor > 300) {
      setErroInput('Digite um peso válido em kg.');
      return;
    }
    addWeightEntry(today, valor);
    setInputValor('');
    setErroInput(null);
    setStep('altura');
  }

  function enviarAltura() {
    const valor = parseFloat(inputValor.replace(',', '.'));
    if (!valor || valor < 100 || valor > 250) {
      setErroInput('Digite uma altura válida em cm.');
      return;
    }
    setDietaPerfil({ altura: valor });
    setInputValor('');
    setErroInput(null);
    setStep('idade');
  }

  function enviarIdade() {
    const valor = parseFloat(inputValor.replace(',', '.'));
    if (!valor || valor < 10 || valor > 100) {
      setErroInput('Digite uma idade válida.');
      return;
    }
    setDietaPerfil({ idade: valor });
    setInputValor('');
    setErroInput(null);
    setStep('sexo');
  }

  function escolherSexo(sexo: DietaSexo) {
    setDietaPerfil({ sexo });
    setStep('atividade');
  }

  function escolherAtividade(atividade: DietaAtividade) {
    setDietaPerfil({ atividade });
    setStep('objetivo');
  }

  function escolherObjetivo(objetivo: DietaObjetivo) {
    setDietaConfig({ objetivo });
    setStep('restricoes');
  }

  function toggleRestricao(key: DietaRestricao) {
    setTempRestricoes((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  function confirmarRestricoes() {
    setDietaConfig({ restricoes: tempRestricoes });
    setStep('refeicoesDia');
  }

  function escolherRefeicoesDia(n: number) {
    setDietaConfig({ refeicoesPorDia: n });
    const dias = gerarSemanaDieta(n).map((d) => ({ ...d, resultado: null, error: null }));
    setDietaSemana(dias);
    setStep('semana');
  }

  function editarPreferencias() {
    setDietaSemana([]);
    setTempRestricoes(state.dietaConfig.restricoes);
    setStep('objetivo');
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionTitle>Cozinha do Alquimista</SectionTitle>
      <SubText style={{ marginTop: -8 }}>
        Estimativas gerais (fórmula de Mifflin-St Jeor) — não substituem orientação de nutricionista.
      </SubText>

      {step === 'peso' && (
        <Card style={{ gap: 10 }}>
          <SubText>Qual seu peso atual, em kg?</SubText>
          <TextInput
            value={inputValor}
            onChangeText={(v) => {
              setInputValor(v);
              setErroInput(null);
            }}
            placeholder="Ex: 70"
            placeholderTextColor={LQ.inkFaint}
            keyboardType="numeric"
            style={styles.input}
          />
          {!!erroInput && <Text style={styles.errorText}>{erroInput}</Text>}
          <PillButton label="Enviar" onPress={enviarPeso} />
        </Card>
      )}

      {step === 'altura' && (
        <Card style={{ gap: 10 }}>
          <SubText>E sua altura, em cm?</SubText>
          <TextInput
            value={inputValor}
            onChangeText={(v) => {
              setInputValor(v);
              setErroInput(null);
            }}
            placeholder="Ex: 175"
            placeholderTextColor={LQ.inkFaint}
            keyboardType="numeric"
            style={styles.input}
          />
          {!!erroInput && <Text style={styles.errorText}>{erroInput}</Text>}
          <PillButton label="Enviar" onPress={enviarAltura} />
        </Card>
      )}

      {step === 'idade' && (
        <Card style={{ gap: 10 }}>
          <SubText>Quantos anos você tem?</SubText>
          <TextInput
            value={inputValor}
            onChangeText={(v) => {
              setInputValor(v);
              setErroInput(null);
            }}
            placeholder="Ex: 30"
            placeholderTextColor={LQ.inkFaint}
            keyboardType="numeric"
            style={styles.input}
          />
          {!!erroInput && <Text style={styles.errorText}>{erroInput}</Text>}
          <PillButton label="Enviar" onPress={enviarIdade} />
        </Card>
      )}

      {step === 'sexo' && (
        <View style={{ gap: 8 }}>
          <SubText>Isso ajuda a calcular seu gasto calórico com mais precisão: qual dessas se aplica a você?</SubText>
          {SEXO_BIOLOGICO.map((s) => (
            <Pressable key={s.key} onPress={() => escolherSexo(s.key)} style={styles.listBtn}>
              <Text style={styles.listBtnText}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {step === 'atividade' && (
        <View style={{ gap: 8 }}>
          <SubText>Qual seu nível de atividade física no dia a dia?</SubText>
          {ATIVIDADES.map((a) => (
            <Pressable key={a.key} onPress={() => escolherAtividade(a.key)} style={styles.optionCard}>
              <View>
                <Text style={styles.optionTitle}>{a.label}</Text>
                <SubText>{a.descricao}</SubText>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {step === 'objetivo' && (
        <View style={{ gap: 8 }}>
          <SubText>Qual seu objetivo principal agora?</SubText>
          {OBJETIVOS.map((o) => (
            <Pressable key={o.key} onPress={() => escolherObjetivo(o.key)} style={styles.listBtn}>
              <Text style={styles.listBtnText}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {step === 'restricoes' && (
        <View style={{ gap: 8 }}>
          <SubText>Alguma restrição alimentar? Pode marcar mais de uma.</SubText>
          <View style={styles.gridRow}>
            {RESTRICOES_ALIMENTARES.map((r) => {
              const ativo = tempRestricoes.includes(r.key);
              return (
                <Pressable
                  key={r.key}
                  onPress={() => toggleRestricao(r.key)}
                  style={[styles.chip, ativo && styles.chipActive]}>
                  <Text style={[styles.chipText, ativo && styles.chipTextActive]}>{r.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <PillButton label={tempRestricoes.length ? 'Confirmar restrições' : 'Sem restrições, seguir'} onPress={confirmarRestricoes} />
        </View>
      )}

      {step === 'refeicoesDia' && (
        <View style={{ gap: 8 }}>
          <SubText>Quantas refeições por dia você prefere?</SubText>
          <View style={styles.gridRow}>
            {OPCOES_REFEICOES_DIA.map((n) => (
              <Pressable key={n} onPress={() => escolherRefeicoesDia(n)} style={styles.gridBtn}>
                <Text style={styles.gridBtnText}>{n}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {step === 'semana' && (
        <View style={{ gap: 12 }}>
          <Pressable onPress={editarPreferencias} style={{ alignSelf: 'flex-start' }}>
            <Text style={styles.linkText}>Editar objetivo / restrições / refeições por dia</Text>
          </Pressable>
          {state.dietaSemana.map((dia, idx) => (
            <DiaCard
              key={idx}
              dia={dia}
              idx={idx}
              jaComeu={(nome) => hojeComido.has(nome)}
              onGerar={gerarCardapioDoDia}
              onComer={(r) =>
                registrarRefeicaoComida({
                  slot: r.slot,
                  nome: r.nome,
                  calorias: r.calorias,
                  proteina: r.proteina,
                  carboidrato: r.carboidrato,
                  gordura: r.gordura,
                })
              }
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: LQ.paper },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  input: {
    backgroundColor: LQ.paper,
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: LQ.radius,
    color: LQ.ink,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  listBtn: { borderWidth: 1, borderColor: LQ.line, backgroundColor: LQ.paperRaised, borderRadius: LQ.radius, paddingVertical: 12, paddingHorizontal: 14 },
  listBtnText: { color: LQ.ink, fontSize: 14 },
  optionCard: { borderWidth: 1, borderColor: LQ.line, backgroundColor: LQ.paperRaised, borderRadius: LQ.radius, padding: 14 },
  optionTitle: { color: LQ.ink, fontFamily: LQ.fontBodySemiBold, fontSize: 14 },
  gridRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  gridBtn: {
    minWidth: 52,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: LQ.radius,
    borderWidth: 1,
    borderColor: LQ.line,
    backgroundColor: LQ.paperRaised,
  },
  gridBtnText: { color: LQ.ink, fontFamily: LQ.fontBodySemiBold, fontSize: 14 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: LQ.line, backgroundColor: LQ.paperRaised, paddingVertical: 8, paddingHorizontal: 14 },
  chipActive: { backgroundColor: LQ.gold, borderColor: LQ.gold },
  chipText: { color: LQ.inkSoft, fontSize: 12, fontFamily: LQ.fontBodySemiBold },
  chipTextActive: { color: '#fff' },
  linkText: { color: LQ.gold, fontSize: 12, fontFamily: LQ.fontBodySemiBold },
  diaCard: {
    borderLeftWidth: 4,
    borderLeftColor: LQ.gold,
    borderWidth: 1,
    borderColor: LQ.line,
    backgroundColor: LQ.paperRaised,
    borderRadius: LQ.radius,
    padding: 14,
    gap: 10,
  },
  diaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  diaLabel: { color: LQ.ink, fontFamily: LQ.fontBodySemiBold, fontSize: 14 },
  diaTitulo: { color: LQ.goldInk, fontFamily: LQ.fontDisplay, fontSize: 15, textTransform: 'uppercase' },
  errorText: { color: LQ.danger, fontSize: 13 },
  refRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 8 },
  refRowBorder: { borderTopWidth: 1, borderTopColor: LQ.line },
  refSlot: { color: LQ.inkFaint, fontSize: 11, textTransform: 'uppercase' },
  refNome: { color: LQ.ink, fontSize: 13, marginTop: 2 },
  refPorcao: { color: LQ.inkFaint, fontSize: 11, marginTop: 2 },
  refCalorias: { color: LQ.inkSoft, fontSize: 12, fontFamily: LQ.fontMono },
  comerText: { color: LQ.gold, fontSize: 11, fontFamily: LQ.fontBodySemiBold },
  comerTextDone: { color: LQ.inkFaint },
  totaisRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: LQ.line, paddingTop: 10 },
  dicaText: { color: LQ.goldInk, fontSize: 12 },
});

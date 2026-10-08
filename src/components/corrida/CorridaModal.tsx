import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { RouteMap } from '@/components/corrida/RouteMap';
import { RunShareCard } from '@/components/corrida/RunShareCard';
import { ShareActions } from '@/components/ShareActions';
import { PillButton, SubText } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';
import {
  ActiveRun,
  discardRun,
  duracaoSeg,
  finishRun,
  pauseRun,
  restaurarSessao,
  resumeRun,
  startRun,
  subscribe,
} from '@/services/runTracker';
import {
  calcularMetricas,
  dataLocal,
  DISTANCIA_MINIMA_M,
  fmtDistanciaKm,
  fmtPace,
  fmtTempo,
  paceMedio,
  RunRecord,
  simplificarRota,
  xpDaCorrida,
} from '@/store/corrida';
import { useLifeQuest } from '@/store/LifeQuestStore';

type Tela = 'inicio' | 'gravando' | 'resumo';

function Stat({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={styles.statValor}>{valor}</Text>
      <Text style={styles.statRotulo}>{rotulo}</Text>
    </View>
  );
}

function dataCurta(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

export function CorridaModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { state, salvarCorrida, excluirCorrida } = useLifeQuest();
  const { width } = useWindowDimensions();
  const cardRef = useRef<View>(null);

  const [tela, setTela] = useState<Tela>('inicio');
  const [run, setRun] = useState<ActiveRun | null>(null);
  const [resumoRun, setResumoRun] = useState<RunRecord | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [iniciando, setIniciando] = useState(false);
  const [agora, setAgora] = useState(Date.now());

  const larguraPainel = Math.max(220, width - 40 - 32 - 2);
  const metricas = useMemo(() => calcularMetricas(run?.points ?? []), [run]);
  const rotaAoVivo = useMemo(() => simplificarRota(run?.points ?? [], 150), [run]);

  useEffect(() => {
    if (!visible) return;
    const parar = subscribe(setRun);
    let ativo = true;
    restaurarSessao().then((r) => {
      if (!ativo) return;
      setRun(r);
      if (r) setTela('gravando');
      else setTela((t) => (t === 'gravando' ? 'inicio' : t));
    });
    return () => {
      ativo = false;
      parar();
    };
  }, [visible]);

  useEffect(() => {
    if (!visible || tela !== 'gravando' || run?.status !== 'running') return;
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [visible, tela, run?.status]);

  async function iniciar() {
    setErro(null);
    setAviso(null);
    setIniciando(true);
    const r = await startRun();
    setIniciando(false);
    if (!r.ok) {
      setErro(
        r.reason === 'permission'
          ? 'Sem permissão de localização. Libere o acesso à localização nas configurações do app e tente de novo.'
          : r.reason === 'gps-off'
            ? 'O GPS do aparelho está desligado. Ligue a localização e tente de novo.'
            : `Não foi possível iniciar o GPS. ${r.message ?? ''}`
      );
      return;
    }
    if (!r.background) {
      setAviso('Sem a permissão de localização "o tempo todo", mantenha o app aberto durante a corrida.');
    }
    setTela('gravando');
  }

  async function finalizar() {
    const final = await finishRun();
    if (!final) {
      setTela('inicio');
      return;
    }
    const m = calcularMetricas(final.points);
    if (m.distanceM < DISTANCIA_MINIMA_M) {
      setErro(`Corrida muito curta (menos de ${DISTANCIA_MINIMA_M} m) — não foi salva.`);
      setTela('inicio');
      return;
    }
    const registro: RunRecord = {
      id: `${final.startedAt}`,
      date: dataLocal(final.startedAt),
      startedAt: final.startedAt,
      distanceM: Math.round(m.distanceM),
      durationSec: Math.round(final.accumulatedSec),
      route: simplificarRota(final.points),
      splits: m.splits,
      xp: xpDaCorrida(m.distanceM),
    };
    salvarCorrida(registro);
    setErro(null);
    setAviso(null);
    setResumoRun(registro);
    setTela('resumo');
  }

  function descartar() {
    Alert.alert('Descartar corrida', 'Tem certeza? O percurso gravado até agora será apagado.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: async () => {
          await discardRun();
          setTela('inicio');
        },
      },
    ]);
  }

  function excluir(r: RunRecord) {
    Alert.alert('Excluir corrida', 'Tem certeza que deseja excluir esta corrida? O XP já ganho é mantido.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          excluirCorrida(r.id);
          setTela('inicio');
        },
      },
    ]);
  }

  const totalKm = state.runs.reduce((s, r) => s + r.distanceM, 0);
  const duracao = run ? duracaoSeg(run, agora) : 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>🏃 Corrida</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ gap: 14 }}>
            {tela === 'inicio' && (
              <>
                <SubText>
                  Grava o seu percurso por GPS: distância, tempo, ritmo e parciais por km. Funciona com a tela apagada.
                </SubText>
                {!!erro && <Text style={styles.erro}>{erro}</Text>}
                <PillButton label={iniciando ? 'Abrindo o GPS…' : 'Iniciar corrida'} onPress={iniciar} disabled={iniciando} />

                {state.runs.length > 0 && (
                  <>
                    <Text style={styles.secao}>
                      {state.runs.length} {state.runs.length === 1 ? 'corrida' : 'corridas'} · {fmtDistanciaKm(totalKm)} km no total
                    </Text>
                    <View style={{ gap: 8 }}>
                      {state.runs.slice(0, 8).map((r) => (
                        <Pressable
                          key={r.id}
                          onPress={() => {
                            setResumoRun(r);
                            setTela('resumo');
                          }}
                          style={styles.runItem}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.runData}>{dataCurta(r.date)}</Text>
                            <Text style={styles.runDetalhe}>
                              {fmtTempo(r.durationSec)} · {fmtPace(paceMedio(r.distanceM, r.durationSec))} /km
                            </Text>
                          </View>
                          <Text style={styles.runKm}>{fmtDistanciaKm(r.distanceM)} km</Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}
              </>
            )}

            {tela === 'gravando' && run && (
              <>
                <Text style={[styles.estado, run.status === 'paused' && { color: LQ.goldInk }]}>
                  {run.status === 'paused' ? '⏸ PAUSADO' : '● GRAVANDO'}
                </Text>
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.distGrande}>{fmtDistanciaKm(metricas.distanceM)}</Text>
                  <Text style={styles.statRotulo}>quilômetros</Text>
                </View>
                <View style={{ flexDirection: 'row' }}>
                  <Stat valor={fmtTempo(duracao)} rotulo="Tempo" />
                  <Stat valor={fmtPace(run.status === 'running' ? metricas.paceAtual : null)} rotulo="Ritmo atual /km" />
                  <Stat valor={fmtPace(paceMedio(metricas.distanceM, duracao))} rotulo="Ritmo médio /km" />
                </View>
                <RouteMap route={rotaAoVivo} width={larguraPainel} height={190} />
                {!!aviso && <Text style={styles.aviso}>{aviso}</Text>}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <PillButton
                    label={run.status === 'running' ? 'Pausar' : 'Retomar'}
                    variant="ghost"
                    onPress={() => (run.status === 'running' ? pauseRun() : resumeRun())}
                    style={{ flex: 1 }}
                  />
                  <PillButton label="Finalizar" onPress={finalizar} style={{ flex: 1 }} />
                </View>
                <Pressable onPress={descartar} style={{ alignSelf: 'center' }} hitSlop={8}>
                  <Text style={styles.link}>Descartar corrida</Text>
                </Pressable>
                <SubText style={{ textAlign: 'center' }}>Pode fechar esta tela: a gravação continua.</SubText>
              </>
            )}

            {tela === 'resumo' && resumoRun && (
              <>
                <View style={{ alignItems: 'center', gap: 12 }}>
                  <RunShareCard ref={cardRef} run={resumoRun} largura={Math.min(340, larguraPainel)} />

                  {resumoRun.splits.length > 0 && (
                    <View style={{ alignSelf: 'stretch' }}>
                      <Text style={styles.secao}>Parciais por km</Text>
                      {resumoRun.splits.map((s, i) => (
                        <View key={i} style={[styles.splitRow, i > 0 && styles.splitBorder]}>
                          <Text style={styles.runData}>Km {i + 1}</Text>
                          <Text style={styles.runKm}>{fmtPace(s)} /km</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <Text style={styles.xp}>+{resumoRun.xp} XP de Vitalidade</Text>

                  <ShareActions
                    cardRef={cardRef}
                    defaultCaption={`Corrida de ${fmtDistanciaKm(resumoRun.distanceM)} km em ${fmtTempo(resumoRun.durationSec)} 🏃`}
                    postedTitle="Corrida postada!"
                    dialogTitle="Compartilhar corrida"
                    onPosted={() => setTela('inicio')}
                  />
                </View>
                <PillButton label="Voltar" variant="ghost" onPress={() => setTela('inicio')} />
                <Pressable onPress={() => excluir(resumoRun)} style={{ alignSelf: 'center' }} hitSlop={8}>
                  <Text style={styles.link}>Excluir esta corrida</Text>
                </Pressable>
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
  erro: { color: LQ.danger, fontSize: 13 },
  aviso: { color: LQ.goldInk, fontSize: 12, textAlign: 'center' },
  secao: { color: LQ.inkFaint, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontFamily: LQ.fontBodySemiBold, marginBottom: 4 },
  runItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LQ.paper,
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: LQ.radius,
    padding: 12,
  },
  runData: { color: LQ.ink, fontFamily: LQ.fontBodySemiBold, fontSize: 13 },
  runDetalhe: { color: LQ.inkFaint, fontSize: 12, marginTop: 2 },
  runKm: { color: LQ.goldInk, fontFamily: LQ.fontMono, fontSize: 14 },
  estado: { color: LQ.gold, fontSize: 12, letterSpacing: 1, textAlign: 'center', fontFamily: LQ.fontBodySemiBold },
  distGrande: { color: LQ.ink, fontFamily: LQ.fontDisplay, fontSize: 64 },
  statValor: { color: LQ.ink, fontFamily: LQ.fontMono, fontSize: 18 },
  statRotulo: { color: LQ.inkFaint, fontSize: 11, textAlign: 'center' },
  splitRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  splitBorder: { borderTopWidth: 1, borderTopColor: LQ.line },
  xp: { color: LQ.goldInk, fontFamily: LQ.fontMono, fontSize: 13 },
  link: { color: LQ.gold, fontSize: 12, fontFamily: LQ.fontBodySemiBold },
});

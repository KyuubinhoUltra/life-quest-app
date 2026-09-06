import React, { useEffect, useRef, useState } from 'react';
import { AppState, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { FlameIcon } from '@/components/FlameIcon';
import { Card, Eyebrow, PillButton, SubText } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';
import {
  fetchTodayHealthMetrics,
  hasHealthPermissions,
  HealthMetrics,
  isHealthConnectSupported,
  openHealthConnectSettings,
  requestHealthPermissions,
} from '@/services/healthConnect';

type HealthStatus = 'checking' | 'unsupported' | 'need-permission' | 'ready';

function StepsIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill={LQ.gold} />
    </Svg>
  );
}

function ClockIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={LQ.gold} strokeWidth={1.8} />
      <Path d="M12 7v5l3.5 2" stroke={LQ.gold} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MetricIcon({ children }: { children: React.ReactNode }) {
  return <View style={styles.metricIcon}>{children}</View>;
}

function MetricRow({ icon, value, unit }: { icon: React.ReactNode; value: number | string; unit: string }) {
  return (
    <View style={styles.metricRow}>
      <MetricIcon>{icon}</MetricIcon>
      <Text style={styles.metricValue}>
        {value} <Text style={styles.metricUnit}>{unit}</Text>
      </Text>
    </View>
  );
}

export function HealthConnectCard() {
  const [status, setStatus] = useState<HealthStatus>('checking');
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [syncing, setSyncing] = useState(false);
  const statusRef = useRef(status);
  statusRef.current = status;

  const refresh = async () => {
    if (Platform.OS !== 'android' || !(await isHealthConnectSupported())) {
      setStatus('unsupported');
      return;
    }
    if (await hasHealthPermissions()) {
      setStatus('ready');
      setMetrics(await fetchTodayHealthMetrics());
    } else {
      setStatus('need-permission');
    }
  };

  useEffect(() => {
    refresh();
    // Se o usuário sair pra conceder a permissão manualmente no app do Health
    // Connect, detecta isso quando ele voltar pro Life Quest.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && statusRef.current === 'need-permission') {
        refresh();
      }
    });
    return () => sub.remove();
  }, []);

  const connect = async () => {
    setSyncing(true);
    const result = await requestHealthPermissions();
    if (result.granted) {
      setStatus('ready');
      setMetrics(await fetchTodayHealthMetrics());
    } else if (result.reason === 'error') {
      Alert.alert('Erro ao conectar', result.error || 'Falha desconhecida ao falar com o Health Connect.');
    } else {
      Alert.alert(
        'Permissão não concedida',
        'O Android pode ter bloqueado o pedido de permissão (isso acontece se você já negou duas vezes). Abra o Health Connect e conceda o acesso manualmente para o Life Quest.',
        [
          { text: 'Agora não', style: 'cancel' },
          { text: 'Abrir Health Connect', onPress: openHealthConnectSettings },
        ]
      );
    }
    setSyncing(false);
  };

  const sync = async () => {
    setSyncing(true);
    setMetrics(await fetchTodayHealthMetrics());
    setSyncing(false);
  };

  if (status === 'unsupported') return null;

  return (
    <Card>
      <Eyebrow>Google Saúde</Eyebrow>
      {status === 'checking' && <SubText>Verificando Health Connect…</SubText>}
      {status === 'need-permission' && (
        <>
          <SubText style={{ marginBottom: 12 }}>
            Conecte para trazer passos, calorias e tempo de exercício de hoje direto do Health Connect.
          </SubText>
          <PillButton label={syncing ? 'Conectando…' : 'Conectar'} variant="ghost" disabled={syncing} onPress={connect} />
          <Pressable onPress={openHealthConnectSettings} hitSlop={8} style={{ marginTop: 12, alignSelf: 'center' }}>
            <Text style={styles.link}>Já neguei antes? Abrir Health Connect</Text>
          </Pressable>
        </>
      )}
      {status === 'ready' && (
        <>
          <Text style={styles.cardTitle}>Atividade diária</Text>
          <View style={styles.body}>
            <View style={styles.metrics}>
              <MetricRow icon={<StepsIcon />} value={metrics?.steps ?? '—'} unit="passos" />
              <MetricRow icon={<ClockIcon />} value={metrics?.exerciseMinutes ?? '—'} unit="min" />
              <MetricRow icon={<FlameIcon size={18} lit gradId="hcCardFlame" />} value={metrics?.calories ?? '—'} unit="kcal" />
            </View>
            <View style={styles.decoration} pointerEvents="none">
              <FlameIcon size={96} lit gradId="hcCardFlameBg" />
            </View>
          </View>
          <View style={styles.linksRow}>
            <Pressable onPress={sync} hitSlop={8}>
              <Text style={styles.link}>{syncing ? 'Sincronizando…' : 'Sincronizar'}</Text>
            </Pressable>
            <Pressable onPress={openHealthConnectSettings} hitSlop={8}>
              <Text style={styles.link}>Gerenciar permissões</Text>
            </Pressable>
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  cardTitle: { color: LQ.ink, fontFamily: LQ.fontBodySemiBold, fontSize: 15, marginTop: 2, marginBottom: 16 },
  body: { flexDirection: 'row', alignItems: 'center' },
  metrics: { flex: 1, gap: 16 },
  metricRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: LQ.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: { color: LQ.ink, fontFamily: LQ.fontBodyBold, fontSize: 20 },
  metricUnit: { color: LQ.inkSoft, fontFamily: LQ.fontBody, fontSize: 13 },
  decoration: { width: 96, height: 96, opacity: 0.12, marginLeft: 8 },
  linksRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 18 },
  link: { color: LQ.gold, fontSize: 12, fontFamily: LQ.fontBodySemiBold },
});

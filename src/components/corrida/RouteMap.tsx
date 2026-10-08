import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { LQ } from '@/constants/life-quest-theme';

// Desenha o percurso (lat/lon) ajustado ao quadro, sem mapa de fundo.
export function RouteMap({ route, width, height }: { route: [number, number][]; width: number; height: number }) {
  const desenho = useMemo(() => {
    if (route.length < 2) return null;
    const pad = 18;
    const lats = route.map((p) => p[0]);
    const lons = route.map((p) => p[1]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const latMedia = (minLat + maxLat) / 2;
    // 1° de longitude é mais curto longe do equador
    const spanX = Math.max((maxLon - minLon) * Math.cos((latMedia * Math.PI) / 180), 1e-6);
    const spanY = Math.max(maxLat - minLat, 1e-6);
    const escala = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY);
    const offX = (width - spanX * escala) / 2;
    const offY = (height - spanY * escala) / 2;
    const pontos = route.map(([lat, lon]) => ({
      x: offX + (lon - minLon) * Math.cos((latMedia * Math.PI) / 180) * escala,
      y: offY + (maxLat - lat) * escala,
    }));
    const d = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    return { d, inicio: pontos[0], fim: pontos[pontos.length - 1] };
  }, [route, width, height]);

  return (
    <View style={[styles.box, { width, height }]}>
      <Svg width={width} height={height}>
        {[0.25, 0.5, 0.75].map((f) => (
          <React.Fragment key={f}>
            <Line x1={width * f} y1={0} x2={width * f} y2={height} stroke={LQ.lineSoft} strokeWidth={1} />
            <Line x1={0} y1={height * f} x2={width} y2={height * f} stroke={LQ.lineSoft} strokeWidth={1} />
          </React.Fragment>
        ))}
        {desenho && (
          <>
            <Path d={desenho.d} stroke={LQ.gold} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <Circle cx={desenho.inicio.x} cy={desenho.inicio.y} r={6} fill={LQ.paperRaised} stroke={LQ.ink} strokeWidth={2.5} />
            <Circle cx={desenho.fim.x} cy={desenho.fim.y} r={6} fill={LQ.gold} stroke={LQ.ink} strokeWidth={2.5} />
          </>
        )}
      </Svg>
      {!desenho && <Text style={styles.vazio}>Aguardando o GPS…</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: LQ.paper, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  vazio: { position: 'absolute', color: LQ.inkFaint, fontSize: 12 },
});

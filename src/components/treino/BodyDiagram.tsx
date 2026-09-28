import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Rect, Text as SvgText } from 'react-native-svg';

import { LQ } from '@/constants/life-quest-theme';

// Coordenadas herdadas do protótipo web (lifequest_treino_generator.jsx) — só a
// pele visual muda aqui (cores do tema, primitives do react-native-svg).
type Shape =
  | { grupo?: string; tipo: 'circle'; cx: number; cy: number; r: number }
  | { grupo?: string; tipo: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { grupo?: string; tipo: 'rect'; x: number; y: number; width: number; height: number; rx: number };

const CORPO_BASE: Shape[] = [
  { tipo: 'circle', cx: 160, cy: 30, r: 24 },
  { tipo: 'rect', x: 150, y: 52, width: 20, height: 16, rx: 6 },
  { tipo: 'rect', x: 100, y: 68, width: 120, height: 122, rx: 36 },
  { tipo: 'rect', x: 118, y: 178, width: 84, height: 28, rx: 14 },
  { tipo: 'circle', cx: 92, cy: 188, r: 11 },
  { tipo: 'circle', cx: 228, cy: 188, r: 11 },
  { tipo: 'ellipse', cx: 141, cy: 322, rx: 17, ry: 9 },
  { tipo: 'ellipse', cx: 179, cy: 322, rx: 17, ry: 9 },
];

const FORMAS_FRENTE: Shape[] = [
  { grupo: 'ombros', tipo: 'circle', cx: 108, cy: 80, r: 20 },
  { grupo: 'ombros', tipo: 'circle', cx: 212, cy: 80, r: 20 },
  { grupo: 'peito', tipo: 'ellipse', cx: 140, cy: 98, rx: 22, ry: 24 },
  { grupo: 'peito', tipo: 'ellipse', cx: 180, cy: 98, rx: 22, ry: 24 },
  { grupo: 'bracos', tipo: 'rect', x: 80, y: 80, width: 24, height: 102, rx: 12 },
  { grupo: 'bracos', tipo: 'rect', x: 216, y: 80, width: 24, height: 102, rx: 12 },
  { grupo: 'core', tipo: 'rect', x: 142, y: 128, width: 16, height: 16, rx: 4 },
  { grupo: 'core', tipo: 'rect', x: 162, y: 128, width: 16, height: 16, rx: 4 },
  { grupo: 'core', tipo: 'rect', x: 142, y: 148, width: 16, height: 16, rx: 4 },
  { grupo: 'core', tipo: 'rect', x: 162, y: 148, width: 16, height: 16, rx: 4 },
  { grupo: 'core', tipo: 'rect', x: 142, y: 168, width: 16, height: 16, rx: 4 },
  { grupo: 'core', tipo: 'rect', x: 162, y: 168, width: 16, height: 16, rx: 4 },
  { grupo: 'pernas', tipo: 'rect', x: 126, y: 188, width: 30, height: 132, rx: 15 },
  { grupo: 'pernas', tipo: 'rect', x: 164, y: 188, width: 30, height: 132, rx: 15 },
];

const FORMAS_COSTAS: Shape[] = [
  { grupo: 'ombros', tipo: 'circle', cx: 108, cy: 80, r: 20 },
  { grupo: 'ombros', tipo: 'circle', cx: 212, cy: 80, r: 20 },
  { grupo: 'costas', tipo: 'rect', x: 100, y: 76, width: 120, height: 108, rx: 30 },
  { grupo: 'bracos', tipo: 'rect', x: 80, y: 80, width: 24, height: 102, rx: 12 },
  { grupo: 'bracos', tipo: 'rect', x: 216, y: 80, width: 24, height: 102, rx: 12 },
  { grupo: 'pernas', tipo: 'rect', x: 126, y: 188, width: 30, height: 132, rx: 15 },
  { grupo: 'pernas', tipo: 'rect', x: 164, y: 188, width: 30, height: 132, rx: 15 },
];

type Callout = { grupo: string; label: string; pillX: number; pillY: number; leaderX: number; leaderY: number };

const CALLOUTS_FRENTE: Callout[] = [
  { grupo: 'ombros', label: 'Ombros', pillX: 280, pillY: 50, leaderX: 226, leaderY: 66 },
  { grupo: 'peito', label: 'Peito', pillX: 40, pillY: 75, leaderX: 118, leaderY: 90 },
  { grupo: 'bracos', label: 'Braços', pillX: 280, pillY: 130, leaderX: 240, leaderY: 130 },
  { grupo: 'core', label: 'Core', pillX: 40, pillY: 155, leaderX: 142, leaderY: 155 },
  { grupo: 'pernas', label: 'Pernas', pillX: 280, pillY: 240, leaderX: 194, leaderY: 240 },
];

const CALLOUTS_COSTAS: Callout[] = [
  { grupo: 'ombros', label: 'Ombros', pillX: 280, pillY: 50, leaderX: 226, leaderY: 66 },
  { grupo: 'costas', label: 'Costas', pillX: 40, pillY: 115, leaderX: 100, leaderY: 115 },
  { grupo: 'bracos', label: 'Braços', pillX: 280, pillY: 130, leaderX: 240, leaderY: 130 },
  { grupo: 'pernas', label: 'Pernas', pillX: 280, pillY: 240, leaderX: 194, leaderY: 240 },
];

const GRUPO_LABEL: Record<string, string> = {
  ombros: 'Ombros',
  peito: 'Peito',
  costas: 'Costas',
  bracos: 'Braços',
  core: 'Core / abdômen',
  pernas: 'Pernas',
};

function FormaBase({ forma }: { forma: Shape }) {
  const props = { fill: LQ.paperRaised, stroke: LQ.line, strokeWidth: 1 };
  if (forma.tipo === 'circle') return <Circle cx={forma.cx} cy={forma.cy} r={forma.r} {...props} />;
  if (forma.tipo === 'ellipse') return <Ellipse cx={forma.cx} cy={forma.cy} rx={forma.rx} ry={forma.ry} {...props} />;
  return <Rect x={forma.x} y={forma.y} width={forma.width} height={forma.height} rx={forma.rx} {...props} />;
}

function FormaCorpo({ forma, ativo, onPress }: { forma: Shape; ativo: boolean; onPress: () => void }) {
  const props = {
    fill: ativo ? LQ.gold : LQ.line,
    stroke: ativo ? LQ.goldInk : LQ.inkFaint,
    strokeWidth: 1.5,
    onPress,
  };
  if (forma.tipo === 'circle') return <Circle cx={forma.cx} cy={forma.cy} r={forma.r} {...props} />;
  if (forma.tipo === 'ellipse') return <Ellipse cx={forma.cx} cy={forma.cy} rx={forma.rx} ry={forma.ry} {...props} />;
  return <Rect x={forma.x} y={forma.y} width={forma.width} height={forma.height} rx={forma.rx} {...props} />;
}

function CalloutCorpo({ callout, ativo, onPress }: { callout: Callout; ativo: boolean; onPress: () => void }) {
  const largura = Math.max(56, callout.label.length * 7 + 22);
  const pillX = callout.pillX - largura / 2;
  return (
    <G onPress={onPress}>
      <Line
        x1={callout.leaderX}
        y1={callout.leaderY}
        x2={callout.pillX}
        y2={callout.pillY}
        stroke={ativo ? LQ.gold : LQ.line}
        strokeWidth={1}
      />
      <Rect
        x={pillX}
        y={callout.pillY - 12}
        width={largura}
        height={24}
        rx={12}
        fill={ativo ? LQ.gold : LQ.paperRaised}
        stroke={ativo ? LQ.goldInk : LQ.line}
        strokeWidth={1}
      />
      <SvgText
        x={callout.pillX}
        y={callout.pillY + 4}
        textAnchor="middle"
        fontSize={11}
        fontWeight="600"
        fill={ativo ? '#fff' : LQ.inkSoft}>
        {callout.label}
      </SvgText>
    </G>
  );
}

export function BodyDiagram({ selecionados, onToggle }: { selecionados: string[]; onToggle: (grupo: string) => void }) {
  const [vista, setVista] = useState<'frente' | 'costas'>('frente');
  const formas = vista === 'frente' ? FORMAS_FRENTE : FORMAS_COSTAS;
  const callouts = vista === 'frente' ? CALLOUTS_FRENTE : CALLOUTS_COSTAS;
  const labelsSelecionados = selecionados.map((g) => GRUPO_LABEL[g] ?? g).join(', ');

  return (
    <View>
      <Svg viewBox="0 0 320 340" width="100%" height={220}>
        {CORPO_BASE.map((f, i) => (
          <FormaBase key={i} forma={f} />
        ))}
        {formas.map((f, i) => (
          <FormaCorpo
            key={`${vista}-${i}`}
            forma={f}
            ativo={!!f.grupo && selecionados.includes(f.grupo)}
            onPress={() => f.grupo && onToggle(f.grupo)}
          />
        ))}
        {callouts.map((c) => (
          <CalloutCorpo
            key={`${vista}-${c.grupo}`}
            callout={c}
            ativo={selecionados.includes(c.grupo)}
            onPress={() => onToggle(c.grupo)}
          />
        ))}
      </Svg>
      <View style={styles.viewToggle}>
        <Pressable onPress={() => setVista('frente')} style={[styles.viewBtn, vista === 'frente' && styles.viewBtnActive]}>
          <Text style={[styles.viewBtnText, vista === 'frente' && styles.viewBtnTextActive]}>Frente</Text>
        </Pressable>
        <Pressable onPress={() => setVista('costas')} style={[styles.viewBtn, vista === 'costas' && styles.viewBtnActive]}>
          <Text style={[styles.viewBtnText, vista === 'costas' && styles.viewBtnTextActive]}>Costas</Text>
        </Pressable>
      </View>
      <Text style={styles.selecaoLabel}>{labelsSelecionados || 'Nenhum grupo selecionado'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  viewToggle: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 },
  viewBtn: { borderRadius: 999, paddingVertical: 6, paddingHorizontal: 14, borderWidth: 1, borderColor: LQ.line, backgroundColor: LQ.paperRaised },
  viewBtnActive: { backgroundColor: LQ.gold, borderColor: LQ.gold },
  viewBtnText: { color: LQ.inkSoft, fontSize: 12, fontFamily: LQ.fontBodySemiBold },
  viewBtnTextActive: { color: '#fff' },
  selecaoLabel: { color: LQ.inkFaint, fontSize: 12, textAlign: 'center', marginTop: 8 },
});

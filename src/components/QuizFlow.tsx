import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { LQ } from '@/constants/life-quest-theme';
import { CLASSES, QUIZ_QUESTIONS } from '@/store/character';
import { CharacterClass } from '@/store/types';

type Phase = 'question' | 'tiebreak' | 'suspense' | 'reveal';

export function QuizFlow({ onComplete }: { onComplete: (classe: CharacterClass, afinidade: CharacterClass | null) => void }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [answers, setAnswers] = useState<(number | undefined)[]>([]);
  const [phase, setPhase] = useState<Phase>('question');
  const [tied, setTied] = useState<CharacterClass[]>([]);
  const [result, setResult] = useState<{ classe: CharacterClass; afinidade: CharacterClass | null } | null>(null);

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (phase !== 'question') return;
    anim.setValue(dir * 24);
    Animated.parallel([
      Animated.timing(anim, { toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, phase]);

  const opacity = anim.interpolate({ inputRange: [-24, 0, 24], outputRange: [0, 1, 0] });

  function computeScores() {
    const scores: Record<CharacterClass, number> = { guerreiro: 0, ranger: 0, monge: 0, alquimista: 0 };
    answers.forEach((oi, qi) => {
      if (oi === undefined) return;
      const opt = QUIZ_QUESTIONS[qi].options[oi];
      (Object.keys(opt.classes) as CharacterClass[]).forEach((c) => {
        scores[c] += opt.classes[c] ?? 0;
      });
    });
    return scores;
  }

  function selectOption(oi: number) {
    const next = [...answers];
    next[step] = oi;
    setAnswers(next);

    const isLast = step === QUIZ_QUESTIONS.length - 1;
    setTimeout(() => {
      if (!isLast) {
        setDir(1);
        setStep((s) => s + 1);
        return;
      }
      const scores = computeScores();
      const max = Math.max(...Object.values(scores));
      const top = (Object.keys(scores) as CharacterClass[]).filter((k) => scores[k] === max);
      if (top.length > 1) {
        setTied(top);
        setPhase('tiebreak');
      } else {
        const rest = (Object.keys(scores) as CharacterClass[])
          .filter((k) => k !== top[0])
          .sort((a, b) => scores[b] - scores[a]);
        reveal(top[0], rest[0] ?? null);
      }
    }, 180);
  }

  function reveal(classe: CharacterClass, afinidade: CharacterClass | null) {
    setResult({ classe, afinidade });
    setPhase('suspense');
    setTimeout(() => setPhase('reveal'), 1200);
  }

  function goBack() {
    setDir(-1);
    setStep((s) => Math.max(0, s - 1));
  }

  if (phase === 'suspense') {
    return (
      <View style={styles.revealCard}>
        <Text style={styles.suspense}>Calculando seu destino…</Text>
      </View>
    );
  }

  if (phase === 'reveal' && result) {
    const c = CLASSES[result.classe];
    return (
      <View style={styles.revealCard}>
        <Text style={styles.classIcon}>{c.icon}</Text>
        <Text style={styles.className}>{c.nome} novato</Text>
        <Text style={styles.classLore}>{c.lore}</Text>
        <Pressable style={styles.solidBtn} onPress={() => onComplete(result.classe, result.afinidade)}>
          <Text style={styles.solidBtnText}>Começar jornada</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === 'tiebreak') {
    return (
      <View style={styles.revealCard}>
        <Text style={styles.tieText}>Empate! Qual dessas classes combina mais com você agora?</Text>
        <View style={styles.tieOptions}>
          {tied.map((c) => (
            <Pressable
              key={c}
              style={styles.ghostBtn}
              onPress={() => {
                const afinidade = tied.find((t) => t !== c) ?? null;
                reveal(c, afinidade);
              }}>
              <Text style={styles.ghostBtnText}>
                {CLASSES[c].icon} {CLASSES[c].nome}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  const q = QUIZ_QUESTIONS[step];
  const pct = ((step + 1) / QUIZ_QUESTIONS.length) * 100;

  return (
    <View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.progressLabel}>
        Pergunta {step + 1} de {QUIZ_QUESTIONS.length}
      </Text>

      <Animated.View style={[styles.questionCard, { opacity, transform: [{ translateX: anim }] }]}>
        <Text style={styles.questionText}>{q.q}</Text>
        <View style={{ gap: 8 }}>
          {q.options.map((opt, oi) => (
            <Pressable
              key={opt.label}
              style={[styles.option, answers[step] === oi && styles.optionSelected]}
              onPress={() => selectOption(oi)}>
              <Text style={[styles.optionText, answers[step] === oi && styles.optionTextSelected]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {step > 0 && (
        <Pressable style={[styles.ghostBtn, { alignSelf: 'flex-start', marginTop: 4 }]} onPress={goBack}>
          <Text style={styles.ghostBtnText}>Voltar</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  progressBar: { height: 6, borderRadius: 3, backgroundColor: LQ.lineSoft, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: LQ.gold, borderRadius: 3 },
  progressLabel: {
    color: LQ.inkFaint,
    fontSize: 10,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  questionCard: {
    backgroundColor: LQ.paperRaised,
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: LQ.radius,
    padding: 16,
  },
  questionText: { color: LQ.ink, fontWeight: '600', fontSize: 15, marginBottom: 12 },
  option: {
    backgroundColor: LQ.paper,
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: LQ.radius,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  optionSelected: { borderColor: LQ.gold, backgroundColor: LQ.goldSoft },
  optionText: { color: LQ.ink, fontSize: 14 },
  optionTextSelected: { color: LQ.goldInk, fontWeight: '600' },
  revealCard: {
    backgroundColor: LQ.paperRaised,
    borderWidth: 1,
    borderColor: LQ.gold,
    borderRadius: LQ.radius,
    padding: 30,
    alignItems: 'center',
  },
  suspense: { color: LQ.inkSoft, fontSize: 16, letterSpacing: 0.5 },
  classIcon: { fontSize: 46, marginBottom: 8 },
  className: { color: LQ.goldInk, fontWeight: '700', fontSize: 22, textTransform: 'uppercase', marginBottom: 8 },
  classLore: { color: LQ.inkSoft, fontStyle: 'italic', textAlign: 'center', marginBottom: 20, maxWidth: 320 },
  solidBtn: { backgroundColor: LQ.gold, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 24 },
  solidBtnText: { color: '#fff', fontWeight: '600' },
  tieText: { color: LQ.inkSoft, fontSize: 14, textAlign: 'center', marginBottom: 14 },
  tieOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  ghostBtn: {
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  ghostBtnText: { color: LQ.ink, fontWeight: '600', fontSize: 13 },
});

import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PillButton } from '@/components/ui';
import { LQ } from '@/constants/life-quest-theme';
import { useCommunityAuth } from '@/store/CommunityAuthContext';

export function AuthModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { signIn, signUp } = useCommunityAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setError('');
    setMode('login');
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    setError('');
    if (!email || !password || (mode === 'signup' && !username.trim())) {
      setError('Preencha todos os campos.');
      return;
    }
    setLoading(true);
    const err = mode === 'login' ? await signIn(email, password) : await signUp(email, password, username.trim());
    setLoading(false);
    if (err) setError(err);
    else close();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>{mode === 'login' ? 'Entrar' : 'Criar conta'}</Text>
            <Pressable onPress={close} style={styles.closeBtn} hitSlop={8}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {mode === 'signup' && (
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Nome de usuário"
              placeholderTextColor={LQ.inkFaint}
              autoCapitalize="none"
              style={styles.input}
            />
          )}
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="E-mail"
            placeholderTextColor={LQ.inkFaint}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Senha"
            placeholderTextColor={LQ.inkFaint}
            secureTextEntry
            style={styles.input}
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <PillButton
            label={loading ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            onPress={submit}
            disabled={loading}
            style={{ marginTop: 6 }}
          />

          <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')} style={styles.switchBtn}>
            <Text style={styles.switchText}>
              {mode === 'login' ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  panel: { backgroundColor: LQ.paperRaised, borderWidth: 1, borderColor: LQ.line, borderRadius: LQ.radius, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { color: LQ.ink, fontFamily: LQ.fontDisplay, fontSize: 18, textTransform: 'uppercase', letterSpacing: 0.5 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LQ.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: LQ.ink, fontSize: 14 },
  input: {
    backgroundColor: LQ.paper,
    borderWidth: 1,
    borderColor: LQ.line,
    borderRadius: LQ.radius,
    color: LQ.ink,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  error: { color: LQ.danger, fontSize: 12, textAlign: 'center', marginBottom: 8 },
  switchBtn: { marginTop: 16, alignSelf: 'center' },
  switchText: { color: LQ.gold, fontSize: 12, fontFamily: LQ.fontBodySemiBold },
});

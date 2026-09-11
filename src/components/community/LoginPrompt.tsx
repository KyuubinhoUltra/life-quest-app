import React from 'react';
import { View } from 'react-native';

import { PillButton, SubText } from '@/components/ui';

export function LoginPrompt({ onLogin }: { onLogin: () => void }) {
  return (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <SubText style={{ textAlign: 'center', marginBottom: 12 }}>Entre na sua conta pra ver isso.</SubText>
      <PillButton label="Entrar / Criar conta" onPress={onLogin} />
    </View>
  );
}

import { Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChecklistIcon, DumbbellIcon, HomeIcon, ShieldIcon, WalletIcon } from '@/components/TabIcon';
import { LQ } from '@/constants/life-quest-theme';
import { LifeQuestProvider } from '@/store/LifeQuestStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const tabBarHeight = 56 + insets.bottom;

  return (
    <LifeQuestProvider>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: LQ.paper },
          headerTitleStyle: { color: LQ.ink, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
          headerShadowVisible: false,
          tabBarStyle: {
            backgroundColor: LQ.paperRaised,
            borderTopColor: LQ.line,
            height: tabBarHeight,
            paddingTop: 6,
            paddingBottom: insets.bottom,
          },
          tabBarActiveTintColor: LQ.gold,
          tabBarInactiveTintColor: LQ.inkFaint,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Life Quest',
            tabBarLabel: 'Início',
            tabBarIcon: ({ color }) => <HomeIcon color={color as string} />,
          }}
        />
        <Tabs.Screen
          name="rotina"
          options={{
            title: 'Rotina',
            tabBarIcon: ({ color }) => <ChecklistIcon color={color as string} />,
          }}
        />
        <Tabs.Screen
          name="academia"
          options={{
            title: 'Academia',
            tabBarLabel: 'Treino',
            tabBarIcon: ({ color }) => <DumbbellIcon color={color as string} />,
          }}
        />
        <Tabs.Screen
          name="metas"
          options={{
            title: 'Metas financeiras',
            tabBarLabel: 'Metas',
            tabBarIcon: ({ color }) => <WalletIcon color={color as string} />,
          }}
        />
        <Tabs.Screen
          name="personagem"
          options={{
            title: 'Personagem',
            tabBarLabel: 'Perfil',
            tabBarIcon: ({ color }) => <ShieldIcon color={color as string} />,
          }}
        />
      </Tabs>
    </LifeQuestProvider>
  );
}

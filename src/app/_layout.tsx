import { Anton_400Regular } from '@expo-google-fonts/anton';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
  IBMPlexMono_700Bold,
} from '@expo-google-fonts/ibm-plex-mono';
import {
  PublicSans_400Regular,
  PublicSans_500Medium,
  PublicSans_600SemiBold,
  PublicSans_700Bold,
} from '@expo-google-fonts/public-sans';
import { Tabs } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChecklistIcon, DumbbellIcon, HeartIcon, HomeIcon, ShieldIcon, UsersIcon, WalletIcon } from '@/components/TabIcon';
import { LQ } from '@/constants/life-quest-theme';
import { CommunityAuthProvider } from '@/store/CommunityAuthContext';
import { LifeQuestProvider } from '@/store/LifeQuestStore';

SplashScreen.preventAutoHideAsync();

(Text as any).defaultProps = (Text as any).defaultProps || {};
(Text as any).defaultProps.style = [{ fontFamily: LQ.fontBody }, (Text as any).defaultProps.style];

export default function RootLayout() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Anton_400Regular,
    PublicSans_400Regular,
    PublicSans_500Medium,
    PublicSans_600SemiBold,
    PublicSans_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
    IBMPlexMono_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  const tabBarHeight = 56 + insets.bottom;

  if (!fontsLoaded) return null;

  return (
    <LifeQuestProvider>
      <CommunityAuthProvider>
        <StatusBar style="light" />
        <Tabs
          screenOptions={{
            headerStyle: { backgroundColor: LQ.paper },
            headerTitleStyle: { color: LQ.ink, fontFamily: LQ.fontDisplay, textTransform: 'uppercase', letterSpacing: 0.5 },
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
            tabBarLabelStyle: { fontSize: 11, fontFamily: LQ.fontBodySemiBold },
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
              title: 'Missões Diárias',
              tabBarLabel: 'Missões',
              tabBarIcon: ({ color }) => <ChecklistIcon color={color as string} />,
            }}
          />
          <Tabs.Screen
            name="saude"
            options={{
              title: 'Saúde',
              tabBarIcon: ({ color }) => <HeartIcon color={color as string} />,
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
            name="comunidade"
            options={{
              title: 'Comunidade',
              tabBarIcon: ({ color }) => <UsersIcon color={color as string} />,
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
      </CommunityAuthProvider>
    </LifeQuestProvider>
  );
}

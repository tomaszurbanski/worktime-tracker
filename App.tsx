import './src/i18n';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';

import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import StatsScreen from './src/screens/StatsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LoginScreen from './src/screens/LoginScreen';
import { getSettings } from './src/utils/storage';
import { loadSavedLanguage } from './src/i18n';

const Tab = createBottomTabNavigator();
const COLORS = { primary: '#2563EB', inactive: '#94A3B8', bg: '#FFFFFF' };

function MainTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: COLORS.bg, elevation: 0, shadowOpacity: 0 },
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingBottom: 4 },
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
            Home: ['timer', 'timer-outline'],
            History: ['time', 'time-outline'],
            Stats: ['bar-chart', 'bar-chart-outline'],
            Settings: ['settings', 'settings-outline'],
          };
          const [filled, outline] = icons[route.name] ?? ['help', 'help-outline'];
          return <Ionicons name={focused ? filled : outline} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('home.title'), tabBarLabel: t('tabs.home') }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: t('history.title'), tabBarLabel: t('tabs.history') }} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ title: t('stats.title'), tabBarLabel: t('tabs.stats') }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: t('settings.title'), tabBarLabel: t('tabs.settings') }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    Promise.all([loadSavedLanguage(), getSettings()]).then(([, s]) => {
      setNeedsLogin(!s.userFullName);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {needsLogin ? (
          <LoginScreen onDone={() => setNeedsLogin(false)} />
        ) : (
          <NavigationContainer>
            <MainTabs />
          </NavigationContainer>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

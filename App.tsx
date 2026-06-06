import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import StatsScreen from './src/screens/StatsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AddDelegationScreen from './src/screens/AddDelegationScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const COLORS = { primary: '#2563EB', inactive: '#94A3B8', bg: '#FFFFFF' };

function Tabs() {
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
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'WorkTime', tabBarLabel: 'Praca' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'Historia', tabBarLabel: 'Historia' }} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ title: 'Statystyki', tabBarLabel: 'Statystyki' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ustawienia', tabBarLabel: 'Ustawienia' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Stack.Navigator>
            <Stack.Screen name="Main" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen
              name="AddDelegation"
              component={AddDelegationScreen}
              options={{
                title: 'Nowa delegacja',
                headerStyle: { backgroundColor: COLORS.bg },
                headerTitleStyle: { fontWeight: '700' },
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

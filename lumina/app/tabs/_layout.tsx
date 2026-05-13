import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { Colors, Typography } from '../../src/constants/theme';

const TAB_ICONS: Record<string, string> = {
  dashboard: '◉',
  focus: '⏱',
  insights: '📈',
  goals: '✦',
  profile: '⚙',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <Text
            style={{
              fontSize: 18,
              opacity: focused ? 1 : 0.4,
            }}
          >
            {TAB_ICONS[route.name] ?? '●'}
          </Text>
        ),
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 84,
          paddingBottom: 20,
        },
        tabBarLabelStyle: {
          ...Typography.caption,
        },
        headerShown: false,
      })}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Today' }} />
      <Tabs.Screen name="focus" options={{ title: 'Focus' }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights' }} />
      <Tabs.Screen name="goals" options={{ title: 'Goals' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

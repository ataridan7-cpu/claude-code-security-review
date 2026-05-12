import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { getDatabase } from '../src/services/storage/DatabaseService';
import { ClaudeService } from '../src/services/claude/ClaudeService';
import { Colors } from '../src/constants/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    async function init() {
      // Initialize SQLite
      await getDatabase();
      // Check for API key
      const keyExists = await ClaudeService.hasApiKey();
      setHasApiKey(keyExists);
      setIsReady(true);
    }
    init();
  }, []);

  if (!isReady) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="focus-session/[sessionId]"
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
        <Stack.Screen
          name="mood-checkin/index"
          options={{ title: 'Mood Check-in', presentation: 'modal' }}
        />
        <Stack.Screen
          name="weekly-letter/index"
          options={{ title: 'Weekly Letter' }}
        />
        <Stack.Screen
          name="family/index"
          options={{ title: 'Family Wisdom' }}
        />
        <Stack.Screen
          name="app-limit-reached/[appId]"
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
        <Stack.Screen
          name="context-journal/[sessionId]"
          options={{ title: 'Reflect', presentation: 'modal' }}
        />
        <Stack.Screen
          name="detox/index"
          options={{ title: 'Digital Detox' }}
        />
      </Stack>
    </QueryClientProvider>
  );
}

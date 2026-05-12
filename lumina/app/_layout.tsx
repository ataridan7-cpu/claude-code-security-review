import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { getDatabase } from '../src/services/storage/DatabaseService';
import { ClaudeService } from '../src/services/claude/ClaudeService';
import { NotificationService } from '../src/services/notifications/NotificationService';
import { MindfulMoment } from '../src/services/notifications/MindfulMoment';
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
  const router = useRouter();

  // Route to the correct screen when the user taps a notification
  const lastResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    const route = lastResponse?.notification.request.content.data?.route as string | undefined;
    if (route) router.push(route as never);
  }, [lastResponse]);

  useEffect(() => {
    async function init() {
      await getDatabase();
      const keyExists = await ClaudeService.hasApiKey();
      setHasApiKey(keyExists);

      // Schedule recurring notifications and start doom-scroll detection
      const hasPermission = await NotificationService.hasPermission();
      if (hasPermission) {
        await NotificationService.scheduleRecurring();
        MindfulMoment.start();
      }

      setIsReady(true);
    }
    init();

    return () => MindfulMoment.stop();
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

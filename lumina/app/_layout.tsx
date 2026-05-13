import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import NetInfo from '@react-native-community/netinfo';
import { getDatabase } from '../src/services/storage/DatabaseService';
import { ClaudeService } from '../src/services/claude/ClaudeService';
import { getPendingRequests, markAttempted, deleteRequest } from '../src/utils/offlineQueue';
import { Colors } from '../src/constants/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// Features whose queued requests can be replayed by invalidating their query cache.
// When connectivity restores, we invalidate these so React Query re-fetches.
const FEATURE_QUERY_KEYS: Record<string, string[][]> = {
  daily_summary: [['screentime', 'today'], ['insights', 'latest']],
  weekly_letter: [['insights', 'weekly']],
  goal_progress: [['goals', 'active']],
  mood_correlation: [['insights', 'mood-correlation']],
};

async function drainOfflineQueue(qc: QueryClient): Promise<void> {
  try {
    const pending = await getPendingRequests(10);
    if (pending.length === 0) return;

    const invalidated = new Set<string>();
    for (const req of pending) {
      const keys = FEATURE_QUERY_KEYS[req.feature];
      if (keys) {
        for (const key of keys) {
          const keyStr = key.join('/');
          if (!invalidated.has(keyStr)) {
            qc.invalidateQueries({ queryKey: key });
            invalidated.add(keyStr);
          }
        }
        await deleteRequest(req.id);
      } else {
        // Unknown feature — mark attempted so it ages out after 3 tries
        await markAttempted(req.id);
      }
    }
  } catch {
    // Non-critical — silent failure
  }
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    async function init() {
      await getDatabase();
      const keyExists = await ClaudeService.hasApiKey();
      setHasApiKey(keyExists);
      setIsReady(true);
    }
    init();

    // Drain the offline queue whenever the device regains connectivity
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        drainOfflineQueue(queryClient);
      }
    });
    return () => unsubscribe();
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
        <Stack.Screen name="onboarding/goal-setup" options={{ headerShown: false }} />
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

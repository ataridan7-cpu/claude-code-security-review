import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ClaudeService } from '../../src/services/claude/ClaudeService';
import { AppSwapSuggestion, SwapActivity } from '../../src/models';
import { Colors, Typography, Spacing, Radius } from '../../src/constants/theme';

const CATEGORY_EMOJI: Record<string, string> = {
  movement: '🏃',
  learning: '📚',
  creativity: '🎨',
  connection: '💬',
  mindfulness: '🧘',
};

export default function AppLimitReachedScreen() {
  const { appId, appName, category } = useLocalSearchParams<{
    appId: string;
    appName: string;
    category: string;
  }>();

  const [swaps, setSwaps] = useState<AppSwapSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const result = await ClaudeService.generateAppSwap(
        appName ?? 'this app',
        category ?? 'social'
      );
      setSwaps(result);
      setIsLoading(false);
    }
    load();
  }, [appId]);

  function handleSelect(activity: SwapActivity) {
    // In production: deep link to activity.deepLinkApp if set
    router.back();
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.emoji}>⏸</Text>
        <Text style={styles.title}>Time's up on {appName ?? 'this app'}</Text>
        <Text style={styles.subtitle}>You hit your goal limit. Here's what you could do instead:</Text>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.loadingText}>Finding alternatives...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {swaps?.suggestions.map((activity) => (
            <Pressable
              key={activity.id}
              style={styles.card}
              onPress={() => handleSelect(activity)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardEmoji}>
                  {CATEGORY_EMOJI[activity.category] ?? '✦'}
                </Text>
                <View style={styles.cardMeta}>
                  <Text style={styles.cardTitle}>{activity.title}</Text>
                  <Text style={styles.cardDuration}>{activity.durationMinutes} min</Text>
                </View>
              </View>
              <Text style={styles.cardDesc}>{activity.description}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <Pressable style={styles.ignoreBtn} onPress={() => router.back()}>
        <Text style={styles.ignoreText}>Ignore limit this time</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.xl, paddingTop: 60, gap: Spacing.sm, alignItems: 'center' },
  emoji: { fontSize: 56 },
  title: { ...Typography.h1, color: Colors.text, textAlign: 'center' },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', maxWidth: 280 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  loadingText: { ...Typography.body, color: Colors.textSecondary },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 100 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  cardEmoji: { fontSize: 32 },
  cardMeta: { flex: 1 },
  cardTitle: { ...Typography.h3, color: Colors.text },
  cardDuration: { ...Typography.caption, color: Colors.textSecondary },
  cardDesc: { ...Typography.body, color: Colors.textSecondary },
  ignoreBtn: {
    position: 'absolute',
    bottom: Spacing.xl,
    alignSelf: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  ignoreText: { ...Typography.bodySmall, color: Colors.textMuted },
});

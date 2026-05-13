import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Share, StyleSheet, ActivityIndicator } from 'react-native';
import { ClaudeService } from '../../src/services/claude/ClaudeService';
import { useWeekScreenTime } from '../../src/hooks/useScreenTime';
import { useActiveGoals } from '../../src/hooks/useGoals';
import { Colors, Typography, Spacing, Radius } from '../../src/constants/theme';

export default function WeeklyLetterScreen() {
  const { data: weekSummaries = [] } = useWeekScreenTime();
  const { data: goals = [] } = useActiveGoals();
  const [letter, setLetter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (weekSummaries.length > 0 && !letter) {
      generateLetter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekSummaries.length]);

  async function generateLetter() {
    if (weekSummaries.length === 0) return;
    setIsLoading(true);
    try {
      const { narrative } = await ClaudeService.generateWeeklyLetter(
        weekSummaries,
        goals,
        []
      );
      setLetter(narrative);
      setGeneratedAt(new Date());
    } finally {
      setIsLoading(false);
    }
  }

  async function handleShare() {
    await Share.share({
      message: `My Weekly Wellness Letter from Lumina:\n\n${letter}`,
    });
  }

  const weekStr = weekSummaries.length > 0
    ? `Week of ${weekSummaries[weekSummaries.length - 1]?.date}`
    : 'This Week';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.label}>WEEKLY WELLNESS LETTER</Text>
      <Text style={styles.weekStr}>{weekStr}</Text>

      {isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.loadingText}>Lumina is writing your letter...</Text>
        </View>
      )}

      {letter ? (
        <>
          <Text style={styles.letterText}>{letter}</Text>
          {generatedAt && (
            <Text style={styles.timestamp}>
              Written {generatedAt.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          )}
          <View style={styles.actions}>
            <Pressable style={styles.shareBtn} onPress={handleShare}>
              <Text style={styles.shareBtnText}>Share letter</Text>
            </Pressable>
            <Pressable style={styles.regenerateBtn} onPress={generateLetter}>
              <Text style={styles.regenerateBtnText}>Regenerate</Text>
            </Pressable>
          </View>
        </>
      ) : !isLoading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Track at least 3 days to receive your first letter.
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, paddingBottom: Spacing.xxl, gap: Spacing.md },
  label: { ...Typography.label, color: Colors.primary },
  weekStr: { ...Typography.h2, color: Colors.text },
  loading: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  loadingText: { ...Typography.body, color: Colors.textSecondary },
  letterText: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 28,
    fontStyle: 'italic',
  },
  timestamp: { ...Typography.caption, color: Colors.textMuted, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  shareBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  shareBtnText: { ...Typography.body, fontWeight: '600', color: Colors.background },
  regenerateBtn: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  regenerateBtnText: { ...Typography.body, color: Colors.textSecondary },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StreamingText } from '../../../src/components/common/StreamingText';
import { LoadingSkeleton } from '../../../src/components/common/LoadingSkeleton';
import { useClaudeStream } from '../../../src/hooks/useClaude';
import { useWeekScreenTime } from '../../../src/hooks/useScreenTime';
import { useActiveGoals } from '../../../src/hooks/useGoals';
import { ClaudeService } from '../../../src/services/claude/ClaudeService';
import { Colors, Typography, Spacing, Radius } from '../../../src/constants/theme';

export default function InsightsScreen() {
  const { data: weekSummaries = [], isLoading } = useWeekScreenTime();
  const { data: goals = [] } = useActiveGoals();
  const { text: moodText, isStreaming: moodStreaming, stream: streamMood } = useClaudeStream();
  const [loadedCorrelation, setLoadedCorrelation] = useState(false);

  useEffect(() => {
    if (weekSummaries.length >= 5 && !loadedCorrelation) {
      setLoadedCorrelation(true);
      streamMood(
        ClaudeService.streamMoodCorrelation(
          [
            { category: 'social', averageMood: 2.8, sampleSize: 12 },
            { category: 'entertainment', averageMood: 3.5, sampleSize: 8 },
            { category: 'productivity', averageMood: 4.1, sampleSize: 6 },
          ],
          weekSummaries,
          goals,
          []
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekSummaries.length]);

  const totalThisWeek = weekSummaries.reduce((s, d) => s + d.totalSeconds, 0);
  const avgPerDay = weekSummaries.length > 0 ? totalThisWeek / weekSummaries.length : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Insights</Text>

      {/* Weekly overview */}
      <View style={styles.statRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{(totalThisWeek / 3600).toFixed(1)}h</Text>
          <Text style={styles.statLabel}>This week</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{(avgPerDay / 3600).toFixed(1)}h</Text>
          <Text style={styles.statLabel}>Daily avg</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{weekSummaries.length}</Text>
          <Text style={styles.statLabel}>Days tracked</Text>
        </View>
      </View>

      {/* Bar chart — simple text-based for now */}
      {!isLoading && weekSummaries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LAST 7 DAYS</Text>
          {weekSummaries.slice(0, 7).map((s) => {
            const barPct = avgPerDay > 0 ? (s.totalSeconds / (avgPerDay * 1.5)) * 100 : 0;
            const dayName = new Date(s.date + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'short',
            });
            return (
              <View key={s.date} style={styles.dayRow}>
                <Text style={styles.dayLabel}>{dayName}</Text>
                <View style={styles.dayTrack}>
                  <View
                    style={[
                      styles.dayFill,
                      {
                        width: `${Math.min(barPct, 100)}%`,
                        backgroundColor:
                          s.totalSeconds > avgPerDay ? Colors.warning : Colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.dayValue}>
                  {(s.totalSeconds / 3600).toFixed(1)}h
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Mood correlation */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>MOOD & SCREEN TIME</Text>
        {moodText || moodStreaming ? (
          <StreamingText text={moodText} isStreaming={moodStreaming} style={styles.narrative} />
        ) : (
          <Text style={styles.emptyText}>Log your mood for 5+ days to see patterns.</Text>
        )}
      </View>

      {/* Weekly Letter CTA */}
      <Pressable style={styles.letterCard} onPress={() => router.push('/weekly-letter')}>
        <Text style={styles.letterTitle}>Weekly Wellness Letter</Text>
        <Text style={styles.letterSub}>A personal reflection from Lumina →</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.md },
  title: { ...Typography.hero, color: Colors.text, marginTop: Spacing.lg },
  statRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: { ...Typography.h2, color: Colors.text },
  statLabel: { ...Typography.caption, color: Colors.textSecondary },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionLabel: { ...Typography.label, color: Colors.textSecondary },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dayLabel: { ...Typography.bodySmall, color: Colors.textSecondary, width: 32 },
  dayTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  dayFill: { height: 6, borderRadius: Radius.full },
  dayValue: { ...Typography.caption, color: Colors.textSecondary, width: 32, textAlign: 'right' },
  narrative: { ...Typography.body, color: Colors.text, lineHeight: 22 },
  emptyText: { ...Typography.body, color: Colors.textMuted },
  letterCard: {
    backgroundColor: Colors.primaryDim,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: Spacing.xs,
  },
  letterTitle: { ...Typography.h3, color: Colors.text },
  letterSub: { ...Typography.body, color: Colors.primaryLight },
});

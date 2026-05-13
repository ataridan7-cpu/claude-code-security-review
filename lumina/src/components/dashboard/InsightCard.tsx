import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { StreamingText } from '../common/StreamingText';
import { InsightCardSkeleton } from '../common/LoadingSkeleton';
import { useClaudeStream } from '../../hooks/useClaude';
import { ClaudeService } from '../../services/claude/ClaudeService';
import { DailyScreenTimeSummary, Goal, MoodEntry } from '../../models';
import { Colors, Typography, Radius, Spacing } from '../../constants/theme';

interface InsightCardProps {
  summary: DailyScreenTimeSummary;
  goals: Goal[];
  moods: MoodEntry[];
  cachedText?: string;
}

export function InsightCard({ summary, goals, moods, cachedText }: InsightCardProps) {
  const { text, isStreaming, error, stream, reset } = useClaudeStream();

  const displayText = text || cachedText || '';

  useEffect(() => {
    if (!cachedText) {
      reset();
      stream(ClaudeService.streamDailyInsight(summary, goals, moods));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary.date]);

  if (!displayText && isStreaming) {
    return <InsightCardSkeleton />;
  }

  if (error) {
    return (
      <View style={styles.card}>
        <Text style={styles.label}>TODAY'S INSIGHT</Text>
        <Text style={styles.error}>Could not load insight. Tap to retry.</Text>
        <Pressable onPress={() => stream(ClaudeService.streamDailyInsight(summary, goals, moods))}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.label}>TODAY'S INSIGHT</Text>
      <StreamingText
        text={displayText}
        isStreaming={isStreaming}
        style={styles.narrative}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    ...Typography.label,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  narrative: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 23,
  },
  error: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  retryText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    marginTop: Spacing.sm,
  },
});

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { DailyRing } from '../../../src/components/dashboard/DailyRing';
import { InsightCard } from '../../../src/components/dashboard/InsightCard';
import { AppUsageBar } from '../../../src/components/common/AppUsageBar';
import { InsightCardSkeleton, LoadingSkeleton } from '../../../src/components/common/LoadingSkeleton';
import { useTodayScreenTime, useSyncScreenTime } from '../../../src/hooks/useScreenTime';
import { useActiveGoals } from '../../../src/hooks/useGoals';
import { useMoodStore } from '../../../src/stores/moodStore';
import { detectHeavySession } from '../../../src/analytics/PatternAnalyzer';
import { Colors, Typography, Spacing, Radius } from '../../../src/constants/theme';

export default function DashboardScreen() {
  const { data: summary, isLoading, refetch } = useTodayScreenTime();
  const { data: goals = [] } = useActiveGoals();
  const { hasTodaysEntry } = useMoodStore();
  const syncMutation = useSyncScreenTime();

  const topApps = summary?.topApps.slice(0, 5) ?? [];
  const maxSeconds = topApps[0]?.totalSeconds ?? 1;

  const dailyGoal = goals.find((g) => g.goalType === 'daily_max');
  const goalSeconds = dailyGoal?.dailyLimitSeconds;

  // Find the heaviest single-app session today (≥2 hours) to prompt reflection
  const heavyApp = summary?.topApps.find((app) =>
    detectHeavySession(app.totalSeconds / 60)
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={syncMutation.isPending}
          onRefresh={() => { syncMutation.mutate(); refetch(); }}
          tintColor={Colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Good {getTimeOfDay()}</Text>
        <Text style={styles.date}>{formatDate(new Date())}</Text>
      </View>

      {/* Daily Ring */}
      <View style={styles.ringContainer}>
        {isLoading ? (
          <LoadingSkeleton width={160} height={160} borderRadius={80} />
        ) : (
          <DailyRing
            totalSeconds={summary?.totalSeconds ?? 0}
            goalSeconds={goalSeconds}
          />
        )}
      </View>

      {/* Mood prompt */}
      {!hasTodaysEntry && (
        <Pressable
          style={styles.moodPrompt}
          onPress={() => router.push('/mood-checkin')}
        >
          <Text style={styles.moodPromptText}>How are you feeling today?</Text>
          <Text style={styles.moodPromptCta}>Log mood →</Text>
        </Pressable>
      )}

      {/* Claude Insight */}
      {isLoading ? (
        <InsightCardSkeleton />
      ) : summary ? (
        <InsightCard summary={summary} goals={goals} moods={[]} />
      ) : null}

      {/* Top Apps */}
      {topApps.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TOP APPS</Text>
          {topApps.map((app) => (
            <AppUsageBar key={app.bundleId} stat={app} maxSeconds={maxSeconds} />
          ))}
        </View>
      )}

      {/* Heavy-session reflection prompt */}
      {heavyApp && (
        <Pressable
          style={styles.reflectPrompt}
          onPress={() =>
            router.push(
              `/context-journal/today?appName=${encodeURIComponent(heavyApp.appName)}&durationMinutes=${Math.round(heavyApp.totalSeconds / 60)}`
            )
          }
        >
          <Text style={styles.reflectTitle}>Reflect on your {heavyApp.appName} session</Text>
          <Text style={styles.reflectSub}>
            {Math.round(heavyApp.totalSeconds / 60)} min today · Tap to journal with Lumina →
          </Text>
        </Pressable>
      )}

      {/* Focus shortcut */}
      <Pressable
        style={styles.focusBtn}
        onPress={() => router.push('/tabs/focus')}
      >
        <Text style={styles.focusBtnText}>Start Focus Session</Text>
      </Pressable>
    </ScrollView>
  );
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.md },
  header: { marginTop: Spacing.lg },
  greeting: { ...Typography.hero, color: Colors.text },
  date: { ...Typography.body, color: Colors.textSecondary, marginTop: 2 },
  ringContainer: { alignItems: 'center', paddingVertical: Spacing.lg },
  moodPrompt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  moodPromptText: { ...Typography.body, color: Colors.text },
  moodPromptCta: { ...Typography.bodySmall, color: Colors.primary },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  sectionTitle: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.sm },
  focusBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  focusBtnText: { ...Typography.body, fontWeight: '600', color: Colors.background },
  reflectPrompt: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.accent + '55',
    gap: Spacing.xs,
  },
  reflectTitle: { ...Typography.body, color: Colors.text, fontWeight: '600' },
  reflectSub: { ...Typography.bodySmall, color: Colors.textSecondary },
});

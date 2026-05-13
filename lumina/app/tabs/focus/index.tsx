import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useActiveGoals } from '../../../src/hooks/useGoals';
import { useRecentSessions } from '../../../src/hooks/useFocusSession';
import { Colors, Typography, Spacing, Radius } from '../../../src/constants/theme';

const DURATION_OPTIONS = [
  { label: '25 min', seconds: 25 * 60 },
  { label: '45 min', seconds: 45 * 60 },
  { label: '60 min', seconds: 60 * 60 },
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60 > 0 ? `${m % 60}m` : ''}`;
}

export default function FocusScreen() {
  const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[0].seconds);
  const { data: goals = [] } = useActiveGoals();
  const { data: sessions = [] } = useRecentSessions();

  function startSession() {
    router.push({
      pathname: '/focus-session/[sessionId]',
      params: { sessionId: 'new', duration: String(selectedDuration) },
    });
  }

  const completedToday = sessions.filter((s) => {
    const today = new Date().toISOString().split('T')[0];
    return (
      s.status === 'completed' &&
      new Date(s.startedAt).toISOString().split('T')[0] === today
    );
  }).length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Focus</Text>

      {completedToday > 0 && (
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>
            {completedToday} session{completedToday > 1 ? 's' : ''} completed today
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>DURATION</Text>
        <View style={styles.durationRow}>
          {DURATION_OPTIONS.map((opt) => (
            <Pressable
              key={opt.seconds}
              style={[
                styles.durationChip,
                selectedDuration === opt.seconds && styles.durationChipActive,
              ]}
              onPress={() => setSelectedDuration(opt.seconds)}
            >
              <Text
                style={[
                  styles.durationLabel,
                  selectedDuration === opt.seconds && styles.durationLabelActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {goals.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LINKED GOAL</Text>
          {goals.slice(0, 3).map((g) => (
            <Pressable key={g.id} style={styles.goalChip}>
              <Text style={styles.goalText} numberOfLines={1}>
                {g.claudeInterpretation}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable style={styles.startBtn} onPress={startSession}>
        <Text style={styles.startBtnText}>Begin Session</Text>
      </Pressable>

      {sessions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RECENT SESSIONS</Text>
          {sessions.slice(0, 5).map((s) => (
            <View key={s.id} style={styles.sessionRow}>
              <Text style={styles.sessionLabel}>
                {formatDuration(s.durationTarget)}
              </Text>
              <Text style={[styles.sessionStatus, s.status === 'completed' && styles.statusDone]}>
                {s.status}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.md },
  title: { ...Typography.hero, color: Colors.text, marginTop: Spacing.lg },
  streakBadge: {
    backgroundColor: Colors.primaryDim,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    alignSelf: 'flex-start',
  },
  streakText: { ...Typography.bodySmall, color: Colors.primaryLight },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sectionLabel: { ...Typography.label, color: Colors.textSecondary },
  durationRow: { flexDirection: 'row', gap: Spacing.sm },
  durationChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  durationChipActive: {
    backgroundColor: Colors.primaryDim,
    borderColor: Colors.primary,
  },
  durationLabel: { ...Typography.body, color: Colors.textSecondary },
  durationLabelActive: { color: Colors.primaryLight },
  goalChip: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  goalText: { ...Typography.bodySmall, color: Colors.text },
  startBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  startBtnText: { ...Typography.h2, color: Colors.background },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sessionLabel: { ...Typography.body, color: Colors.text },
  sessionStatus: { ...Typography.bodySmall, color: Colors.textMuted, textTransform: 'capitalize' },
  statusDone: { color: Colors.success },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { ClaudeService } from '../../src/services/claude/ClaudeService';
import { DetoxProgram, DetoxDifficulty, DetoxUserProfile } from '../../src/models';
import { Colors, Typography, Spacing, Radius } from '../../src/constants/theme';

const DIFFICULTIES: Array<{ value: DetoxDifficulty; label: string; desc: string }> = [
  { value: 'gentle', label: 'Gentle', desc: 'Reduce usage gradually, small daily wins' },
  { value: 'moderate', label: 'Moderate', desc: 'Scheduled breaks, phone-free zones' },
  { value: 'intensive', label: 'Intensive', desc: 'Deep reset, significant habit change' },
];

export default function DetoxScreen() {
  const [program, setProgram] = useState<DetoxProgram | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DetoxDifficulty>('gentle');

  async function generateProgram() {
    setIsGenerating(true);
    try {
      const profile: DetoxUserProfile = {
        averageDailyHours: 5,
        topCategories: ['social', 'entertainment'],
        currentGoals: [],
        moodTrend: 'stable',
      };
      const p = await ClaudeService.generateDetoxProgram(profile, selectedDifficulty);
      setProgram(p);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Digital Detox</Text>
      <Text style={styles.subtitle}>
        Lumina designs a personalized 7-day program based on your usage patterns.
      </Text>

      {!program && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DIFFICULTY</Text>
          {DIFFICULTIES.map((d) => (
            <Pressable
              key={d.value}
              style={[
                styles.difficultyCard,
                selectedDifficulty === d.value && styles.difficultyCardActive,
              ]}
              onPress={() => setSelectedDifficulty(d.value)}
            >
              <Text style={styles.difficultyLabel}>{d.label}</Text>
              <Text style={styles.difficultyDesc}>{d.desc}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {!program ? (
        <Pressable
          style={[styles.generateBtn, isGenerating && styles.btnDisabled]}
          onPress={generateProgram}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={Colors.background} />
              <Text style={styles.generateBtnText}>Building your program...</Text>
            </View>
          ) : (
            <Text style={styles.generateBtnText}>Create my detox program</Text>
          )}
        </Pressable>
      ) : (
        <>
          <View style={styles.programHeader}>
            <Text style={styles.programTitle}>{program.title}</Text>
            <Text style={styles.programDesc}>{program.description}</Text>
          </View>
          {program.dailyChallenges.map((challenge) => (
            <View key={challenge.day} style={styles.challengeCard}>
              <View style={styles.challengeHeader}>
                <View style={styles.dayBadge}>
                  <Text style={styles.dayBadgeText}>Day {challenge.day}</Text>
                </View>
                <View style={[styles.actionBadge]}>
                  <Text style={styles.actionBadgeText}>{challenge.actionType}</Text>
                </View>
              </View>
              <Text style={styles.challengeTitle}>{challenge.title}</Text>
              <Text style={styles.challengeDesc}>{challenge.description}</Text>
              {challenge.durationMinutes && (
                <Text style={styles.challengeTime}>{challenge.durationMinutes} min</Text>
              )}
            </View>
          ))}
          <Pressable style={styles.newProgramBtn} onPress={() => setProgram(null)}>
            <Text style={styles.newProgramText}>Generate new program</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.md },
  title: { ...Typography.hero, color: Colors.text },
  subtitle: { ...Typography.body, color: Colors.textSecondary },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionLabel: { ...Typography.label, color: Colors.textSecondary },
  difficultyCard: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  difficultyCardActive: { borderColor: Colors.primary },
  difficultyLabel: { ...Typography.h3, color: Colors.text },
  difficultyDesc: { ...Typography.bodySmall, color: Colors.textSecondary },
  generateBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.7 },
  loadingRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  generateBtnText: { ...Typography.body, fontWeight: '600', color: Colors.background },
  programHeader: { gap: Spacing.xs },
  programTitle: { ...Typography.h1, color: Colors.text },
  programDesc: { ...Typography.body, color: Colors.textSecondary },
  challengeCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  challengeHeader: { flexDirection: 'row', gap: Spacing.sm },
  dayBadge: {
    backgroundColor: Colors.primaryDim,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  dayBadgeText: { ...Typography.caption, color: Colors.primaryLight },
  actionBadge: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  actionBadgeText: { ...Typography.caption, color: Colors.textSecondary, textTransform: 'capitalize' },
  challengeTitle: { ...Typography.h3, color: Colors.text },
  challengeDesc: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22 },
  challengeTime: { ...Typography.bodySmall, color: Colors.textMuted },
  newProgramBtn: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  newProgramText: { ...Typography.body, color: Colors.textSecondary },
});

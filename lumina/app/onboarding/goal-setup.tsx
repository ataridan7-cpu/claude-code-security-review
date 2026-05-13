import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { GoalChatInterface } from '../../src/components/goals/GoalChatInterface';
import { useCreateGoal } from '../../src/hooks/useGoals';
import { Colors, Typography, Spacing, Radius } from '../../src/constants/theme';
import { GoalType, AppCategory, TimeBlock } from '../../src/models';

export default function GoalSetupScreen() {
  const createGoal = useCreateGoal();
  const [goalCreated, setGoalCreated] = useState(false);

  async function handleGoalConfirmed(
    toolName: string,
    toolInput: Record<string, unknown>
  ) {
    if (toolName === 'create_app_limit_goal') {
      await createGoal.mutateAsync({
        naturalLanguageInput: '',
        claudeInterpretation:
          (toolInput.claudeExplanation as string) ?? 'App usage limit',
        goalType: 'app_limit' as GoalType,
        targetApps: (toolInput.targetBundleIds as string[]) ?? [],
        targetCategories: (toolInput.targetCategories as AppCategory[]) ?? [],
        dailyLimitSeconds: (toolInput.dailyLimitSeconds as number) ?? 3600,
      });
      setGoalCreated(true);
    } else if (toolName === 'create_time_block') {
      await createGoal.mutateAsync({
        naturalLanguageInput: '',
        claudeInterpretation:
          (toolInput.claudeExplanation as string) ?? 'Time block',
        goalType: 'bedtime_block' as GoalType,
        scheduledBlocks: (toolInput.scheduledBlocks as TimeBlock[]) ?? [],
      });
      setGoalCreated(true);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Set your first goal</Text>
        <Text style={styles.subtitle}>
          Tell Lumina what you'd like to change — in plain English. You can always adjust it later.
        </Text>
      </View>

      {goalCreated ? (
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>✓</Text>
          <Text style={styles.successTitle}>Goal created</Text>
          <Text style={styles.successBody}>
            Lumina will track your progress and check in with you along the way.
          </Text>
          <Pressable
            style={styles.continueBtn}
            onPress={() => router.replace('/tabs/dashboard')}
          >
            <Text style={styles.continueBtnText}>Go to dashboard</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <GoalChatInterface onGoalConfirmed={handleGoalConfirmed} />
          <Pressable
            style={styles.skipBtn}
            onPress={() => router.replace('/tabs/dashboard')}
          >
            <Text style={styles.skipText}>Skip — set a goal later</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  title: { ...Typography.h1, color: Colors.text },
  subtitle: { ...Typography.body, color: Colors.textSecondary, lineHeight: 24 },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  successEmoji: {
    fontSize: 56,
    color: Colors.success,
  },
  successTitle: { ...Typography.h1, color: Colors.text },
  successBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  continueBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  continueBtnText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.background,
  },
  skipBtn: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  skipText: { ...Typography.body, color: Colors.textMuted },
});

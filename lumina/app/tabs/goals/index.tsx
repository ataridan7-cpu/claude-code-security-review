import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  StyleSheet,
} from 'react-native';
import { useActiveGoals, useCreateGoal, usePauseGoal } from '../../../src/hooks/useGoals';
import { buildGoalPayload, requestIOSAppSelection } from '../../../src/hooks/useConfirmGoal';
import { GoalChatInterface } from '../../../src/components/goals/GoalChatInterface';
import { Colors, Typography, Spacing, Radius } from '../../../src/constants/theme';
import { Goal } from '../../../src/models';

export default function GoalsScreen() {
  const { data: goals = [] } = useActiveGoals();
  const createGoal = useCreateGoal();
  const pauseGoal = usePauseGoal();
  const [showAddModal, setShowAddModal] = useState(false);

  async function handleGoalConfirmed(
    toolName: string,
    toolInput: Record<string, unknown>
  ) {
    // On iOS, present FamilyActivityPicker for app_limit goals before saving
    const iosSelection = await requestIOSAppSelection(toolName);
    const payload = buildGoalPayload(toolName, toolInput, iosSelection);
    if (payload) {
      await createGoal.mutateAsync(payload);
    }
    setShowAddModal(false);
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Goals</Text>

        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No active goals yet</Text>
            <Text style={styles.emptySubtitle}>
              Tell Lumina what you'd like to change and it will set it up for you.
            </Text>
          </View>
        ) : (
          goals.map((goal) => (
            <View key={goal.id} style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <View style={[styles.goalTypeBadge]}>
                  <Text style={styles.goalTypeText}>{goal.goalType.replace('_', ' ')}</Text>
                </View>
              </View>
              <Text style={styles.goalInterpretation}>
                {goal.claudeInterpretation}
              </Text>
              {goal.dailyLimitSeconds && (
                <Text style={styles.goalDetail}>
                  {Math.round(goal.dailyLimitSeconds / 60)} min/day limit
                </Text>
              )}
              {goal.enforcementEnabled && (
                <Text style={styles.enforcedBadge}>● Enforced on device</Text>
              )}
              <Pressable
                style={styles.pauseBtn}
                onPress={() => pauseGoal.mutate(goal)}
              >
                <Text style={styles.pauseBtnText}>Pause</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      <Pressable
        style={styles.addBtn}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addBtnText}>+ Add Goal</Text>
      </Pressable>

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Goal</Text>
            <Pressable onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </Pressable>
          </View>
          <GoalChatInterface onGoalConfirmed={handleGoalConfirmed} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: 100, gap: Spacing.md },
  title: { ...Typography.hero, color: Colors.text, marginTop: Spacing.lg },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: { ...Typography.h2, color: Colors.text },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
  },
  goalCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  goalHeader: { flexDirection: 'row' },
  goalTypeBadge: {
    backgroundColor: Colors.primaryDim,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  goalTypeText: { ...Typography.caption, color: Colors.primaryLight, textTransform: 'uppercase' },
  goalInterpretation: { ...Typography.body, color: Colors.text },
  goalDetail: { ...Typography.bodySmall, color: Colors.textSecondary },
  enforcedBadge: { ...Typography.caption, color: Colors.success },
  pauseBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pauseBtnText: { ...Typography.caption, color: Colors.textSecondary },
  addBtn: {
    position: 'absolute',
    bottom: Spacing.xl,
    alignSelf: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  addBtnText: { ...Typography.body, fontWeight: '600', color: Colors.background },
  modal: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.md,
  },
  modalTitle: { ...Typography.h2, color: Colors.text },
  modalClose: { ...Typography.body, color: Colors.primary },
});

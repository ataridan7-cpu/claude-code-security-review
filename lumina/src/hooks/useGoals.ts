import { Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { Goal, GoalType, AppCategory, TimeBlock } from '../models';
import {
  insertGoal,
  getActiveGoals,
  getAllGoals,
  updateGoalStatus,
} from '../services/storage/GoalRepository';
import { ScreenTimeService } from '../services/screentime/ScreenTimeService';

const QUERY_KEYS = {
  active: ['goals', 'active'],
  all: ['goals', 'all'],
};

export function useActiveGoals() {
  return useQuery({
    queryKey: QUERY_KEYS.active,
    queryFn: getActiveGoals,
  });
}

export function useAllGoals() {
  return useQuery({
    queryKey: QUERY_KEYS.all,
    queryFn: getAllGoals,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (partial: {
      naturalLanguageInput: string;
      claudeInterpretation: string;
      goalType: GoalType;
      targetApps?: string[];
      targetCategories?: AppCategory[];
      dailyLimitSeconds?: number;
      scheduledBlocks?: TimeBlock[];
      iosActivitySelection?: string;
    }) => {
      let enforcementEnabled = false;
      const goalId = uuidv4();

      // Android: register with the foreground blocking service
      if (
        Platform.OS === 'android' &&
        (partial.goalType === 'app_limit' || partial.goalType === 'category_limit') &&
        (partial.targetApps?.length ?? 0) > 0 &&
        partial.dailyLimitSeconds
      ) {
        for (const bundleId of partial.targetApps!) {
          await ScreenTimeService.registerBlockedApp(bundleId, partial.dailyLimitSeconds);
        }
        await ScreenTimeService.startBlockingService();
        enforcementEnabled = true;
      }

      // iOS: register a DeviceActivity threshold via FamilyControls
      if (
        Platform.OS === 'ios' &&
        (partial.goalType === 'app_limit' || partial.goalType === 'category_limit') &&
        partial.iosActivitySelection &&
        partial.dailyLimitSeconds
      ) {
        await ScreenTimeService.registerGoalLimit(
          partial.iosActivitySelection,
          goalId,
          partial.dailyLimitSeconds
        );
        enforcementEnabled = true;
      }

      const goal: Goal = {
        id: goalId,
        ...partial,
        status: 'active',
        createdAt: Date.now(),
        activatedAt: Date.now(),
        progress: [],
        enforcementEnabled,
      };
      await insertGoal(goal);
      return goal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.active });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
}

export function usePauseGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (goal: Goal) => {
      // Android: unregister from the foreground blocking service
      if (Platform.OS === 'android' && goal.enforcementEnabled) {
        for (const bundleId of goal.targetApps ?? []) {
          await ScreenTimeService.unregisterBlockedApp(bundleId);
        }
        const remaining = await getActiveGoals();
        const otherEnforced = remaining.some(
          (g) => g.id !== goal.id && g.enforcementEnabled && (g.targetApps?.length ?? 0) > 0
        );
        if (!otherEnforced) {
          await ScreenTimeService.stopBlockingService();
        }
      }

      // iOS: stop DeviceActivity monitoring for this goal
      if (Platform.OS === 'ios' && goal.enforcementEnabled) {
        await ScreenTimeService.removeGoalLimit(goal.id);
      }

      await updateGoalStatus(goal.id, 'paused');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.active });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { Goal, GoalType, AppCategory, TimeBlock } from '../models';
import {
  insertGoal,
  getActiveGoals,
  getAllGoals,
  updateGoalStatus,
} from '../services/storage/GoalRepository';

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
    }) => {
      const goal: Goal = {
        id: uuidv4(),
        ...partial,
        status: 'active',
        createdAt: Date.now(),
        activatedAt: Date.now(),
        progress: [],
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
    mutationFn: (goalId: string) => updateGoalStatus(goalId, 'paused'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.active });
    },
  });
}

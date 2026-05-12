import { create } from 'zustand';
import { Goal } from '../models';

interface GoalState {
  goals: Goal[];
  draftGoal: Partial<Goal> | null;
  isProcessing: boolean;

  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  setDraftGoal: (draft: Partial<Goal> | null) => void;
  setProcessing: (v: boolean) => void;
}

export const useGoalStore = create<GoalState>((set) => ({
  goals: [],
  draftGoal: null,
  isProcessing: false,

  setGoals: (goals) => set({ goals }),
  addGoal: (goal) => set((s) => ({ goals: [goal, ...s.goals] })),
  updateGoal: (id, updates) =>
    set((s) => ({
      goals: s.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    })),
  setDraftGoal: (draftGoal) => set({ draftGoal }),
  setProcessing: (isProcessing) => set({ isProcessing }),
}));

import { create } from 'zustand';
import { ClaudeInsight } from '../models';

interface InsightState {
  dailyInsight: ClaudeInsight | null;
  weeklyLetter: ClaudeInsight | null;
  moodCorrelationInsight: ClaudeInsight | null;
  streamingDailyText: string;
  isDailyStreaming: boolean;

  setDailyInsight: (insight: ClaudeInsight) => void;
  setWeeklyLetter: (insight: ClaudeInsight) => void;
  setMoodCorrelationInsight: (insight: ClaudeInsight) => void;
  appendDailyChunk: (chunk: string) => void;
  clearDailyText: () => void;
  setDailyStreaming: (v: boolean) => void;
}

export const useInsightStore = create<InsightState>((set) => ({
  dailyInsight: null,
  weeklyLetter: null,
  moodCorrelationInsight: null,
  streamingDailyText: '',
  isDailyStreaming: false,

  setDailyInsight: (dailyInsight) => set({ dailyInsight }),
  setWeeklyLetter: (weeklyLetter) => set({ weeklyLetter }),
  setMoodCorrelationInsight: (moodCorrelationInsight) => set({ moodCorrelationInsight }),
  appendDailyChunk: (chunk) =>
    set((s) => ({ streamingDailyText: s.streamingDailyText + chunk })),
  clearDailyText: () => set({ streamingDailyText: '' }),
  setDailyStreaming: (isDailyStreaming) => set({ isDailyStreaming }),
}));

import { create } from 'zustand';
import { MoodEntry } from '../models';

interface MoodState {
  recentEntries: MoodEntry[];
  hasTodaysEntry: boolean;

  setRecentEntries: (entries: MoodEntry[]) => void;
  addEntry: (entry: MoodEntry) => void;
  setHasTodaysEntry: (v: boolean) => void;
}

export const useMoodStore = create<MoodState>((set) => ({
  recentEntries: [],
  hasTodaysEntry: false,

  setRecentEntries: (recentEntries) => set({ recentEntries }),
  addEntry: (entry) =>
    set((s) => ({
      recentEntries: [entry, ...s.recentEntries].slice(0, 30),
      hasTodaysEntry: true,
    })),
  setHasTodaysEntry: (hasTodaysEntry) => set({ hasTodaysEntry }),
}));

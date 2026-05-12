import { create } from 'zustand';
import { FocusSession } from '../models';

interface FocusState {
  activeSession: FocusSession | null;
  recentSessions: FocusSession[];
  streamingCoachText: string;
  isCoachStreaming: boolean;

  setActiveSession: (session: FocusSession | null) => void;
  setRecentSessions: (sessions: FocusSession[]) => void;
  appendCoachChunk: (chunk: string) => void;
  clearCoachText: () => void;
  setCoachStreaming: (v: boolean) => void;
  incrementInterruptions: () => void;
}

export const useFocusStore = create<FocusState>((set) => ({
  activeSession: null,
  recentSessions: [],
  streamingCoachText: '',
  isCoachStreaming: false,

  setActiveSession: (activeSession) => set({ activeSession }),
  setRecentSessions: (recentSessions) => set({ recentSessions }),
  appendCoachChunk: (chunk) =>
    set((s) => ({ streamingCoachText: s.streamingCoachText + chunk })),
  clearCoachText: () => set({ streamingCoachText: '' }),
  setCoachStreaming: (isCoachStreaming) => set({ isCoachStreaming }),
  incrementInterruptions: () =>
    set((s) => ({
      activeSession: s.activeSession
        ? {
            ...s.activeSession,
            interruptionCount: s.activeSession.interruptionCount + 1,
          }
        : null,
    })),
}));

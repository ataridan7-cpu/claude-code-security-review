import { useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { FocusSession, MoodScore, CoachMessage } from '../models';
import {
  insertSession,
  getActiveSession,
  getRecentSessions,
  updateSessionStatus,
  appendCoachMessage,
  incrementInterruptions,
  saveMoodAfter,
} from '../services/storage/FocusSessionRepository';

const QUERY_KEYS = {
  active: ['focus', 'active'],
  recent: ['focus', 'recent'],
};

export function useActiveSession() {
  return useQuery({
    queryKey: QUERY_KEYS.active,
    queryFn: getActiveSession,
    refetchInterval: 10_000, // poll every 10s while active
  });
}

export function useRecentSessions() {
  return useQuery({
    queryKey: QUERY_KEYS.recent,
    queryFn: () => getRecentSessions(10),
  });
}

export function useStartSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (opts: { durationTarget: number; goalId?: string; moodBefore?: MoodScore }) => {
      const session: FocusSession = {
        id: uuidv4(),
        goalId: opts.goalId,
        startedAt: Date.now(),
        durationTarget: opts.durationTarget,
        status: 'active',
        interruptionCount: 0,
        coachMessages: [],
        moodBefore: opts.moodBefore,
      };
      await insertSession(session);
      return session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.active });
    },
  });
}

export function useEndSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (opts: {
      sessionId: string;
      status: FocusSession['status'];
      moodAfter?: MoodScore;
    }) => {
      const now = Date.now();
      await updateSessionStatus(opts.sessionId, opts.status, now);
      if (opts.moodAfter) await saveMoodAfter(opts.sessionId, opts.moodAfter);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.active });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.recent });
    },
  });
}

export function useRecordInterruption() {
  return useMutation({
    mutationFn: (sessionId: string) => incrementInterruptions(sessionId),
  });
}

export function useSaveCoachMessage() {
  return useMutation({
    mutationFn: (opts: { sessionId: string; message: CoachMessage }) =>
      appendCoachMessage(opts.sessionId, opts.message),
  });
}

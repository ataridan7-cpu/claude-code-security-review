import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  AppState,
  AppStateStatus,
  StyleSheet,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { v4 as uuidv4 } from 'uuid';
import { CoachMessageBubble } from '../../src/components/focus/CoachMessageBubble';
import { useClaudeStream } from '../../src/hooks/useClaude';
import {
  useStartSession,
  useEndSession,
  useRecordInterruption,
} from '../../src/hooks/useFocusSession';
import { ClaudeService } from '../../src/services/claude/ClaudeService';
import { FocusSession } from '../../src/models';
import { Colors, Typography, Spacing, Radius } from '../../src/constants/theme';

export default function FocusSessionScreen() {
  const { duration } = useLocalSearchParams<{ duration: string }>();
  const durationSeconds = parseInt(duration ?? '1500', 10);

  const [session, setSession] = useState<FocusSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const startMutation = useStartSession();
  const endMutation = useEndSession();
  const interruptMutation = useRecordInterruption();

  const { text: coachText, isStreaming, stream, reset } = useClaudeStream();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const lastActiveRef = useRef(Date.now());
  const interruptionCountRef = useRef(0);

  // Start session and send opening coach message
  useEffect(() => {
    async function init() {
      const s = await startMutation.mutateAsync({ durationTarget: durationSeconds });
      setSession(s);
      reset();
      stream(ClaudeService.streamFocusMessage('start', s));
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        // 15-min check-in
        if (next % 900 === 0 && session && !isDone) {
          reset();
          stream(ClaudeService.streamFocusMessage('checkin', session));
        }
        if (next >= durationSeconds && !isDone) {
          handleComplete();
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isDone]);

  // AppState — detect when user backgrounds the app (interruption)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (
        appStateRef.current === 'active' &&
        next !== 'active' &&
        session &&
        !isDone
      ) {
        interruptionCountRef.current += 1;
        interruptMutation.mutate(session.id);
        reset();
        stream(
          ClaudeService.streamFocusMessage(
            'interruption',
            { ...session, interruptionCount: interruptionCountRef.current },
            undefined,
            'another app'
          )
        );
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isDone]);

  async function handleComplete() {
    if (!session || isDone) return;
    setIsDone(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    await endMutation.mutateAsync({ sessionId: session.id, status: 'completed', endedAt: Date.now() });
    reset();
    stream(
      ClaudeService.streamFocusMessage('completion', {
        ...session,
        interruptionCount: interruptionCountRef.current,
      })
    );
  }

  async function handleAbandon() {
    if (!session) return;
    Alert.alert('End session?', 'Your progress will still be saved.', [
      { text: 'Keep going', style: 'cancel' },
      {
        text: 'End session',
        style: 'destructive',
        onPress: async () => {
          if (intervalRef.current) clearInterval(intervalRef.current);
          await endMutation.mutateAsync({ sessionId: session.id, status: 'abandoned' });
          router.back();
        },
      },
    ]);
  }

  const remaining = Math.max(durationSeconds - elapsed, 0);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = Math.min(elapsed / durationSeconds, 1);

  return (
    <View style={styles.screen}>
      <View style={styles.timerSection}>
        <Text style={styles.timer}>
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        {!isDone && (
          <Text style={styles.subtext}>
            {interruptionCountRef.current > 0
              ? `${interruptionCountRef.current} interruption${interruptionCountRef.current > 1 ? 's' : ''}`
              : 'Stay focused'}
          </Text>
        )}
      </View>

      <CoachMessageBubble text={coachText} isStreaming={isStreaming} />

      {!isDone && (
        <View style={styles.actions}>
          <Pressable
            style={styles.distractedBtn}
            onPress={() => {
              interruptionCountRef.current += 1;
              if (session) {
                interruptMutation.mutate(session.id);
                reset();
                stream(
                  ClaudeService.streamFocusMessage(
                    'interruption',
                    { ...session, interruptionCount: interruptionCountRef.current }
                  )
                );
              }
            }}
          >
            <Text style={styles.distractedText}>I got distracted</Text>
          </Pressable>
          <Pressable style={styles.endBtn} onPress={handleAbandon}>
            <Text style={styles.endText}>End session</Text>
          </Pressable>
        </View>
      )}

      {isDone && (
        <Pressable style={styles.doneBtn} onPress={() => router.back()}>
          <Text style={styles.doneBtnText}>Done</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
    paddingBottom: Spacing.xxl,
  },
  timerSection: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.md },
  timer: { fontSize: 64, fontWeight: '200', color: Colors.text, letterSpacing: -2 },
  progressTrack: {
    width: '60%',
    height: 2,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  subtext: { ...Typography.bodySmall, color: Colors.textSecondary },
  actions: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md },
  distractedBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  distractedText: { ...Typography.body, color: Colors.textSecondary },
  endBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  endText: { ...Typography.body, color: Colors.textMuted },
  doneBtn: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  doneBtnText: { ...Typography.body, fontWeight: '600', color: Colors.background },
});

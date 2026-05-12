import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ClaudeService } from '../../src/services/claude/ClaudeService';
import { Colors, Typography, Spacing, Radius } from '../../src/constants/theme';

type Turn = { role: 'claude' | 'user'; text: string };

export default function ContextJournalScreen() {
  const { appName = 'that app', durationMinutes = '0' } = useLocalSearchParams<{
    appName: string;
    durationMinutes: string;
  }>();
  const duration = Math.round(Number(durationMinutes));

  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  // Phase advances as: opening(0) → after 1st user reply(1) → synthesis done(2)
  const [phase, setPhase] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  async function streamResponse(generator: AsyncGenerator<string>, onDone?: () => void) {
    setStreaming(true);
    let text = '';
    setTurns((prev) => [...prev, { role: 'claude', text: '' }]);
    for await (const chunk of generator) {
      text += chunk;
      setTurns((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: 'claude', text };
        return next;
      });
    }
    setStreaming(false);
    onDone?.();
  }

  // Auto-start with Claude's opening question
  useEffect(() => {
    streamResponse(
      ClaudeService.streamJournalOpening(String(appName), duration)
    );
  }, []);

  async function handleSend() {
    if (!input.trim() || streaming) return;
    const userText = input.trim();
    setInput('');

    // Capture turn number before updating state
    const userTurnsSoFar = turns.filter((t) => t.role === 'user').length;
    setTurns((prev) => [...prev, { role: 'user', text: userText }]);

    if (userTurnsSoFar === 0) {
      // First user reply → follow-up question
      await streamResponse(
        ClaudeService.streamJournalFollowUp(userText, 0),
        () => setPhase(1)
      );
    } else {
      // Second user reply → final synthesis
      await streamResponse(
        ClaudeService.streamJournalFollowUp(userText, 1),
        () => setPhase(2)
      );
    }
  }

  const isDone = phase === 2;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text style={styles.headerLabel}>REFLECT</Text>
        <Text style={styles.headerSub}>
          {duration} min on {appName}
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {turns.map((turn, i) => {
          const isLastTurn = i === turns.length - 1;
          const isSynthesis = isDone && isLastTurn && turn.role === 'claude';
          return (
            <View
              key={i}
              style={[
                styles.bubble,
                turn.role === 'user' ? styles.userBubble : styles.claudeBubble,
                isSynthesis && styles.synthesisBubble,
              ]}
            >
              {isSynthesis && (
                <Text style={styles.synthesisLabel}>Your reflection</Text>
              )}
              <Text
                style={[
                  styles.bubbleText,
                  turn.role === 'user' && styles.userBubbleText,
                  isSynthesis && styles.synthesisText,
                ]}
              >
                {turn.text}
                {streaming && isLastTurn && turn.role === 'claude' ? '▋' : ''}
              </Text>
            </View>
          );
        })}

        {isDone && (
          <View style={styles.doneNote}>
            <Text style={styles.doneNoteText}>
              Saved to your journal. Come back anytime to reflect.
            </Text>
          </View>
        )}
      </ScrollView>

      {!isDone && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={streaming ? 'Lumina is thinking…' : 'Write your thoughts…'}
            placeholderTextColor={Colors.textMuted}
            multiline
            editable={!streaming}
          />
          <Pressable
            style={[
              styles.sendBtn,
              (!input.trim() || streaming) && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!input.trim() || streaming}
          >
            {streaming ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <Text style={styles.sendBtnText}>→</Text>
            )}
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLabel: {
    ...Typography.label,
    color: Colors.primary,
    letterSpacing: 1.5,
  },
  headerSub: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  bubble: {
    maxWidth: '88%',
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  claudeBubble: {
    backgroundColor: Colors.surface,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userBubble: {
    backgroundColor: Colors.primaryDim,
    alignSelf: 'flex-end',
  },
  synthesisBubble: {
    backgroundColor: Colors.surfaceRaised,
    borderColor: Colors.primary,
    borderWidth: 1,
    maxWidth: '100%',
    alignSelf: 'stretch',
    marginTop: Spacing.sm,
  },
  synthesisLabel: {
    ...Typography.label,
    color: Colors.primary,
    marginBottom: Spacing.sm,
    letterSpacing: 1,
  },
  bubbleText: { ...Typography.body, color: Colors.text, lineHeight: 24 },
  userBubbleText: { color: Colors.primaryLight },
  synthesisText: { fontStyle: 'italic', lineHeight: 26 },
  doneNote: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  doneNoteText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    ...Typography.body,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: Colors.background, fontSize: 20, fontWeight: '600' },
});

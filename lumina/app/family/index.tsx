import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StreamingText } from '../../src/components/common/StreamingText';
import { useClaudeStream } from '../../src/hooks/useClaude';
import { ClaudeService } from '../../src/services/claude/ClaudeService';
import { Colors, Typography, Spacing, Radius } from '../../src/constants/theme';

const SAMPLE_QUESTIONS = [
  'Is 4 hours of TikTok appropriate for a 13-year-old?',
  "My child won't put their phone down at dinner. What should I do?",
  'How do I start a conversation about screen time without a fight?',
  'What does research say about phones in bedrooms for teens?',
];

export default function FamilyScreen() {
  const [question, setQuestion] = useState('');
  const [childAge, setChildAge] = useState('');
  const { text, isStreaming, stream, reset } = useClaudeStream();

  async function handleAsk() {
    if (!question.trim()) return;
    reset();
    const age = childAge ? parseInt(childAge, 10) : undefined;
    stream(ClaudeService.streamFamilyWisdom(question, age));
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Family Wisdom</Text>
        <Text style={styles.subtitle}>
          Ask Lumina anything about your child's digital wellness. Answers are
          grounded in current research.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>YOUR QUESTION</Text>
          <TextInput
            style={styles.input}
            value={question}
            onChangeText={setQuestion}
            placeholder="Ask anything about your child's screen time..."
            placeholderTextColor={Colors.textMuted}
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>CHILD'S AGE (optional)</Text>
          <TextInput
            style={[styles.input, styles.inputShort]}
            value={childAge}
            onChangeText={setChildAge}
            placeholder="e.g. 12"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>

        {!question && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>EXAMPLE QUESTIONS</Text>
            {SAMPLE_QUESTIONS.map((q) => (
              <Pressable
                key={q}
                style={styles.sampleChip}
                onPress={() => setQuestion(q)}
              >
                <Text style={styles.sampleText}>{q}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {(text || isStreaming) && (
          <View style={styles.responseCard}>
            <Text style={styles.responseLabel}>LUMINA'S GUIDANCE</Text>
            <StreamingText text={text} isStreaming={isStreaming} style={styles.responseText} />
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.askBtn, (!question.trim() || isStreaming) && styles.askBtnDisabled]}
          onPress={handleAsk}
          disabled={!question.trim() || isStreaming}
        >
          <Text style={styles.askBtnText}>{isStreaming ? 'Thinking...' : 'Ask Lumina'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: 100, gap: Spacing.md },
  title: { ...Typography.hero, color: Colors.text, marginTop: Spacing.lg },
  subtitle: { ...Typography.body, color: Colors.textSecondary },
  inputGroup: { gap: Spacing.sm },
  label: { ...Typography.label, color: Colors.textSecondary },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.text,
    ...Typography.body,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputShort: { minHeight: 48 },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionLabel: { ...Typography.label, color: Colors.textSecondary },
  sampleChip: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sampleText: { ...Typography.bodySmall, color: Colors.text },
  responseCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  responseLabel: { ...Typography.label, color: Colors.primary },
  responseText: { ...Typography.body, color: Colors.text, lineHeight: 24 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  askBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  askBtnDisabled: { opacity: 0.5 },
  askBtnText: { ...Typography.body, fontWeight: '600', color: Colors.background },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { ClaudeService } from '../../services/claude/ClaudeService';
import { useActiveGoals } from '../../hooks/useGoals';
import { useWeekScreenTime } from '../../hooks/useScreenTime';
import { Colors, Typography, Radius, Spacing } from '../../constants/theme';

interface ParsedGoal {
  toolName: string;
  toolInput: Record<string, unknown>;
  conversationalText: string;
}

interface GoalChatInterfaceProps {
  onGoalConfirmed: (toolName: string, toolInput: Record<string, unknown>) => void;
}

export function GoalChatInterface({ onGoalConfirmed }: GoalChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsed, setParsed] = useState<ParsedGoal | null>(null);
  const [clarifyQuestion, setClarifyQuestion] = useState<string | null>(null);

  const { data: goals = [] } = useActiveGoals();
  const { data: weekSummaries = [] } = useWeekScreenTime();

  async function handleSubmit() {
    if (!input.trim()) return;
    setIsProcessing(true);
    setParsed(null);
    setClarifyQuestion(null);

    try {
      const result = await ClaudeService.parseGoalFromNaturalLanguage(
        input,
        weekSummaries.filter(Boolean) as any,
        goals,
        []
      );

      if (result.toolName === 'clarify_intent') {
        setClarifyQuestion((result.toolInput as any).question ?? '');
      } else {
        setParsed(result);
      }
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>DESCRIBE YOUR GOAL</Text>
      <Text style={styles.hint}>
        E.g. "I want to stop using Instagram after 9pm" or "Limit TikTok to 30 minutes a day"
      </Text>

      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        placeholder="What would you like to change?"
        placeholderTextColor={Colors.textMuted}
        multiline
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />

      {clarifyQuestion && (
        <View style={styles.clarifyBubble}>
          <Text style={styles.clarifyText}>{clarifyQuestion}</Text>
        </View>
      )}

      {parsed && (
        <View style={styles.confirmCard}>
          <Text style={styles.confirmText}>
            {(parsed.toolInput as any).claudeExplanation ?? parsed.conversationalText}
          </Text>
          <Pressable
            style={styles.confirmBtn}
            onPress={() => onGoalConfirmed(parsed.toolName, parsed.toolInput)}
          >
            <Text style={styles.confirmBtnText}>Set this goal</Text>
          </Pressable>
        </View>
      )}

      <Pressable
        style={[styles.submitBtn, isProcessing && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={isProcessing || !input.trim()}
      >
        {isProcessing ? (
          <ActivityIndicator color={Colors.background} />
        ) : (
          <Text style={styles.submitText}>Interpret goal</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  label: {
    ...Typography.label,
    color: Colors.primary,
  },
  hint: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.text,
    ...Typography.body,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clarifyBubble: {
    backgroundColor: Colors.primaryDim,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  clarifyText: {
    ...Typography.body,
    color: Colors.primaryLight,
  },
  confirmCard: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    gap: Spacing.sm,
  },
  confirmText: {
    ...Typography.body,
    color: Colors.text,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  confirmBtnText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.background,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.background,
  },
});

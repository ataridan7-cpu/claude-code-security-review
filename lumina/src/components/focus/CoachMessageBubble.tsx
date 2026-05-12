import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StreamingText } from '../common/StreamingText';
import { Colors, Typography, Radius, Spacing } from '../../constants/theme';

interface CoachMessageBubbleProps {
  text: string;
  isStreaming: boolean;
}

export function CoachMessageBubble({ text, isStreaming }: CoachMessageBubbleProps) {
  if (!text && !isStreaming) return null;

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>L</Text>
      </View>
      <View style={styles.bubble}>
        <StreamingText
          text={text}
          isStreaming={isStreaming}
          style={styles.text}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.bodySmall,
    color: Colors.primaryLight,
    fontWeight: '700',
  },
  bubble: {
    flex: 1,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.lg,
    borderTopLeftRadius: 4,
    padding: Spacing.md,
  },
  text: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 22,
  },
});

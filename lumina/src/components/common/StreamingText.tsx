import React, { useEffect, useRef } from 'react';
import { Text, Animated, StyleSheet, TextStyle } from 'react-native';
import { Colors, Typography } from '../../constants/theme';

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
  style?: TextStyle;
  /** Character used as the blinking cursor while streaming */
  cursor?: string;
}

/**
 * Renders Claude streaming output with a blinking cursor while streaming.
 * Cursor blinks at 600ms intervals and disappears when done.
 */
export function StreamingText({
  text,
  isStreaming,
  style,
  cursor = '▋',
}: StreamingTextProps) {
  const cursorOpacity = useRef(new Animated.Value(1)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isStreaming) {
      animRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(cursorOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(cursorOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
      animRef.current.start();
    } else {
      animRef.current?.stop();
      cursorOpacity.setValue(0);
    }

    return () => {
      animRef.current?.stop();
    };
  }, [isStreaming, cursorOpacity]);

  return (
    <Text style={[styles.text, style]}>
      {text}
      {isStreaming && (
        <Animated.Text style={[styles.cursor, { opacity: cursorOpacity }]}>
          {cursor}
        </Animated.Text>
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    ...Typography.body,
    color: Colors.text,
  },
  cursor: {
    color: Colors.primary,
  },
});

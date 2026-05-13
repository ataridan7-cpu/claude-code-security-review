import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Typography } from '../../constants/theme';

interface DailyRingProps {
  totalSeconds: number;
  goalSeconds?: number; // daily goal if set
  size?: number;
  strokeWidth?: number;
}

function formatTotal(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function DailyRing({
  totalSeconds,
  goalSeconds = 4 * 3600, // 4h default
  size = 160,
  strokeWidth = 12,
}: DailyRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(totalSeconds / goalSeconds, 1);
  const strokeDashoffset = circumference * (1 - progress);

  const overBudget = totalSeconds > goalSeconds;
  const ringColor = overBudget ? Colors.danger : Colors.primary;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.total, { color: ringColor }]}>
          {formatTotal(totalSeconds)}
        </Text>
        <Text style={styles.label}>today</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
  },
  total: {
    ...Typography.h1,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

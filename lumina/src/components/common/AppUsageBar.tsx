import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppUsageStat } from '../../models';
import { Colors, Typography, Radius, Spacing } from '../../constants/theme';

interface AppUsageBarProps {
  stat: AppUsageStat;
  maxSeconds: number;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

export function AppUsageBar({ stat, maxSeconds }: AppUsageBarProps) {
  const fillPercent = maxSeconds > 0 ? (stat.totalSeconds / maxSeconds) * 100 : 0;
  const categoryColor = Colors[stat.categoryId] ?? Colors.other;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName} numberOfLines={1}>
          {stat.appName}
        </Text>
        <Text style={styles.duration}>{formatDuration(stat.totalSeconds)}</Text>
      </View>
      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${fillPercent}%`, backgroundColor: categoryColor }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  appName: {
    ...Typography.bodySmall,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  duration: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  track: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: Radius.full,
  },
});

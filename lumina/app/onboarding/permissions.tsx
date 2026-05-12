import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ScreenTimeService } from '../../src/services/screentime/ScreenTimeService';
import { Colors, Typography, Spacing, Radius } from '../../src/constants/theme';

export default function PermissionsScreen() {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');

  async function handleRequest() {
    setStatus('requesting');
    const result = await ScreenTimeService.requestPermission();
    if (result === 'granted') {
      setStatus('granted');
      setTimeout(() => router.push('/onboarding/api-key'), 800);
    } else {
      setStatus('denied');
    }
  }

  function handleSkip() {
    router.push('/onboarding/api-key');
  }

  const iosText =
    "Lumina uses Apple's Screen Time API to read your app usage. You'll see a system prompt from iOS — tap Allow.";
  const androidText =
    "Android requires you to grant Usage Access in Settings. We'll take you there now — enable Lumina, then come back.";

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>📱</Text>
        <Text style={styles.title}>Screen Time Access</Text>
        <Text style={styles.body}>
          {Platform.OS === 'ios' ? iosText : androidText}
        </Text>
        <View style={styles.privacyNote}>
          <Text style={styles.privacyText}>
            Your usage data never leaves your device. Lumina reads it locally to generate insights.
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {status === 'granted' ? (
          <View style={styles.grantedBadge}>
            <Text style={styles.grantedText}>Access granted ✓</Text>
          </View>
        ) : status === 'denied' ? (
          <>
            <Text style={styles.deniedText}>
              No problem — you can grant access later in Settings. Lumina will work with manual mood tracking in the meantime.
            </Text>
            <Pressable style={styles.primaryBtn} onPress={handleSkip}>
              <Text style={styles.primaryBtnText}>Continue anyway</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              style={[styles.primaryBtn, status === 'requesting' && styles.btnDisabled]}
              onPress={handleRequest}
              disabled={status === 'requesting'}
            >
              {status === 'requesting' ? (
                <ActivityIndicator color={Colors.background} />
              ) : (
                <Text style={styles.primaryBtnText}>Grant access</Text>
              )}
            </Pressable>
            <Pressable style={styles.skipBtn} onPress={handleSkip}>
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
    padding: Spacing.xl,
    paddingBottom: 60,
  },
  hero: { flex: 1, justifyContent: 'center', gap: Spacing.lg },
  heroEmoji: { fontSize: 64 },
  title: { ...Typography.hero, color: Colors.text },
  body: { ...Typography.body, color: Colors.textSecondary, lineHeight: 26 },
  privacyNote: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  privacyText: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
  actions: { gap: Spacing.sm },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { ...Typography.body, fontWeight: '600', color: Colors.background },
  skipBtn: { paddingVertical: Spacing.sm, alignItems: 'center' },
  skipText: { ...Typography.body, color: Colors.textMuted },
  grantedBadge: {
    backgroundColor: Colors.success + '22',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.success,
  },
  grantedText: { ...Typography.body, color: Colors.success },
  deniedText: { ...Typography.body, color: Colors.textSecondary, lineHeight: 24 },
});

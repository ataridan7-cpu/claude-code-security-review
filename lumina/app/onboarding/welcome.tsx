import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../src/constants/theme';

const SLIDES = [
  {
    emoji: '✦',
    title: 'Meet Lumina',
    body: 'Your AI companion for a healthier relationship with your devices. Not preachy. Not restrictive. Just honest.',
  },
  {
    emoji: '🧠',
    title: 'Powered by Claude',
    body: 'Lumina uses Claude AI to turn raw screen time data into personal insights that actually make sense for your life.',
  },
  {
    emoji: '🔒',
    title: 'Your data stays yours',
    body: 'Everything lives on your device. No accounts. No servers. Your screen time is private.',
  },
];

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const [slide, setSlide] = useState(0);

  return (
    <View style={styles.screen}>
      <View style={styles.slideContainer}>
        <Text style={styles.slideEmoji}>{SLIDES[slide].emoji}</Text>
        <Text style={styles.slideTitle}>{SLIDES[slide].title}</Text>
        <Text style={styles.slideBody}>{SLIDES[slide].body}</Text>
      </View>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === slide && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.actions}>
        {slide < SLIDES.length - 1 ? (
          <Pressable style={styles.nextBtn} onPress={() => setSlide((s) => s + 1)}>
            <Text style={styles.nextBtnText}>Next</Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.startBtn}
            onPress={() => router.push('/onboarding/permissions')}
          >
            <Text style={styles.startBtnText}>Get started</Text>
          </Pressable>
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
    paddingHorizontal: Spacing.xl,
    paddingTop: 80,
    paddingBottom: 60,
  },
  slideContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.lg },
  slideEmoji: { fontSize: 72 },
  slideTitle: { ...Typography.hero, color: Colors.text, textAlign: 'center' },
  slideBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 280,
  },
  dots: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center', paddingVertical: Spacing.lg },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  dotActive: { width: 20, backgroundColor: Colors.primary },
  actions: {},
  nextBtn: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nextBtnText: { ...Typography.body, color: Colors.text },
  startBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  startBtnText: { ...Typography.body, fontWeight: '600', color: Colors.background },
});

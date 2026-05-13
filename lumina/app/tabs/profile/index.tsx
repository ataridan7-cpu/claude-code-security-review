import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ClaudeService } from '../../../src/services/claude/ClaudeService';
import { Colors, Typography, Spacing, Radius } from '../../../src/constants/theme';

export default function ProfileScreen() {
  const [apiKey, setApiKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);

  async function saveApiKey() {
    if (!apiKey.trim()) return;
    setIsSavingKey(true);
    try {
      await ClaudeService.saveApiKey(apiKey.trim());
      setApiKey('');
      Alert.alert('Saved', 'API key updated.');
    } finally {
      setIsSavingKey(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>

      {/* Claude API Key */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>CLAUDE API KEY</Text>
        <Text style={styles.sectionDesc}>
          Stored securely on-device (iOS Keychain / Android Keystore).
        </Text>
        <TextInput
          style={styles.input}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="sk-ant-... (leave blank to keep current)"
          placeholderTextColor={Colors.textMuted}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        {apiKey.trim() !== '' && (
          <Pressable style={styles.saveKeyBtn} onPress={saveApiKey}>
            <Text style={styles.saveKeyText}>
              {isSavingKey ? 'Saving...' : 'Update key'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Navigation shortcuts */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>FEATURES</Text>
        {[
          { label: 'Digital Detox Programs', route: '/detox' },
          { label: 'Family Wisdom Mode', route: '/family' },
          { label: 'Weekly Wellness Letter', route: '/weekly-letter' },
        ].map((item) => (
          <Pressable
            key={item.route}
            style={styles.navRow}
            onPress={() => router.push(item.route as any)}
          >
            <Text style={styles.navLabel}>{item.label}</Text>
            <Text style={styles.navArrow}>→</Text>
          </Pressable>
        ))}
      </View>

      {/* App info */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <Text style={styles.aboutText}>Lumina v1.0.0</Text>
        <Text style={styles.aboutText}>
          Built with Claude claude-sonnet-4-6, React Native, and expo-sqlite.
        </Text>
        <Text style={styles.aboutText}>
          Screen time data is processed entirely on your device.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.md },
  title: { ...Typography.hero, color: Colors.text, marginTop: Spacing.lg },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionLabel: { ...Typography.label, color: Colors.textSecondary },
  sectionDesc: { ...Typography.bodySmall, color: Colors.textMuted },
  input: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.text,
    ...Typography.body,
    borderWidth: 1,
    borderColor: Colors.border,
    fontFamily: 'monospace',
  },
  saveKeyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  saveKeyText: { ...Typography.body, fontWeight: '600', color: Colors.background },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navLabel: { ...Typography.body, color: Colors.text },
  navArrow: { ...Typography.body, color: Colors.textMuted },
  aboutText: { ...Typography.bodySmall, color: Colors.textSecondary },
});

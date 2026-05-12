import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ClaudeService } from '../../src/services/claude/ClaudeService';
import { Colors, Typography, Spacing, Radius } from '../../src/constants/theme';

export default function ApiKeyScreen() {
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (!apiKey.trim().startsWith('sk-ant-')) {
      Alert.alert('Invalid key', 'Anthropic API keys start with "sk-ant-".');
      return;
    }
    setIsSaving(true);
    try {
      await ClaudeService.saveApiKey(apiKey.trim());
      router.replace('/tabs/dashboard');
    } catch {
      Alert.alert('Error', 'Could not save the key. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🔑</Text>
        <Text style={styles.title}>Connect Claude</Text>
        <Text style={styles.body}>
          Lumina uses Claude to generate insights. Add your Anthropic API key — it's stored securely on-device and never shared.
        </Text>
        <View style={styles.hint}>
          <Text style={styles.hintText}>
            Get a free key at console.anthropic.com → API Keys
          </Text>
        </View>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="sk-ant-..."
          placeholderTextColor={Colors.textMuted}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Pressable
          style={[styles.saveBtn, (!apiKey.trim() || isSaving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!apiKey.trim() || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={Colors.background} />
          ) : (
            <Text style={styles.saveBtnText}>Save & start</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.skipBtn}
          onPress={() => router.replace('/tabs/dashboard')}
        >
          <Text style={styles.skipText}>Skip — add later in Settings</Text>
        </Pressable>
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
  hint: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hintText: { ...Typography.bodySmall, color: Colors.textSecondary },
  form: { gap: Spacing.sm },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.text,
    ...Typography.body,
    borderWidth: 1,
    borderColor: Colors.border,
    fontFamily: 'monospace',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { ...Typography.body, fontWeight: '600', color: Colors.background },
  skipBtn: { paddingVertical: Spacing.sm, alignItems: 'center' },
  skipText: { ...Typography.body, color: Colors.textMuted },
});

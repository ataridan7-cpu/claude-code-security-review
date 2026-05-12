import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { v4 as uuidv4 } from 'uuid';
import { MoodScore, MoodTag, MoodEntry } from '../../src/models';
import { insertMoodEntry } from '../../src/services/storage/MoodRepository';
import { useMoodStore } from '../../src/stores/moodStore';
import { Colors, Typography, Spacing, Radius } from '../../src/constants/theme';

const MOOD_OPTIONS: Array<{ score: MoodScore; emoji: string; label: string }> = [
  { score: 1, emoji: '😔', label: 'Rough' },
  { score: 2, emoji: '😕', label: 'Meh' },
  { score: 3, emoji: '😐', label: 'Okay' },
  { score: 4, emoji: '🙂', label: 'Good' },
  { score: 5, emoji: '😊', label: 'Great' },
];

const TAG_OPTIONS: MoodTag[] = [
  'anxious', 'calm', 'focused', 'distracted',
  'happy', 'sad', 'bored', 'productive', 'overwhelmed',
];

export default function MoodCheckinScreen() {
  const [score, setScore] = useState<MoodScore | null>(null);
  const [energy, setEnergy] = useState<MoodScore | null>(null);
  const [tags, setTags] = useState<MoodTag[]>([]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { addEntry } = useMoodStore();

  function toggleTag(tag: MoodTag) {
    setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));
  }

  async function handleSave() {
    if (!score || !energy) {
      Alert.alert('', 'Please rate your mood and energy level.');
      return;
    }
    setIsSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const entry: MoodEntry = {
        id: uuidv4(),
        date: today,
        recordedAt: Date.now(),
        score,
        energy,
        tags,
        notes: notes.trim() || undefined,
        screenTimePrecedingHours: 0,
      };
      await insertMoodEntry(entry);
      addEntry(entry);
      router.back();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>How are you?</Text>
      <Text style={styles.subtitle}>Takes 30 seconds. Helps Lumina spot patterns.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>MOOD</Text>
        <View style={styles.emojiRow}>
          {MOOD_OPTIONS.map((opt) => (
            <Pressable
              key={opt.score}
              style={[styles.emojiBtn, score === opt.score && styles.emojiBtnActive]}
              onPress={() => setScore(opt.score)}
            >
              <Text style={styles.emoji}>{opt.emoji}</Text>
              <Text style={[styles.emojiLabel, score === opt.score && styles.emojiLabelActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ENERGY</Text>
        <View style={styles.emojiRow}>
          {[1, 2, 3, 4, 5].map((e) => (
            <Pressable
              key={e}
              style={[styles.energyBtn, energy === e && styles.energyBtnActive]}
              onPress={() => setEnergy(e as MoodScore)}
            >
              <Text style={[styles.energyText, energy === e && styles.energyTextActive]}>
                {e}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.energyLabels}>
          <Text style={styles.energyLabel}>Drained</Text>
          <Text style={styles.energyLabel}>Energized</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>TAGS (optional)</Text>
        <View style={styles.tagRow}>
          {TAG_OPTIONS.map((tag) => (
            <Pressable
              key={tag}
              style={[styles.tagChip, tags.includes(tag) && styles.tagChipActive]}
              onPress={() => toggleTag(tag)}
            >
              <Text
                style={[styles.tagText, tags.includes(tag) && styles.tagTextActive]}
              >
                {tag}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <TextInput
        style={styles.notes}
        value={notes}
        onChangeText={setNotes}
        placeholder="Anything else on your mind? (optional)"
        placeholderTextColor={Colors.textMuted}
        multiline
      />

      <Pressable
        style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Text style={styles.saveBtnText}>Save check-in</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.md },
  title: { ...Typography.hero, color: Colors.text, marginTop: Spacing.lg },
  subtitle: { ...Typography.body, color: Colors.textSecondary },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionLabel: { ...Typography.label, color: Colors.textSecondary },
  emojiRow: { flexDirection: 'row', justifyContent: 'space-between' },
  emojiBtn: {
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryDim },
  emoji: { fontSize: 28 },
  emojiLabel: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  emojiLabelActive: { color: Colors.primaryLight },
  energyBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  energyBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryDim },
  energyText: { ...Typography.h3, color: Colors.textSecondary },
  energyTextActive: { color: Colors.primaryLight },
  energyLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  energyLabel: { ...Typography.caption, color: Colors.textMuted },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tagChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagChipActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  tagText: { ...Typography.bodySmall, color: Colors.textSecondary },
  tagTextActive: { color: Colors.primaryLight },
  notes: {
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
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...Typography.body, fontWeight: '600', color: Colors.background },
});

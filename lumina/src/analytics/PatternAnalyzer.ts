import { DailyScreenTimeSummary, MoodEntry, AppCategory } from '../models';

/**
 * Local (offline) computation of usage patterns before sending to Claude.
 * Keeps Claude calls focused on narrative generation rather than raw math.
 */

export interface CategoryCorrelation {
  category: AppCategory;
  averageMood: number;
  sampleSize: number;
}

/**
 * Correlates screen time categories with subsequent mood scores.
 * Requires at least 5 paired data points to return meaningful results.
 */
export function computeMoodCorrelations(
  summaries: DailyScreenTimeSummary[],
  moods: MoodEntry[]
): CategoryCorrelation[] {
  const moodByDate: Record<string, number> = {};
  for (const m of moods) {
    moodByDate[m.date] = m.score;
  }

  const categoryScores: Record<string, number[]> = {};

  for (const summary of summaries) {
    const moodScore = moodByDate[summary.date];
    if (!moodScore) continue;

    for (const [category, seconds] of Object.entries(summary.byCategory)) {
      if (seconds < 300) continue; // skip < 5 min — not meaningful
      if (!categoryScores[category]) categoryScores[category] = [];
      categoryScores[category].push(moodScore);
    }
  }

  return Object.entries(categoryScores)
    .filter(([, scores]) => scores.length >= 5)
    .map(([category, scores]) => ({
      category: category as AppCategory,
      averageMood: scores.reduce((s, x) => s + x, 0) / scores.length,
      sampleSize: scores.length,
    }))
    .sort((a, b) => b.sampleSize - a.sampleSize);
}

/**
 * Returns the streak (consecutive days) where all active goals were met.
 */
export function computeGoalStreak(
  progressByDate: Array<{ date: string; allMet: boolean }>
): number {
  let streak = 0;
  const sorted = [...progressByDate].sort((a, b) => b.date.localeCompare(a.date));
  for (const day of sorted) {
    if (day.allMet) streak++;
    else break;
  }
  return streak;
}

/**
 * Detects heavy single-session usage (>2 hours on one app) for context journaling.
 */
export function detectHeavySession(
  durationMinutes: number,
  thresholdMinutes = 120
): boolean {
  return durationMinutes >= thresholdMinutes;
}

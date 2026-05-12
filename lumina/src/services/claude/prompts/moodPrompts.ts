import { MoodCorrelation, DailyScreenTimeSummary, AppCategory } from '../../../models';

export function buildMoodCorrelationPrompt(
  correlations: Array<{ category: AppCategory; averageMood: number; sampleSize: number }>,
  recentSummaries: DailyScreenTimeSummary[]
): string {
  const corrText = correlations
    .map(
      (c) =>
        `  - After ${c.category} apps: avg mood ${c.averageMood.toFixed(1)}/5 (${c.sampleSize} data points)`
    )
    .join('\n');

  const topCategory = recentSummaries[0]?.topApps[0]?.categoryId ?? 'unknown';

  return `Here are the user's mood-screen time correlations based on their check-ins:

${corrText}

Their most-used category this week: ${topCategory}

Write a 3-sentence insight about what these patterns reveal. Be specific about which categories help vs. hurt their mood. Make one practical, personalized suggestion based on the strongest signal. Do not list bullet points — write as flowing prose. Under 100 words.`;
}

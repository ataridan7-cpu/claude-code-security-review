import { DailyScreenTimeSummary, Goal } from '../../../models';

export function buildDailyInsightPrompt(
  summary: DailyScreenTimeSummary,
  goals: Goal[]
): string {
  const topAppsText = summary.topApps
    .slice(0, 5)
    .map(
      (a) =>
        `  - ${a.appName}: ${Math.round(a.totalSeconds / 60)} min (${a.percentOfDay.toFixed(0)}%)`
    )
    .join('\n');

  const totalHours = (summary.totalSeconds / 3600).toFixed(1);
  const activeGoals = goals.filter((g) => g.status === 'active');
  const goalsText =
    activeGoals.length > 0
      ? activeGoals
          .map((g) => `  - ${g.claudeInterpretation}`)
          .join('\n')
      : '  (none yet)';

  return `Here is the user's screen time data for today, ${summary.date}:

Total screen time: ${totalHours} hours
Device pick-ups: ${summary.pickUps}

Top apps:
${topAppsText}

Active goals:
${goalsText}

Write a daily insight narrative (3–4 sentences). Be specific, mention actual app names and durations. Note progress toward any goals. End with one concrete micro-action for tonight. Keep it under 120 words.`;
}

export function buildWeeklyLetterPrompt(
  summaries: DailyScreenTimeSummary[],
  goals: Goal[]
): string {
  const daysText = summaries
    .map(
      (s) =>
        `${s.date}: ${(s.totalSeconds / 3600).toFixed(1)}h total — top app: ${s.topApps[0]?.appName ?? 'none'}`
    )
    .join('\n');

  const avgHours = (
    summaries.reduce((acc, s) => acc + s.totalSeconds, 0) /
    (summaries.length * 3600)
  ).toFixed(1);

  const activeGoals = goals
    .filter((g) => g.status === 'active')
    .map((g) => g.claudeInterpretation)
    .join(', ');

  return `Write a warm, personal weekly wellness letter for this person's screen time data.

This week at a glance:
${daysText}

Average: ${avgHours} hours/day

Active goals: ${activeGoals || 'none'}

Format as a genuine letter — no headers, no bullet points. 3 paragraphs:
1. Reflect on what the week's patterns reveal about their life right now (be insightful, not just descriptive)
2. Celebrate one win and name one pattern worth watching
3. A single meaningful invitation for next week

Tone: a thoughtful friend who cares, not a productivity app. Keep it under 300 words.`;
}

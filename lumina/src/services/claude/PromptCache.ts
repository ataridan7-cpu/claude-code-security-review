import { getDatabase } from '../storage/DatabaseService';
import {
  DailyScreenTimeSummary,
  Goal,
  MoodEntry,
  ClaudeRequestContext,
} from '../../models';
import { CACHE_TTL_MS } from '../../constants/claude';

interface CacheEntry {
  key: string;
  context: string;
  builtAt: number;
}

// In-memory cache for the current app session
const _cache = new Map<string, CacheEntry>();

export function buildUserProfileContext(
  userId: string,
  screenTimeHistory: DailyScreenTimeSummary[],
  goals: Goal[],
  moodHistory: MoodEntry[]
): string {
  const today = new Date().toISOString().split('T')[0];

  const recentDays = screenTimeHistory.slice(0, 7);
  const avgHours =
    recentDays.length > 0
      ? (
          recentDays.reduce((s, d) => s + d.totalSeconds, 0) /
          (recentDays.length * 3600)
        ).toFixed(1)
      : '0';

  const topAppsAllTime: Record<string, number> = {};
  for (const day of recentDays) {
    for (const app of day.topApps) {
      topAppsAllTime[app.appName] =
        (topAppsAllTime[app.appName] ?? 0) + app.totalSeconds;
    }
  }
  const topAppsText = Object.entries(topAppsAllTime)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, secs]) => `${name} (${Math.round(secs / 60)} min/day avg)`)
    .join(', ');

  const activeGoals = goals
    .filter((g) => g.status === 'active')
    .map((g) => `- ${g.claudeInterpretation}`)
    .join('\n');

  const recentMoods = moodHistory.slice(0, 7);
  const avgMood =
    recentMoods.length > 0
      ? (recentMoods.reduce((s, m) => s + m.score, 0) / recentMoods.length).toFixed(1)
      : 'unknown';

  return `## User Profile (as of ${today})

Average daily screen time (7 days): ${avgHours} hours
Top apps by usage: ${topAppsText || 'insufficient data'}

Active goals:
${activeGoals || '(none yet)'}

Mood average (7 days): ${avgMood}/5

Recent screen time by day:
${recentDays
  .map(
    (d) =>
      `  ${d.date}: ${(d.totalSeconds / 3600).toFixed(1)}h total — top: ${d.topApps[0]?.appName ?? 'none'}`
  )
  .join('\n')}`;
}

export function getCacheKey(userId: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `${userId}-${date}`;
}

export function getCachedContext(key: string): string | null {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.builtAt > CACHE_TTL_MS) {
    _cache.delete(key);
    return null;
  }
  return entry.context;
}

export function setCachedContext(key: string, context: string): void {
  _cache.set(key, { key, context, builtAt: Date.now() });
}

import {
  computeMoodCorrelations,
  computeGoalStreak,
  detectHeavySession,
} from '../../src/analytics/PatternAnalyzer';
import { DailyScreenTimeSummary, MoodEntry } from '../../src/models';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeSummary(date: string, socialSeconds: number): DailyScreenTimeSummary {
  return {
    date,
    totalSeconds: socialSeconds,
    byCategory: {
      social: socialSeconds,
      entertainment: 0, productivity: 0, health: 0,
      education: 0, games: 0, communication: 0, news: 0, other: 0,
    },
    topApps: [],
    pickUps: 0,
    notificationsReceived: 0,
  };
}

function makeMood(date: string, score: 1 | 2 | 3 | 4 | 5): MoodEntry {
  return {
    id: `mood-${date}`,
    date,
    recordedAt: Date.now(),
    score,
    energy: score,
    tags: [],
    screenTimePrecedingHours: 2,
  };
}

// ── computeMoodCorrelations ───────────────────────────────────────────────────

describe('computeMoodCorrelations', () => {
  it('returns empty when fewer than 5 paired data points', () => {
    const summaries = ['2024-01-01', '2024-01-02', '2024-01-03'].map((d) =>
      makeSummary(d, 3600)
    );
    const moods = ['2024-01-01', '2024-01-02', '2024-01-03'].map((d) =>
      makeMood(d, 3)
    );
    expect(computeMoodCorrelations(summaries, moods)).toEqual([]);
  });

  it('returns correlation when 5 or more paired data points exist', () => {
    const dates = ['01', '02', '03', '04', '05'].map((d) => `2024-01-${d}`);
    const summaries = dates.map((d) => makeSummary(d, 3600));
    const moods = dates.map((d, i) => makeMood(d, ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5));
    const result = computeMoodCorrelations(summaries, moods);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].category).toBe('social');
    expect(result[0].sampleSize).toBe(5);
  });

  it('skips days with < 5 min of usage in a category', () => {
    const dates = ['01', '02', '03', '04', '05', '06'].map((d) => `2024-01-${d}`);
    // First 5 days have 60s (< 5min) in social — should be skipped
    const summaries = dates.map((d, i) =>
      makeSummary(d, i < 5 ? 60 : 3600)
    );
    const moods = dates.map((d) => makeMood(d, 3));
    const result = computeMoodCorrelations(summaries, moods);
    // Only day 6 qualifies, but we need 5 points
    expect(result).toEqual([]);
  });
});

// ── computeGoalStreak ─────────────────────────────────────────────────────────

describe('computeGoalStreak', () => {
  it('returns 0 for empty input', () => {
    expect(computeGoalStreak([])).toBe(0);
  });

  it('counts consecutive met days from most recent', () => {
    const data = [
      { date: '2024-01-05', allMet: true },
      { date: '2024-01-04', allMet: true },
      { date: '2024-01-03', allMet: true },
      { date: '2024-01-02', allMet: false },
      { date: '2024-01-01', allMet: true },
    ];
    expect(computeGoalStreak(data)).toBe(3);
  });

  it('breaks at first unmet day', () => {
    const data = [
      { date: '2024-01-03', allMet: false },
      { date: '2024-01-02', allMet: true },
      { date: '2024-01-01', allMet: true },
    ];
    expect(computeGoalStreak(data)).toBe(0);
  });

  it('handles input in any order', () => {
    const data = [
      { date: '2024-01-01', allMet: true },
      { date: '2024-01-03', allMet: true },
      { date: '2024-01-02', allMet: true },
    ];
    expect(computeGoalStreak(data)).toBe(3);
  });
});

// ── detectHeavySession ────────────────────────────────────────────────────────

describe('detectHeavySession', () => {
  it('returns true at the default 120-min threshold', () => {
    expect(detectHeavySession(120)).toBe(true);
    expect(detectHeavySession(180)).toBe(true);
  });

  it('returns false below threshold', () => {
    expect(detectHeavySession(119)).toBe(false);
    expect(detectHeavySession(0)).toBe(false);
  });

  it('respects a custom threshold', () => {
    expect(detectHeavySession(60, 60)).toBe(true);
    expect(detectHeavySession(59, 60)).toBe(false);
  });
});

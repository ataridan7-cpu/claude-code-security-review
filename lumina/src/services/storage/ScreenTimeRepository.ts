import { getDatabase } from './DatabaseService';
import {
  AppUsageRecord,
  AppUsageStat,
  AppCategory,
  DailyScreenTimeSummary,
} from '../../models';

interface RawRecord {
  id: string;
  bundle_id: string;
  app_name: string;
  category: string;
  duration_seconds: number;
  session_start: number;
  session_end: number;
  date: string;
  platform: string;
  synced_at: number | null;
}

function toModel(r: RawRecord): AppUsageRecord {
  return {
    id: r.id,
    bundleId: r.bundle_id,
    appName: r.app_name,
    categoryId: r.category as AppCategory,
    durationSeconds: r.duration_seconds,
    sessionStart: r.session_start,
    sessionEnd: r.session_end,
    date: r.date,
    platform: r.platform as 'ios' | 'android',
    syncedAt: r.synced_at ?? undefined,
  };
}

export async function insertRecords(records: AppUsageRecord[]): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const r of records) {
      await db.runAsync(
        `INSERT OR REPLACE INTO screen_time_records
          (id, bundle_id, app_name, category, duration_seconds,
           session_start, session_end, date, platform, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        r.id,
        r.bundleId,
        r.appName,
        r.categoryId,
        r.durationSeconds,
        r.sessionStart,
        r.sessionEnd,
        r.date,
        r.platform,
        r.syncedAt ?? null
      );
    }
  });
}

export async function getRecordsForDate(date: string): Promise<AppUsageRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<RawRecord>(
    'SELECT * FROM screen_time_records WHERE date = ? ORDER BY session_start ASC',
    date
  );
  return rows.map(toModel);
}

export async function getRecordsForRange(
  startDate: string,
  endDate: string
): Promise<AppUsageRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<RawRecord>(
    'SELECT * FROM screen_time_records WHERE date >= ? AND date <= ? ORDER BY date ASC, session_start ASC',
    startDate,
    endDate
  );
  return rows.map(toModel);
}

export async function getDailySummary(date: string): Promise<DailyScreenTimeSummary | null> {
  const db = await getDatabase();
  const records = await getRecordsForDate(date);
  if (records.length === 0) return null;

  const byCategory: Record<AppCategory, number> = {
    social: 0,
    entertainment: 0,
    productivity: 0,
    health: 0,
    education: 0,
    games: 0,
    communication: 0,
    news: 0,
    other: 0,
  };

  const appTotals: Record<string, AppUsageStat> = {};
  let totalSeconds = 0;

  for (const r of records) {
    byCategory[r.categoryId] = (byCategory[r.categoryId] ?? 0) + r.durationSeconds;
    totalSeconds += r.durationSeconds;
    if (!appTotals[r.bundleId]) {
      appTotals[r.bundleId] = {
        bundleId: r.bundleId,
        appName: r.appName,
        categoryId: r.categoryId,
        totalSeconds: 0,
        percentOfDay: 0,
      };
    }
    appTotals[r.bundleId].totalSeconds += r.durationSeconds;
  }

  const topApps = Object.values(appTotals)
    .map((a) => ({
      ...a,
      percentOfDay: totalSeconds > 0 ? (a.totalSeconds / totalSeconds) * 100 : 0,
    }))
    .sort((a, b) => b.totalSeconds - a.totalSeconds)
    .slice(0, 10);

  const pickUpsRow = await db.getFirstAsync<{ pick_ups: number }>(
    `SELECT CAST(duration_seconds AS INTEGER) as pick_ups FROM screen_time_records
     WHERE date = ? AND duration_seconds <= 30 GROUP BY bundle_id`,
    date
  );

  return {
    date,
    totalSeconds,
    byCategory,
    topApps,
    pickUps: pickUpsRow?.pick_ups ?? 0,
    notificationsReceived: 0, // populated by native module
  };
}

export async function getLastNDaysSummaries(n: number): Promise<DailyScreenTimeSummary[]> {
  const summaries: DailyScreenTimeSummary[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const s = await getDailySummary(dateStr);
    if (s) summaries.push(s);
  }
  return summaries;
}

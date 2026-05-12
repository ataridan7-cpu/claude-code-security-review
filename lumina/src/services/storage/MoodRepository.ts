import { getDatabase } from './DatabaseService';
import { MoodEntry, MoodScore, MoodTag } from '../../models';

interface RawMood {
  id: string;
  date: string;
  recorded_at: number;
  score: number;
  energy: number;
  tags: string;
  notes: string | null;
  screen_time_preceding_hours: number;
  correlation_insight_id: string | null;
}

function toModel(r: RawMood): MoodEntry {
  return {
    id: r.id,
    date: r.date,
    recordedAt: r.recorded_at,
    score: r.score as MoodScore,
    energy: r.energy as MoodScore,
    tags: JSON.parse(r.tags) as MoodTag[],
    notes: r.notes ?? undefined,
    screenTimePrecedingHours: r.screen_time_preceding_hours,
    correlationInsightId: r.correlation_insight_id ?? undefined,
  };
}

export async function insertMoodEntry(entry: MoodEntry): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO mood_entries
      (id, date, recorded_at, score, energy, tags, notes,
       screen_time_preceding_hours, correlation_insight_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    entry.id,
    entry.date,
    entry.recordedAt,
    entry.score,
    entry.energy,
    JSON.stringify(entry.tags),
    entry.notes ?? null,
    entry.screenTimePrecedingHours,
    entry.correlationInsightId ?? null
  );
}

export async function getMoodEntryForDate(date: string): Promise<MoodEntry | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<RawMood>(
    'SELECT * FROM mood_entries WHERE date = ? LIMIT 1',
    date
  );
  return row ? toModel(row) : null;
}

export async function getLastNMoodEntries(n: number): Promise<MoodEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<RawMood>(
    'SELECT * FROM mood_entries ORDER BY recorded_at DESC LIMIT ?',
    n
  );
  return rows.map(toModel);
}

export async function updateCorrelationInsightId(
  moodId: string,
  insightId: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE mood_entries SET correlation_insight_id = ? WHERE id = ?',
    insightId,
    moodId
  );
}

export async function hasTodaysMoodEntry(): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const entry = await getMoodEntryForDate(today);
  return entry !== null;
}

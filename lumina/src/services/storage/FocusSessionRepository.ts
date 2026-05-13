import { getDatabase } from './DatabaseService';
import { FocusSession, CoachMessage, MoodScore } from '../../models';

interface RawSession {
  id: string;
  goal_id: string | null;
  started_at: number;
  ended_at: number | null;
  duration_target: number;
  duration_actual: number | null;
  status: string;
  interruption_count: number;
  coach_messages: string;
  mood_before: number | null;
  mood_after: number | null;
}

function toModel(r: RawSession): FocusSession {
  return {
    id: r.id,
    goalId: r.goal_id ?? undefined,
    startedAt: r.started_at,
    endedAt: r.ended_at ?? undefined,
    durationTarget: r.duration_target,
    durationActual: r.duration_actual ?? undefined,
    status: r.status as FocusSession['status'],
    interruptionCount: r.interruption_count,
    coachMessages: JSON.parse(r.coach_messages) as CoachMessage[],
    moodBefore: r.mood_before as MoodScore | undefined,
    moodAfter: r.mood_after as MoodScore | undefined,
  };
}

export async function insertSession(session: FocusSession): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO focus_sessions
      (id, goal_id, started_at, ended_at, duration_target, duration_actual,
       status, interruption_count, coach_messages, mood_before, mood_after)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    session.id,
    session.goalId ?? null,
    session.startedAt,
    session.endedAt ?? null,
    session.durationTarget,
    session.durationActual ?? null,
    session.status,
    session.interruptionCount,
    JSON.stringify(session.coachMessages),
    session.moodBefore ?? null,
    session.moodAfter ?? null
  );
}

export async function getActiveSession(): Promise<FocusSession | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<RawSession>(
    "SELECT * FROM focus_sessions WHERE status = 'active' LIMIT 1"
  );
  return row ? toModel(row) : null;
}

export async function updateSessionStatus(
  id: string,
  status: FocusSession['status'],
  endedAt?: number,
  durationActual?: number
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE focus_sessions SET status = ?, ended_at = ?, duration_actual = ? WHERE id = ?',
    status,
    endedAt ?? null,
    durationActual ?? null,
    id
  );
}

export async function appendCoachMessage(
  sessionId: string,
  message: CoachMessage
): Promise<void> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ coach_messages: string }>(
    'SELECT coach_messages FROM focus_sessions WHERE id = ?',
    sessionId
  );
  if (!row) return;
  const messages: CoachMessage[] = JSON.parse(row.coach_messages);
  messages.push(message);
  await db.runAsync(
    'UPDATE focus_sessions SET coach_messages = ? WHERE id = ?',
    JSON.stringify(messages),
    sessionId
  );
}

export async function incrementInterruptions(sessionId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE focus_sessions SET interruption_count = interruption_count + 1 WHERE id = ?',
    sessionId
  );
}

export async function saveMoodAfter(sessionId: string, mood: MoodScore): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE focus_sessions SET mood_after = ? WHERE id = ?',
    mood,
    sessionId
  );
}

export async function getRecentSessions(limit = 10): Promise<FocusSession[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<RawSession>(
    "SELECT * FROM focus_sessions WHERE status != 'active' ORDER BY started_at DESC LIMIT ?",
    limit
  );
  return rows.map(toModel);
}

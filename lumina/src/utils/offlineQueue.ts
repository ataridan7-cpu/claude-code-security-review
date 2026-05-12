import { getDatabase } from '../services/storage/DatabaseService';
import { v4 as uuidv4 } from 'uuid';
import { ClaudeFeature } from '../models';

export interface QueuedRequest {
  id: string;
  feature: ClaudeFeature;
  payload: unknown;
  createdAt: number;
  attemptCount: number;
}

export async function enqueue(feature: ClaudeFeature, payload: unknown): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO offline_queue (id, feature, payload, created_at, attempt_count) VALUES (?, ?, ?, ?, 0)',
    uuidv4(),
    feature,
    JSON.stringify(payload),
    Date.now()
  );
}

export async function getPendingRequests(limit = 10): Promise<QueuedRequest[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    feature: string;
    payload: string;
    created_at: number;
    attempt_count: number;
  }>(
    'SELECT * FROM offline_queue WHERE attempt_count < 3 ORDER BY created_at ASC LIMIT ?',
    limit
  );
  return rows.map((r) => ({
    id: r.id,
    feature: r.feature as ClaudeFeature,
    payload: JSON.parse(r.payload),
    createdAt: r.created_at,
    attemptCount: r.attempt_count,
  }));
}

export async function markAttempted(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE offline_queue SET attempt_count = attempt_count + 1, attempted_at = ? WHERE id = ?',
    Date.now(),
    id
  );
}

export async function deleteRequest(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM offline_queue WHERE id = ?', id);
}

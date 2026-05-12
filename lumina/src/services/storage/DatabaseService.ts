import * as SQLite from 'expo-sqlite';

const DB_NAME = 'lumina.db';
const SCHEMA_VERSION = 1;

let _db: SQLite.SQLiteDatabase | null = null;

const MIGRATIONS: Array<(db: SQLite.SQLiteDatabase) => Promise<void>> = [
  // Migration 0 → 1: initial schema
  async (db) => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS screen_time_records (
        id TEXT PRIMARY KEY,
        bundle_id TEXT NOT NULL,
        app_name TEXT NOT NULL,
        category TEXT NOT NULL,
        duration_seconds INTEGER NOT NULL,
        session_start INTEGER NOT NULL,
        session_end INTEGER NOT NULL,
        date TEXT NOT NULL,
        platform TEXT NOT NULL,
        synced_at INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_str_date ON screen_time_records(date);
      CREATE INDEX IF NOT EXISTS idx_str_bundle ON screen_time_records(bundle_id);

      CREATE TABLE IF NOT EXISTS mood_entries (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        recorded_at INTEGER NOT NULL,
        score INTEGER NOT NULL,
        energy INTEGER NOT NULL,
        tags TEXT NOT NULL DEFAULT '[]',
        notes TEXT,
        screen_time_preceding_hours REAL NOT NULL DEFAULT 0,
        correlation_insight_id TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_mood_date ON mood_entries(date);

      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        natural_language_input TEXT NOT NULL,
        claude_interpretation TEXT NOT NULL,
        goal_type TEXT NOT NULL,
        target_apps TEXT DEFAULT '[]',
        target_categories TEXT DEFAULT '[]',
        daily_limit_seconds INTEGER,
        scheduled_blocks TEXT DEFAULT '[]',
        weekly_target TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        created_at INTEGER NOT NULL,
        activated_at INTEGER,
        progress TEXT NOT NULL DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS claude_insights (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        generated_at INTEGER NOT NULL,
        period_start TEXT NOT NULL,
        period_end TEXT NOT NULL,
        narrative TEXT NOT NULL,
        highlights TEXT NOT NULL DEFAULT '[]',
        prompt_cache_key TEXT,
        model_used TEXT NOT NULL,
        input_tokens INTEGER NOT NULL DEFAULT 0,
        output_tokens INTEGER NOT NULL DEFAULT 0,
        cached_input_tokens INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_insight_type_period ON claude_insights(type, period_start);

      CREATE TABLE IF NOT EXISTS focus_sessions (
        id TEXT PRIMARY KEY,
        goal_id TEXT,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        duration_target INTEGER NOT NULL,
        duration_actual INTEGER,
        status TEXT NOT NULL DEFAULT 'active',
        interruption_count INTEGER NOT NULL DEFAULT 0,
        coach_messages TEXT NOT NULL DEFAULT '[]',
        mood_before INTEGER,
        mood_after INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_focus_started ON focus_sessions(started_at);

      CREATE TABLE IF NOT EXISTS detox_programs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        duration_days INTEGER NOT NULL,
        difficulty TEXT NOT NULL,
        daily_challenges TEXT NOT NULL DEFAULT '[]',
        claude_generated_at INTEGER NOT NULL,
        target_areas TEXT NOT NULL DEFAULT '[]',
        user_profile_snapshot TEXT NOT NULL,
        started_at INTEGER,
        completed_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS offline_queue (
        id TEXT PRIMARY KEY,
        feature TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        attempted_at INTEGER,
        attempt_count INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS daily_token_usage (
        date TEXT PRIMARY KEY,
        total_input_tokens INTEGER NOT NULL DEFAULT 0,
        total_output_tokens INTEGER NOT NULL DEFAULT 0,
        total_cached_tokens INTEGER NOT NULL DEFAULT 0,
        calls_by_feature TEXT NOT NULL DEFAULT '{}',
        budget INTEGER NOT NULL DEFAULT 100000
      );
    `);
  },
];

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync(DB_NAME);
  await runMigrations(_db);
  return _db;
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  let currentVersion = result?.user_version ?? 0;

  for (let i = currentVersion; i < MIGRATIONS.length; i++) {
    await MIGRATIONS[i](db);
    await db.execAsync(`PRAGMA user_version = ${i + 1}`);
    currentVersion = i + 1;
  }
}

export async function closeDatabase(): Promise<void> {
  if (_db) {
    await _db.closeAsync();
    _db = null;
  }
}

import { getDatabase } from './DatabaseService';
import { Goal, GoalType, AppCategory, TimeBlock, WeeklyGoalTarget, GoalProgress } from '../../models';

interface RawGoal {
  id: string;
  natural_language_input: string;
  claude_interpretation: string;
  goal_type: string;
  target_apps: string;
  target_categories: string;
  daily_limit_seconds: number | null;
  scheduled_blocks: string;
  weekly_target: string | null;
  status: string;
  created_at: number;
  activated_at: number | null;
  progress: string;
}

function toModel(r: RawGoal): Goal {
  return {
    id: r.id,
    naturalLanguageInput: r.natural_language_input,
    claudeInterpretation: r.claude_interpretation,
    goalType: r.goal_type as GoalType,
    targetApps: JSON.parse(r.target_apps),
    targetCategories: JSON.parse(r.target_categories) as AppCategory[],
    dailyLimitSeconds: r.daily_limit_seconds ?? undefined,
    scheduledBlocks: JSON.parse(r.scheduled_blocks) as TimeBlock[],
    weeklyTarget: r.weekly_target ? JSON.parse(r.weekly_target) as WeeklyGoalTarget : undefined,
    status: r.status as Goal['status'],
    createdAt: r.created_at,
    activatedAt: r.activated_at ?? undefined,
    progress: JSON.parse(r.progress) as GoalProgress[],
  };
}

export async function insertGoal(goal: Goal): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO goals
      (id, natural_language_input, claude_interpretation, goal_type,
       target_apps, target_categories, daily_limit_seconds, scheduled_blocks,
       weekly_target, status, created_at, activated_at, progress)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    goal.id,
    goal.naturalLanguageInput,
    goal.claudeInterpretation,
    goal.goalType,
    JSON.stringify(goal.targetApps ?? []),
    JSON.stringify(goal.targetCategories ?? []),
    goal.dailyLimitSeconds ?? null,
    JSON.stringify(goal.scheduledBlocks ?? []),
    goal.weeklyTarget ? JSON.stringify(goal.weeklyTarget) : null,
    goal.status,
    goal.createdAt,
    goal.activatedAt ?? null,
    JSON.stringify(goal.progress)
  );
}

export async function getActiveGoals(): Promise<Goal[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<RawGoal>(
    "SELECT * FROM goals WHERE status = 'active' ORDER BY created_at DESC"
  );
  return rows.map(toModel);
}

export async function getAllGoals(): Promise<Goal[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<RawGoal>(
    'SELECT * FROM goals ORDER BY created_at DESC'
  );
  return rows.map(toModel);
}

export async function updateGoalStatus(
  goalId: string,
  status: Goal['status'],
  activatedAt?: number
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE goals SET status = ?, activated_at = ? WHERE id = ?',
    status,
    activatedAt ?? null,
    goalId
  );
}

export async function appendGoalProgress(
  goalId: string,
  entry: GoalProgress
): Promise<void> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ progress: string }>(
    'SELECT progress FROM goals WHERE id = ?',
    goalId
  );
  if (!row) return;
  const progress: GoalProgress[] = JSON.parse(row.progress);
  progress.push(entry);
  await db.runAsync(
    'UPDATE goals SET progress = ? WHERE id = ?',
    JSON.stringify(progress),
    goalId
  );
}

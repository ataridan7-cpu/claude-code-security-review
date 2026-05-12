import { Goal } from '../../../src/models';

// Mock DatabaseService before importing repository functions
const mockDb = {
  runAsync: jest.fn().mockResolvedValue(undefined),
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
};

jest.mock('../../../src/services/storage/DatabaseService', () => ({
  getDatabase: jest.fn().mockResolvedValue(mockDb),
}));

import {
  insertGoal,
  getActiveGoals,
  getAllGoals,
  updateGoalStatus,
  appendGoalProgress,
} from '../../../src/services/storage/GoalRepository';

const sampleGoal: Goal = {
  id: 'goal-1',
  naturalLanguageInput: 'Limit TikTok to 30 min a day',
  claudeInterpretation: '30 minute daily limit on TikTok',
  goalType: 'app_limit',
  targetApps: ['com.tiktok.TikTok'],
  targetCategories: [],
  dailyLimitSeconds: 1800,
  scheduledBlocks: [],
  status: 'active',
  createdAt: 1700000000000,
  progress: [],
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ── insertGoal ────────────────────────────────────────────────────────────────

describe('insertGoal', () => {
  it('calls runAsync with correct SQL and bound values', async () => {
    await insertGoal(sampleGoal);

    expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
    const [sql, ...params] = mockDb.runAsync.mock.calls[0];
    expect(sql).toMatch(/INSERT OR REPLACE INTO goals/i);

    // Spot-check serialized fields
    expect(params).toContain('goal-1');
    expect(params).toContain('app_limit');
    expect(params).toContain(1800);
    expect(params).toContain(JSON.stringify(['com.tiktok.TikTok']));
    expect(params).toContain(JSON.stringify([])); // targetCategories
    expect(params).toContain('active');
  });
});

// ── getActiveGoals ────────────────────────────────────────────────────────────

describe('getActiveGoals', () => {
  it('queries only active goals and maps them to the model', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      {
        id: 'goal-1',
        natural_language_input: 'Limit TikTok',
        claude_interpretation: '30 min daily TikTok',
        goal_type: 'app_limit',
        target_apps: '["com.tiktok.TikTok"]',
        target_categories: '[]',
        daily_limit_seconds: 1800,
        scheduled_blocks: '[]',
        weekly_target: null,
        status: 'active',
        created_at: 1700000000000,
        activated_at: null,
        progress: '[]',
      },
    ]);

    const goals = await getActiveGoals();
    expect(goals).toHaveLength(1);
    expect(goals[0].id).toBe('goal-1');
    expect(goals[0].targetApps).toEqual(['com.tiktok.TikTok']);
    expect(goals[0].dailyLimitSeconds).toBe(1800);
    expect(goals[0].activatedAt).toBeUndefined();

    const [sql] = mockDb.getAllAsync.mock.calls[0];
    expect(sql).toMatch(/WHERE status = 'active'/i);
  });

  it('returns empty array when no active goals', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([]);
    const goals = await getActiveGoals();
    expect(goals).toEqual([]);
  });
});

// ── getAllGoals ───────────────────────────────────────────────────────────────

describe('getAllGoals', () => {
  it('queries all goals without a status filter', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([]);
    await getAllGoals();
    const [sql] = mockDb.getAllAsync.mock.calls[0];
    expect(sql).not.toMatch(/WHERE status/i);
  });
});

// ── updateGoalStatus ──────────────────────────────────────────────────────────

describe('updateGoalStatus', () => {
  it('updates status and clears activated_at when not provided', async () => {
    await updateGoalStatus('goal-1', 'paused');
    const [sql, status, activatedAt, id] = mockDb.runAsync.mock.calls[0];
    expect(sql).toMatch(/UPDATE goals SET status/i);
    expect(status).toBe('paused');
    expect(activatedAt).toBeNull();
    expect(id).toBe('goal-1');
  });

  it('passes activatedAt when provided', async () => {
    await updateGoalStatus('goal-1', 'active', 1700000000000);
    const [, , activatedAt] = mockDb.runAsync.mock.calls[0];
    expect(activatedAt).toBe(1700000000000);
  });
});

// ── appendGoalProgress ────────────────────────────────────────────────────────

describe('appendGoalProgress', () => {
  it('appends an entry to existing progress JSON', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({ progress: '[]' });

    const entry = { date: '2024-01-01', metValue: true, actualValue: 1500, targetValue: 1800 };
    await appendGoalProgress('goal-1', entry);

    const [, serialized] = mockDb.runAsync.mock.calls[0];
    expect(JSON.parse(serialized)).toEqual([entry]);
  });

  it('does nothing if the goal does not exist', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce(null);
    await appendGoalProgress('ghost-id', { date: '2024-01-01', metValue: false, actualValue: 0, targetValue: 1800 });
    expect(mockDb.runAsync).not.toHaveBeenCalled();
  });
});

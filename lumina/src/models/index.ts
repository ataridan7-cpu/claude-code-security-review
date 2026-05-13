// ── App Categories ────────────────────────────────────────────────────────────

export type AppCategory =
  | 'social'
  | 'entertainment'
  | 'productivity'
  | 'health'
  | 'education'
  | 'games'
  | 'communication'
  | 'news'
  | 'other';

// ── Screen Time ───────────────────────────────────────────────────────────────

export interface AppUsageRecord {
  id: string;
  bundleId: string;
  appName: string;
  categoryId: AppCategory;
  durationSeconds: number;
  sessionStart: number; // Unix ms
  sessionEnd: number;
  date: string; // YYYY-MM-DD
  platform: 'ios' | 'android';
  syncedAt?: number;
}

export interface AppUsageStat {
  bundleId: string;
  appName: string;
  categoryId: AppCategory;
  totalSeconds: number;
  percentOfDay: number;
}

export interface DailyScreenTimeSummary {
  date: string;
  totalSeconds: number;
  byCategory: Record<AppCategory, number>;
  topApps: AppUsageStat[];
  pickUps: number; // iOS only, 0 on Android
  notificationsReceived: number;
}

// ── Mood ──────────────────────────────────────────────────────────────────────

export type MoodScore = 1 | 2 | 3 | 4 | 5;

export type MoodTag =
  | 'anxious'
  | 'calm'
  | 'focused'
  | 'distracted'
  | 'happy'
  | 'sad'
  | 'bored'
  | 'productive'
  | 'overwhelmed';

export interface MoodEntry {
  id: string;
  date: string;
  recordedAt: number;
  score: MoodScore;
  energy: MoodScore;
  tags: MoodTag[];
  notes?: string;
  screenTimePrecedingHours: number; // total usage in prior 2 hours
  correlationInsightId?: string;
}

export interface MoodCorrelation {
  appCategory: AppCategory;
  averageMoodAfter: number;
  sampleSize: number;
  trend: 'positive' | 'negative' | 'neutral';
  claudeNarrative: string;
  computedAt: number;
}

// ── Goals ─────────────────────────────────────────────────────────────────────

export type GoalType =
  | 'app_limit'
  | 'category_limit'
  | 'bedtime_block'
  | 'focus_streak'
  | 'daily_max'
  | 'custom';

export interface TimeBlock {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  startTime: string; // HH:MM 24h
  endTime: string;
}

export interface WeeklyGoalTarget {
  metricType: 'total_hours' | 'category_hours' | 'pickup_count';
  targetValue: number;
}

export interface GoalProgress {
  date: string;
  metValue: boolean;
  actualValue: number;
  targetValue: number;
}

export interface Goal {
  id: string;
  naturalLanguageInput: string;
  claudeInterpretation: string;
  goalType: GoalType;
  targetApps?: string[];
  targetCategories?: AppCategory[];
  dailyLimitSeconds?: number;
  scheduledBlocks?: TimeBlock[];
  weeklyTarget?: WeeklyGoalTarget;
  createdAt: number;
  activatedAt?: number;
  status: 'draft' | 'active' | 'completed' | 'paused';
  progress: GoalProgress[];
  /** Android: true once targetApps are registered with LuminaBlockingService */
  enforcementEnabled?: boolean;
  /** iOS: base64-encoded FamilyActivitySelection used with DeviceActivity monitoring */
  iosActivitySelection?: string;
}

// ── Focus Sessions ────────────────────────────────────────────────────────────

export type CoachMessageTrigger =
  | 'scheduled'
  | 'interruption'
  | 'completion'
  | 'user_request';

export interface CoachMessage {
  id: string;
  role: 'coach' | 'user';
  content: string;
  streamedAt: number;
  trigger: CoachMessageTrigger;
}

export interface FocusSession {
  id: string;
  goalId?: string;
  startedAt: number;
  endedAt?: number;
  durationTarget: number; // seconds
  durationActual?: number;
  status: 'active' | 'completed' | 'interrupted' | 'abandoned';
  interruptionCount: number;
  coachMessages: CoachMessage[];
  moodBefore?: MoodScore;
  moodAfter?: MoodScore;
}

// ── Claude Insights ───────────────────────────────────────────────────────────

export type InsightType =
  | 'daily_summary'
  | 'weekly_letter'
  | 'mood_correlation'
  | 'goal_progress'

  | 'detox_guidance';

export type InsightSentiment = 'positive' | 'negative' | 'neutral';

export interface InsightHighlight {
  label: string;
  value: string;
  sentiment: InsightSentiment;
  emoji: string;
}

export interface ClaudeInsight {
  id: string;
  type: InsightType;
  generatedAt: number;
  periodStart: string;
  periodEnd: string;
  narrative: string;
  highlights: InsightHighlight[];
  promptCacheKey?: string;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
}

// ── Digital Detox ─────────────────────────────────────────────────────────────

export type DetoxDifficulty = 'gentle' | 'moderate' | 'intensive';

export type DetoxActionType = 'avoid' | 'replace' | 'reduce' | 'reflect';

export interface DetoxChallenge {
  day: number;
  title: string;
  description: string;
  actionType: DetoxActionType;
  targetApps?: string[];
  durationMinutes?: number;
  completedAt?: number;
  userNotes?: string;
}

export interface DetoxUserProfile {
  averageDailyHours: number;
  topCategories: AppCategory[];
  currentGoals: string[];
  moodTrend: 'improving' | 'stable' | 'declining';
}

export interface DetoxProgram {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  difficulty: DetoxDifficulty;
  dailyChallenges: DetoxChallenge[];
  claudeGeneratedAt: number;
  targetAreas: AppCategory[];
  userProfileSnapshot: DetoxUserProfile;
  startedAt?: number;
  completedAt?: number;
}

// ── App Swap ──────────────────────────────────────────────────────────────────

export type SwapActivityCategory =
  | 'movement'
  | 'learning'
  | 'creativity'
  | 'connection'
  | 'mindfulness';

export interface SwapActivity {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  category: SwapActivityCategory;
  deepLinkApp?: string;
}

export interface AppSwapSuggestion {
  triggeredByApp: string;
  triggeredByAppName: string;
  suggestions: SwapActivity[];
  generatedAt: number;
  accepted?: string;
}

// ── Claude API Internal ───────────────────────────────────────────────────────

export interface ClaudeStreamChunk {
  type: 'text' | 'done' | 'error';
  text?: string;
  error?: string;
}

export type ClaudeFeature =
  | InsightType
  | 'goal_coach'
  | 'focus_companion'
  | 'family_wisdom'
  | 'context_journal'
  | 'app_swap';

export interface ClaudeRequestContext {
  feature: ClaudeFeature;
  userId: string;
  screenTimeHistory?: DailyScreenTimeSummary[];
  moodHistory?: MoodEntry[];
  goals?: Goal[];
  focusSession?: FocusSession;
  extraContext?: Record<string, unknown>;
}

// ── Token Budget ──────────────────────────────────────────────────────────────

export interface DailyTokenUsage {
  date: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCachedTokens: number;
  callsByFeature: Record<ClaudeFeature, number>;
  budget: number;
}

// ── Permission State ──────────────────────────────────────────────────────────

export type PermissionStatus = 'granted' | 'denied' | 'unavailable' | 'undetermined';

export interface AppPermissions {
  screenTime: PermissionStatus;
  notifications: PermissionStatus;
}

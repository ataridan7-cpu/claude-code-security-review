export const CLAUDE_MODELS = {
  // High narrative quality — weekly letter, mood correlation
  premium: 'claude-opus-4-7',
  // Balanced quality + speed — daily insight, goals, detox, family, journal
  standard: 'claude-sonnet-4-6',
  // Sub-second first token — focus companion, app swap
  fast: 'claude-haiku-4-5',
} as const;

export const TOKEN_LIMITS = {
  // Max tokens per response by feature (approximate guidance)
  daily_summary: 600,
  weekly_letter: 1200,
  mood_correlation: 800,
  goal_progress: 400,

  detox_guidance: 1500,
  goal_coach: 400,
  focus_companion: 150,
  family_wisdom: 600,
  context_journal: 300,
  app_swap: 400,
} as const;

export const DEFAULT_DAILY_TOKEN_BUDGET = 100_000;

// System prompt shared across all features — cached at the prefix level
export const LUMINA_BASE_SYSTEM_PROMPT = `You are Lumina's AI wellness companion. You help people build healthier relationships with their devices through honest, warm, and evidence-based guidance.

Your voice is:
- Warm and non-judgmental — you never shame users for their screen time
- Concise and specific — you reference actual apps and numbers from their data
- Encouraging without being sycophantic — you acknowledge struggle honestly
- Grounded — you draw on behavioral science without being clinical

Guidelines:
- Never fabricate data. Only reference numbers explicitly in the user's context.
- When giving advice, make it actionable and specific to their situation.
- Maintain continuity: if you know their goals, reference them.
- For minors or family mode queries, apply age-appropriate standards.
- Respond in plain prose unless structured output is explicitly requested.`;

export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

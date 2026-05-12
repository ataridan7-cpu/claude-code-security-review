import { getDatabase } from './DatabaseService';
import { ClaudeInsight, InsightType, InsightHighlight } from '../../models';

interface RawInsight {
  id: string;
  type: string;
  generated_at: number;
  period_start: string;
  period_end: string;
  narrative: string;
  highlights: string;
  prompt_cache_key: string | null;
  model_used: string;
  input_tokens: number;
  output_tokens: number;
  cached_input_tokens: number;
}

function toModel(r: RawInsight): ClaudeInsight {
  return {
    id: r.id,
    type: r.type as InsightType,
    generatedAt: r.generated_at,
    periodStart: r.period_start,
    periodEnd: r.period_end,
    narrative: r.narrative,
    highlights: JSON.parse(r.highlights) as InsightHighlight[],
    promptCacheKey: r.prompt_cache_key ?? undefined,
    modelUsed: r.model_used,
    inputTokens: r.input_tokens,
    outputTokens: r.output_tokens,
    cachedInputTokens: r.cached_input_tokens,
  };
}

export async function insertInsight(insight: ClaudeInsight): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO claude_insights
      (id, type, generated_at, period_start, period_end, narrative, highlights,
       prompt_cache_key, model_used, input_tokens, output_tokens, cached_input_tokens)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    insight.id,
    insight.type,
    insight.generatedAt,
    insight.periodStart,
    insight.periodEnd,
    insight.narrative,
    JSON.stringify(insight.highlights),
    insight.promptCacheKey ?? null,
    insight.modelUsed,
    insight.inputTokens,
    insight.outputTokens,
    insight.cachedInputTokens
  );
}

export async function getInsightForDate(
  type: InsightType,
  date: string
): Promise<ClaudeInsight | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<RawInsight>(
    'SELECT * FROM claude_insights WHERE type = ? AND period_start = ? ORDER BY generated_at DESC LIMIT 1',
    type,
    date
  );
  return row ? toModel(row) : null;
}

export async function getLatestInsight(type: InsightType): Promise<ClaudeInsight | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<RawInsight>(
    'SELECT * FROM claude_insights WHERE type = ? ORDER BY generated_at DESC LIMIT 1',
    type
  );
  return row ? toModel(row) : null;
}

export async function updateNarrative(id: string, narrative: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE claude_insights SET narrative = ? WHERE id = ?',
    narrative,
    id
  );
}

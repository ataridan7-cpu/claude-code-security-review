import Anthropic from '@anthropic-ai/sdk';
import * as SecureStore from 'expo-secure-store';
import { v4 as uuidv4 } from 'uuid';

import {
  ClaudeInsight,
  ClaudeRequestContext,
  ClaudeFeature,
  DailyScreenTimeSummary,
  Goal,
  MoodEntry,
  FocusSession,
  DetoxUserProfile,
  DetoxDifficulty,
  DetoxProgram,
  AppSwapSuggestion,
} from '../../models';
import {
  CLAUDE_MODELS,
  TOKEN_LIMITS,
  LUMINA_BASE_SYSTEM_PROMPT,
  DEFAULT_DAILY_TOKEN_BUDGET,
} from '../../constants/claude';
import {
  buildUserProfileContext,
  getCacheKey,
  getCachedContext,
  setCachedContext,
} from './PromptCache';
import { GOAL_COACH_TOOLS } from './ToolDefinitions';
import {
  buildDailyInsightPrompt,
  buildWeeklyLetterPrompt,
} from './prompts/insightPrompts';
import {
  buildFocusStartPrompt,
  buildFocusCheckInPrompt,
  buildInterruptionRecoveryPrompt,
  buildFocusCompletionPrompt,
} from './prompts/focusPrompts';
import { buildMoodCorrelationPrompt, buildMindfulMomentPrompt } from './prompts/moodPrompts';
import { buildGoalInterpretationPrompt } from './prompts/goalPrompts';
import { buildDetoxProgramPrompt } from './prompts/detoxPrompts';
import { buildFamilyWisdomPrompt } from './prompts/familyPrompts';
import {
  buildContextJournalOpeningPrompt,
  buildContextJournalFollowUpPrompt,
  buildAppSwapPrompt,
} from './prompts/journalPrompts';
import { getDatabase } from '../storage/DatabaseService';

const SECURE_STORE_KEY = 'lumina_anthropic_api_key';

class ClaudeServiceClass {
  private _client: Anthropic | null = null;
  private _userId = 'local';

  async getClient(): Promise<Anthropic> {
    if (this._client) return this._client;
    const apiKey = await SecureStore.getItemAsync(SECURE_STORE_KEY);
    if (!apiKey) throw new Error('Anthropic API key not configured');
    this._client = new Anthropic({ apiKey });
    return this._client;
  }

  async saveApiKey(key: string): Promise<void> {
    await SecureStore.setItemAsync(SECURE_STORE_KEY, key);
    this._client = null; // reset so next call re-initializes
  }

  async hasApiKey(): Promise<boolean> {
    const key = await SecureStore.getItemAsync(SECURE_STORE_KEY);
    return !!key;
  }

  // ── Context building ──────────────────────────────────────────────────────

  private async buildCachedSystemBlocks(
    history: DailyScreenTimeSummary[],
    goals: Goal[],
    moods: MoodEntry[]
  ): Promise<Anthropic.TextBlockParam[]> {
    const key = getCacheKey(this._userId);
    let userContext = getCachedContext(key);
    if (!userContext) {
      userContext = buildUserProfileContext(this._userId, history, goals, moods);
      setCachedContext(key, userContext);
    }

    return [
      {
        type: 'text',
        text: LUMINA_BASE_SYSTEM_PROMPT,
        // @ts-ignore — cache_control is supported by the API, SDK types may lag
        cache_control: { type: 'ephemeral' },
      },
      {
        type: 'text',
        text: userContext,
        // @ts-ignore
        cache_control: { type: 'ephemeral' },
      },
    ];
  }

  // ── Token budget tracking ─────────────────────────────────────────────────

  private async trackTokenUsage(
    feature: ClaudeFeature,
    inputTokens: number,
    outputTokens: number,
    cachedTokens: number
  ): Promise<void> {
    try {
      const db = await getDatabase();
      const today = new Date().toISOString().split('T')[0];
      const row = await db.getFirstAsync<{
        total_input_tokens: number;
        total_output_tokens: number;
        total_cached_tokens: number;
        calls_by_feature: string;
        budget: number;
      }>('SELECT * FROM daily_token_usage WHERE date = ?', today);

      if (row) {
        const calls = JSON.parse(row.calls_by_feature);
        calls[feature] = (calls[feature] ?? 0) + 1;
        await db.runAsync(
          `UPDATE daily_token_usage SET
            total_input_tokens = total_input_tokens + ?,
            total_output_tokens = total_output_tokens + ?,
            total_cached_tokens = total_cached_tokens + ?,
            calls_by_feature = ?
           WHERE date = ?`,
          inputTokens,
          outputTokens,
          cachedTokens,
          JSON.stringify(calls),
          today
        );
      } else {
        await db.runAsync(
          `INSERT INTO daily_token_usage
            (date, total_input_tokens, total_output_tokens, total_cached_tokens,
             calls_by_feature, budget)
           VALUES (?, ?, ?, ?, ?, ?)`,
          today,
          inputTokens,
          outputTokens,
          cachedTokens,
          JSON.stringify({ [feature]: 1 }),
          DEFAULT_DAILY_TOKEN_BUDGET
        );
      }
    } catch {
      // Non-critical — don't break the feature if tracking fails
    }
  }

  private async isOverBudget(): Promise<boolean> {
    try {
      const db = await getDatabase();
      const today = new Date().toISOString().split('T')[0];
      const row = await db.getFirstAsync<{
        total_input_tokens: number;
        budget: number;
      }>('SELECT total_input_tokens, budget FROM daily_token_usage WHERE date = ?', today);
      if (!row) return false;
      return row.total_input_tokens >= row.budget;
    } catch {
      return false;
    }
  }

  // ── Streaming helpers ─────────────────────────────────────────────────────

  async *streamText(
    model: string,
    systemBlocks: Anthropic.TextBlockParam[],
    userPrompt: string,
    maxTokens: number,
    feature: ClaudeFeature
  ): AsyncGenerator<string> {
    const client = await this.getClient();
    let inputTokens = 0;
    let outputTokens = 0;
    let cachedTokens = 0;

    const stream = client.messages.stream({
      model,
      max_tokens: maxTokens,
      system: systemBlocks as Anthropic.TextBlockParam[],
      messages: [{ role: 'user', content: userPrompt }],
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
      if (event.type === 'message_delta' && event.usage) {
        outputTokens = event.usage.output_tokens;
      }
      if (event.type === 'message_start' && event.message.usage) {
        inputTokens = event.message.usage.input_tokens;
        cachedTokens =
          (event.message.usage as any).cache_read_input_tokens ?? 0;
      }
    }

    await this.trackTokenUsage(feature, inputTokens, outputTokens, cachedTokens);
  }

  // ── Feature: Daily Insight (streaming) ───────────────────────────────────

  async *streamDailyInsight(
    summary: DailyScreenTimeSummary,
    goals: Goal[],
    moods: MoodEntry[]
  ): AsyncGenerator<string> {
    const systemBlocks = await this.buildCachedSystemBlocks([summary], goals, moods);
    const prompt = buildDailyInsightPrompt(summary, goals);
    yield* this.streamText(
      CLAUDE_MODELS.standard,
      systemBlocks,
      prompt,
      TOKEN_LIMITS.daily_summary,
      'daily_summary'
    );
  }

  // ── Feature: Weekly Letter (one-shot, returns full insight) ──────────────

  async generateWeeklyLetter(
    summaries: DailyScreenTimeSummary[],
    goals: Goal[],
    moods: MoodEntry[]
  ): Promise<{ narrative: string; inputTokens: number; outputTokens: number; cachedTokens: number }> {
    const client = await this.getClient();
    const systemBlocks = await this.buildCachedSystemBlocks(summaries, goals, moods);
    const prompt = buildWeeklyLetterPrompt(summaries, goals);

    const response = await client.messages.create({
      model: CLAUDE_MODELS.premium,
      max_tokens: TOKEN_LIMITS.weekly_letter,
      system: systemBlocks,
      messages: [{ role: 'user', content: prompt }],
    });

    const narrative =
      response.content[0].type === 'text' ? response.content[0].text : '';
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const cachedTokens = (response.usage as any).cache_read_input_tokens ?? 0;

    await this.trackTokenUsage('weekly_letter', inputTokens, outputTokens, cachedTokens);
    return { narrative, inputTokens, outputTokens, cachedTokens };
  }

  // ── Feature: Focus Companion (streaming) ──────────────────────────────────

  async *streamFocusMessage(
    type: 'start' | 'checkin' | 'interruption' | 'completion',
    session: FocusSession,
    goal?: Goal,
    interruptionAppName?: string
  ): AsyncGenerator<string> {
    const mins = Math.round(session.durationTarget / 60);
    const elapsed = session.startedAt
      ? Math.round((Date.now() - session.startedAt) / 60000)
      : 0;

    let prompt: string;
    switch (type) {
      case 'start':
        prompt = buildFocusStartPrompt(session, goal);
        break;
      case 'checkin':
        prompt = buildFocusCheckInPrompt(elapsed, mins);
        break;
      case 'interruption':
        prompt = buildInterruptionRecoveryPrompt(
          interruptionAppName ?? 'another app',
          session.interruptionCount
        );
        break;
      case 'completion':
        prompt = buildFocusCompletionPrompt(mins, session.interruptionCount, session.moodBefore);
        break;
    }

    const systemBlocks: Anthropic.TextBlockParam[] = [
      { type: 'text', text: LUMINA_BASE_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } as any },
    ];
    yield* this.streamText(
      CLAUDE_MODELS.fast,
      systemBlocks,
      prompt,
      TOKEN_LIMITS.focus_companion,
      'focus_companion'
    );
  }

  // ── Feature: Smart Goal Coach (tool use) ─────────────────────────────────

  async parseGoalFromNaturalLanguage(
    userInput: string,
    history: DailyScreenTimeSummary[],
    goals: Goal[],
    moods: MoodEntry[]
  ): Promise<{
    toolName: string;
    toolInput: Record<string, unknown>;
    conversationalText: string;
  }> {
    const client = await this.getClient();
    const systemBlocks = await this.buildCachedSystemBlocks(history, goals, moods);
    const prompt = buildGoalInterpretationPrompt(userInput);

    const response = await client.messages.create({
      model: CLAUDE_MODELS.standard,
      max_tokens: TOKEN_LIMITS.goal_coach,
      system: systemBlocks,
      tools: GOAL_COACH_TOOLS,
      tool_choice: { type: 'any' },
      messages: [{ role: 'user', content: prompt }],
    });

    await this.trackTokenUsage(
      'goal_coach',
      response.usage.input_tokens,
      response.usage.output_tokens,
      (response.usage as any).cache_read_input_tokens ?? 0
    );

    let toolName = 'clarify_intent';
    let toolInput: Record<string, unknown> = { question: 'Could you tell me more about what you want to limit?' };
    let conversationalText = '';

    for (const block of response.content) {
      if (block.type === 'text') {
        conversationalText = block.text;
      }
      if (block.type === 'tool_use') {
        toolName = block.name;
        toolInput = block.input as Record<string, unknown>;
      }
    }

    return { toolName, toolInput, conversationalText };
  }

  // ── Feature: Mindful Moment (streaming) ───────────────────────────────────

  async *streamMindfulMoment(
    appName: string,
    continuousMinutes: number
  ): AsyncGenerator<string> {
    const prompt = buildMindfulMomentPrompt(appName, continuousMinutes);
    const systemBlocks: Anthropic.TextBlockParam[] = [
      { type: 'text', text: LUMINA_BASE_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } as any },
    ];
    yield* this.streamText(
      CLAUDE_MODELS.fast,
      systemBlocks,
      prompt,
      TOKEN_LIMITS.mindful_moment,
      'mindful_moment'
    );
  }

  // ── Feature: Mood Correlation (streaming) ─────────────────────────────────

  async *streamMoodCorrelation(
    correlations: Array<{ category: string; averageMood: number; sampleSize: number }>,
    history: DailyScreenTimeSummary[],
    goals: Goal[],
    moods: MoodEntry[]
  ): AsyncGenerator<string> {
    const systemBlocks = await this.buildCachedSystemBlocks(history, goals, moods);
    const prompt = buildMoodCorrelationPrompt(correlations as any, history);
    yield* this.streamText(
      CLAUDE_MODELS.standard,
      systemBlocks,
      prompt,
      TOKEN_LIMITS.mood_correlation,
      'mood_correlation'
    );
  }

  // ── Feature: Digital Detox Designer ───────────────────────────────────────

  async generateDetoxProgram(
    profile: DetoxUserProfile,
    difficulty: DetoxDifficulty
  ): Promise<DetoxProgram> {
    const client = await this.getClient();
    const prompt = buildDetoxProgramPrompt(profile, difficulty);
    const systemBlocks: Anthropic.TextBlockParam[] = [
      { type: 'text', text: LUMINA_BASE_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } as any },
    ];

    const response = await client.messages.create({
      model: CLAUDE_MODELS.standard,
      max_tokens: TOKEN_LIMITS.detox_guidance,
      system: systemBlocks,
      messages: [{ role: 'user', content: prompt }],
    });

    await this.trackTokenUsage(
      'detox_guidance',
      response.usage.input_tokens,
      response.usage.output_tokens,
      (response.usage as any).cache_read_input_tokens ?? 0
    );

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return {
      id: uuidv4(),
      title: parsed.title ?? 'Digital Reset',
      description: parsed.description ?? '',
      durationDays: 7,
      difficulty,
      dailyChallenges: parsed.dailyChallenges ?? [],
      claudeGeneratedAt: Date.now(),
      targetAreas: profile.topCategories,
      userProfileSnapshot: profile,
    };
  }

  // ── Feature: App Swap Suggestions (streaming) ─────────────────────────────

  async generateAppSwap(
    blockedAppName: string,
    category: string
  ): Promise<AppSwapSuggestion> {
    const client = await this.getClient();
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    const prompt = buildAppSwapPrompt(blockedAppName, category, currentTime);
    const systemBlocks: Anthropic.TextBlockParam[] = [
      { type: 'text', text: LUMINA_BASE_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } as any },
    ];

    const response = await client.messages.create({
      model: CLAUDE_MODELS.fast,
      max_tokens: TOKEN_LIMITS.app_swap,
      system: systemBlocks,
      messages: [{ role: 'user', content: prompt }],
    });

    await this.trackTokenUsage(
      'app_swap',
      response.usage.input_tokens,
      response.usage.output_tokens,
      (response.usage as any).cache_read_input_tokens ?? 0
    );

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return {
      triggeredByApp: '',
      triggeredByAppName: blockedAppName,
      suggestions,
      generatedAt: Date.now(),
    };
  }

  // ── Feature: Family Wisdom (streaming) ────────────────────────────────────

  async *streamFamilyWisdom(
    question: string,
    childAge?: number
  ): AsyncGenerator<string> {
    const prompt = buildFamilyWisdomPrompt(question, childAge);
    const systemBlocks: Anthropic.TextBlockParam[] = [
      { type: 'text', text: LUMINA_BASE_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } as any },
    ];
    yield* this.streamText(
      CLAUDE_MODELS.standard,
      systemBlocks,
      prompt,
      TOKEN_LIMITS.family_wisdom,
      'family_wisdom'
    );
  }

  // ── Feature: Context Journal (streaming) ──────────────────────────────────

  async *streamJournalOpening(
    appName: string,
    durationMinutes: number
  ): AsyncGenerator<string> {
    const prompt = buildContextJournalOpeningPrompt(appName, durationMinutes);
    const systemBlocks: Anthropic.TextBlockParam[] = [
      { type: 'text', text: LUMINA_BASE_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } as any },
    ];
    yield* this.streamText(
      CLAUDE_MODELS.standard,
      systemBlocks,
      prompt,
      TOKEN_LIMITS.context_journal,
      'context_journal'
    );
  }

  async *streamJournalFollowUp(
    userResponse: string,
    turnNumber: number
  ): AsyncGenerator<string> {
    const prompt = buildContextJournalFollowUpPrompt(userResponse, turnNumber);
    const systemBlocks: Anthropic.TextBlockParam[] = [
      { type: 'text', text: LUMINA_BASE_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } as any },
    ];
    yield* this.streamText(
      CLAUDE_MODELS.standard,
      systemBlocks,
      prompt,
      TOKEN_LIMITS.context_journal,
      'context_journal'
    );
  }
}

export const ClaudeService = new ClaudeServiceClass();

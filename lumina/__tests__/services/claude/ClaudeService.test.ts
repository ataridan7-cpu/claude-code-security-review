/**
 * Tests for ClaudeService streaming accumulation and tool-use parsing.
 * All external dependencies (Anthropic SDK, expo-secure-store, SQLite) are mocked.
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Fake async stream generator — emits Anthropic-shaped stream events
async function* fakeStream(chunks: string[]) {
  yield {
    type: 'message_start',
    message: { usage: { input_tokens: 20, cache_read_input_tokens: 5 } },
  };
  for (const text of chunks) {
    yield { type: 'content_block_delta', delta: { type: 'text_delta', text } };
  }
  yield { type: 'message_delta', usage: { output_tokens: chunks.length * 2 } };
}

const mockStream = jest.fn();
const mockCreate = jest.fn();

jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        stream: mockStream,
        create: mockCreate,
      },
    })),
  };
});

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue('sk-test-key'),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
}));

const mockDb = {
  runAsync: jest.fn().mockResolvedValue(undefined),
  getAllAsync: jest.fn().mockResolvedValue([]),
  getFirstAsync: jest.fn().mockResolvedValue(null),
};

jest.mock('../../../src/services/storage/DatabaseService', () => ({
  getDatabase: jest.fn().mockResolvedValue(mockDb),
}));

import { ClaudeService } from '../../../src/services/claude/ClaudeService';

beforeEach(() => {
  jest.clearAllMocks();
  // Reset the private client so each test gets a fresh one
  (ClaudeService as any)._client = null;
});

// ── Streaming accumulation ────────────────────────────────────────────────────

describe('streamText — streaming accumulation', () => {
  it('yields each chunk individually', async () => {
    const chunks = ['Hello', ' ', 'world', '!'];
    mockStream.mockReturnValue(fakeStream(chunks));

    const received: string[] = [];
    for await (const chunk of (ClaudeService as any).streamText(
      'claude-haiku-4-5',
      [{ type: 'text', text: 'system' }],
      'user prompt',
      200,
      'focus_companion'
    )) {
      received.push(chunk);
    }

    expect(received).toEqual(chunks);
  });

  it('accumulates to the correct full string', async () => {
    const chunks = ['The ', 'quick ', 'brown ', 'fox'];
    mockStream.mockReturnValue(fakeStream(chunks));

    let full = '';
    for await (const chunk of (ClaudeService as any).streamText(
      'claude-sonnet-4-6',
      [],
      'prompt',
      600,
      'daily_summary'
    )) {
      full += chunk;
    }

    expect(full).toBe('The quick brown fox');
  });

  it('calls messages.stream with the correct model and max_tokens', async () => {
    mockStream.mockReturnValue(fakeStream(['hi']));

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of (ClaudeService as any).streamText(
      'claude-haiku-4-5',
      [],
      'test',
      150,
      'focus_companion'
    )) { /* drain */ }

    expect(mockStream).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-haiku-4-5', max_tokens: 150 })
    );
  });

  it('handles an empty stream without throwing', async () => {
    mockStream.mockReturnValue(fakeStream([]));

    const chunks: string[] = [];
    for await (const chunk of (ClaudeService as any).streamText(
      'claude-sonnet-4-6', [], 'prompt', 600, 'daily_summary'
    )) {
      chunks.push(chunk);
    }
    expect(chunks).toEqual([]);
  });
});

// ── Tool-use parsing ──────────────────────────────────────────────────────────

describe('parseGoalFromNaturalLanguage — tool-use parsing', () => {
  const emptyContext = { history: [], goals: [], moods: [] };

  it('extracts tool name and input from a create_app_limit_goal response', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'tool_use',
          name: 'create_app_limit_goal',
          input: {
            targetBundleIds: ['com.tiktok.TikTok'],
            dailyLimitSeconds: 1800,
            claudeExplanation: 'Limit TikTok to 30 minutes per day',
          },
        },
      ],
      usage: { input_tokens: 50, output_tokens: 30, cache_read_input_tokens: 0 },
    });

    const result = await ClaudeService.parseGoalFromNaturalLanguage(
      'Limit TikTok to 30 minutes a day',
      emptyContext.history,
      emptyContext.goals,
      emptyContext.moods
    );

    expect(result.toolName).toBe('create_app_limit_goal');
    expect(result.toolInput).toMatchObject({
      targetBundleIds: ['com.tiktok.TikTok'],
      dailyLimitSeconds: 1800,
    });
    expect(result.conversationalText).toBe('');
  });

  it('captures conversational text alongside a tool call', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        { type: 'text', text: 'Got it! Setting that up for you.' },
        {
          type: 'tool_use',
          name: 'create_time_block',
          input: {
            scheduledBlocks: [{ dayOfWeek: 0, startTime: '22:00', endTime: '07:00' }],
            claudeExplanation: 'No-phone bedtime block',
          },
        },
      ],
      usage: { input_tokens: 60, output_tokens: 40, cache_read_input_tokens: 0 },
    });

    const result = await ClaudeService.parseGoalFromNaturalLanguage(
      'No phone after 10pm',
      emptyContext.history,
      emptyContext.goals,
      emptyContext.moods
    );

    expect(result.toolName).toBe('create_time_block');
    expect(result.conversationalText).toBe('Got it! Setting that up for you.');
  });

  it('falls back to clarify_intent when no tool_use block is present', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Could you be more specific?' }],
      usage: { input_tokens: 30, output_tokens: 10, cache_read_input_tokens: 0 },
    });

    const result = await ClaudeService.parseGoalFromNaturalLanguage(
      'help me',
      emptyContext.history,
      emptyContext.goals,
      emptyContext.moods
    );

    expect(result.toolName).toBe('clarify_intent');
    expect(result.conversationalText).toBe('Could you be more specific?');
  });
});

// ── API key management ────────────────────────────────────────────────────────

describe('hasApiKey', () => {
  it('returns true when secure store has a key', async () => {
    expect(await ClaudeService.hasApiKey()).toBe(true);
  });

  it('returns false when secure store is empty', async () => {
    const { getItemAsync } = require('expo-secure-store');
    getItemAsync.mockResolvedValueOnce(null);
    expect(await ClaudeService.hasApiKey()).toBe(false);
  });
});

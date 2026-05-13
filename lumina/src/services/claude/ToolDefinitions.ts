import Anthropic from '@anthropic-ai/sdk';

export const GOAL_COACH_TOOLS: Anthropic.Tool[] = [
  {
    name: 'create_app_limit_goal',
    description:
      'Creates a daily time limit for one or more specific apps. Use when the user clearly names apps or categories they want to limit.',
    input_schema: {
      type: 'object' as const,
      properties: {
        targetBundleIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Bundle IDs of target apps (e.g. ["com.instagram.ios"])',
        },
        targetCategories: {
          type: 'array',
          items: { type: 'string' },
          description: 'App categories if specific apps are unknown',
        },
        dailyLimitSeconds: {
          type: 'integer',
          description: 'Daily usage limit in seconds',
        },
        claudeExplanation: {
          type: 'string',
          description:
            'A 2–3 sentence explanation of what this goal does, shown to the user for confirmation',
        },
      },
      required: ['dailyLimitSeconds', 'claudeExplanation'],
    },
  },
  {
    name: 'create_time_block',
    description:
      'Creates a scheduled block of time when all or specific apps are disabled (e.g. no phones after 9pm).',
    input_schema: {
      type: 'object' as const,
      properties: {
        scheduledBlocks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dayOfWeek: { type: 'integer', description: '0=Sun, 6=Sat, -1=every day' },
              startTime: { type: 'string', description: 'HH:MM 24h format' },
              endTime: { type: 'string', description: 'HH:MM 24h format' },
            },
            required: ['startTime', 'endTime'],
          },
        },
        targetBundleIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific apps to block. Empty array means all apps.',
        },
        claudeExplanation: {
          type: 'string',
          description: 'Explanation of the time block for user confirmation',
        },
      },
      required: ['scheduledBlocks', 'claudeExplanation'],
    },
  },
  {
    name: 'clarify_intent',
    description:
      "Ask the user a follow-up question when their goal is ambiguous. Use this before creating a goal if you're not sure what they want.",
    input_schema: {
      type: 'object' as const,
      properties: {
        question: {
          type: 'string',
          description: 'A single, specific clarifying question',
        },
      },
      required: ['question'],
    },
  },
];

export function buildContextJournalOpeningPrompt(
  appName: string,
  durationMinutes: number
): string {
  return `The user just spent ${durationMinutes} minutes on ${appName} in one sitting.

Open a gentle, curious journaling conversation. Write a single opening question that helps them explore what was going on emotionally before or during that session. Don't assume it was a bad thing — sometimes long usage is fine. Be curious, not judgmental. Under 25 words.`;
}

export function buildContextJournalFollowUpPrompt(
  userResponse: string,
  turnNumber: number
): string {
  if (turnNumber === 1) {
    return `The user responded to your opening question: "${userResponse}"

Ask one follow-up question that goes one level deeper — what feeling or need was underneath their answer? Keep it short, under 20 words.`;
  }

  return `The user said: "${userResponse}"

Synthesize a short journal entry (3–4 sentences) that captures the emotional insight from this conversation. Write in first person as if the user is writing their own journal. Help them see the pattern clearly without judgment. End with a gentle intention for next time.`;
}

export function buildAppSwapPrompt(
  blockedAppName: string,
  category: string,
  currentTime: string
): string {
  return `The user just hit their limit for ${blockedAppName} (category: ${category}). It's ${currentTime}.

Suggest 3 meaningful alternative activities. Mix physical, creative, and social options. Each should:
- Be genuinely doable right now
- Feel like a reward, not a punishment
- Take 5–20 minutes

Return as JSON array:
[
  {
    "id": "unique_id",
    "title": "short title",
    "description": "one specific sentence — make it appealing",
    "durationMinutes": 10,
    "category": "movement|learning|creativity|connection|mindfulness",
    "deepLinkApp": "optional.bundle.id"
  }
]`;
}

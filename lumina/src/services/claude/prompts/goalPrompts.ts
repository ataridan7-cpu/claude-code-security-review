export function buildGoalInterpretationPrompt(userInput: string): string {
  return `The user wants to set a screen time goal. Here is what they said:

"${userInput}"

Interpret their intent and call the most appropriate tool to create a structured goal. If you need clarification, call clarify_intent instead.

When creating a goal, your claudeExplanation should:
1. Confirm what you understood in plain language
2. Explain exactly how the limit will work
3. Be encouraging — change is hard

Keep explanations under 50 words.`;
}

export function buildGoalProgressPrompt(
  goalInterpretation: string,
  metCount: number,
  totalDays: number
): string {
  const rate = totalDays > 0 ? Math.round((metCount / totalDays) * 100) : 0;
  return `This user has a goal: "${goalInterpretation}"

Progress: ${metCount} out of ${totalDays} days met (${rate}% success rate).

Write 2 sentences of honest, warm progress feedback. If they're struggling (<50%), be compassionate and suggest one small adjustment. If they're succeeding (≥70%), celebrate specifically. Don't be generic.`;
}

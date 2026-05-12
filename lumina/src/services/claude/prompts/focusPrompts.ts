import { FocusSession, Goal } from '../../../models';

export function buildFocusStartPrompt(
  session: FocusSession,
  goal?: Goal
): string {
  const mins = Math.round(session.durationTarget / 60);
  const goalContext = goal
    ? `\nThis session is linked to their goal: "${goal.claudeInterpretation}".`
    : '';
  return `The user is starting a ${mins}-minute focus session.${goalContext}

Write a brief, energizing opening message (2 sentences max). Acknowledge what they're committing to and set a grounded, calm tone. Do not use exclamation marks — be warm and steady, not hype-y.`;
}

export function buildFocusCheckInPrompt(
  elapsedMinutes: number,
  durationMinutes: number
): string {
  const remaining = durationMinutes - elapsedMinutes;
  return `The user is ${elapsedMinutes} minutes into a ${durationMinutes}-minute focus session. ${remaining} minutes remain.

Write a mid-session check-in (1–2 sentences). Acknowledge that this point in a session is often when focus dips. Offer a simple grounding technique or encouragement. Keep it under 30 words.`;
}

export function buildInterruptionRecoveryPrompt(
  appName: string,
  interruptionCount: number
): string {
  return `The user just checked ${appName} during their focus session. This is interruption #${interruptionCount}.

Write a non-shaming, practical redirect (1 sentence). Help them return to focus without guilt. Under 20 words.`;
}

export function buildFocusCompletionPrompt(
  durationMinutes: number,
  interruptionCount: number,
  moodBefore?: number
): string {
  const interruptions =
    interruptionCount === 0
      ? 'zero interruptions'
      : `${interruptionCount} interruption${interruptionCount > 1 ? 's' : ''}`;
  const moodContext = moodBefore
    ? ` They rated their mood ${moodBefore}/5 before starting.`
    : '';

  return `The user just completed a ${durationMinutes}-minute focus session with ${interruptions}.${moodContext}

Write a genuine, warm completion message (2–3 sentences). Acknowledge their effort honestly. If they had interruptions, normalize it — everyone does. End with a single reflective question about the session. Under 60 words.`;
}

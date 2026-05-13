import { DetoxUserProfile, DetoxDifficulty } from '../../../models';

export function buildDetoxProgramPrompt(
  profile: DetoxUserProfile,
  difficulty: DetoxDifficulty
): string {
  const topCats = profile.topCategories.slice(0, 3).join(', ');
  return `Design a personalized ${difficulty} 7-day digital detox program for this person.

Their profile:
- Average daily screen time: ${profile.averageDailyHours.toFixed(1)} hours
- Top usage areas: ${topCats}
- Current mood trend: ${profile.moodTrend}
- Active goals: ${profile.currentGoals.join(', ') || 'none yet'}

Difficulty guide:
- gentle: Reduce by 20%, replace with offline alternatives
- moderate: Reduce by 40%, scheduled breaks, phone-free zones
- intensive: Reduce by 60%, specific replacement habits, reflection prompts

Return a JSON object with this exact shape:
{
  "title": "string (creative, 3–6 words)",
  "description": "string (2 sentences, what this program is about)",
  "dailyChallenges": [
    {
      "day": 1,
      "title": "string",
      "description": "string (specific, actionable, under 50 words)",
      "actionType": "avoid|replace|reduce|reflect",
      "targetApps": ["bundle.id.example"],
      "durationMinutes": 30
    }
    // ... 7 total
  ]
}

Make challenges progressively harder. Day 1 should feel achievable for someone who hasn't changed habits before.`;
}

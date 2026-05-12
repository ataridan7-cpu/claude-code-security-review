export function buildFamilyWisdomPrompt(
  question: string,
  childAge?: number
): string {
  const ageContext = childAge
    ? `The parent is asking about a ${childAge}-year-old.`
    : 'No specific age was provided.';

  return `A parent is asking for guidance about their child's digital wellness.

${ageContext}

Their question: "${question}"

Answer with:
1. A direct, honest response to their question (research-backed where possible)
2. Age-appropriate context if an age was given
3. One practical conversation starter they can use with their child tonight

Be warm but grounded. Avoid scare tactics. Parents feel enough guilt — help them take confident, measured action. Reference established guidelines (AAP, WHO) where relevant without being preachy. Under 200 words.`;
}
